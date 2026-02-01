/// <reference lib="deno.unstable" />

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

function getEnv(name: string) {
  return Deno.env.get(name) ?? "";
}

serve(async (req) => {
  try {
    // Support both standard Edge env names and Lovable/Vite env names as fallback
    const supabaseUrl = getEnv("SUPABASE_URL") || getEnv("VITE_SUPABASE_URL");
    const supabaseAnonKey =
      getEnv("SUPABASE_ANON_KEY") ||
      getEnv("SUPABASE_ANON_KEY") ||
      getEnv("VITE_SUPABASE_PUBLISHABLE_KEY");

    // Safe fallback if env is missing
    if (!supabaseUrl || !supabaseAnonKey) {
      return Response.redirect(new URL("/icon-512.png", req.url), 302);
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data, error } = await supabase.rpc("get_public_store_config");

    const logoUrl = !error && data?.[0]?.logo_url ? String(data[0].logo_url) : null;
    const redirectTo = logoUrl || new URL("/icon-512.png", req.url).toString();

    // Most social crawlers follow redirects for og:image.
    return new Response(null, {
      status: 302,
      headers: {
        Location: redirectTo,
        // Encourage fast refresh while still allowing crawler caching behavior.
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (_e) {
    return Response.redirect(new URL("/icon-512.png", req.url), 302);
  }
});
