function readServerEnv(value?: string) {
  return value?.trim() ?? "";
}

const metaAppId =
  readServerEnv(process.env.META_APP_ID) ||
  readServerEnv(process.env.NEXT_PUBLIC_META_APP_ID);
const metaAppSecret = readServerEnv(process.env.META_APP_SECRET);

export const metaServerEnv = {
  metaAppId,
  metaAppSecret,
  whatsappAppId:
    readServerEnv(process.env.NEXT_PUBLIC_WHATSAPP_APP_ID) || metaAppId,
  whatsappAppSecret:
    readServerEnv(process.env.WHATSAPP_APP_SECRET) || metaAppSecret,
  instagramAppId:
    readServerEnv(process.env.INSTAGRAM_APP_ID) ||
    readServerEnv(process.env.NEXT_PUBLIC_INSTAGRAM_APP_ID) ||
    readServerEnv(process.env.NEXT_PUBLIC_WHATSAPP_APP_ID) ||
    metaAppId,
  instagramAppSecret:
    readServerEnv(process.env.INSTAGRAM_APP_SECRET) || metaAppSecret,
} as const;
