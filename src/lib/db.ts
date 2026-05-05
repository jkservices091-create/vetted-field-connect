import { supabase } from "@/integrations/supabase/client";

/**
 * Loosely-typed Supabase client for tables added in this PR (trade_badges,
 * trade_references, trade_project_photos, trades, public_worker_handles)
 * that aren't yet in the auto-generated `Database` type. Lovable regenerates
 * the types after migrations run; until then, use `db` here.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const db: any = supabase;
