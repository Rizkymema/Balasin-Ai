import { jsonError, jsonOk } from "@/server/http";
import { getServerSession } from "@/server/auth/session";

export async function GET() {
  const session = await getServerSession();
  if (!session) {
    return jsonError("Unauthorized", 401);
  }

  return jsonOk(session);
}
