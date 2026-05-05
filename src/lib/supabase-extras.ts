// Thin shim around supabase-js for tables/views/RPCs that aren't yet in the
// generated Database types (they're added by PR #1, PR #2, and this PR's
// migration; types regenerate after deploy). Centralizing the cast lets us
// avoid scattering ad-hoc casts across the call sites.

/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase } from "@/integrations/supabase/client";

type AnySupabase = {
  from: (table: string) => any;
  rpc: (name: string, args?: Record<string, unknown>) => any;
};

export const sb = supabase as unknown as AnySupabase;
