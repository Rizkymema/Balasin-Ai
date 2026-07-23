import assert from "node:assert/strict";

import {
  parseCustomInstructions,
  serializeCustomInstructions,
} from "../src/lib/custom-instructions";
import {
  isInternalReplyArtifact,
  isKnowledgeChunkEligibleForAnswer,
} from "../src/server/services/reply-engine";
import type { KnowledgeChunk } from "../src/server/repositories/dashboard-repository";

function buildChunk(sourceName: string, content: string): KnowledgeChunk {
  return {
    id: "test-chunk",
    documentId: "test-document",
    chunkIndex: 0,
    content,
    metadata: {
      sourceName,
      sourceType: "google_sheet",
    },
    createdAt: new Date(0).toISOString(),
  };
}

function main() {
  assert.equal(
    isInternalReplyArtifact("category: WhatsApp\nquestion: Alamat bengkel di mana yah?"),
    true,
  );
  assert.equal(
    isInternalReplyArtifact("Jenis: **DM**\nIndikasi: Positif / Netral"),
    true,
  );
  assert.equal(
    isInternalReplyArtifact("Johan Garage berlokasi di Jl. Contoh No. 10, Jakarta."),
    false,
  );
  assert.equal(
    isKnowledgeChunkEligibleForAnswer(
      buildChunk(
        "google-sheet.xlsx | Pertanyaan_Baru",
        "category: Pertanyaan Baru | question: Berapa biaya servis?",
      ),
    ),
    false,
  );
  assert.equal(
    isKnowledgeChunkEligibleForAnswer(
      buildChunk(
        "google-sheet.xlsx | AI_Control",
        "channel: dm | user_key: 123 | mode: auto",
      ),
    ),
    false,
  );
  assert.equal(
    isKnowledgeChunkEligibleForAnswer(
      buildChunk(
        "google-sheet.xlsx | Knowledge_Base",
        "Pertanyaan: Kenapa motor boros? | Jawaban: Periksa tekanan ban dan filter udara.",
      ),
    ),
    true,
  );

  const serialized = serializeCustomInstructions({
    persona: "Nama bot Johan Assistant.",
    tone: "Formal dan sopan.",
    guardrails: "Dilarang mengarang harga.",
  });
  assert.deepEqual(parseCustomInstructions(serialized), {
    persona: "Nama bot Johan Assistant.",
    tone: "Formal dan sopan.",
    guardrails: "Dilarang mengarang harga.",
    agentInstructions: "",
  });

  const withAgent = `${serialized}\n\n[INSTRUKSI KHUSUS AI AGENT - PRIORITAS KEDUA]\nJawab singkat.`;
  assert.equal(parseCustomInstructions(withAgent).guardrails, "Dilarang mengarang harga.");
  assert.equal(parseCustomInstructions(withAgent).agentInstructions, "Jawab singkat.");

  console.log("reply-engine output guard smoke test passed");
}

main();
