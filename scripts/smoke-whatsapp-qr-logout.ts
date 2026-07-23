import assert from "node:assert/strict";

process.env.WHATSAPP_QR_API_URL = "https://evolution.example.test";
process.env.WHATSAPP_QR_API_KEY = "test-api-key";
process.env.WHATSAPP_QR_WEBHOOK_SECRET = "test-webhook-secret";

const requests: Array<{ url: string; method: string; apiKey: string | null }> = [];
const originalFetch = globalThis.fetch;
let forceDeleteFailure = false;

globalThis.fetch = async (input, init) => {
  const request = new Request(input, init);
  requests.push({
    url: request.url,
    method: request.method,
    apiKey: request.headers.get("apikey"),
  });
  if (forceDeleteFailure && request.method === "DELETE") {
    return new Response(
      JSON.stringify({ message: "Method not allowed" }),
      {
        status: 405,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
  return new Response(
    JSON.stringify({
      status: "SUCCESS",
      error: false,
      response: { message: "Instance logged out" },
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    },
  );
};

async function main() {
  const {
    logoutWhatsAppQrInstance,
    shouldAutoReplyWhatsAppQrMessage,
  } =
    await import("../src/server/services/whatsapp-qr-gateway");

  try {
    assert.equal(
      shouldAutoReplyWhatsAppQrMessage("628123456789@s.whatsapp.net", false),
      true,
    );
    assert.equal(
      shouldAutoReplyWhatsAppQrMessage("120363000000000000@g.us", false),
      false,
    );
    assert.equal(
      shouldAutoReplyWhatsAppQrMessage("120363000000000000@g.us", true),
      true,
    );

    await logoutWhatsAppQrInstance("balesin-wa-test");

    assert.equal(requests.length, 1);
    assert.equal(
      requests[0].url,
      "https://evolution.example.test/instance/logout/balesin-wa-test",
    );
    assert.equal(requests[0].method, "DELETE");
    assert.equal(requests[0].apiKey, "test-api-key");

    requests.length = 0;
    forceDeleteFailure = true;
    await logoutWhatsAppQrInstance("balesin-wa-legacy");
    assert.deepEqual(
      requests.map((request) => request.method),
      ["DELETE", "POST"],
    );

    console.log("WhatsApp QR logout smoke test passed.");
  } finally {
    globalThis.fetch = originalFetch;
  }
}

void main();
