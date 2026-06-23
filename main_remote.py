from __future__ import annotations

import asyncio
import base64
import hashlib
import hmac
import io
import json
import logging
import os
import re
import secrets
import shutil
import zipfile
from datetime import datetime, timezone
from html import escape
from pathlib import Path
from urllib.parse import parse_qs, quote_plus, urlsplit, urlunsplit

from fastapi import BackgroundTasks, Cookie, FastAPI, Header, HTTPException, Query, Request
from fastapi.responses import FileResponse, HTMLResponse, PlainTextResponse, RedirectResponse, Response, StreamingResponse

from ..core.config import get_settings
from ..core.logging import configure_logging
from ..core.security import hash_nonce, normalize_whatsapp_number, verify_meta_signature
from ..db import init_db
from ..schemas import HealthResponse, WebhookAcceptedResponse
from ..services.chat import AssistantChatService
from ..services.env_manager import redact_sensitive_assignments, sanitize_whatsapp_payload
from ..services.file_delivery import ensure_pdf_delivery
from ..services.hermes_bridge import HermesBridge
from ..services.hermes_admin import (
    hermes_overview,
    install_skill,
    list_installed_skills,
    list_tools,
    search_skills,
    set_tool_enabled,
    uninstall_skill,
)
from ..services.hermes_control import (
    build_hermes_command_message,
    parse_hermes_command,
    read_hermes_model_config,
    set_hermes_model,
)
from ..services.meta_whatsapp import MetaWhatsAppSender
from ..services.payloads import iter_inbound_messages
from ..services.settings_control import (
    ParsedControlCommand,
    apply_app_settings,
    apply_project_settings,
    build_control_message,
    parse_control_command,
    redact_control_text,
    split_sensitive_assignments,
    summarize_assignments,
)
from ..services.store import Store

configure_logging()
logger = logging.getLogger(__name__)

app = FastAPI(title="AI Assistants WhatsApp Control Layer", version="0.1.0")
store = Store()
sender = MetaWhatsAppSender()
bridge = HermesBridge()
chat = AssistantChatService()

RISKY_KEYWORDS = {
    "deploy",
    "publish",
    "hapus",
    "delete",
    "remove",
    "destroy",
    "reboot",
    "restart service",
    "systemctl",
    ".env",
    "secret",
    "credential",
    "dns",
    "firewall",
    "proxy",
    "push git",
    "merge",
    "release",
}

DOWNLOADABLE_EXTENSIONS = {
    ".csv",
    ".doc",
    ".docx",
    ".html",
    ".jpg",
    ".jpeg",
    ".md",
    ".pdf",
    ".png",
    ".ppt",
    ".pptx",
    ".txt",
    ".webp",
    ".xls",
    ".xlsx",
    ".zip",
}

PROTECTED_PROJECT_NAMES = {"AI Assistants"}
PROJECT_DOWNLOAD_EXCLUDED_DIRS = {
    ".git",
    ".mypy_cache",
    ".pytest_cache",
    ".ruff_cache",
    ".venv",
    "__pycache__",
    "node_modules",
    "venv",
}
PROJECT_DOWNLOAD_EXCLUDED_FILES = {".env", ".env.local", ".env.production"}
PROJECT_ARCHIVE_MAX_BYTES = 250 * 1024 * 1024
PROJECT_CATEGORY_ORDER = ("web", "mobile", "presentation", "document", "spreadsheet", "bot", "other")
PROJECT_CATEGORY_LABELS = {
    "web": "Web",
    "mobile": "Mobile",
    "presentation": "PPT & Presentation",
    "document": "Document & PDF",
    "spreadsheet": "Spreadsheet & Data",
    "bot": "Bot & Automation",
    "other": "Other Projects",
}
TEXT_PREVIEW_EXTENSIONS = {
    ".txt",
    ".md",
    ".markdown",
    ".json",
    ".yaml",
    ".yml",
    ".toml",
    ".ini",
    ".csv",
    ".html",
    ".css",
    ".js",
    ".jsx",
    ".ts",
    ".tsx",
    ".py",
    ".sh",
    ".ps1",
    ".sql",
    ".xml",
    ".svg",
}
FILE_PREVIEW_MAX_BYTES = 240 * 1024


@app.on_event("startup")
async def startup() -> None:
    init_db()


def _scan_project_library() -> list[dict]:
    projects_root = get_settings().hermes_projects_root.resolve()
    if not projects_root.exists():
        return []

    projects: list[dict] = []
    for project_root in sorted(projects_root.iterdir(), key=lambda item: item.name.lower()):
        if not project_root.is_dir() or project_root.name.startswith("."):
            continue
        projects.append(_inspect_project(project_root, projects_root))
    return sorted(projects, key=lambda item: (PROJECT_CATEGORY_ORDER.index(item["category"]), -item["modified_ts"]))


def _inspect_project(project_root: Path, projects_root: Path) -> dict:
    file_count = 0
    total_size = 0
    latest_mtime = project_root.stat().st_mtime
    suffixes: set[str] = set()
    manifest_text = ""
    top_level_names = {item.name.lower() for item in project_root.iterdir()}

    for manifest_name in ("package.json", "pyproject.toml", "README.md"):
        manifest_path = project_root / manifest_name
        if manifest_path.exists() and manifest_path.is_file():
            manifest_text += "\n" + manifest_path.read_text(encoding="utf-8", errors="replace")[:100_000].lower()

    for file_path in _iter_project_files(project_root):
        try:
            stat = file_path.stat()
        except OSError:
            continue
        file_count += 1
        total_size += stat.st_size
        latest_mtime = max(latest_mtime, stat.st_mtime)
        suffixes.add(file_path.suffix.lower())

    category = _detect_project_category(project_root.name, top_level_names, suffixes, manifest_text)
    encoded_ref = _encode_project_ref(project_root)
    browse_token = _build_project_action_token(encoded_ref, "browse")
    download_token = _build_project_action_token(encoded_ref, "download")
    delete_token = _build_project_action_token(encoded_ref, "delete")
    preview_url = _project_static_preview_url(project_root)

    return {
        "name": project_root.name,
        "path": str(project_root),
        "category": category,
        "file_count": file_count,
        "size_bytes": total_size,
        "modified_ts": latest_mtime,
        "modified_label": datetime.fromtimestamp(latest_mtime).strftime("%d %b %Y %H:%M"),
        "browse_url": f"/projects/{encoded_ref}?token={browse_token}",
        "download_url": f"/projects/{encoded_ref}/download?token={download_token}",
        "delete_url": f"/projects/{encoded_ref}/delete?token={delete_token}",
        "preview_url": preview_url,
        "protected": project_root.name in PROTECTED_PROJECT_NAMES or project_root.resolve() == Path.cwd().resolve(),
    }


def _iter_project_files(project_root: Path):
    for current_root, directories, filenames in os.walk(project_root, topdown=True, followlinks=False):
        directories[:] = [
            directory
            for directory in directories
            if directory not in PROJECT_DOWNLOAD_EXCLUDED_DIRS
            and not (Path(current_root) / directory).is_symlink()
        ]
        for filename in filenames:
            if filename in PROJECT_DOWNLOAD_EXCLUDED_FILES or filename.startswith(".env."):
                continue
            path = Path(current_root) / filename
            if path.is_file() and not path.is_symlink():
                yield path


def _detect_project_category(name: str, top_level_names: set[str], suffixes: set[str], manifest_text: str) -> str:
    lowered_name = name.lower()
    if {"expo", "react-native"} & set(re.findall(r"[a-z0-9-]+", manifest_text)) or "app.json" in top_level_names:
        return "mobile"
    if any(marker in manifest_text for marker in ('"next"', '"vite"', '"react"', '"vue"', '"nuxt"', '"svelte"')) or "index.html" in top_level_names:
        return "web"
    if suffixes & {".ppt", ".pptx"}:
        return "presentation"
    if suffixes & {".pdf", ".doc", ".docx", ".odt"}:
        return "document"
    if suffixes & {".csv", ".xls", ".xlsx", ".ods"}:
        return "spreadsheet"
    if any(keyword in lowered_name for keyword in ("bot", "agent", "assistant", "automation", "telegram")):
        return "bot"
    if any(keyword in manifest_text for keyword in ("telegram bot", "aiogram", "python-telegram-bot", "whatsapp bot")):
        return "bot"
    return "other"


def _render_dashboard_page(tasks: list[dict], projects: list[dict]) -> str:
    task_cards = "\n".join(_render_dashboard_task_card(task) for task in tasks)
    if not task_cards:
        task_cards = """
          <article class="empty-card">
            <strong>Belum ada task.</strong>
            <span>Kirim instruksi dari WhatsApp untuk mulai membuat project dengan Hermes Agent.</span>
          </article>
        """

    completed_count = sum(1 for task in tasks if task.get("status") == "completed")
    running_count = sum(1 for task in tasks if task.get("status") in {"queued", "running", "waiting_approval"})
    failed_count = sum(1 for task in tasks if task.get("status") == "failed")
    active_workspace = _render_active_workspace(tasks)
    project_sections = _render_project_sections(projects)
    category_nav = _render_project_category_nav(projects)

    return f"""<!doctype html>
<html lang="id">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <title>Hermes Assistants</title>
    <style>{_dashboard_css()}</style>
  </head>
  <body>
    <main class="page-shell">
      <nav class="topbar">
        <a class="brand" href="/">
          <span class="brand-mark">H</span>
          <span>
            <strong>Hermes Assistants</strong>
            <small>WhatsApp control layer</small>
          </span>
        </a>
        <a class="status-pill" href="/health"><span></span> Online</a>
      </nav>

      <section class="hero-grid">
        <div class="hero-card">
          <p class="eyebrow">Meta WhatsApp Cloud API + Hermes Agent</p>
          <h1>Control Hermes dari WhatsApp, pantau hasilnya di sini.</h1>
          <p class="lead">
            Semua project di <strong>/root/hermes-projects</strong> tampil di sini, baik dibuat dari WhatsApp
            maupun langsung melalui Hermes CLI. Project dikelompokkan otomatis dan bisa di-preview,
            di-download sebagai ZIP, atau dihapus melalui konfirmasi.
          </p>
          <div class="hero-actions">
            <a class="button primary" href="#projects">Buka Project Library</a>
            <a class="button" href="#office">Hermes Office</a>
            <a class="button" href="#results">Riwayat Task WA</a>
            <a class="button" href="/control">Hermes Control Center</a>
          </div>
        </div>
        <aside class="control-card">
          <span class="card-label">Runtime</span>
          <dl>
            <div><dt>Agent</dt><dd>Hermes CLI</dd></div>
            <div><dt>Projects</dt><dd>/root/hermes-projects</dd></div>
            <div><dt>Channel</dt><dd>WhatsApp Cloud API</dd></div>
            <div><dt>Mode</dt><dd>Autonomous task runner</dd></div>
          </dl>
        </aside>
      </section>

      <section class="stats-grid" aria-label="Task summary">
        <article><strong>{len(projects)}</strong><span>All projects</span></article>
        <article><strong>{len(tasks)}</strong><span>Recent WA tasks</span></article>
        <article><strong>{completed_count}</strong><span>Completed</span></article>
        <article><strong>{running_count + failed_count}</strong><span>Active / attention</span></article>
      </section>

      {active_workspace}

      <section class="section-head" id="projects">
        <div>
          <p class="eyebrow">Project library</p>
          <h2>Semua project Hermes</h2>
        </div>
        <p>Project dipisahkan berdasarkan tipe. Download ZIP tidak menyertakan secret, repository metadata, dependency cache, atau virtual environment.</p>
      </section>

      {category_nav}
      {project_sections}

      <section class="section-head task-history-head" id="results">
        <div>
          <p class="eyebrow">WhatsApp activity</p>
          <h2>Riwayat task dari WhatsApp</h2>
        </div>
        <p>Task terbaru muncul otomatis di sini. Buka detail untuk melihat prompt, hasil, log, preview, dan file download.</p>
      </section>

      <section class="task-grid">
        {task_cards}
      </section>
    </main>
  </body>
</html>"""


def _render_active_workspace(tasks: list[dict]) -> str:
    active_statuses = {"queued", "running", "waiting_approval"}
    active_tasks = [task for task in tasks if str(task.get("status") or "").lower() in active_statuses]
    model_name, context_label = _read_hermes_model_status()
    if not active_tasks:
        return f"""
          <section class="office-floor idle-office" id="office">
            <div class="office-copy">
              <p class="eyebrow">Hermes office</p>
              <h2>Ruang kerja sedang kosong.</h2>
              <p>Belum ada task yang sedang antre atau dikerjakan. Ketika kamu membuat project dari WhatsApp, operator Hermes akan muncul di sini dengan progress dan task detail.</p>
            </div>
            <div class="office-model-card">
              <span>Active model</span>
              <strong>{escape(model_name)}</strong>
              <small>Context: {escape(context_label)}</small>
            </div>
          </section>
        """

    worker_cards = "".join(_render_worker_card(task, model_name) for task in active_tasks[:6])
    return f"""
      <section class="office-floor" id="office">
        <div class="office-copy">
          <p class="eyebrow">Hermes office</p>
          <h2>Ruang kerja Hermes</h2>
          <p>Lihat task yang sedang antre, berjalan, atau menunggu approval. Anggap ini seperti ruang kantor: setiap kartu adalah worker Hermes yang sedang memproses instruksi dari WhatsApp.</p>
        </div>
        <div class="worker-grid">
          {worker_cards}
        </div>
      </section>
    """


def _render_worker_card(task: dict, model_name: str) -> str:
    task_id = str(task.get("id") or "")
    status = str(task.get("status") or "unknown")
    progress = int(task.get("progress_percent") or 0)
    step = str(task.get("current_step") or "Analysing")
    prompt = str(task.get("prompt") or "")
    project_label = _infer_project_label(prompt, str(task.get("result_summary") or ""))
    detail_url = _build_task_detail_url(task_id)
    progress_clamped = max(0, min(progress, 100))
    return f"""
      <article class="worker-card">
        <div class="worker-top">
          <span class="worker-avatar">H</span>
          <span class="status-dot {escape(status)}">{escape(status)}</span>
        </div>
        <h3>{escape(project_label)}</h3>
        <p>{escape(_truncate_text(prompt, 120))}</p>
        <div class="worker-meter" aria-label="Progress {progress_clamped}%"><span style="width:{progress_clamped}%"></span></div>
        <dl class="worker-facts">
          <div><dt>AI</dt><dd>{escape(model_name)}</dd></div>
          <div><dt>Step</dt><dd>{escape(step)}</dd></div>
          <div><dt>Task</dt><dd>{escape(task_id)}</dd></div>
        </dl>
        <div class="task-actions">
          <a class="primary-link" href="{escape(detail_url)}">Pantau worker</a>
        </div>
      </article>
    """


def _infer_project_label(prompt: str, summary: str) -> str:
    text = "\n".join([prompt, summary])
    path_match = re.search(r"/root/hermes-projects/([^\n`/]+)", text)
    if path_match:
        return path_match.group(1).strip(" .,:;)")
    quoted_match = re.search(r"project\s+['\"]([^'\"]+)['\"]", text, flags=re.IGNORECASE)
    if quoted_match:
        return quoted_match.group(1).strip()
    lowered = prompt.lower()
    for marker in ("buat project", "buatkan project", "project"):
        if marker in lowered:
            tail = prompt[lowered.index(marker) + len(marker) :].strip(" :.-")
            if tail:
                return _truncate_text(tail, 42)
    return "Hermes task"


def _render_project_category_nav(projects: list[dict]) -> str:
    counts = {category: 0 for category in PROJECT_CATEGORY_ORDER}
    for project in projects:
        counts[project["category"]] += 1
    links = [
        f'<a href="#category-{category}">{escape(PROJECT_CATEGORY_LABELS[category])}<span>{counts[category]}</span></a>'
        for category in PROJECT_CATEGORY_ORDER
        if counts[category]
    ]
    if not links:
        return ""
    return f'<nav class="category-nav" aria-label="Project categories">{"".join(links)}</nav>'


def _render_project_sections(projects: list[dict]) -> str:
    if not projects:
        return """
          <section class="empty-card project-empty">
            <strong>Belum ada project di /root/hermes-projects.</strong>
            <span>Buat project melalui Hermes CLI atau WhatsApp, lalu project akan muncul otomatis.</span>
          </section>
        """

    sections: list[str] = []
    for category in PROJECT_CATEGORY_ORDER:
        category_projects = [project for project in projects if project["category"] == category]
        if not category_projects:
            continue
        cards = "".join(_render_project_card(project) for project in category_projects)
        sections.append(
            f"""
            <section class="project-section" id="category-{category}">
              <div class="project-section-head">
                <h3>{escape(PROJECT_CATEGORY_LABELS[category])}</h3>
                <span>{len(category_projects)} project</span>
              </div>
              <div class="project-grid">{cards}</div>
            </section>
            """
        )
    return "".join(sections)


