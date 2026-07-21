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
  const { createBookingServiceFlowTemplate } =
    await import("../src/lib/conversation-flow-templates");
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
    setConversationFlowActive,
  } = await import("../src/server/repositories/conversation-flow-repository");
  const {
    executeConversationFlowBeforeAi,
    resumeConversationFlowForm,
    validateConversationFlowGraph,
  } =
    await import("../src/server/services/conversation-flow-service");

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

  const inactive = await setConversationFlowActive(flow.id, false);
  assert.equal(inactive.flow?.status, "Inactive");
  const reactivated = await setConversationFlowActive(flow.id, true);
  assert.equal(reactivated.flow?.status, "Published");

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

  const bookingTemplate = createBookingServiceFlowTemplate({
    flowId: "flow-booking-template-smoke",
    lastUpdate: new Date().toISOString(),
  });
  assert.equal(bookingTemplate.status, "Draft");
  assert.equal(bookingTemplate.normalizedTrigger, "booking_intent");
  assert.ok(bookingTemplate.draftGraph);
  const bookingValidation = validateConversationFlowGraph(
    bookingTemplate.draftGraph,
    config,
  );
  assert.equal(
    bookingValidation.valid,
    true,
    bookingValidation.errors.map((item) => item.message).join("; "),
  );
  const bookingForm = bookingTemplate.draftGraph.nodes.find(
    (node) => node.type === "form_chat",
  );
  assert.equal(bookingForm?.data.formFields?.length, 7);
  assert.equal(
    bookingForm?.data.formFields?.every((field) => field.required),
    true,
  );
  const bookingRuntimeConfig = structuredClone(config);
  bookingRuntimeConfig.workspace.timezone = "UTC";
  bookingRuntimeConfig.workspace.businessHours = "00:00 - 23:59";
  const bookingRuntime = executeConversationFlowBeforeAi({
    graph: bookingTemplate.draftGraph,
    config: bookingRuntimeConfig,
    now: new Date("2026-07-21T12:00:00.000Z"),
  });
  assert.equal(bookingRuntime.graphReplyOnly, true);
  assert.equal(bookingRuntime.needsHuman, false);
  assert.equal(bookingRuntime.formState?.fieldIndex, 0);
  assert.equal(
    bookingRuntime.messages.some((item) =>
      item.includes("Booking Service Johan Garage"),
    ),
    true,
  );

  const bookingAnswers = [
    "Rizky",
    "081234567890",
    "Honda Vario 125 2022",
    "2",
    "CVT bergetar",
    "2026-07-25",
    "3",
  ];
  let bookingStep = bookingRuntime;
  for (const answer of bookingAnswers) {
    assert.ok(bookingStep.formState);
    bookingStep = resumeConversationFlowForm({
      graph: bookingTemplate.draftGraph,
      config: bookingRuntimeConfig,
      state: bookingStep.formState,
      answer,
      now: new Date("2026-07-21T12:00:00.000Z"),
    });
  }
  assert.equal(bookingStep.completedForm?.values.customer_name, "Rizky");
  assert.equal(bookingStep.completedForm?.values.service_type, "Servis CVT");
  assert.equal(bookingStep.completedForm?.values.preferred_time, "13:00");
  assert.equal(bookingStep.needsHuman, true);

  console.log(
    JSON.stringify({
      initialized: true,
      autosave: true,
      revisionConflict: true,
      tested: true,
      published: true,
      statusToggle: true,
      discarded: true,
      nodes: discarded?.draftGraph?.nodes.length,
      edges: discarded?.draftGraph?.edges.length,
      bookingTemplate: true,
      bookingFields: bookingForm?.data.formFields?.length,
      bookingCompleted: Boolean(bookingStep.completedForm),
    }),
  );
}

main().finally(() => {
  closeDatabase();
  rmSync(storageDirectory, { recursive: true, force: true });
});
