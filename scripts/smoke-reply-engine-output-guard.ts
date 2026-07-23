import assert from "node:assert/strict";

import { isInternalReplyArtifact } from "../src/server/services/reply-engine";

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

  console.log("reply-engine output guard smoke test passed");
}

main();
