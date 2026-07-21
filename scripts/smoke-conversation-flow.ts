import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import type { ConversationFlow } from "../src/types/dashboard-config";

const storageDirectory = mkdtempSync(join(tmpdir(), "balesin-flow-test-"));
let closeDatabase = () => {};

process.env.BALESIN_STORAGE_DIR = storageDirectory;
delete process.env.VERCEL;
delete process.env.BLOB_READ_WRITE_TOKEN;
delete process.env.SUPABASE_URL;
delete process.env.SUPABASE_SERVICE_ROLE_KEY;
delete process.env.NEXT_PUBLIC_SUPABASE_URL;
delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function main() {
  const { defaultDashboardConfig } =
    await import("../src/lib/dashboard-config");
  const { getDatabase } = await import("../src/server/db");
  closeDatabase = () => getDatabase().close();
  const { saveDashboardConfigRecord } =
    await import("../src/server/repositories/dashboard-repository");
  const {
    discardConversationFlowDraft,
    initializeConversationFlowDraft,
    markConversationFlowTested,
    publishConversationFlow,
    saveConversationFlowDraft,
  } = await import("../src/server/repositories/conversation-flow-repository");

  const flow = {
    id: "flow-smoke",
    name: "Flow Smoke Test",
    channel: "All Channels",
    trigger: "First incoming message",
    initialMessage: "Halo",
    interactiveMenu: [],
    fallbackMessage: "Hubungi admin",
    humanAgentHandoff: { enabled: true, condition: "Knowledge not found" },
    status: "Draft",
    botResponse: 0,
    lastUpdate: new Date().toISOString(),
  } satisfies ConversationFlow;

  const config = structuredClone(defaultDashboardConfig);
  config.automation.conversations = [flow];
  await saveDashboardConfigRecord(config);

  const initialized = await initializeConversationFlowDraft(flow.id);
  assert.equal(initialized?.draftRevision, 1);
  assert.equal(initialized?.draftGraph?.nodes.length, 10);

  const graph = structuredClone(initialized?.draftGraph);
  assert.ok(graph);
  const greeting = graph.nodes.find((node) => node.data.label === "Greeting");
  assert.ok(greeting);
  greeting.data.message = "Halo dari draft";

  const saved = await saveConversationFlowDraft({
    flowId: flow.id,
    graph,
    expectedRevision: 1,
  });
  assert.equal(saved.flow?.draftRevision, 2);
  assert.equal(saved.conflict, false);
  const conflict = await saveConversationFlowDraft({
    flowId: flow.id,
    graph,
    expectedRevision: 1,
  });
  assert.equal(conflict.conflict, true);

  await markConversationFlowTested({ flowId: flow.id, graph });
  const published = await publishConversationFlow(flow.id);
  assert.ok(published.flow);
  assert.equal(published.flow.status, "Published");
  assert.equal(published.flow.publishedRevision, 1);
  assert.equal(published.flow.initialMessage, "Halo dari draft");

  const changed = structuredClone(published.flow?.publishedGraph);
  assert.ok(changed);
  const fallback = changed.nodes.find((node) => node.type === "fallback");
  assert.ok(fallback);
  fallback.data.message = "Fallback belum dipublikasikan";
  await saveConversationFlowDraft({
    flowId: flow.id,
    graph: changed,
    expectedRevision: 1,
  });

  const discarded = await discardConversationFlowDraft(flow.id);
  assert.equal(discarded?.hasUnpublishedChanges, false);
  assert.notEqual(
    discarded?.draftGraph?.nodes.find((node) => node.type === "fallback")?.data
      .message,
    "Fallback belum dipublikasikan",
  );

  console.log(
    JSON.stringify({
      initialized: true,
      autosave: true,
      revisionConflict: true,
      tested: true,
      published: true,
      discarded: true,
      nodes: discarded?.draftGraph?.nodes.length,
      edges: discarded?.draftGraph?.edges.length,
    }),
  );
}

main().finally(() => {
  closeDatabase();
  rmSync(storageDirectory, { recursive: true, force: true });
});
