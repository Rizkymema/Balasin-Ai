import {
  deleteKnowledgeDocument,
  readKnowledgeDocumentContent,
} from "@/server/repositories/dashboard-repository";
import { jsonError, jsonOk, requireApiSession } from "@/server/http";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { response } = await requireApiSession();
  if (response) {
    return response;
  }

  const { id } = await context.params;
  const content = readKnowledgeDocumentContent(id);
  if (!content) {
    return jsonError("Document not found.", 404);
  }

  return jsonOk(content);
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { response } = await requireApiSession();
  if (response) {
    return response;
  }

  const { id } = await context.params;
  deleteKnowledgeDocument(id);
  return jsonOk({ deleted: true, id });
}