def _render_project_card(project: dict) -> str:
    preview_link = ""
    if project["preview_url"]:
        preview_link = f'<a class="primary-link" href="{escape(project["preview_url"])}">Preview</a>'
    protected_note = '<span class="protected-label">System project</span>' if project["protected"] else ""
    delete_link = ""
    if not project["protected"]:
        delete_link = f'<a class="danger-link" href="{escape(project["delete_url"])}">Delete</a>'

    return f"""
      <article class="project-card">
        <div class="project-card-top">
          <span class="project-icon">{escape(_project_category_initial(project["category"]))}</span>
          {protected_note}
        </div>
        <h4>{escape(project["name"])}</h4>
        <p class="project-path">{escape(project["path"])}</p>
        <div class="project-facts">
          <span>{project["file_count"]} files</span>
          <span>{escape(_format_file_size(project["size_bytes"]))}</span>
          <span>{escape(project["modified_label"])}</span>
        </div>
        <div class="task-actions project-actions">
          {preview_link}
          <a class="primary-link" href="{escape(project["browse_url"])}">Open files</a>
          <a href="{escape(project["download_url"])}">Download ZIP</a>
          {delete_link}
        </div>
      </article>
    """


def _project_category_initial(category: str) -> str:
    return {
        "web": "W",
        "mobile": "M",
        "presentation": "P",
        "document": "D",
        "spreadsheet": "S",
        "bot": "B",
        "other": "O",
    }.get(category, "P")


def _render_dashboard_task_card(task: dict) -> str:
    task_id = str(task.get("id") or "")
    status = str(task.get("status") or "unknown")
    summary = str(task.get("result_summary") or task.get("error_summary") or "")
    prompt = str(task.get("prompt") or "No prompt")
    detail_url = _build_task_detail_url(task_id)
    log_url = _build_task_log_url(task_id)
    preview_url = _find_project_preview_url(summary)
    download_urls = _find_download_urls(summary, limit=1)
    result_badge = "Project result" if preview_url or download_urls else "Task detail"
    extra_link = ""
    if preview_url:
        extra_link = f'<a href="{escape(preview_url)}">Preview</a>'
    elif download_urls:
        extra_link = f'<a href="{escape(download_urls[0][1])}">{escape(download_urls[0][0])}</a>'

    return f"""
      <article class="task-card">
        <div class="task-card-head">
          <span class="status-dot {escape(status)}">{escape(status)}</span>
          <span>{escape(result_badge)}</span>
        </div>
        <h3>Task {escape(task_id)}</h3>
        <p>{escape(_truncate_text(prompt, 150))}</p>
        <div class="task-meta">
          <span>Progress {escape(str(task.get("progress_percent") or 0))}%</span>
          <span>{escape(_format_datetime_label(task.get("created_at")))}</span>
        </div>
        <div class="task-actions">
          <a class="primary-link" href="{escape(detail_url)}">Open detail</a>
          <a href="{escape(log_url)}">Log</a>
          {extra_link}
        </div>
      </article>
    """


def _render_task_detail_page(task: dict, log_text: str, summary: str, prompt: str, log_url: str) -> str:
    task_id = str(task.get("id") or "")
    status = str(task.get("status") or "-")
    preview_url = _find_project_preview_url(summary)
    download_urls = _find_download_urls(summary, limit=5)
    asset_links = []
    if preview_url:
        asset_links.append(f'<a class="button primary" href="{escape(preview_url)}">Open preview</a>')
    for label, url in download_urls:
        asset_links.append(f'<a class="button" href="{escape(url)}">{escape(label)}</a>')
    if not asset_links:
        asset_links.append('<span class="muted">Belum ada preview/download terdeteksi dari summary Hermes.</span>')

    return f"""<!doctype html>
<html lang="id">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <title>Task {escape(task_id)}</title>
    <style>{_dashboard_css()}</style>
  </head>
  <body>
    <main class="page-shell detail-shell">
      <nav class="topbar">
        <a class="brand" href="/">
          <span class="brand-mark">H</span>
          <span><strong>Hermes Assistants</strong><small>Task detail</small></span>
        </a>
        <a class="status-pill" href="{escape(log_url)}"><span></span> Raw log</a>
      </nav>

      <section class="detail-hero">
        <div>
          <p class="eyebrow">Hermes task</p>
          <h1>Task {escape(task_id)}</h1>
          <p class="lead">Status task, prompt, hasil, log, dan output project yang dikirim dari WhatsApp.</p>
        </div>
        <span class="status-dot {escape(status)}">{escape(status)}</span>
      </section>

      <section class="info-grid">
        {_render_info_item("Status", status)}
        {_render_info_item("Current step", str(task.get("current_step") or "-"))}
        {_render_info_item("Progress", f"{task.get('progress_percent') or 0}%")}
        {_render_info_item("Created", _format_datetime_label(task.get("created_at")))}
        {_render_info_item("Started", _format_datetime_label(task.get("started_at")))}
        {_render_info_item("Finished", _format_datetime_label(task.get("finished_at")))}
      </section>

      <section class="card">
        <div class="card-title"><span>Output links</span><small>Preview dan file hasil Hermes</small></div>
        <div class="asset-actions">{"".join(asset_links)}</div>
      </section>

      <section class="content-grid">
        <article class="card">
          <div class="card-title"><span>User Prompt</span><small>Instruksi dari WhatsApp</small></div>
          <pre class="code-block">{escape(prompt or "No prompt")}</pre>
        </article>
        <article class="card">
          <div class="card-title"><span>Summary</span><small>Hasil akhir Hermes</small></div>
          <pre class="code-block summary-block">{escape(summary or "No summary available yet.")}</pre>
        </article>
      </section>

      <section class="card">
        <div class="card-title"><span>Log Tail</span><small>Output terakhir dari Hermes</small></div>
        <pre class="code-block log-block">{escape(log_text or "No log output yet.")}</pre>
      </section>
    </main>
  </body>
</html>"""


def _render_info_item(label: str, value: str) -> str:
    return f"""
      <article>
        <span>{escape(label)}</span>
        <strong>{escape(value or "-")}</strong>
      </article>
    """


