import { createClient, type SupabaseClient } from "@supabase/supabase-js";

function getSupabaseUrl() {
  return process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
}

function getSupabaseKey() {
  return (
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ??
    ""
  );
}

export function isSupabaseEnabled() {
  return getSupabaseUrl().length > 0 && getSupabaseKey().length > 0;
}

declare global {
  var __balesinSupabase: SupabaseClient | undefined;
}

export function getSupabaseServerClient() {
  if (!isSupabaseEnabled()) {
    throw new Error("Supabase belum dikonfigurasi.");
  }

  if (globalThis.__balesinSupabase) {
    return globalThis.__balesinSupabase;
  }

  const client = createClient(getSupabaseUrl(), getSupabaseKey(), {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  globalThis.__balesinSupabase = client;
  return client;
}

export function getSupabaseStorageMode() {
  if (!isSupabaseEnabled()) {
    return "disabled" as const;
  }

  return process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
    ? ("service_role" as const)
    : ("publishable" as const);
}
