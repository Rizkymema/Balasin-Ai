export function getRequestContentLength(request: Request) {
  const raw = request.headers.get("content-length");
  if (!raw) {
    return null;
  }

  const value = Number(raw);
  return Number.isFinite(value) && value >= 0 ? value : null;
}

export function assertRequestSize(request: Request, maxBytes: number) {
  const contentLength = getRequestContentLength(request);
  if (contentLength !== null && contentLength > maxBytes) {
    throw new Error("Payload terlalu besar.");
  }
}

export function getFileExtension(fileName: string) {
  const normalized = fileName.trim().toLowerCase();
  const dotIndex = normalized.lastIndexOf(".");
  return dotIndex >= 0 ? normalized.slice(dotIndex) : "";
}

export function assertFileUpload(params: {
  file: File;
  allowedExtensions: Set<string>;
  maxBytes: number;
}) {
  const extension = getFileExtension(params.file.name);

  if (!params.allowedExtensions.has(extension)) {
    throw new Error("Tipe file tidak didukung.");
  }

  if (params.file.size <= 0) {
    throw new Error("File kosong dan tidak bisa diproses.");
  }

  if (params.file.size > params.maxBytes) {
    throw new Error("Ukuran file melebihi batas yang diizinkan.");
  }
}