def _dashboard_css() -> str:
    return """
      @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');

      :root {
        color-scheme: dark;
        --bg: #050814;
        --panel: #0a0e1c;
        --panel-strong: #121932;
        --text: #f1f5f9;
        --muted: #94a3b8;
        --border: rgba(255, 255, 255, 0.06);
        --accent: #00d2ff;
        --accent-dark: #006d86;
        --danger: #f43f5e;
        --warn: #f59e0b;
        --ok: #10b981;
        --shadow: 0 0 12px rgba(0, 210, 255, 0.15);
      }
      * { box-sizing: border-box; }
      html { scroll-behavior: smooth; }
      body {
        margin: 0;
        min-width: 320px;
        overflow-x: hidden;
        font-family: 'Manrope', system-ui, -apple-system, sans-serif;
        color: var(--text);
        background:
          radial-gradient(circle at top left, rgba(0, 210, 255, 0.06), transparent 40rem),
          radial-gradient(circle at top right, rgba(16, 185, 129, 0.04), transparent 35rem),
          var(--bg);
        line-height: 1.5;
      }
      a { color: inherit; text-decoration: none; transition: color 0.2s; }
      a:hover { color: var(--accent); }
      .page-shell {
        width: min(1200px, calc(100% - 32px));
        margin: 0 auto;
        padding: 24px 0 48px;
      }
      .topbar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 14px;
        margin-bottom: 24px;
        border-bottom: 1px solid var(--border);
        padding-bottom: 16px;
      }
      .brand {
        display: flex;
        align-items: center;
        gap: 12px;
        min-width: 0;
      }
      .brand-mark {
        display: grid;
        place-items: center;
        flex: 0 0 auto;
        width: 40px;
        height: 40px;
        border-radius: 10px;
        color: var(--accent);
        background: var(--panel-strong);
        border: 1px solid var(--border);
        font-weight: 800;
        font-size: 18px;
      }
      .brand strong, .brand small { display: block; }
      .brand strong { font-size: 16px; font-weight: 700; color: var(--text); }
      .brand small { color: var(--muted); margin-top: 2px; font-size: 11px; }
      .status-pill {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        white-space: nowrap;
        border: 1px solid rgba(16, 185, 129, 0.2);
        background: rgba(16, 185, 129, 0.06);
        color: var(--ok);
        border-radius: 999px;
        padding: 8px 14px;
        font-weight: 700;
        font-size: 12px;
        transition: all 0.2s;
      }
      .status-pill:hover {
        background: rgba(16, 185, 129, 0.1);
        border-color: rgba(16, 185, 129, 0.3);
      }
      .status-pill span {
        width: 6px;
        height: 6px;
        border-radius: 999px;
        background: currentColor;
        box-shadow: 0 0 8px currentColor;
      }
      .hero-grid {
        display: grid;
        grid-template-columns: minmax(0, 1.35fr) minmax(300px, 0.65fr);
        gap: 20px;
        margin-bottom: 24px;
      }
      .hero-card, .control-card, .card, .task-card, .empty-card, .info-grid article, .stats-grid article {
        border: 1px solid var(--border);
        background: var(--panel);
        border-radius: 12px;
      }
      .hero-card {
        padding: clamp(24px, 4vw, 36px);
      }
      .eyebrow {
        margin: 0 0 12px;
        color: var(--accent);
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.1em;
        text-transform: uppercase;
      }
      h1, h2, h3, h4 { margin: 0; letter-spacing: -0.02em; font-weight: 700; color: var(--text); }
      h1 { font-size: clamp(30px, 5vw, 44px); line-height: 1.15; max-width: 850px; }
      h2 { font-size: clamp(22px, 3.5vw, 32px); }
      h3 { font-size: 18px; overflow-wrap: anywhere; }
      h4 { font-size: 16px; }
      .lead {
        color: var(--muted);
        max-width: 760px;
        line-height: 1.6;
        font-size: 15px;
        margin: 16px 0 0;
      }
      .hero-actions, .task-actions, .asset-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin-top: 24px;
      }
      .button, .task-actions a {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 40px;
        border-radius: 8px;
        border: 1px solid var(--border);
        padding: 0 16px;
        font-weight: 600;
        font-size: 13px;
        background: rgba(255, 255, 255, 0.02);
        color: var(--text);
        cursor: pointer;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      }
      .button:hover, .task-actions a:hover {
        background: rgba(255, 255, 255, 0.06);
        border-color: rgba(255, 255, 255, 0.16);
      }
      .button.primary, .primary-link {
        background: var(--accent) !important;
        color: #050814 !important;
        border-color: var(--accent) !important;
        font-weight: 700;
      }
      .button.primary:hover, .primary-link:hover {
        background: #38bdf8 !important;
        border-color: #38bdf8 !important;
        box-shadow: var(--shadow);
      }
      .control-card {
        padding: 24px;
        align-self: stretch;
      }
      .card-label {
        display: inline-block;
        color: var(--accent);
        font-weight: 700;
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        margin-bottom: 16px;
      }
      dl { margin: 0; display: grid; gap: 14px; }
      dl div {
        display: grid;
        grid-template-columns: minmax(80px, 0.35fr) minmax(0, 1fr);
        gap: 12px;
        align-items: start;
      }
      dt { color: var(--muted); font-weight: 600; font-size: 13px; }
      dd { margin: 0; overflow-wrap: anywhere; font-size: 13px; color: var(--text); }
      .stats-grid, .task-grid, .info-grid, .content-grid {
        display: grid;
        gap: 16px;
      }
      .stats-grid {
        grid-template-columns: repeat(4, minmax(0, 1fr));
        margin: 20px 0 32px;
      }
      .stats-grid article, .info-grid article {
        padding: 20px;
        background: var(--panel);
        border: 1px solid var(--border);
      }
      .stats-grid strong {
        display: block;
        font-size: 32px;
        letter-spacing: -0.03em;
        color: var(--text);
        margin-bottom: 4px;
      }
      .stats-grid span, .info-grid span, .muted {
        color: var(--muted);
        font-size: 13px;
      }
      .section-head {
        display: flex;
        justify-content: space-between;
        gap: 18px;
        align-items: flex-end;
        margin: 32px 0 20px;
        border-bottom: 1px solid var(--border);
        padding-bottom: 12px;
      }
      .section-head h2 {
        font-size: 24px;
      }
      .section-head p:last-child {
        max-width: 520px;
        color: var(--muted);
        line-height: 1.5;
        margin: 0;
        font-size: 13px;
      }
      .category-nav {
        display: flex;
        gap: 8px;
        overflow-x: auto;
        padding: 4px 0 16px;
        scrollbar-width: thin;
        margin-bottom: 12px;
      }
      .category-nav a {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        flex: 0 0 auto;
        border: 1px solid var(--border);
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.02);
        padding: 8px 16px;
        font-size: 13px;
        font-weight: 600;
        color: var(--muted);
        transition: all 0.2s;
      }
      .category-nav a:hover, .category-nav a.active {
        background: rgba(255, 255, 255, 0.06);
        border-color: rgba(255, 255, 255, 0.16);
        color: var(--text);
      }
      .category-nav a.active {
        border-color: var(--accent);
        color: var(--accent);
      }
      .category-nav span {
        display: grid;
        place-items: center;
        min-width: 20px;
        height: 20px;
        border-radius: 999px;
        background: var(--panel-strong);
        color: var(--muted);
        font-size: 11px;
        font-weight: 700;
        padding: 0 6px;
      }
      .category-nav a.active span {
        background: var(--accent);
        color: #050814;
      }
      .project-section {
        scroll-margin-top: 16px;
        margin: 8px 0 32px;
      }
      .project-section-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 16px;
      }
      .project-section-head h3 {
        font-size: 20px;
        color: var(--accent);
      }
      .project-section-head span {
        color: var(--muted);
        font-size: 12px;
        font-weight: 600;
      }
      .office-floor {
        display: grid;
        grid-template-columns: minmax(260px, 0.35fr) minmax(0, 1fr);
        gap: 20px;
        align-items: stretch;
        margin: 12px 0 32px;
        border: 1px solid var(--border);
        border-radius: 12px;
        padding: 24px;
        background: radial-gradient(circle at 100% 100%, rgba(0, 210, 255, 0.05), transparent 30rem), var(--panel);
        color: var(--text);
      }
      .office-copy {
        display: grid;
        align-content: center;
        min-height: 200px;
      }
      .office-copy .eyebrow { color: var(--accent); }
      .office-copy h2 {
        color: var(--text);
        font-size: 28px;
        line-height: 1.2;
      }
      .office-copy p {
        margin: 12px 0 0;
        color: var(--muted);
        line-height: 1.6;
        font-size: 14px;
      }
      .office-model-card {
        align-self: center;
        border: 1px solid var(--border);
        border-radius: 10px;
        padding: 20px;
        background: var(--panel-strong);
      }
      .office-model-card span, .office-model-card small {
        display: block;
        color: var(--muted);
        font-size: 12px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
      .office-model-card strong {
        display: block;
        margin: 8px 0;
        font-size: 20px;
        overflow-wrap: anywhere;
        color: var(--accent);
      }
      .worker-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 16px;
      }
      .worker-card {
        min-width: 0;
        border: 1px solid var(--border);
        border-radius: 10px;
        padding: 20px;
        background: var(--panel-strong);
      }
      .worker-top {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        margin-bottom: 16px;
      }
      .worker-avatar {
        display: grid;
        place-items: center;
        width: 38px;
        height: 38px;
        border-radius: 8px;
        color: #050814;
        background: var(--accent);
        font-weight: 800;
        font-size: 16px;
      }
      .worker-card h3 { color: var(--text); font-size: 16px; }
      .worker-card p {
        min-height: 54px;
        color: var(--muted);
        line-height: 1.5;
        font-size: 13px;
        margin: 8px 0;
      }
      .worker-meter {
        height: 6px;
        overflow: hidden;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.06);
        margin: 12px 0;
      }
      .worker-meter span {
        display: block;
        height: 100%;
        border-radius: inherit;
        background: linear-gradient(90deg, var(--accent), var(--ok));
      }
      .worker-facts {
        display: grid;
        gap: 6px;
        font-size: 11px;
      }
      .worker-facts div {
        display: grid;
        grid-template-columns: 54px minmax(0, 1fr);
        gap: 8px;
      }
      .worker-facts dt { color: var(--muted); font-weight: 500; }
      .worker-facts dd { color: var(--text); font-weight: 600; }
      .worker-card .task-actions a {
        color: #050814 !important;
        background: var(--accent) !important;
        border-color: var(--accent) !important;
      }
      .worker-card .task-actions a:hover {
        background: #38bdf8 !important;
        border-color: #38bdf8 !important;
      }
      .project-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 16px;
      }
      .project-card {
        min-width: 0;
        border: 1px solid var(--border);
        border-radius: 12px;
        padding: 20px;
        background: var(--panel);
        transition: all 0.2s;
      }
      .project-card:hover {
        border-color: rgba(0, 210, 255, 0.2);
        box-shadow: var(--shadow);
      }
      .project-card-top {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 10px;
        margin-bottom: 16px;
      }
      .project-icon {
        display: grid;
        place-items: center;
        width: 36px;
        height: 36px;
        border-radius: 8px;
        background: rgba(0, 210, 255, 0.08);
        color: var(--accent);
        font-weight: 800;
        font-size: 14px;
      }
      .protected-label {
        border-radius: 999px;
        padding: 4px 10px;
        color: var(--ok);
        background: rgba(16, 185, 129, 0.08);
        font-size: 11px;
        font-weight: 700;
        border: 1px solid rgba(16, 185, 129, 0.15);
      }
      .project-card h4 {
        margin: 0;
        font-size: 18px;
        color: var(--text);
        overflow-wrap: anywhere;
      }
      .project-path {
        margin: 8px 0 16px;
        min-height: 36px;
        color: var(--muted);
        font-family: 'JetBrains Mono', Consolas, monospace;
        font-size: 11px;
        line-height: 1.5;
        overflow-wrap: anywhere;
      }
      .project-facts {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
      }
      .project-facts span {
        border: 1px solid var(--border);
        border-radius: 4px;
        padding: 4px 8px;
        color: var(--muted);
        background: rgba(255, 255, 255, 0.01);
        font-size: 11px;
        font-weight: 500;
      }
      .project-actions {
        margin-top: 18px;
      }
      .danger-link {
        color: var(--danger) !important;
        border-color: rgba(244, 63, 94, 0.2) !important;
        background: rgba(244, 63, 94, 0.05) !important;
      }
      .danger-link:hover {
        background: rgba(244, 63, 94, 0.1) !important;
        border-color: var(--danger) !important;
      }
      .task-history-head {
        margin-top: 48px;
      }
      .project-empty {
        margin-bottom: 30px;
        text-align: center;
        padding: 40px;
        border: 1px dashed var(--border);
        border-radius: 12px;
        color: var(--muted);
        background: rgba(255, 255, 255, 0.01);
      }
      .task-grid {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }
      .task-card, .empty-card {
        padding: 20px;
        min-width: 0;
      }
      .task-card:hover {
        border-color: rgba(0, 210, 255, 0.2);
        box-shadow: var(--shadow);
      }
      .task-card-head, .task-meta {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        color: var(--muted);
        font-size: 12px;
        font-weight: 600;
        margin-bottom: 16px;
      }
      .status-dot {
        display: inline-flex;
        align-items: center;
        width: fit-content;
        border-radius: 999px;
        padding: 4px 10px;
        background: rgba(255, 255, 255, 0.04);
        color: var(--muted);
        font-size: 11px;
        font-weight: 700;
        text-transform: capitalize;
        border: 1px solid var(--border);
      }
      .status-dot.completed {
        background: rgba(16, 185, 129, 0.08);
        color: var(--ok);
        border-color: rgba(16, 185, 129, 0.15);
      }
      .status-dot.running, .status-dot.queued, .status-dot.waiting_approval {
        background: rgba(245, 158, 11, 0.08);
        color: var(--warn);
        border-color: rgba(245, 158, 11, 0.15);
      }
      .status-dot.failed {
        background: rgba(244, 63, 94, 0.08);
        color: var(--danger);
        border-color: rgba(244, 63, 94, 0.15);
      }
      .task-card p {
        min-height: 60px;
        color: var(--muted);
        line-height: 1.5;
        overflow-wrap: anywhere;
        font-size: 13px;
        margin: 12px 0;
      }
      .detail-shell { max-width: 1040px; }
      .detail-hero {
        display: flex;
        justify-content: space-between;
        gap: 18px;
        align-items: flex-start;
        margin: 24px 0;
      }
      .info-grid {
        grid-template-columns: repeat(3, minmax(0, 1fr));
        margin-bottom: 18px;
      }
      .info-grid strong {
        display: block;
        margin-top: 8px;
        line-height: 1.35;
        overflow-wrap: anywhere;
        font-size: 16px;
        color: var(--text);
      }
      .card {
        padding: clamp(20px, 3vw, 28px);
        margin-bottom: 20px;
        min-width: 0;
      }
      .card-title {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        align-items: baseline;
        margin-bottom: 18px;
        border-bottom: 1px solid var(--border);
        padding-bottom: 10px;
      }
      .card-title span {
        font-size: 20px;
        font-weight: 700;
        letter-spacing: -0.02em;
      }
      .card-title small { color: var(--muted); font-size: 12px; }
      .content-grid {
        grid-template-columns: 1fr;
      }
      .code-block {
        width: 100%;
        max-width: 100%;
        margin: 0;
        overflow: auto;
        white-space: pre-wrap;
        overflow-wrap: anywhere;
        word-break: break-word;
        border-radius: 8px;
        background: #040711;
        color: #f1f5f9;
        padding: 18px;
        line-height: 1.6;
        font-size: 12px;
        font-family: 'JetBrains Mono', Consolas, monospace;
        border: 1px solid var(--border);
      }
      .summary-block {
        background: var(--panel-strong);
        color: var(--text);
        border: 1px solid var(--border);
      }
      .log-block {
        max-height: 520px;
      }
      .delete-shell {
        max-width: 600px;
        min-height: 80vh;
        display: grid;
        align-content: center;
      }
      .delete-card h1 {
        font-size: clamp(28px, 6vw, 44px);
        color: var(--danger);
      }
      .delete-target {
        display: grid;
        gap: 6px;
        margin: 24px 0;
        border: 1px solid rgba(244, 63, 94, 0.2);
        border-radius: 8px;
        padding: 16px;
        background: rgba(244, 63, 94, 0.03);
      }
      .delete-target span {
        color: var(--muted);
        font-family: 'JetBrains Mono', Consolas, monospace;
        font-size: 12px;
        overflow-wrap: anywhere;
      }
      .delete-error {
        margin-bottom: 20px;
        border-radius: 8px;
        padding: 12px 16px;
        color: var(--danger);
        background: rgba(244, 63, 94, 0.08);
        font-weight: 600;
        font-size: 13px;
        border: 1px solid rgba(244, 63, 94, 0.15);
      }
      form {
        display: grid;
        gap: 16px;
      }
      form label {
        font-weight: 600;
        font-size: 13px;
        color: var(--text);
      }
      form input[type="text"], form input[type="password"], form input:not([type]) {
        width: 100%;
        min-height: 42px;
        border: 1px solid var(--border);
        border-radius: 8px;
        padding: 0 14px;
        background: rgba(255, 255, 255, 0.02);
        color: var(--text);
        font: inherit;
        font-size: 14px;
        transition: all 0.2s;
      }
      form input[type="text"]:focus, form input[type="password"]:focus, form input:not([type]):focus {
        border-color: var(--accent);
        background: rgba(255, 255, 255, 0.04);
        box-shadow: 0 0 0 2px rgba(0, 210, 255, 0.1);
        outline: none;
      }
      .check-row {
        display: grid;
        grid-template-columns: auto 1fr;
        align-items: start;
        gap: 12px;
        color: var(--muted);
        line-height: 1.4;
        font-weight: 500;
        font-size: 13px;
      }
      .check-row input {
        width: 16px;
        height: 16px;
        margin-top: 1px;
      }
      .danger-button {
        min-height: 42px;
        border: 0;
        border-radius: 8px;
        padding: 0 20px;
        color: #050814;
        background: var(--danger);
        font: inherit;
        font-weight: 700;
        font-size: 13px;
        cursor: pointer;
        transition: background 0.2s;
      }
      .danger-button:hover {
        background: #f43f5e;
      }
      .project-browser-shell { max-width: 1320px; }
      .project-browser-hero {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(280px, 0.4fr);
        gap: 20px;
        align-items: stretch;
        margin: 24px 0;
      }
      .project-browser-hero > div, .project-browser-stats, .file-list-card, .file-preview-card {
        border: 1px solid var(--border);
        border-radius: 12px;
        background: var(--panel);
      }
      .project-browser-hero > div { padding: clamp(24px, 4vw, 36px); }
      .project-browser-stats {
        display: grid;
        gap: 12px;
        padding: 20px;
      }
      .project-browser-stats article {
        border: 1px solid var(--border);
        border-radius: 8px;
        padding: 16px;
        background: var(--panel-strong);
      }
      .project-browser-stats strong {
        display: block;
        font-size: 24px;
        letter-spacing: -0.02em;
        overflow-wrap: anywhere;
        color: var(--text);
        margin-bottom: 2px;
      }
      .project-browser-stats span { color: var(--muted); font-weight: 600; font-size: 12px; }
      .file-room {
        display: grid;
        grid-template-columns: minmax(260px, 0.34fr) minmax(0, 1fr);
        gap: 20px;
      }
      .file-list-card, .file-preview-card {
        min-width: 0;
        padding: 20px;
      }
      .file-list {
        display: grid;
        gap: 8px;
        max-height: 72vh;
        overflow: auto;
        padding-right: 4px;
      }
      .file-row {
        display: grid;
        grid-template-columns: 36px minmax(0, 1fr);
        gap: 4px 12px;
        align-items: center;
        border: 1px solid var(--border);
        border-radius: 8px;
        padding: 10px;
        background: var(--panel-strong);
        transition: all 0.2s;
      }
      .file-row:hover {
        border-color: rgba(255, 255, 255, 0.12);
      }
      .file-row.selected {
        border-color: rgba(0, 210, 255, 0.3);
        background: rgba(0, 210, 255, 0.04);
        color: var(--accent);
      }
      .file-type {
        display: grid;
        place-items: center;
        width: 32px;
        height: 32px;
        border-radius: 6px;
        color: var(--accent);
        background: rgba(0, 210, 255, 0.08);
        font-size: 9px;
        font-weight: 700;
        text-transform: uppercase;
      }
      .file-name {
        overflow-wrap: anywhere;
        font-weight: 600;
        font-size: 13px;
        color: var(--text);
      }
      .file-row.selected .file-name {
        color: var(--accent);
      }
      .file-meta {
        grid-column: 2;
        color: var(--muted);
        font-size: 11px;
      }
      .project-preview-code {
        min-height: 520px;
        max-height: 72vh;
      }
      .binary-preview, .file-empty {
        border: 1px dashed var(--border);
        border-radius: 8px;
        padding: 24px;
        color: var(--muted);
        background: rgba(255, 255, 255, 0.01);
        line-height: 1.6;
        text-align: center;
        font-size: 13px;
      }
      .control-shell { max-width: 1180px; }
      .control-message {
        margin-bottom: 18px;
        border: 1px solid rgba(0, 210, 255, 0.2);
        border-radius: 8px;
        padding: 12px 16px;
        color: var(--accent);
        background: rgba(0, 210, 255, 0.04);
        white-space: pre-wrap;
        font-size: 13px;
      }
      .search-form {
        grid-template-columns: minmax(0, 1fr) auto;
        align-items: end;
        margin-bottom: 20px;
      }
      .admin-list {
        display: grid;
        gap: 12px;
        max-height: 640px;
        overflow: auto;
      }
      .admin-row, .tool-row {
        display: grid;
        grid-template-columns: minmax(170px, 0.6fr) minmax(0, 1.4fr) auto;
        gap: 16px;
        align-items: center;
        border: 1px solid var(--border);
        border-radius: 10px;
        padding: 16px;
        background: var(--panel);
      }
      .admin-row strong, .admin-row small, .tool-row strong, .tool-row span {
        display: block;
      }
      .admin-row strong, .tool-row strong {
        color: var(--text);
        font-size: 15px;
      }
      .admin-row small, .tool-row span {
        color: var(--muted);
        margin-top: 3px;
        font-size: 11px;
      }
      .admin-row p {
        margin: 0;
        color: var(--muted);
        line-height: 1.5;
        font-size: 13px;
      }
      .admin-row code {
        overflow-wrap: anywhere;
        font-size: 11px;
        background: var(--panel-strong);
        padding: 2px 6px;
        border-radius: 4px;
        font-family: 'JetBrains Mono', monospace;
      }
      .search-result {
        grid-template-columns: minmax(160px, 0.5fr) minmax(0, 1fr);
      }
      .search-result form, .search-result code {
        grid-column: 1 / -1;
      }
      .tool-grid {
        display: grid;
        gap: 12px;
        grid-template-columns: 1fr 1fr;
      }
      .tool-row {
        grid-template-columns: minmax(0, 1fr) auto;
      }
      .enabled-button, .disabled-button, .danger-mini {
        border: 0;
        border-radius: 999px;
        padding: 6px 12px;
        font: inherit;
        font-size: 11px;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.2s;
      }
      .enabled-button { color: var(--ok); background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.15); }
      .enabled-button:hover { background: rgba(16, 185, 129, 0.15); }
      .disabled-button { color: var(--muted); background: rgba(255, 255, 255, 0.04); border: 1px solid var(--border); }
      .disabled-button:hover { background: rgba(255, 255, 255, 0.08); }
      .danger-mini { color: var(--danger); background: rgba(244, 63, 94, 0.08); border: 1px solid rgba(244, 63, 94, 0.15); }
      .danger-mini:hover { background: rgba(244, 63, 94, 0.15); }
      .admin-output { max-height: 520px; font-size: 11px; }
      @media (max-width: 900px) {
        .page-shell { width: min(100% - 24px, 760px); padding-top: 16px; }
        .hero-grid, .task-grid, .project-grid, .info-grid, .stats-grid, .worker-grid, .project-browser-hero, .file-room { grid-template-columns: 1fr 1fr; }
        .office-floor { grid-template-columns: 1fr; }
        .control-card { order: 2; }
        .tool-grid { grid-template-columns: 1fr; }
      }
      @media (max-width: 620px) {
        .page-shell { width: min(100% - 20px, 520px); }
        .topbar, .section-head, .detail-hero { align-items: flex-start; flex-direction: column; }
        .hero-grid, .task-grid, .project-grid, .info-grid, .stats-grid, .worker-grid, .project-browser-hero, .file-room { grid-template-columns: 1fr; }
        .hero-card { border-radius: 12px; padding: 22px; }
        .task-card p { min-height: auto; }
        .project-path { min-height: auto; }
        .office-floor { border-radius: 12px; padding: 16px; }
        .worker-card p { min-height: auto; }
        .file-list { max-height: 46vh; }
        .project-preview-code { min-height: 320px; max-height: 60vh; }
        .card-title { align-items: flex-start; flex-direction: column; }
        dl div { grid-template-columns: 1fr; gap: 3px; }
        .button, .task-actions a { width: 100%; }
        .code-block { font-size: 12px; padding: 14px; border-radius: 8px; }
        .search-form, .admin-row, .tool-row { grid-template-columns: 1fr; }
        .search-form .button, .admin-row button, .tool-row button { width: 100%; }
      }
    """


def _truncate_text(text: str, limit: int) -> str:
    cleaned = re.sub(r"\s+", " ", text).strip()
    if len(cleaned) <= limit:
        return cleaned
    return cleaned[: max(0, limit - 1)].rstrip() + "..."


def _format_datetime_label(value: object) -> str:
    text = str(value or "").strip()
    if not text:
        return "-"
    try:
        parsed = datetime.fromisoformat(text.replace("Z", "+00:00"))
    except ValueError:
        return text
    return parsed.strftime("%d %b %Y %H:%M")


def _format_file_size(size_bytes: int) -> str:
    size = float(max(0, size_bytes))
    for unit in ("B", "KB", "MB", "GB"):
        if size < 1024 or unit == "GB":
            return f"{size:.0f} {unit}" if unit == "B" else f"{size:.1f} {unit}"
        size /= 1024
    return f"{size:.1f} GB"


def _encode_project_ref(project_root: Path) -> str:
    return base64.urlsafe_b64encode(project_root.name.encode("utf-8")).decode("ascii").rstrip("=")


def _build_project_action_token(encoded_ref: str, action: str) -> str:
    payload = f"project:{action}:{encoded_ref}"
    digest = hmac.new(_task_access_secret().encode("utf-8"), payload.encode("utf-8"), hashlib.sha256).hexdigest()
    return digest[:40]


