import type { DashboardConfig } from "@/types/dashboard-config";
import { assertSafeExternalUrl } from "@/server/security/safe-fetch";
import { resolveAppUrl } from "@/lib/app-url";

export function resolveProviderEndpoint(config: DashboardConfig): string {
  const customBaseUrl = config.aiProvider.baseUrl.trim();
  if (customBaseUrl) {
    if (/\/(chat\/completions|responses)$/i.test(customBaseUrl)) {
      return customBaseUrl;
    }
    return `${customBaseUrl.replace(/\/+$/, "")}/chat/completions`;
  }

  switch (config.aiProvider.provider) {
    case "openrouter":
      return "https://openrouter.ai/api/v1/chat/completions";
    case "openai":
      return "https://api.openai.com/v1/chat/completions";
    case "gemini": {
      const model = config.aiProvider.model.trim() || "gemini-pro";
      const apiKey = config.aiProvider.apiKey.trim();
      return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    }
    case "anthropic":
      return "https://api.anthropic.com/v1/messages";
    default:
      return "https://api.openai.com/v1/chat/completions";
  }
}

export function extractAiResponseText(payload: any, provider?: string): string {
  if (!payload || typeof payload !== "object") {
    return "";
  }

  if (provider === "anthropic") {
    const text = payload.content
      ?.filter((item: any) => item.type === "text")
      .map((item: any) => item.text?.trim() ?? "")
      .filter(Boolean)
      .join("\n");
    return text?.trim() ?? "";
  }

  if (provider === "gemini") {
    const text = payload.candidates?.[0]?.content?.parts
      ?.map((p: any) => p.text?.trim() ?? "")
      .filter(Boolean)
      .join("\n");
    return text?.trim() ?? "";
  }

  if (typeof payload.output_text === "string" && payload.output_text.trim()) {
    return payload.output_text.trim();
  }

  const content = payload.choices?.[0]?.message?.content;
  if (typeof content === "string") {
    return content.trim();
  }

  if (Array.isArray(content)) {
    return content
      .filter((item: any) => item.type === "text")
      .map((item: any) => item.text?.trim() ?? "")
      .filter(Boolean)
      .join("\n")
      .trim();
  }

  return "";
}

export async function callLlm(
  config: DashboardConfig,
  systemPrompt: string,
  userPrompt: string,
  options: {
    temperature?: number;
    maxTokens?: number;
    history?: Array<{ role: "user" | "assistant"; content: string }>;
  } = {},
): Promise<string> {
  const provider = config.aiProvider.provider;
  const apiKey = config.aiProvider.apiKey.trim();
  const endpoint = resolveProviderEndpoint(config);
  assertSafeExternalUrl(endpoint);

  const temperature = options.temperature ?? 0.25;
  const maxTokens = options.maxTokens ?? 1024;
  const history = options.history ?? [];

  let response: Response;

  if (provider === "gemini") {
    const contents = [
      ...history.map((h) => ({
        role: h.role === "user" ? "user" : "model",
        parts: [{ text: h.content }],
      })),
      { role: "user", parts: [{ text: userPrompt }] },
    ];

    response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents,
        generationConfig: { temperature, maxOutputTokens: maxTokens },
      }),
    });
  } else if (provider === "anthropic") {
    const messages = [
      ...history.map((h) => ({
        role: h.role === "user" ? ("user" as const) : ("assistant" as const),
        content: h.content,
      })),
      { role: "user" as const, content: userPrompt },
    ];

    response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: config.aiProvider.model.trim() || "claude-3-haiku-20240307",
        max_tokens: maxTokens,
        system: systemPrompt,
        messages,
        temperature,
      }),
    });
  } else {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    };
    if (provider === "openrouter") {
      headers["HTTP-Referer"] = resolveAppUrl();
      headers["X-Title"] = config.workspace.name || "Balesin Desk";
    }

    const messages = [
      { role: "system", content: systemPrompt },
      ...history.map((h) => ({ role: h.role, content: h.content })),
      { role: "user", content: userPrompt },
    ];

    response = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: config.aiProvider.model.trim() || "gpt-3.5-turbo",
        temperature,
        max_tokens: maxTokens,
        messages,
      }),
    });
  }

  if (!response.ok) {
    const errText = await response.text().catch(() => "");
    throw new Error(`AI Provider API returned ${response.status}: ${errText}`);
  }

  const payload = await response.json();
  return extractAiResponseText(payload, provider);
}
