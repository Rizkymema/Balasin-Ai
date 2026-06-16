import { getKnowledgeChunks } from "@/server/repositories/dashboard-repository";
import { jsonOk, requireApiSession } from "@/server/http";

export async function GET(request: Request) {
  const { response } = await requireApiSession();
  if (response) {
    return response;
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") ?? "";
  return jsonOk(await getKnowledgeChunks(query));
}