def _validate_project_action(encoded_ref: str, token: str, action: str) -> Path:
    expected = _build_project_action_token(encoded_ref, action)
    if not token or not hmac.compare_digest(token, expected):
        raise HTTPException(status_code=403, detail="Invalid project action token")
    padded = encoded_ref + "=" * (-len(encoded_ref) % 4)
    try:
        project_name = base64.urlsafe_b64decode(padded.encode("ascii")).decode("utf-8")
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Invalid project reference") from exc
    if not project_name or project_name in {".", ".."} or "/" in project_name or "\\" in project_name:
        raise HTTPException(status_code=400, detail="Invalid project name")

    projects_root = get_settings().hermes_projects_root.resolve()
    project_root = (projects_root / project_name).resolve()
    if project_root.parent != projects_root or not project_root.exists() or not project_root.is_dir():
        raise HTTPException(status_code=404, detail="Project not found")
    return project_root


def _project_is_protected(project_root: Path) -> bool:
    return project_root.name in PROTECTED_PROJECT_NAMES or project_root.resolve() == Path.cwd().resolve()


def _project_browser_url(project_root: Path) -> str:
    encoded_ref = _encode_project_ref(project_root)
    token = _build_project_action_token(encoded_ref, "browse")
    return f"/projects/{encoded_ref}?token={token}"


def _project_static_preview_url(project_root: Path) -> str | None:
    for relative in ("index.html", "dist/index.html", "build/index.html", "out/index.html"):
        index_path = project_root / relative
        if index_path.exists() and index_path.is_file():
            return _build_project_preview_url(index_path.parent)
    return None


def _build_project_archive(project_root: Path) -> io.BytesIO:
    files = list(_iter_project_files(project_root))
    total_size = sum(path.stat().st_size for path in files)
    if total_size > PROJECT_ARCHIVE_MAX_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"Project is too large to archive from the web ({_format_file_size(total_size)}).",
        )

    archive = io.BytesIO()
    with zipfile.ZipFile(archive, mode="w", compression=zipfile.ZIP_DEFLATED, compresslevel=6) as zip_file:
        for file_path in files:
            archive_name = Path(project_root.name) / file_path.relative_to(project_root)
            zip_file.write(file_path, archive_name.as_posix())
    archive.seek(0)
    return archive


def _list_project_file_entries(project_root: Path, *, limit: int = 500) -> list[dict]:
    entries: list[dict] = []
    for file_path in _iter_project_files(project_root):
        relative = file_path.relative_to(project_root).as_posix()
        try:
            stat = file_path.stat()
        except OSError:
            continue
        entries.append(
            {
                "relative": relative,
                "name": file_path.name,
                "suffix": file_path.suffix.lower(),
                "size": stat.st_size,
                "modified_label": datetime.fromtimestamp(stat.st_mtime).strftime("%d %b %Y %H:%M"),
                "is_text": _is_text_preview_file(file_path),
            }
        )
    entries.sort(key=lambda item: item["relative"].lower())
    return entries[:limit]


def _is_text_preview_file(file_path: Path) -> bool:
    return file_path.suffix.lower() in TEXT_PREVIEW_EXTENSIONS


def _select_project_file(project_root: Path, requested_file: str | None) -> Path | None:
    visible_files = list(_iter_project_files(project_root))
    visible_by_relative = {path.relative_to(project_root).as_posix(): path for path in visible_files}
    if requested_file:
        normalized = requested_file.replace("\\", "/").lstrip("/")
        candidate = visible_by_relative.get(normalized)
        if candidate:
            return candidate
    for preferred in ("README.md", "readme.md", "package.json", "pyproject.toml", "index.html"):
        candidate = visible_by_relative.get(preferred)
        if candidate:
            return candidate
    for candidate in visible_files:
        if _is_text_preview_file(candidate):
            return candidate
    return visible_files[0] if visible_files else None


def _read_project_file_preview(file_path: Path) -> tuple[str, bool, str]:
    try:
        size = file_path.stat().st_size
    except OSError:
        return "File tidak bisa dibaca.", False, "error"
    if size > FILE_PREVIEW_MAX_BYTES:
        return f"File terlalu besar untuk preview langsung ({_format_file_size(size)}). Gunakan Download ZIP.", False, "large"
    if not _is_text_preview_file(file_path):
        try:
            content = file_path.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            return "Preview tidak tersedia untuk file binary. Gunakan Download ZIP untuk mengambil file ini.", False, "binary"
        except OSError:
            return "File tidak bisa dibaca.", False, "error"
        return content, True, "text"
    try:
        return file_path.read_text(encoding="utf-8", errors="replace"), True, "text"
    except OSError:
        return "File tidak bisa dibaca.", False, "error"


def _render_project_browser_page(project_root: Path, encoded_ref: str, token: str, selected_file: str | None = None) -> str:
    inspected = _inspect_project(project_root, get_settings().hermes_projects_root.resolve())
    files = _list_project_file_entries(project_root)
    selected_path = _select_project_file(project_root, selected_file)
    selected_relative = selected_path.relative_to(project_root).as_posix() if selected_path else ""
    preview_text = "Belum ada file yang bisa ditampilkan."
    preview_is_text = False
    preview_kind = "empty"
    if selected_path:
        preview_text, preview_is_text, preview_kind = _read_project_file_preview(selected_path)

    file_rows = "".join(_render_project_file_row(encoded_ref, token, entry, selected_relative) for entry in files)
    if not file_rows:
        file_rows = '<div class="file-empty">Project belum memiliki file yang bisa ditampilkan.</div>'

    preview_url = inspected.get("preview_url")
    preview_link = f'<a class="button" href="{escape(preview_url)}">Open Web Preview</a>' if preview_url else ""
    delete_link = ""
    if not inspected["protected"]:
        delete_link = f'<a class="button danger-link" href="{escape(inspected["delete_url"])}">Delete Project</a>'
    download_selected = ""
    if selected_path and selected_path.suffix.lower() in DOWNLOADABLE_EXTENSIONS:
        download_selected = f'<a class="button" href="{escape(_build_file_download_url(selected_path))}">Download File</a>'

    preview_block = (
        f'<pre class="code-block project-preview-code">{escape(preview_text)}</pre>'
        if preview_is_text
        else f'<div class="binary-preview">{escape(preview_text)}</div>'
    )

    return f"""<!doctype html>
<html lang="id">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <title>{escape(project_root.name)} - Hermes Project</title>
    <style>{_dashboard_css()}</style>
  </head>
  <body>
    <main class="page-shell project-browser-shell">
      <nav class="topbar">
        <a class="brand" href="/">
          <span class="brand-mark">H</span>
          <span><strong>Hermes Assistants</strong><small>Project file room</small></span>
        </a>
        <a class="status-pill" href="/health"><span></span> Online</a>
      </nav>

      <section class="project-browser-hero">
        <div>
          <p class="eyebrow">{escape(PROJECT_CATEGORY_LABELS.get(inspected["category"], "Project"))}</p>
          <h1>{escape(project_root.name)}</h1>
          <p class="lead">{escape(str(project_root))}</p>
          <div class="hero-actions">
            <a class="button primary" href="{escape(inspected["download_url"])}">Download ZIP</a>
            {preview_link}
            {download_selected}
            {delete_link}
            <a class="button" href="/">Back to Library</a>
          </div>
        </div>
        <aside class="project-browser-stats">
          <article><strong>{inspected["file_count"]}</strong><span>Files</span></article>
          <article><strong>{escape(_format_file_size(inspected["size_bytes"]))}</strong><span>Total size</span></article>
          <article><strong>{escape(inspected["modified_label"])}</strong><span>Last update</span></article>
        </aside>
      </section>

      <section class="file-room">
        <aside class="file-list-card">
          <div class="card-title"><span>Isi Project</span><small>{len(files)} file</small></div>
          <div class="file-list">{file_rows}</div>
        </aside>
        <section class="file-preview-card">
          <div class="card-title">
            <span>{escape(selected_relative or "Preview")}</span>
            <small>{escape(preview_kind)}</small>
          </div>
          {preview_block}
        </section>
      </section>
    </main>
  </body>
</html>"""


def _render_project_file_row(encoded_ref: str, token: str, entry: dict, selected_relative: str) -> str:
    relative = str(entry["relative"])
    is_selected = relative == selected_relative
    selected_class = " selected" if is_selected else ""
    href = f"/projects/{encoded_ref}?token={quote_plus(token)}&file={quote_plus(relative)}"
    icon = "TXT" if entry["is_text"] else "BIN"
    return f"""
      <a class="file-row{selected_class}" href="{escape(href)}">
        <span class="file-type">{icon}</span>
        <span class="file-name">{escape(relative)}</span>
        <span class="file-meta">{escape(_format_file_size(int(entry["size"])))} · {escape(entry["modified_label"])}</span>
      </a>
    """


def _render_delete_confirmation_page(
    project_root: Path,
    encoded_ref: str,
    token: str,
    error: str | None = None,
) -> str:
    error_html = f'<div class="delete-error">{escape(error)}</div>' if error else ""
    action_url = f"/projects/{encoded_ref}/delete?token={token}"
    return f"""<!doctype html>
<html lang="id">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <title>Delete {escape(project_root.name)}</title>
    <style>{_dashboard_css()}</style>
  </head>
  <body>
    <main class="page-shell delete-shell">
      <nav class="topbar">
        <a class="brand" href="/"><span class="brand-mark">H</span><span><strong>Hermes Assistants</strong><small>Delete confirmation</small></span></a>
      </nav>
      <section class="card delete-card">
        <p class="eyebrow">Danger zone</p>
        <h1>Hapus project?</h1>
        <p class="lead">Tindakan ini akan menghapus seluruh folder project secara permanen dari VPS.</p>
        <div class="delete-target">
          <strong>{escape(project_root.name)}</strong>
          <span>{escape(str(project_root))}</span>
        </div>
        {error_html}
        <form method="post" action="{escape(action_url)}">
          <label for="confirm_name">Ketik nama project untuk konfirmasi</label>
          <input id="confirm_name" name="confirm_name" autocomplete="off" placeholder="{escape(project_root.name)}" required />
          <label for="admin_token">Dashboard admin token</label>
          <input id="admin_token" name="admin_token" type="password" autocomplete="current-password" placeholder="Masukkan admin token" required />
          <label class="check-row">
            <input type="checkbox" name="confirm_delete" value="yes" required />
            <span>Saya memahami project dan seluruh file di dalamnya akan dihapus permanen.</span>
          </label>
          <div class="hero-actions">
            <button class="danger-button" type="submit">Hapus project permanen</button>
            <a class="button" href="/">Batal</a>
          </div>
        </form>
      </section>
    </main>
  </body>
</html>"""


def _render_project_deleted_page(project_name: str) -> str:
    return f"""<!doctype html>
<html lang="id">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <title>Project deleted</title>
    <style>{_dashboard_css()}</style>
  </head>
  <body>
    <main class="page-shell delete-shell">
      <section class="card delete-card">
        <p class="eyebrow">Project deleted</p>
        <h1>{escape(project_name)}</h1>
        <p class="lead">Project sudah dihapus dari /root/hermes-projects.</p>
        <div class="hero-actions"><a class="button primary" href="/">Kembali ke Project Library</a></div>
      </section>
    </main>
  </body>
</html>"""


def _admin_session_token() -> str:
    return hmac.new(_task_access_secret().encode("utf-8"), b"hermes-control-session", hashlib.sha256).hexdigest()


def _admin_csrf_token() -> str:
    return hmac.new(_task_access_secret().encode("utf-8"), b"hermes-control-csrf", hashlib.sha256).hexdigest()


def _admin_session_valid(cookie_value: str | None) -> bool:
    return bool(cookie_value) and hmac.compare_digest(cookie_value, _admin_session_token())


def _require_admin_session(cookie_value: str | None) -> None:
    if not _admin_session_valid(cookie_value):
        raise HTTPException(status_code=401, detail="Admin login required")


def _validate_admin_csrf(value: str) -> None:
    if not value or not hmac.compare_digest(value, _admin_csrf_token()):
        raise HTTPException(status_code=403, detail="Invalid control action token")


def _render_control_login(error: str | None = None) -> str:
    error_html = f'<div class="delete-error">{escape(error)}</div>' if error else ""
    return f"""<!doctype html>
<html lang="id">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <title>Hermes Control Login</title>
    <style>{_dashboard_css()}</style>
  </head>
  <body>
    <main class="page-shell delete-shell">
      <section class="card delete-card">
        <p class="eyebrow">Protected control center</p>
        <h1>Hermes Admin</h1>
        <p class="lead">Masukkan DASHBOARD_ADMIN_TOKEN untuk mengatur skills, tools, model, memory, dan runtime Hermes.</p>
        {error_html}
        <form method="post" action="/control/login">
          <label for="admin_token">Dashboard admin token</label>
          <input id="admin_token" name="admin_token" type="password" autocomplete="current-password" required />
          <div class="hero-actions">
            <button class="button primary" type="submit">Masuk Control Center</button>
            <a class="button" href="/">Kembali</a>
          </div>
        </form>
      </section>
    </main>
  </body>
</html>"""


def _render_control_center(message: str | None = None, search_query: str = "") -> str:
    overview = hermes_overview()
    skills = list_installed_skills()
    tools = list_tools()
    search_results = search_skills(search_query, limit=10) if search_query else []
    csrf = _admin_csrf_token()
    message_html = f'<div class="control-message">{escape(message)}</div>' if message else ""

    skill_cards = "".join(_render_installed_skill_card(skill, csrf) for skill in skills)
    tool_cards = "".join(_render_tool_card(tool, csrf) for tool in tools)
    search_cards = "".join(_render_skill_search_card(item, csrf) for item in search_results)
    if search_query and not search_cards:
        search_cards = '<p class="muted">Skill tidak ditemukan atau registry sedang tidak tersedia.</p>'

    return f"""<!doctype html>
<html lang="id">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <title>Hermes Control Center</title>
    <style>{_dashboard_css()}</style>
  </head>
  <body>
    <main class="page-shell control-shell">
      <nav class="topbar">
        <a class="brand" href="/"><span class="brand-mark">H</span><span><strong>Hermes Control Center</strong><small>Skills, tools, memory, model, runtime</small></span></a>
        <a class="status-pill" href="/control/logout"><span></span> Logout</a>
      </nav>
      {message_html}

      <section class="hero-grid control-hero">
        <article class="hero-card">
          <p class="eyebrow">Hermes administration</p>
          <h1>Kelola Hermes dari satu tempat.</h1>
          <p class="lead">Informasi sensitif disembunyikan. Perubahan skill dan tool dijalankan melalui command native Hermes.</p>
          <div class="hero-actions">
            <a class="button primary" href="#skills">Skills ({len(skills)})</a>
            <a class="button" href="#tools">Tools ({len(tools)})</a>
            <a class="button" href="#runtime">Runtime</a>
          </div>
        </article>
        <aside class="control-card">
          <span class="card-label">Quick links</span>
          <div class="command-list">
            <a class="button" href="/">Project Library</a>
            <a class="button" href="/control">Refresh data</a>
            <a class="button" href="/control/model">Model control</a>
          </div>
        </aside>
      </section>

      <section class="card" id="skills">
        <div class="card-title"><span>Search & Install Skill</span><small>Hermes registries</small></div>
        <form class="search-form" method="get" action="/control">
          <input name="q" value="{escape(search_query)}" placeholder="Cari skill, contoh: PDF, GitHub, Next.js" />
          <button class="button primary" type="submit">Search</button>
        </form>
        <div class="admin-list">{search_cards}</div>
      </section>

      <section class="card">
        <div class="card-title"><span>Installed Skills</span><small>{len(skills)} ditemukan di ~/.hermes/skills</small></div>
        <div class="admin-list installed-skills">{skill_cards}</div>
      </section>

      <section class="card" id="tools">
        <div class="card-title"><span>Hermes Tools</span><small>Klik status untuk enable/disable CLI tools</small></div>
        <div class="tool-grid">{tool_cards}</div>
      </section>

      <section class="content-grid" id="runtime">
        {_render_admin_output_card("Hermes Status", overview["status"])}
        {_render_admin_output_card("Configuration", overview["config"])}
        {_render_admin_output_card("Memory", overview["memory"])}
        {_render_admin_output_card("Hermes Storage", overview["storage"])}
      </section>
    </main>
  </body>
</html>"""


