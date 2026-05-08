import { createClient } from "@supabase/supabase-js";

const rawSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const rawSupabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

const supabaseUrl = rawSupabaseUrl.trim().replace(/\/+$/, "");
const supabaseAnonKey = rawSupabaseAnonKey.trim();

function looksLikeSupabaseUrl(value) {
  return /^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(String(value || ""));
}

export const isSupabaseConfigured = Boolean(
  supabaseUrl && supabaseAnonKey && looksLikeSupabaseUrl(supabaseUrl)
);

export function getSupabaseConfigError() {
  if (!supabaseUrl || !supabaseAnonKey) {
    return "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local, then restart npm run dev.";
  }

  if (!looksLikeSupabaseUrl(supabaseUrl)) {
    return "NEXT_PUBLIC_SUPABASE_URL is not valid. It should look like https://your-project-ref.supabase.co. After fixing .env.local, restart npm run dev.";
  }

  return "Supabase configuration looks valid.";
}

if (!isSupabaseConfigured) {
  console.warn(getSupabaseConfigError());
}

function createTimeoutFetch(timeoutMs = 15000) {
  return async (input, init = {}) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      return await fetch(input, {
        ...init,
        signal: init.signal || controller.signal,
      });
    } catch (error) {
      const message = String(error?.message || "").toLowerCase();

      if (error?.name === "AbortError") {
        throw new Error("Supabase request timed out. Check your internet connection and Supabase project URL.");
      }

      if (message.includes("failed to fetch") || message.includes("network")) {
        throw new Error("Failed to connect to Supabase. Check your internet connection, Supabase URL, anon key, and browser ad-block/VPN settings.");
      }

      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  };
}

export function clearSupabaseAuthStorage() {
  if (typeof window === "undefined") return;

  const keysToRemove = [];

  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);

    if (
      key &&
      (key.startsWith("sb-") ||
        key.includes("supabase") ||
        key.includes("auth-token") ||
        key === "ums-auth-token" ||
        key === "ums-auth-token-v2")
    ) {
      keysToRemove.push(key);
    }
  }

  keysToRemove.forEach((key) => window.localStorage.removeItem(key));
}

export const supabase = createClient(
  isSupabaseConfigured ? supabaseUrl : "https://placeholder.supabase.co",
  isSupabaseConfigured ? supabaseAnonKey : "placeholder-anon-key",
  {
    global: {
      fetch: createTimeoutFetch(),
    },
    auth: {
      storageKey: "ums-auth-token-v3",
      persistSession: true,
      autoRefreshToken: false,
      detectSessionInUrl: false,
      flowType: "implicit",
    },
  }
);
