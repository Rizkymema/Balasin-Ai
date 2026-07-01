function readPublicEnv(value?: string) {
  return value?.trim() ?? "";
}

const metaAppId = readPublicEnv(process.env.NEXT_PUBLIC_META_APP_ID);

export const metaPublicEnv = {
  metaAppId,
  whatsappAppId:
    readPublicEnv(process.env.NEXT_PUBLIC_WHATSAPP_APP_ID) || metaAppId,
  instagramAppId:
    readPublicEnv(process.env.NEXT_PUBLIC_INSTAGRAM_APP_ID) ||
    readPublicEnv(process.env.NEXT_PUBLIC_WHATSAPP_APP_ID) ||
    metaAppId,
  whatsappConfigId: readPublicEnv(process.env.NEXT_PUBLIC_META_WA_CONFIG_ID),
  instagramConfigId: readPublicEnv(process.env.NEXT_PUBLIC_META_IG_CONFIG_ID),
} as const;