def _render_installed_skill_card(skill: dict, csrf: str) -> str:
    return f"""
      <article class="admin-row">
        <div><strong>{escape(skill["name"])}</strong><small>{escape(skill["category"])} · v{escape(skill["version"])}</small></div>
        <p>{escape(_truncate_text(skill["description"], 180))}</p>
        <form method="post" action="/control/skills/uninstall" onsubmit="return confirm('Uninstall skill ini dari Hermes?')">
          <input type="hidden" name="csrf" value="{csrf}" />
          <input type="hidden" name="name" value="{escape(skill["name"])}" />
          <button class="danger-mini" type="submit">Uninstall</button>
        </form>
      </article>
    """


def _render_tool_card(tool: dict, csrf: str) -> str:
    next_state = "false" if tool["enabled"] else "true"
    status_class = "enabled-button" if tool["enabled"] else "disabled-button"
    status_label = "Enabled" if tool["enabled"] else "Disabled"
    return f"""
      <article class="tool-row">
        <div><strong>{escape(tool["name"])}</strong><span>{escape(tool["description"])}</span></div>
        <form method="post" action="/control/tools/set">
          <input type="hidden" name="csrf" value="{csrf}" />
          <input type="hidden" name="name" value="{escape(tool["name"])}" />
          <input type="hidden" name="enabled" value="{next_state}" />
          <button class="{status_class}" type="submit">{status_label}</button>
        </form>
      </article>
    """


def _render_skill_search_card(item: dict, csrf: str) -> str:
    return f"""
      <article class="admin-row search-result">
        <div><strong>{escape(item["name"])}</strong><small>{escape(item["source"])} · {escape(item["trust_level"])}</small></div>
        <p>{escape(item["description"])}</p>
        <code>{escape(item["identifier"])}</code>
        <form method="post" action="/control/skills/install">
          <input type="hidden" name="csrf" value="{csrf}" />
          <input type="hidden" name="identifier" value="{escape(item["identifier"])}" />
          <button class="button primary" type="submit">Install ke Hermes</button>
        </form>
      </article>
    """


def _render_admin_output_card(title: str, content: str) -> str:
    return f"""
      <article class="card">
        <div class="card-title"><span>{escape(title)}</span><small>redacted output</small></div>
        <pre class="code-block admin-output">{escape(content)}</pre>
      </article>
    """


def _render_model_control(message: str | None = None) -> str:
    model = read_hermes_model_config()
    csrf = _admin_csrf_token()
    message_html = f'<div class="control-message">{escape(message)}</div>' if message else ""
    return f"""<!doctype html>
<html lang="id">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <title>Hermes Model Control</title>
    <style>{_dashboard_css()}</style>
  </head>
  <body>
    <main class="page-shell delete-shell">
      <nav class="topbar">
        <a class="brand" href="/control"><span class="brand-mark">H</span><span><strong>Model Control</strong><small>Hermes inference configuration</small></span></a>
      </nav>
      {message_html}
      <section class="card delete-card">
        <p class="eyebrow">Current model</p>
        <h2>{escape(model.provider)} / {escape(model.model)}</h2>
        <p class="lead">Perubahan ini memengaruhi task Hermes berikutnya, termasuk task yang datang dari WhatsApp.</p>
        <form method="post" action="/control/model">
          <input type="hidden" name="csrf" value="{csrf}" />
          <label for="provider">Provider</label>
          <input id="provider" name="provider" value="{escape(model.provider)}" required />
          <label for="model">Model ID</label>
          <input id="model" name="model" value="{escape(model.model)}" required />
          <label for="base_url">Base URL opsional</label>
          <input id="base_url" name="base_url" value="{escape(model.base_url)}" />
          <div class="hero-actions">
            <button class="button primary" type="submit">Update Model Hermes</button>
            <a class="button" href="/control">Kembali</a>
          </div>
        </form>
      </section>
    </main>
  </body>
</html>"""


async def _read_form(request: Request) -> dict[str, str]:
    body = await request.body()
    parsed = parse_qs(body.decode("utf-8", errors="replace"))
    return {key: values[0] if values else "" for key, values in parsed.items()}


@app.get("/", response_class=HTMLResponse)
async def index() -> str:
    return _render_dashboard_page(store.get_recent_tasks(limit=50), _scan_project_library())
    return """
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Hermes Assistants</title>
    <style>
      :root {
        color-scheme: light;
        --bg: #f7f8fb;
        --panel: #ffffff;
        --panel-soft: #f1f5f9;
        --text: #172033;
        --muted: #667085;
        --border: #d9e0ea;
        --accent: #0f766e;
        --accent-2: #2563eb;
        --success: #12805c;
        --shadow: 0 18px 55px rgba(22, 34, 51, 0.08);
      }
      * {
        box-sizing: border-box;
      }
      body {
        margin: 0;
        font-family: "Aptos", "Segoe UI", system-ui, sans-serif;
        background:
          linear-gradient(135deg, rgba(15, 118, 110, 0.08), transparent 34%),
          linear-gradient(315deg, rgba(37, 99, 235, 0.08), transparent 30%),
          var(--bg);
        color: var(--text);
      }
      main {
        max-width: 1120px;
        margin: 0 auto;
        padding: 36px 20px 48px;
      }
      .shell {
        background: var(--panel);
        border: 1px solid var(--border);
        border-radius: 18px;
        box-shadow: var(--shadow);
        overflow: hidden;
      }
      .topbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        padding: 18px 22px;
        border-bottom: 1px solid var(--border);
        background: rgba(255, 255, 255, 0.82);
      }
      .brand {
        display: flex;
        align-items: center;
        gap: 12px;
        min-width: 0;
      }
      .mark {
        display: grid;
        place-items: center;
        width: 38px;
        height: 38px;
        border-radius: 10px;
        background: #0f172a;
        color: #fff;
        font-weight: 800;
      }
      .brand strong {
        display: block;
        font-size: 16px;
        letter-spacing: 0;
      }
      .brand span {
        display: block;
        color: var(--muted);
        font-size: 13px;
        margin-top: 2px;
      }
      .status-pill {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        border: 1px solid rgba(18, 128, 92, 0.22);
        background: rgba(18, 128, 92, 0.08);
        color: var(--success);
        padding: 8px 12px;
        border-radius: 999px;
        font-size: 13px;
        font-weight: 700;
        white-space: nowrap;
      }
      .dot {
        width: 8px;
        height: 8px;
        border-radius: 999px;
        background: var(--success);
        box-shadow: 0 0 0 5px rgba(18, 128, 92, 0.12);
      }
      .hero {
        display: grid;
        grid-template-columns: minmax(0, 1.25fr) minmax(280px, 0.75fr);
        gap: 28px;
        padding: 34px 28px 28px;
      }
      h1 {
        margin: 0;
        max-width: 760px;
        font-size: clamp(34px, 5vw, 62px);
        line-height: 1;
        letter-spacing: 0;
      }
      .lead {
        margin: 18px 0 0;
        max-width: 680px;
        color: var(--muted);
        font-size: 17px;
        line-height: 1.65;
      }
      p {
        margin: 0;
        line-height: 1.6;
      }
      .actions {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        margin-top: 24px;
      }
      .button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 42px;
        padding: 0 15px;
        border: 1px solid var(--border);
        border-radius: 9px;
        color: var(--text);
        text-decoration: none;
        font-weight: 700;
        background: #fff;
      }
      .button.primary {
        background: #0f172a;
        color: #fff;
        border-color: #0f172a;
      }
      .panel {
        border: 1px solid var(--border);
        border-radius: 14px;
        background: var(--panel-soft);
        padding: 18px;
      }
      .panel h2,
      .section h2 {
        margin: 0 0 12px;
        font-size: 15px;
        letter-spacing: 0;
      }
      .metric {
        display: grid;
        grid-template-columns: auto 1fr;
        gap: 10px 12px;
        margin-top: 14px;
        color: var(--muted);
        font-size: 14px;
      }
      .metric b {
        color: var(--text);
      }
      .flow {
        display: grid;
        gap: 10px;
        margin-top: 14px;
      }
      .step {
        display: grid;
        grid-template-columns: 28px 1fr;
        gap: 10px;
        align-items: center;
      }
      .num {
        display: grid;
        place-items: center;
        width: 28px;
        height: 28px;
        border-radius: 8px;
        background: #dbeafe;
        color: #1d4ed8;
        font-weight: 800;
        font-size: 13px;
      }
      .section {
        padding: 0 28px 30px;
      }
      .grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 14px;
      }
      .tile {
        min-height: 142px;
        padding: 18px;
        border: 1px solid var(--border);
        border-radius: 14px;
        background: #fff;
      }
      .tile small {
        display: block;
        color: var(--muted);
        margin-bottom: 10px;
        font-weight: 700;
      }
      code {
        display: inline-block;
        max-width: 100%;
        overflow-wrap: anywhere;
        background: #eef2f7;
        color: #0f172a;
        padding: 3px 7px;
        border-radius: 7px;
        font-size: 13px;
      }
      .command-list {
        display: grid;
        gap: 8px;
        margin-top: 12px;
      }
      .footer {
        display: flex;
        justify-content: space-between;
        gap: 14px;
        padding: 18px 22px;
        border-top: 1px solid var(--border);
        color: var(--muted);
        font-size: 13px;
        background: #fbfcfe;
      }
      .muted,
      .tile p,
      .step span {
        color: var(--muted);
      }
      @media (max-width: 820px) {
        main {
          padding: 16px;
        }
        .topbar,
        .footer {
          align-items: flex-start;
          flex-direction: column;
        }
        .hero {
          grid-template-columns: 1fr;
          padding: 26px 20px 22px;
        }
        .section {
          padding: 0 20px 24px;
        }
        .grid {
          grid-template-columns: 1fr;
        }
      }
    </style>
  </head>
  <body>
    <main>
      <div class="shell">
        <header class="topbar">
          <div class="brand">
            <div class="mark">H</div>
            <div>
              <strong>Hermes Assistants</strong>
              <span>WhatsApp remote control for Hermes Agent</span>
            </div>
          </div>
          <div class="status-pill"><span class="dot"></span> Service online</div>
        </header>

        <section class="hero">
          <div>
            <h1>Control Hermes from WhatsApp.</h1>
            <p class="lead">
              This service receives Meta WhatsApp Cloud API webhooks, validates allowed
              operators, forwards real work to Hermes Agent, and returns progress,
              results, logs, and previews through WhatsApp.
            </p>
            <div class="actions">
              <a class="button primary" href="/health">Healthcheck</a>
              <a class="button" href="/webhooks/meta/whatsapp?hub.mode=subscribe&hub.verify_token=check&hub.challenge=ready">Webhook route</a>
            </div>
          </div>

          <aside class="panel">
            <h2>Runtime</h2>
            <p class="muted">Hermes remains the autonomous execution brain. WhatsApp is only the control surface.</p>
            <div class="metric">
              <b>Channel</b><span>Meta WhatsApp Cloud API</span>
              <b>Agent</b><span>Hermes CLI on VPS</span>
              <b>Projects</b><span><code>/root/hermes-projects</code></span>
              <b>Preview</b><span>Signed project URLs</span>
            </div>
          </aside>
        </section>

        <section class="section">
          <div class="grid">
            <article class="tile">
              <small>Webhook</small>
              <h2>Meta callback endpoint</h2>
              <p><code>/webhooks/meta/whatsapp</code></p>
              <p class="muted">Handles verification, inbound messages, and status callbacks.</p>
            </article>
            <article class="tile">
              <small>Monitoring</small>
              <h2>Task detail and logs</h2>
              <p><code>/tasks/{task_id}</code></p>
              <p class="muted">Signed links are sent to WhatsApp for progress, logs, and results.</p>
            </article>
            <article class="tile">
              <small>Preview</small>
              <h2>Static project access</h2>
              <p><code>/preview/{token}/...</code></p>
              <p class="muted">HTML projects can be opened directly from the result message.</p>
            </article>
          </div>
        </section>

        <section class="section">
          <div class="panel">
            <h2>Execution Flow</h2>
            <div class="flow">
              <div class="step"><span class="num">1</span><span>User sends a WhatsApp message to the bot number.</span></div>
              <div class="step"><span class="num">2</span><span>Meta delivers the webhook to this service.</span></div>
              <div class="step"><span class="num">3</span><span>Allowed numbers are authenticated and the message is stored.</span></div>
              <div class="step"><span class="num">4</span><span>Hermes Agent executes the task, validates output, and reports progress.</span></div>
              <div class="step"><span class="num">5</span><span>WhatsApp receives the final answer, task detail, logs, and preview links.</span></div>
            </div>
          </div>
        </section>

        <section class="section">
          <div class="grid">
            <article class="tile">
              <small>WhatsApp shortcuts</small>
              <h2>Useful commands</h2>
              <div class="command-list">
                <code>task terakhir</code>
                <code>status &lt;task_id&gt;</code>
                <code>log &lt;task_id&gt;</code>
              </div>
            </article>
            <article class="tile">
              <small>Risk control</small>
              <h2>Approval gate</h2>
              <p class="muted">Deploy, delete, credential, config, and sensitive actions require WhatsApp approval before Hermes continues.</p>
            </article>
            <article class="tile">
              <small>Output</small>
              <h2>Project delivery</h2>
              <p class="muted">Results can include summaries, code paths, signed previews, project logs, and validation status.</p>
            </article>
          </div>
        </section>

        <footer class="footer">
          <span>AI Assistants WhatsApp Control Layer</span>
          <span>Production endpoint: <code>hermes-assistants.duckdns.org</code></span>
        </footer>
      </div>
    </main>
  </body>
</html>
"""


@app.get("/control", response_class=HTMLResponse)
async def control_center(
    q: str = Query(default=""),
    message: str = Query(default=""),
    hermes_admin: str | None = Cookie(default=None),
) -> str:
    if not _admin_session_valid(hermes_admin):
        return _render_control_login()
    return _render_control_center(message=message or None, search_query=q.strip()[:120])


@app.post("/control/login")
async def control_login(request: Request) -> Response:
    form = await _read_form(request)
    supplied = form.get("admin_token", "")
    expected = get_settings().dashboard_admin_token
    if not expected or not hmac.compare_digest(supplied, expected):
        return HTMLResponse(_render_control_login("Admin token tidak valid."), status_code=401)
    response = RedirectResponse("/control", status_code=303)
    response.set_cookie(
        "hermes_admin",
        _admin_session_token(),
        httponly=True,
        secure=True,
        samesite="strict",
        max_age=8 * 60 * 60,
    )
    return response


@app.get("/control/logout")
async def control_logout() -> RedirectResponse:
    response = RedirectResponse("/control", status_code=303)
    response.delete_cookie("hermes_admin")
    return response


@app.post("/control/skills/install")
async def control_install_skill(request: Request, hermes_admin: str | None = Cookie(default=None)) -> RedirectResponse:
    _require_admin_session(hermes_admin)
    form = await _read_form(request)
    _validate_admin_csrf(form.get("csrf", ""))
    result = install_skill(form.get("identifier", ""))
    message = ("Skill berhasil diinstall.\n" if result.ok else "Install skill gagal.\n") + result.output[-1500:]
    return RedirectResponse(f"/control?message={quote_plus(message)}#skills", status_code=303)


@app.post("/control/skills/uninstall")
async def control_uninstall_skill(request: Request, hermes_admin: str | None = Cookie(default=None)) -> RedirectResponse:
    _require_admin_session(hermes_admin)
    form = await _read_form(request)
    _validate_admin_csrf(form.get("csrf", ""))
    result = uninstall_skill(form.get("name", ""))
    message = ("Skill berhasil dihapus.\n" if result.ok else "Uninstall skill gagal.\n") + result.output[-1500:]
    return RedirectResponse(f"/control?message={quote_plus(message)}#skills", status_code=303)


@app.post("/control/tools/set")
async def control_set_tool(request: Request, hermes_admin: str | None = Cookie(default=None)) -> RedirectResponse:
    _require_admin_session(hermes_admin)
    form = await _read_form(request)
    _validate_admin_csrf(form.get("csrf", ""))
    enabled = form.get("enabled", "").lower() == "true"
    result = set_tool_enabled(form.get("name", ""), enabled)
    message = ("Tool berhasil diperbarui.\n" if result.ok else "Update tool gagal.\n") + result.output[-1200:]
    return RedirectResponse(f"/control?message={quote_plus(message)}#tools", status_code=303)


@app.get("/control/model", response_class=HTMLResponse)
async def control_model_page(
    message: str = Query(default=""),
    hermes_admin: str | None = Cookie(default=None),
) -> str:
    _require_admin_session(hermes_admin)
    return _render_model_control(message or None)


