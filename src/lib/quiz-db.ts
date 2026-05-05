/**
 * Typed escape hatch for the new quiz tables/RPCs that aren't yet in the
 * auto-generated `Database` type at `src/integrations/supabase/types.ts`.
 *
 * The generated types file is rebuilt by Lovable/Supabase on schema sync; until
 * it is, we route all quiz table reads/writes through these helpers so that
 * `any` is confined to one file.
 */
import { supabase } from "@/integrations/supabase/client";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabase = any;

export const quizDb = supabase as AnySupabase;