@app.post("/control/model")
async def control_update_model(request: Request, hermes_admin: str | None = Cookie(default=None)) -> RedirectResponse:
    _require_admin_session(hermes_admin)
    form = await _read_form(request)
    _validate_admin_csrf(form.get("csrf", ""))
    message = set_hermes_model(
        form.get("provider", ""),
        form.get("model", ""),
        form.get("base_url", "") or None,
    )
    return RedirectResponse(f"/control/model?message={quote_plus(message)}", status_code=303)


@app.get("/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    current_settings = get_settings()
    return HealthResponse(
        status="ok",
        app_env=current_settings.app_env,
        hermes_command=current_settings.hermes_command,
        signature_required=current_settings.webhook_signature_required,
        allowed_numbers_configured=len(current_settings.whatsapp_allowed_numbers),
    )


@app.get("/tasks/{task_id}", response_class=HTMLResponse)
async def task_detail(task_id: str, access: str = Query(default="")) -> str:
    _validate_task_access(task_id, access)
    task = store.get_task(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    log_text = _read_task_log_text(task_id)
    summary = task.get("result_summary") or task.get("error_summary") or "No summary available yet."
    prompt = task.get("prompt") or ""
    log_url = _build_task_log_url(task_id)

    return _render_task_detail_page(task, log_text, summary, prompt, log_url)
    return f"""
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Task {escape(task_id)}</title>
    <style>
      :root {{
        color-scheme: light;
        --bg: #f6f1ea;
        --panel: #fffdfa;
        --text: #1f2937;
        --muted: #6b7280;
        --accent: #9a3412;
        --border: #e5d7c7;
      }}
      body {{
        margin: 0;
        font-family: "Segoe UI", system-ui, sans-serif;
        background: linear-gradient(180deg, #fff7ed 0%, var(--bg) 100%);
        color: var(--text);
      }}
      main {{
        max-width: 960px;
        margin: 32px auto;
        padding: 20px;
      }}
      .card {{
        background: var(--panel);
        border: 1px solid var(--border);
        border-radius: 18px;
        padding: 24px;
        box-shadow: 0 18px 60px rgba(120, 53, 15, 0.08);
        margin-bottom: 18px;
      }}
      h1, h2 {{
        margin: 0 0 12px;
      }}
      p {{
        line-height: 1.6;
      }}
      dl {{
        display: grid;
        grid-template-columns: 180px 1fr;
        gap: 10px 16px;
        margin: 0;
      }}
      dt {{
        color: var(--muted);
        font-weight: 600;
      }}
      dd {{
        margin: 0;
      }}
      pre {{
        white-space: pre-wrap;
        word-break: break-word;
        background: #1f2937;
        color: #f9fafb;
        border-radius: 14px;
        padding: 16px;
        overflow: auto;
      }}
      a {{
        color: var(--accent);
        text-decoration: none;
      }}
    </style>
  </head>
  <body>
    <main>
      <section class="card">
        <h1>Task {escape(task_id)}</h1>
        <dl>
          <dt>Status</dt><dd>{escape(str(task.get("status") or "-"))}</dd>
          <dt>Current step</dt><dd>{escape(str(task.get("current_step") or "-"))}</dd>
          <dt>Progress</dt><dd>{escape(str(task.get("progress_percent") or 0))}%</dd>
          <dt>Created</dt><dd>{escape(str(task.get("created_at") or "-"))}</dd>
          <dt>Started</dt><dd>{escape(str(task.get("started_at") or "-"))}</dd>
          <dt>Finished</dt><dd>{escape(str(task.get("finished_at") or "-"))}</dd>
          <dt>Raw log</dt><dd><a href="{escape(log_url)}">Open task log</a></dd>
        </dl>
      </section>
      <section class="card">
        <h2>User Prompt</h2>
        <pre>{escape(prompt)}</pre>
      </section>
      <section class="card">
        <h2>Summary</h2>
        <pre>{escape(summary)}</pre>
      </section>
      <section class="card">
        <h2>Log Tail</h2>
        <pre>{escape(log_text or "No log output yet.")}</pre>
      </section>
    </main>
  </body>
</html>
"""


@app.get("/tasks/{task_id}/log", response_class=PlainTextResponse)
async def task_log(task_id: str, access: str = Query(default="")) -> str:
    _validate_task_access(task_id, access)
    task = store.get_task(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return _read_task_log_text(task_id)


@app.get("/preview/{token}/{encoded_root}")
@app.get("/preview/{token}/{encoded_root}/")
async def preview_project_index(token: str, encoded_root: str) -> FileResponse:
    project_root = _validate_preview_access(encoded_root, token)
    index_path = project_root / "index.html"
    if not index_path.exists() or not index_path.is_file():
        raise HTTPException(status_code=404, detail="Project index.html not found")
    return FileResponse(index_path)


@app.get("/preview/{token}/{encoded_root}/{file_path:path}")
async def preview_project_file(token: str, encoded_root: str, file_path: str) -> FileResponse:
    project_root = _validate_preview_access(encoded_root, token)
    target = (project_root / file_path).resolve()
    if not _is_path_within(target, project_root) or not target.exists() or not target.is_file():
        raise HTTPException(status_code=404, detail="Project file not found")
    return FileResponse(target)


@app.get("/download/{token}/{encoded_file}")
async def download_project_file(token: str, encoded_file: str) -> FileResponse:
    target = _validate_download_access(encoded_file, token)
    return FileResponse(target, filename=target.name)


@app.get("/projects/{encoded_ref}", response_class=HTMLResponse)
async def browse_project(encoded_ref: str, token: str = Query(default=""), file: str | None = Query(default=None)) -> str:
    project_root = _validate_project_action(encoded_ref, token, "browse")
    return _render_project_browser_page(project_root, encoded_ref, token, file)


@app.get("/projects/{encoded_ref}/download")
async def download_full_project(encoded_ref: str, token: str = Query(default="")) -> StreamingResponse:
    project_root = _validate_project_action(encoded_ref, token, "download")
    archive = _build_project_archive(project_root)
    safe_name = re.sub(r"[^A-Za-z0-9._-]+", "-", project_root.name).strip("-") or "hermes-project"
    headers = {"Content-Disposition": f'attachment; filename="{safe_name}.zip"'}
    return StreamingResponse(archive, media_type="application/zip", headers=headers)


@app.get("/projects/{encoded_ref}/delete", response_class=HTMLResponse)
async def confirm_project_delete(encoded_ref: str, token: str = Query(default="")) -> str:
    project_root = _validate_project_action(encoded_ref, token, "delete")
    if _project_is_protected(project_root):
        raise HTTPException(status_code=403, detail="System project cannot be deleted")
    return _render_delete_confirmation_page(project_root, encoded_ref, token)


@app.post("/projects/{encoded_ref}/delete", response_class=HTMLResponse)
async def delete_project(request: Request, encoded_ref: str, token: str = Query(default="")) -> str:
    project_root = _validate_project_action(encoded_ref, token, "delete")
    if _project_is_protected(project_root):
        raise HTTPException(status_code=403, detail="System project cannot be deleted")

    body = await request.body()
    form = parse_qs(body.decode("utf-8", errors="replace"))
    confirm_name = (form.get("confirm_name") or [""])[0].strip()
    confirmed = (form.get("confirm_delete") or [""])[0] == "yes"
    admin_token = (form.get("admin_token") or [""])[0].strip()
    expected_admin_token = get_settings().dashboard_admin_token
    token_valid = bool(expected_admin_token) and hmac.compare_digest(admin_token, expected_admin_token)
    if confirm_name != project_root.name or not confirmed or not token_valid:
        return _render_delete_confirmation_page(
            project_root,
            encoded_ref,
            token,
            error="Nama project, checkbox konfirmasi, dan admin token harus valid.",
        )

    deleted_name = project_root.name
    shutil.rmtree(project_root)
    return _render_project_deleted_page(deleted_name)


@app.get("/webhooks/meta/whatsapp", response_class=PlainTextResponse)
async def verify_webhook(
    hub_mode: str = Query(alias="hub.mode"),
    hub_verify_token: str = Query(alias="hub.verify_token"),
    hub_challenge: str = Query(alias="hub.challenge"),
):
    current_settings = get_settings()
    if hub_mode == "subscribe" and hub_verify_token == current_settings.meta_verify_token:
        store.create_audit_log(
            actor_type="meta",
            actor_ref="webhook",
            action="verify_success",
            target_type="webhook",
            target_ref="meta_whatsapp",
            metadata={"mode": hub_mode},
        )
        return hub_challenge

    store.create_audit_log(
        actor_type="meta",
        actor_ref="webhook",
        action="verify_failed",
        target_type="webhook",
        target_ref="meta_whatsapp",
        metadata={"mode": hub_mode},
    )
    raise HTTPException(status_code=403, detail="Invalid verify token")


@app.post("/webhooks/meta/whatsapp", response_model=WebhookAcceptedResponse)
async def receive_webhook(
    request: Request,
    background_tasks: BackgroundTasks,
    x_hub_signature_256: str | None = Header(default=None),
) -> WebhookAcceptedResponse:
    current_settings = get_settings()
    raw_body = await request.body()
    try:
        payload = json.loads(raw_body.decode("utf-8"))
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=400, detail="Invalid JSON body") from exc

    signature_valid = verify_meta_signature(raw_body, x_hub_signature_256, current_settings.meta_app_secret)
    if current_settings.webhook_signature_required and not signature_valid:
        store.create_audit_log(
            actor_type="meta",
            actor_ref="webhook",
            action="signature_rejected",
            target_type="webhook",
            target_ref="meta_whatsapp",
            metadata={},
        )
        raise HTTPException(status_code=401, detail="Invalid signature")

    delivery_key = _compute_delivery_key(payload)
    if store.webhook_event_exists(delivery_key):
        return WebhookAcceptedResponse(status="accepted", deliveries=0)

    event_type = "message" if _payload_has_messages(payload) else "status"
    store.create_webhook_event(delivery_key, sanitize_whatsapp_payload(payload), signature_valid, event_type)

    accepted = 0
    for inbound_message in iter_inbound_messages(payload):
        background_tasks.add_task(handle_inbound_message, inbound_message)
        accepted += 1

    return WebhookAcceptedResponse(status="accepted", deliveries=accepted)


async def handle_inbound_message(inbound_message) -> None:
    settings = get_settings()
    number = normalize_whatsapp_number(inbound_message.from_number)
    if not _is_allowed_number(number):
        store.create_audit_log(
            actor_type="user",
            actor_ref=number,
            action="number_rejected",
            target_type="message",
            target_ref=inbound_message.wa_message_id,
            metadata={},
        )
        await sender.send_text(number, "Nomor Anda belum diizinkan untuk mengontrol Hermes.")
        return

    await sender.mark_read(inbound_message.wa_message_id, typing=True)

    user = store.get_or_create_user(number, inbound_message.profile_name)
    session = store.get_or_create_session(user["id"], number)
    text = inbound_message.text_body.strip()
    hermes_command = parse_hermes_command(text)
    control_command = parse_control_command(text)
    stored_text = redact_control_text(text) if control_command else text
    source_message_id = store.create_message(
        session_id=session["id"],
        user_id=user["id"],
        direction="inbound",
        message_type="text",
        wa_message_id=inbound_message.wa_message_id,
        reply_to_wa_id=None,
        body_text=stored_text,
        payload=inbound_message.raw_payload,
        status="received",
    )

    if _is_approval_reply(text):
        await handle_approval_reply(user, session, text)
        return

    if hermes_command:
        response = build_hermes_command_message(hermes_command)
        await _send_and_store_message(
            session_id=session["id"],
            user_id=user["id"],
            to_number=number,
            reply_to_wa_id=inbound_message.wa_message_id,
            body_text=response,
            payload={"provider": "hermes_control", "kind": hermes_command.command, "action": hermes_command.action},
        )
        return

    if control_command:
        await handle_control_command(user, session, text, control_command, inbound_message.wa_message_id, source_message_id)
        return

    task_query = _parse_task_query(text)
    if task_query:
        await handle_task_query(user, session, task_query, inbound_message.wa_message_id)
        return

    if _should_route_to_hermes(text):
        if _requires_approval(text):
            task_id = store.create_task(
                user_id=user["id"],
                session_id=session["id"],
                source_message_id=source_message_id,
                prompt=text,
                status="waiting_approval",
            )
            approval_code = f"APPROVE {task_id}"
            nonce = secrets.token_urlsafe(16)
            store.create_approval(
                task_id=task_id,
                requested_by_user_id=user["id"],
                approval_type="risky_prompt",
                reason="Prompt mengandung aksi berisiko dan perlu konfirmasi sebelum Hermes berjalan.",
                risk_summary="Potential deploy, delete, config, or sensitive action.",
                approval_code=approval_code,
                nonce_hash=hash_nonce(nonce),
                ttl_seconds=settings.approval_code_ttl_seconds,
            )
            store.create_audit_log(
                actor_type="system",
                actor_ref="approval_policy",
                action="approval_requested",
                target_type="task",
                target_ref=task_id,
                metadata={"reason": "risky_prompt"},
            )
            approval_response = "\n".join(
                [
                    "Approval dibutuhkan",
                    f"Task: {task_id}",
                    "Reason: prompt terdeteksi berisiko untuk deploy, delete, config, atau data sensitif.",
                    f"Detail: {_build_task_detail_url(task_id)}",
                    f"Reply: APPROVE {task_id} atau REJECT {task_id}",
                ]
            )
            await _send_and_store_message(
                session_id=session["id"],
                user_id=user["id"],
                to_number=number,
                reply_to_wa_id=inbound_message.wa_message_id,
                body_text=approval_response,
                payload={"provider": "meta_whatsapp", "kind": "approval"},
            )
            return

        task_id = store.create_task(
            user_id=user["id"],
            session_id=session["id"],
            source_message_id=source_message_id,
            prompt=text,
            status="queued",
        )
        ack = _format_task_ack(task_id)
        await _send_and_store_message(
            session_id=session["id"],
            user_id=user["id"],
            to_number=number,
            reply_to_wa_id=inbound_message.wa_message_id,
            body_text=ack,
            payload={"provider": "meta_whatsapp", "kind": "ack"},
        )
        asyncio.create_task(run_task(task_id, number))
        return

    chat_response = await chat.answer(text)
    await _send_and_store_message(
        session_id=session["id"],
        user_id=user["id"],
        to_number=number,
        reply_to_wa_id=inbound_message.wa_message_id,
        body_text=chat_response,
        payload={"provider": "chat", "kind": "direct_reply"},
    )


async def handle_control_command(
    user: dict,
    session: dict,
    text: str,
    command: ParsedControlCommand,
    wa_message_id: str,
    source_message_id: str,
) -> None:
    settings = get_settings()
    number = session["channel_chat_id"]
    _non_sensitive, sensitive = split_sensitive_assignments(command.assignments)

    if command.action == "show":
        reply = build_control_message(command)
        await _send_and_store_message(
            session_id=session["id"],
            user_id=user["id"],
            to_number=number,
            reply_to_wa_id=wa_message_id,
            body_text=reply,
            payload={"provider": "control", "kind": "show"},
        )
        return

    if command.action != "set":
        reply = build_control_message(command)
        await _send_and_store_message(
            session_id=session["id"],
            user_id=user["id"],
            to_number=number,
            reply_to_wa_id=wa_message_id,
            body_text=reply,
            payload={"provider": "control", "kind": "help"},
        )
        return

    if sensitive:
        task_id = store.create_task(
            user_id=user["id"],
            session_id=session["id"],
            source_message_id=source_message_id,
            prompt=f"CONFIG_CHANGE:{command.scope}:{command.target_name or 'app'}:{summarize_assignments(command.assignments)}",
            status="waiting_approval",
        )
        store.create_config_change(
            change_id=task_id,
            user_id=user["id"],
            scope=command.scope,
            target_name=command.target_name,
            request_json={
                "scope": command.scope,
                "target_name": command.target_name,
                "assignments": command.assignments,
            },
            request_summary=summarize_assignments(command.assignments),
            reason="Sensitive env update requested from WhatsApp.",
        )
        approval_code = f"APPROVE {task_id}"
        nonce = secrets.token_urlsafe(16)
        store.create_approval(
            task_id=task_id,
            requested_by_user_id=user["id"],
            approval_type="config_change",
            reason="Perubahan environment sensitif perlu konfirmasi sebelum diterapkan.",
            risk_summary=summarize_assignments(command.assignments),
            approval_code=approval_code,
            nonce_hash=hash_nonce(nonce),
            ttl_seconds=settings.approval_code_ttl_seconds,
        )
        store.create_audit_log(
            actor_type="system",
            actor_ref="approval_policy",
            action="config_change_approval_requested",
            target_type="config_change",
            target_ref=task_id,
            metadata={
                "scope": command.scope,
                "target_name": command.target_name,
                "assignments": redact_sensitive_assignments(summarize_assignments(command.assignments)),
            },
        )
        reply = "\n".join(
            [
                "Approval dibutuhkan",
                f"Task: {task_id}",
                f"Scope: {command.scope}",
                f"Target: {command.target_name or 'app'}",
                f"Request: {summarize_assignments(command.assignments)}",
                f"Detail: {_build_task_detail_url(task_id)}",
                f"Reply: APPROVE {task_id} atau REJECT {task_id}",
            ]
        )
        await _send_and_store_message(
            session_id=session["id"],
            user_id=user["id"],
            to_number=number,
            reply_to_wa_id=wa_message_id,
            body_text=reply,
            payload={"provider": "control", "kind": "approval_requested"},
        )
        return

    if command.scope == "app":
        try:
            apply_app_settings(command.assignments)
            store.create_audit_log(
                actor_type="user",
                actor_ref=user["id"],
                action="app_settings_updated",
                target_type="app_env",
                target_ref="AI Assistants",
                metadata={"assignments": summarize_assignments(command.assignments)},
            )
            reply = "App settings updated:\n" + summarize_assignments(command.assignments)
        except Exception as exc:
            reply = f"Gagal update app settings: {str(exc)[:500]}"
    else:
        try:
            path = apply_project_settings(command.target_name or "", command.assignments)
            store.create_audit_log(
                actor_type="user",
                actor_ref=user["id"],
                action="project_env_updated",
                target_type="project_env",
                target_ref=command.target_name or "unknown",
                metadata={"assignments": summarize_assignments(command.assignments)},
            )
            reply = f"Project env updated at {path}:\n" + summarize_assignments(command.assignments)
        except Exception as exc:
            reply = f"Gagal update project env: {str(exc)[:500]}"

    await _send_and_store_message(
        session_id=session["id"],
        user_id=user["id"],
        to_number=number,
        reply_to_wa_id=wa_message_id,
        body_text=reply,
        payload={"provider": "control", "kind": "settings_applied"},
    )


async def handle_task_query(user: dict, session: dict, query: dict, reply_to_wa_id: str) -> None:
    number = session["channel_chat_id"]
    command_type = query["type"]
    if command_type == "latest":
        task = store.get_latest_task_for_user(user["id"])
        if not task:
            reply = "Belum ada task yang tercatat untuk nomor ini."
        else:
            reply = _format_task_snapshot(task)
        await _send_and_store_message(
            session_id=session["id"],
            user_id=user["id"],
            to_number=number,
            reply_to_wa_id=reply_to_wa_id,
            body_text=reply,
            payload={"provider": "meta_whatsapp", "kind": "task_query_latest"},
        )
        return

    if command_type == "list":
        tasks = store.get_recent_tasks_for_user(user["id"], limit=5)
        if not tasks:
            reply = "Belum ada task yang tercatat untuk nomor ini."
        else:
            lines = ["5 task terbaru:"]
            for task in tasks:
                lines.append(
                    f"- {task['id']} | {task['status']} | {task.get('current_step') or '-'} | {_build_task_detail_url(task['id'])}"
                )
            reply = "\n".join(lines)
        await _send_and_store_message(
            session_id=session["id"],
            user_id=user["id"],
            to_number=number,
            reply_to_wa_id=reply_to_wa_id,
            body_text=reply,
            payload={"provider": "meta_whatsapp", "kind": "task_query_list"},
        )
        return

    task = store.get_task(query["task_id"])
    if not task or task["user_id"] != user["id"]:
        reply = f"Task {query['task_id']} tidak ditemukan."
    else:
        reply = _format_task_snapshot(task)
    await _send_and_store_message(
        session_id=session["id"],
        user_id=user["id"],
        to_number=number,
        reply_to_wa_id=reply_to_wa_id,
        body_text=reply,
        payload={"provider": "meta_whatsapp", "kind": "task_query_detail"},
    )


async def handle_approval_reply(user: dict, session: dict, text: str) -> None:
    parts = text.strip().split(maxsplit=1)
    if len(parts) != 2:
        await _send_and_store_message(
            session_id=session["id"],
            user_id=user["id"],
            to_number=session["channel_chat_id"],
            reply_to_wa_id=None,
            body_text="Format approval tidak valid.",
            payload={"provider": "meta_whatsapp", "kind": "approval_error"},
        )
        return
    action = parts[0].upper()
    task_id = parts[1].strip()
    task = store.get_task(task_id)
    approval = store.get_pending_approval(task_id)
    if not task or not approval:
        await _send_and_store_message(
            session_id=session["id"],
            user_id=user["id"],
            to_number=session["channel_chat_id"],
            reply_to_wa_id=None,
            body_text=f"Approval untuk task {task_id} tidak ditemukan.",
            payload={"provider": "meta_whatsapp", "kind": "approval_missing"},
        )
        return
    if task["user_id"] != user["id"]:
        await _send_and_store_message(
            session_id=session["id"],
            user_id=user["id"],
            to_number=session["channel_chat_id"],
            reply_to_wa_id=None,
            body_text="Anda tidak berhak menyetujui task ini.",
            payload={"provider": "meta_whatsapp", "kind": "approval_forbidden"},
        )
        return

    now = datetime.now(timezone.utc)
    expires_at = datetime.fromisoformat(approval["expires_at"])
    if now > expires_at:
        store.update_approval(approval["id"], status="expired", responded_at=now.isoformat())
        store.update_task(task_id, status="cancelled", current_step="Approval expired")
        await _send_and_store_message(
            session_id=session["id"],
            user_id=user["id"],
            to_number=session["channel_chat_id"],
            reply_to_wa_id=None,
            body_text=f"Approval task {task_id} sudah kedaluwarsa.",
            payload={"provider": "meta_whatsapp", "kind": "approval_expired"},
        )
        return

    if action == "APPROVE":
        store.update_approval(
            approval["id"],
            status="approved",
            approved_by_user_id=user["id"],
            responded_at=now.isoformat(),
        )
        config_change = store.get_config_change(task_id)
        if config_change:
            await apply_approved_config_change(user, session, task_id, config_change)
            return

        store.update_task(task_id, status="queued", current_step="Approval granted")
        await _send_and_store_message(
            session_id=session["id"],
            user_id=user["id"],
            to_number=session["channel_chat_id"],
            reply_to_wa_id=None,
            body_text=f"Approval diterima. Hermes melanjutkan task {task_id}.\nDetail: {_build_task_detail_url(task_id)}",
            payload={"provider": "meta_whatsapp", "kind": "approval_accepted"},
        )
        asyncio.create_task(run_task(task_id, session["channel_chat_id"]))
        return

    if action == "REJECT":
        store.update_approval(
            approval["id"],
            status="rejected",
            approved_by_user_id=user["id"],
            responded_at=now.isoformat(),
        )
        store.update_task(task_id, status="rejected", current_step="Approval rejected")
        await _send_and_store_message(
            session_id=session["id"],
            user_id=user["id"],
            to_number=session["channel_chat_id"],
            reply_to_wa_id=None,
            body_text=f"Task {task_id} dibatalkan oleh user.",
            payload={"provider": "meta_whatsapp", "kind": "approval_rejected"},
        )
        return

    await _send_and_store_message(
        session_id=session["id"],
        user_id=user["id"],
        to_number=session["channel_chat_id"],
        reply_to_wa_id=None,
        body_text="Gunakan APPROVE <task_id> atau REJECT <task_id>.",
        payload={"provider": "meta_whatsapp", "kind": "approval_usage"},
    )


async def apply_approved_config_change(user: dict, session: dict, task_id: str, config_change: dict) -> None:
    number = session["channel_chat_id"]
    now = datetime.now(timezone.utc).isoformat()
    try:
        request = json.loads(config_change["request_json"])
        scope = request.get("scope")
        target_name = request.get("target_name")
        assignments = request.get("assignments") or {}
        if not isinstance(assignments, dict):
            raise ValueError("Invalid config change payload.")

        if scope == "app":
            apply_app_settings({str(key): str(value) for key, value in assignments.items()})
            result_text = "App settings applied:\n" + summarize_assignments({str(key): str(value) for key, value in assignments.items()})
        elif scope == "project":
            path = apply_project_settings(str(target_name or ""), {str(key): str(value) for key, value in assignments.items()})
            result_text = f"Project env applied at {path}:\n" + summarize_assignments({str(key): str(value) for key, value in assignments.items()})
        else:
            raise ValueError("Unknown config change scope.")
    except Exception as exc:
        error_text = str(exc)[:800]
        store.update_config_change(task_id, status="failed", responded_at=now, error_summary=error_text)
        store.update_task(task_id, status="failed", current_step="Config change failed", error_summary=error_text, finished_at=now)
        await _send_and_store_message(
            session_id=session["id"],
            user_id=user["id"],
            to_number=number,
            reply_to_wa_id=None,
            body_text=f"Task {task_id} gagal saat menerapkan config: {error_text}",
            payload={"provider": "meta_whatsapp", "kind": "config_change_failed"},
        )
        return

    store.update_config_change(task_id, status="applied", responded_at=now, applied_at=now)
    store.update_task(
        task_id,
        status="completed",
        current_step="Config applied",
        progress_percent=100,
        result_summary=result_text,
        finished_at=now,
    )
    await _send_and_store_message(
        session_id=session["id"],
        user_id=user["id"],
        to_number=number,
        reply_to_wa_id=None,
        body_text=f"Task {task_id} selesai.\n\n{result_text[:3000]}\n\nDetail: {_build_task_detail_url(task_id)}",
        payload={"provider": "meta_whatsapp", "kind": "config_change_completed"},
    )


async def run_task(task_id: str, number: str) -> None:
    current_settings = get_settings()
    task = store.get_task(task_id)
    if not task:
        return

    store.update_task(
        task_id,
        status="running",
        current_step="Starting Hermes Agent",
        progress_percent=5,
        started_at=datetime.now(timezone.utc).isoformat(),
    )

    task_started_at = asyncio.get_running_loop().time()
    last_progress_sent = 0.0
    last_progress_percent_sent = 0
    last_progress_step_sent = ""

    async def on_progress(progress_task_id: str, progress_percent: int, current_step: str) -> None:
        nonlocal last_progress_sent, last_progress_percent_sent, last_progress_step_sent
        now_ts = asyncio.get_running_loop().time()
        store.update_task(progress_task_id, progress_percent=progress_percent, current_step=current_step)
        store.append_task_log(progress_task_id, "INFO", f"{progress_percent}% {current_step}")
        should_send = False
        if last_progress_sent == 0.0:
            should_send = True
        elif current_step != last_progress_step_sent and progress_percent >= 15:
            should_send = True
        elif progress_percent >= last_progress_percent_sent + 20:
            should_send = True

        if should_send and now_ts - last_progress_sent >= current_settings.task_progress_throttle_seconds:
            last_progress_sent = now_ts
            last_progress_percent_sent = progress_percent
            last_progress_step_sent = current_step
            elapsed_seconds = int(now_ts - task_started_at)
            await _send_and_store_message(
                session_id=task["session_id"],
                user_id=task["user_id"],
                to_number=number,
                reply_to_wa_id=None,
                body_text=_format_task_progress(progress_task_id, progress_percent, current_step, elapsed_seconds),
                payload={"provider": "meta_whatsapp", "kind": "task_progress"},
            )

    try:
        exit_code, summary = await bridge.run_task(task_id, task["prompt"], on_progress=on_progress)
    except Exception as exc:
        logger.exception("Hermes task failed for %s", task_id)
        store.update_task(
            task_id,
            status="failed",
            current_step="Failed",
            error_summary=str(exc),
            finished_at=datetime.now(timezone.utc).isoformat(),
        )
        store.append_task_log(task_id, "ERROR", str(exc))
        await _send_and_store_message(
            session_id=task["session_id"],
            user_id=task["user_id"],
            to_number=number,
            reply_to_wa_id=None,
            body_text=_format_task_error(task_id, str(exc)[:1000]),
            payload={"provider": "meta_whatsapp", "kind": "task_failed"},
        )
        return

    finished_at = datetime.now(timezone.utc).isoformat()
    if exit_code == 0:
        final_summary = _clean_hermes_summary(summary)
        delivery_result = ensure_pdf_delivery(
            task_id=task_id,
            prompt=task["prompt"],
            summary=final_summary,
            projects_root=get_settings().hermes_projects_root,
        )
        final_summary = delivery_result.summary
        if _is_unusable_final_summary(final_summary):
            error_summary = "Hermes mengembalikan output final yang terlalu pendek atau tidak valid."
            store.update_task(
                task_id,
                status="failed",
                current_step="Invalid Hermes output",
                progress_percent=95,
                error_summary=error_summary,
                finished_at=finished_at,
            )
            store.append_task_log(task_id, "ERROR", error_summary)
            await _send_and_store_message(
                session_id=task["session_id"],
                user_id=task["user_id"],
                to_number=number,
                reply_to_wa_id=None,
                body_text=_format_task_error(task_id, error_summary),
                payload={"provider": "meta_whatsapp", "kind": "task_failed"},
            )
            return

        store.update_task(
            task_id,
            status="completed",
            current_step="Completed",
            progress_percent=100,
            result_summary=final_summary,
            finished_at=finished_at,
        )
        await _send_and_store_message(
            session_id=task["session_id"],
            user_id=task["user_id"],
            to_number=number,
            reply_to_wa_id=None,
            body_text=_format_task_completed(task_id, final_summary[:3000]),
            payload={"provider": "meta_whatsapp", "kind": "task_completed"},
        )
    else:
        store.update_task(
            task_id,
            status="failed",
            current_step="Failed",
            progress_percent=95,
            error_summary=summary or f"Hermes exit code {exit_code}",
            finished_at=finished_at,
        )
        await _send_and_store_message(
            session_id=task["session_id"],
            user_id=task["user_id"],
            to_number=number,
            reply_to_wa_id=None,
            body_text=_format_task_failed(task_id, exit_code, _clean_hermes_summary(summary)[:3000]),
            payload={"provider": "meta_whatsapp", "kind": "task_failed"},
        )


def _is_allowed_number(number: str) -> bool:
    current_settings = get_settings()
    return bool(current_settings.whatsapp_allowed_numbers) and number in current_settings.whatsapp_allowed_numbers


async def _send_and_store_message(
    *,
    session_id: str | None,
    user_id: str | None,
    to_number: str,
    reply_to_wa_id: str | None,
    body_text: str,
    payload: dict,
) -> dict | None:
    sent = await sender.send_text(to_number, body_text)
    store.create_message(
        session_id=session_id,
        user_id=user_id,
        direction="outbound",
        message_type="text",
        wa_message_id=(sent or {}).get("messages", [{}])[0].get("id") if isinstance(sent, dict) else None,
        reply_to_wa_id=reply_to_wa_id,
        body_text=body_text,
        payload=payload,
        status="sent" if sent else "queued",
    )
    return sent


def _is_approval_reply(text: str) -> bool:
    upper = text.strip().upper()
    return upper.startswith("APPROVE ") or upper.startswith("REJECT ")


def _requires_approval(text: str) -> bool:
    lower = text.lower()
    return any(keyword in lower for keyword in RISKY_KEYWORDS)


def _is_social_message(lowered: str) -> bool:
    social_messages = {
        "halo",
        "hallo",
        "haii",
        "hai",
        "hi",
        "hello",
        "pagi",
        "siang",
        "sore",
        "malam",
        "help",
        "menu",
        "panduan",
        "ok",
        "oke",
        "sip",
        "siap",
        "thanks",
        "thank you",
        "terima kasih",
        "makasih",
    }
    return lowered in social_messages


def _is_general_question(lowered: str) -> bool:
    question_prefixes = (
        "apa ",
        "apakah ",
        "siapa ",
        "kapan ",
        "dimana ",
        "di mana ",
        "kenapa ",
        "mengapa ",
        "bagaimana ",
        "gimana ",
        "berapa ",
        "cara ",
    )
    if _is_instruction_question(lowered):
        return True
    if lowered.endswith("?") and not _has_work_intent(lowered):
        return True
    return lowered.startswith(question_prefixes) and not _has_work_intent(lowered)


def _is_instruction_question(lowered: str) -> bool:
    question_starters = (
        "cara ",
        "bagaimana cara ",
        "gimana cara ",
        "bagaimana ",
        "gimana ",
        "apa cara ",
    )
    return lowered.startswith(question_starters)


def _has_work_intent(lowered: str) -> bool:
    task_verbs = (
        "buat project",
        "buatkan project",
        "buat aplikasi",
        "buat website",
        "buat landing",
        "buatkan landing",
        "buatkan saya landing",
        "buat dokumen",
        "buatkan dokumen",
        "buatkan saya dokumen",
        "buat file",
        "buatkan file",
        "buat laporan",
        "buatkan laporan",
        "buat proposal",
        "buatkan proposal",
        "buat pdf",
        "buatkan pdf",
        "dokumen pdf",
        "file pdf",
        "export pdf",
        "ekspor pdf",
        "jadikan pdf",
        "susun dokumen",
        "susun laporan",
        "susun proposal",
        "generate pdf",
        "presentasi",
        "slide",
        "spreadsheet",
        "perbaiki",
        "debug",
        "deploy",
        "install",
        "setup",
        "ubah",
        "update",
        "refactor",
        "hapus",
        "remove",
        "jalankan",
        "run ",
        "cek project",
        "check project",
        "list project",
        "baca file",
        "download ",
        "zip ",
        "lihat project",
        "push ",
        "commit",
        "github",
        "buat repo",
        "restart service",
        "systemctl",
        "project env",
        "settings set",
        ".env",
    )
    work_prefixes = (
        "/",
        "buat project",
        "buatkan project",
        "buat dokumen",
        "buatkan dokumen",
        "buat file",
        "buatkan file",
        "buat laporan",
        "buatkan laporan",
        "buat proposal",
        "buatkan proposal",
        "buat pdf",
        "buatkan pdf",
        "susun dokumen",
        "susun laporan",
        "susun proposal",
        "edit project",
        "lihat project",
        "baca ",
        "download ",
        "zip ",
    )
    return lowered.startswith(work_prefixes) or any(verb in lowered for verb in task_verbs)


def _is_task_intent(text: str) -> bool:
    lowered = text.strip().lower()
    if _is_social_message(lowered):
        return False
    if _is_general_question(lowered):
        return False
    if _has_work_intent(lowered):
        return True
    task_verbs = (
        "buat project",
        "buatkan",
        "perbaiki",
        "debug",
        "deploy",
        "install",
        "setup",
        "ubah",
        "update",
        "refactor",
        "hapus",
        "remove",
        "jalankan",
        "run",
        "cek",
        "check",
        "list project",
        "baca ",
        "download ",
        "zip ",
        "lihat project",
        "cari ",
        "search ",
        "tolong",
        "silakan bantu",
        "bantu saya",
        "carikan",
        "buat ",
        "kerjakan",
        "lanjutkan",
        "analisis",
        "review",
    )
    if lowered.startswith(("/", "buat project", "edit project", "lihat project", "baca ", "download ", "zip ")):
        return True
    if any(verb in lowered for verb in task_verbs):
        return True
    return len(lowered.split()) >= 4


def _should_route_to_hermes(text: str) -> bool:
    lowered = text.strip().lower()
    if not lowered:
        return False
    if len(lowered) == 1:
        return False
    return _is_task_intent(text)


def _parse_task_query(text: str) -> dict | None:
    lowered = text.strip().lower()
    if lowered in {"task terakhir", "status", "status terakhir", "log terakhir"}:
        return {"type": "latest"}
    if lowered in {"tasks", "list task", "list tasks", "daftar task"}:
        return {"type": "list"}
    for prefix in ("status ", "task ", "log "):
        if lowered.startswith(prefix):
            task_id = text.strip()[len(prefix) :].strip()
            if task_id:
                return {"type": "detail", "task_id": task_id}
    return None


def _format_task_snapshot(task: dict) -> str:
    task_id = str(task["id"])
    lines = [
        f"Task: {task_id}",
        f"Status: {task.get('status') or '-'}",
        f"Step: {task.get('current_step') or '-'}",
        f"Progress: {task.get('progress_percent') or 0}%",
        f"Created: {task.get('created_at') or '-'}",
    ]
    if task.get("finished_at"):
        lines.append(f"Finished: {task['finished_at']}")
    if task.get("result_summary"):
        lines.append("")
        lines.append(str(task["result_summary"])[:1000])
    elif task.get("error_summary"):
        lines.append("")
        lines.append(str(task["error_summary"])[:1000])
    lines.append("")
    lines.append(f"Detail: {_build_task_detail_url(task_id)}")
    lines.append(f"Log: {_build_task_log_url(task_id)}")
    return "\n".join(lines)


def _format_task_ack(task_id: str) -> str:
    return "\n".join(
        [
            "*Hermes menerima task*",
            f"ID: `{task_id}`",
            "Status: antre untuk dianalisis dan dikerjakan.",
            "",
            f"Pantau: {_build_task_detail_url(task_id)}",
            f"Cek cepat: `status {task_id}`",
        ]
    )


def _format_task_progress(task_id: str, progress_percent: int, current_step: str, elapsed_seconds: int = 0) -> str:
    status_line = _format_hermes_status_line(task_id, progress_percent, elapsed_seconds)
    return "\n".join(
        [
            "*Hermes sedang bekerja*",
            status_line,
            f"Tahap: {current_step}",
            f"Task: `{task_id}`",
            f"Detail: {_build_task_detail_url(task_id)}",
        ]
    )


def _format_task_completed(task_id: str, summary: str) -> str:
    lines = [summary, "", "_Selesai oleh Hermes_", f"Task: `{task_id}`"]
    preview_url = _find_project_preview_url(summary)
    if preview_url:
        lines.append(f"Preview: {preview_url}")
    download_urls = _find_download_urls(summary)
    for label, download_url in download_urls:
        lines.append(f"{label}: {download_url}")
    lines.extend([f"Detail: {_build_task_detail_url(task_id)}", f"Log: {_build_task_log_url(task_id)}"])
    return "\n".join(lines)


def _format_task_error(task_id: str, error_text: str) -> str:
    return "\n".join(
        [
            "*Hermes belum berhasil menyelesaikan task ini*",
            f"Task: `{task_id}`",
            "",
            error_text,
            "",
            f"Detail: {_build_task_detail_url(task_id)}",
            f"Log: {_build_task_log_url(task_id)}",
        ]
    )


def _format_task_failed(task_id: str, exit_code: int, summary: str) -> str:
    lines = [
        "*Hermes belum berhasil menyelesaikan task ini*",
        f"Task: `{task_id}`",
        f"Exit code: {exit_code}",
    ]
    if summary:
        lines.extend(["", summary])
    lines.extend(["", f"Detail: {_build_task_detail_url(task_id)}", f"Log: {_build_task_log_url(task_id)}"])
    return "\n".join(lines)


def _clean_hermes_summary(summary: str | None) -> str:
    if not summary:
        return ""
    text = summary.replace("\r\n", "\n").strip()
    text = re.sub(r"\n{3,}", "\n\n", text)
    closers = (
        "Kalau kamu ingin saya bantu",
        "Kalau kamu mau saya bantu",
        "Jika kamu ingin saya bantu",
        "Kalau ingin,",
        "Bilang aja.",
        "Ada yang mau",
        "Ada yang ingin",
        "Mau saya",
    )
    lines: list[str] = []
    for raw_line in text.splitlines():
        line = raw_line.rstrip()
        if any(line.startswith(prefix) for prefix in closers):
            break
        lines.append(line)
    cleaned = "\n".join(lines).strip()
    cleaned = re.sub(r"^(Baik[, ]+)?(berikut|ini)\s+(penjelasan|ringkasan)\s+(singkat|ringkas)\s+(tentang|mengenai)\s*[:.-]?\s*", "", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"^(Baik[, ]+)?berikut\s+jawaban(?:nya)?\s*[:.-]?\s*", "", cleaned, flags=re.IGNORECASE)
    return re.sub(r"\n{3,}", "\n\n", cleaned)


def _is_unusable_final_summary(summary: str | None) -> bool:
    if not summary:
        return True
    stripped = summary.strip()
    return len(stripped) < 25 or stripped.lower() in {"ba", "baik", "ok", "oke"}


def _format_hermes_status_line(task_id: str, progress_percent: int, elapsed_seconds: int) -> str:
    model_name, context_label = _read_hermes_model_status()
    context_usage = _estimate_context_usage_label(task_id, context_label)
    progress = max(0, min(progress_percent, 100))
    filled = min(10, progress // 10)
    bar = "█" * filled + "░" * (10 - filled)
    elapsed = _format_duration(elapsed_seconds)
    return f"{model_name} │ {context_usage} │ [{bar}] {progress}% │ {elapsed} │ ⏲ {elapsed}"


def _read_hermes_model_status() -> tuple[str, str]:
    config_path = get_settings().hermes_workspace_root / ".hermes" / "config.yaml"
    model_name = "hermes"
    if config_path.exists():
        text = config_path.read_text(encoding="utf-8", errors="replace")
        model_match = re.search(r"(?m)^\s{2}model:\s*([^\n#]+)", text)
        if model_match:
            model_name = model_match.group(1).strip().strip("'\"")
    context_label = "1M" if "1m" in model_name.lower() or "deepseek-v4" in model_name.lower() else "--"
    return model_name, context_label


def _estimate_context_usage_label(task_id: str, context_label: str) -> str:
    settings = get_settings()
    task_dir = settings.task_logs_dir / task_id
    total_chars = 0
    for filename in ("prompt.md", "retry_prompt.md", "agent.log"):
        path = task_dir / filename
        if path.exists():
            total_chars += len(path.read_text(encoding="utf-8", errors="replace"))
    estimated_tokens = max(1, total_chars // 4)
    return f"{_format_token_count(estimated_tokens)}/{context_label}"


def _format_token_count(tokens: int) -> str:
    tokens = max(0, int(tokens))
    if tokens >= 1_000_000:
        return f"{tokens / 1_000_000:.1f}M"
    if tokens >= 1_000:
        return f"{tokens / 1_000:.1f}K"
    return str(tokens)


def _format_duration(seconds: int) -> str:
    seconds = max(0, int(seconds))
    hours, remainder = divmod(seconds, 3600)
    minutes, secs = divmod(remainder, 60)
    if hours:
        return f"{hours}h {minutes}m"
    if minutes:
        return f"{minutes}m {secs}s"
    return f"{secs}s"


def _build_public_base_url() -> str:
    settings = get_settings()
    webhook_url = settings.whatsapp_webhook_url.strip()
    if not webhook_url:
        return f"http://127.0.0.1:{settings.app_port}"
    parts = urlsplit(webhook_url)
    return urlunsplit((parts.scheme, parts.netloc, "", "", "")).rstrip("/")


def _task_access_secret() -> str:
    settings = get_settings()
    return settings.meta_app_secret or settings.meta_verify_token or "ai-assistants-task-access"


def _build_task_access_token(task_id: str) -> str:
    digest = hmac.new(_task_access_secret().encode("utf-8"), task_id.encode("utf-8"), hashlib.sha256).hexdigest()
    return digest[:32]


def _build_task_detail_url(task_id: str) -> str:
    return f"{_build_public_base_url()}/tasks/{task_id}?access={_build_task_access_token(task_id)}"


def _build_task_log_url(task_id: str) -> str:
    return f"{_build_public_base_url()}/tasks/{task_id}/log?access={_build_task_access_token(task_id)}"


def _find_project_preview_url(text: str) -> str | None:
    settings = get_settings()
    projects_root = settings.hermes_projects_root.resolve()
    matches = re.findall(r"(/root/hermes-projects/[^\n`]+)", text)
    for match in matches:
        raw_path = match.strip().strip(" .,:;)")
        candidate = Path(raw_path).resolve()
        candidates = [candidate if candidate.is_dir() else candidate.parent]
        candidates.extend(candidates[0].parents)
        for project_root in candidates:
            if not _is_path_within(project_root, projects_root):
                continue
            if (project_root / "index.html").exists():
                return _build_project_preview_url(project_root)
    return None


def _build_project_preview_url(project_root: Path) -> str:
    encoded_root = base64.urlsafe_b64encode(str(project_root.resolve()).encode("utf-8")).decode("ascii").rstrip("=")
    token = _build_preview_access_token(encoded_root)
    return f"{_build_public_base_url()}/preview/{token}/{encoded_root}/"


def _build_preview_access_token(encoded_root: str) -> str:
    digest = hmac.new(_task_access_secret().encode("utf-8"), encoded_root.encode("utf-8"), hashlib.sha256).hexdigest()
    return digest[:32]


def _find_download_urls(text: str, limit: int = 3) -> list[tuple[str, str]]:
    settings = get_settings()
    projects_root = settings.hermes_projects_root.resolve()
    matches = re.findall(r"(/root/hermes-projects/[^\n`]+)", text)
    download_urls: list[tuple[str, str]] = []
    seen: set[str] = set()

    for match in matches:
        raw_path = match.strip().strip(" .,:;)")
        candidate = Path(raw_path).resolve()
        if not _is_path_within(candidate, projects_root):
            continue
        if not candidate.exists() or not candidate.is_file():
            continue
        if candidate.suffix.lower() not in DOWNLOADABLE_EXTENSIONS:
            continue
        key = str(candidate)
        if key in seen:
            continue
        seen.add(key)
        download_urls.append((f"Download {candidate.suffix.lower().lstrip('.')}", _build_file_download_url(candidate)))
        if len(download_urls) >= limit:
            break

    return download_urls


def _build_file_download_url(file_path: Path) -> str:
    encoded_file = base64.urlsafe_b64encode(str(file_path.resolve()).encode("utf-8")).decode("ascii").rstrip("=")
    token = _build_download_access_token(encoded_file)
    return f"{_build_public_base_url()}/download/{token}/{encoded_file}"


def _build_download_access_token(encoded_file: str) -> str:
    digest = hmac.new(_task_access_secret().encode("utf-8"), encoded_file.encode("utf-8"), hashlib.sha256).hexdigest()
    return digest[:32]


def _validate_download_access(encoded_file: str, token: str) -> Path:
    expected = _build_download_access_token(encoded_file)
    if not token or not hmac.compare_digest(token, expected):
        raise HTTPException(status_code=403, detail="Invalid download token")
    padded = encoded_file + "=" * (-len(encoded_file) % 4)
    try:
        decoded = base64.urlsafe_b64decode(padded.encode("ascii")).decode("utf-8")
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Invalid download path") from exc
    target = Path(decoded).resolve()
    projects_root = get_settings().hermes_projects_root.resolve()
    if not _is_path_within(target, projects_root):
        raise HTTPException(status_code=403, detail="Download path is outside projects root")
    if not target.exists() or not target.is_file():
        raise HTTPException(status_code=404, detail="Download file not found")
    if target.suffix.lower() not in DOWNLOADABLE_EXTENSIONS:
        raise HTTPException(status_code=403, detail="File type is not downloadable")
    return target


def _validate_preview_access(encoded_root: str, token: str) -> Path:
    expected = _build_preview_access_token(encoded_root)
    if not token or not hmac.compare_digest(token, expected):
        raise HTTPException(status_code=403, detail="Invalid preview token")
    padded = encoded_root + "=" * (-len(encoded_root) % 4)
    try:
        decoded = base64.urlsafe_b64decode(padded.encode("ascii")).decode("utf-8")
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Invalid preview path") from exc
    project_root = Path(decoded).resolve()
    projects_root = get_settings().hermes_projects_root.resolve()
    if not _is_path_within(project_root, projects_root):
        raise HTTPException(status_code=403, detail="Preview path is outside projects root")
    return project_root


def _is_path_within(path: Path, parent: Path) -> bool:
    try:
        path.resolve().relative_to(parent.resolve())
        return True
    except ValueError:
        return False


def _validate_task_access(task_id: str, access: str) -> None:
    expected = _build_task_access_token(task_id)
    if not access or not hmac.compare_digest(access, expected):
        raise HTTPException(status_code=403, detail="Invalid access token")


def _read_task_log_text(task_id: str) -> str:
    settings = get_settings()
    log_path = settings.task_logs_dir / task_id / "agent.log"
    if not log_path.exists():
        return ""
    return log_path.read_text(encoding="utf-8", errors="replace")[-20000:]


def _payload_has_messages(payload: dict) -> bool:
    for entry in payload.get("entry", []):
        for change in entry.get("changes", []):
            if change.get("value", {}).get("messages"):
                return True
    return False


def _compute_delivery_key(payload: dict) -> str:
    ids: list[str] = []
    for entry in payload.get("entry", []):
        for change in entry.get("changes", []):
            value = change.get("value", {})
            for message in value.get("messages", []):
                if "id" in message:
                    ids.append(message["id"])
            for status in value.get("statuses", []):
                if "id" in status:
                    ids.append(status["id"])
    if ids:
        return "|".join(ids)
    return json.dumps(payload, sort_keys=True)
