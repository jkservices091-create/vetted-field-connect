import { useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "hiring_party" | "worker" | "admin";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const applySession = async (sess: Session | null) => {
      if (!active) return;

      setLoading(true);
      setSession(sess);
      setUser(sess?.user ?? null);

      if (!sess?.user) {
        setRoles([]);
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", sess.user.id);

      if (!active) return;

      setRoles((data ?? []).map((r) => r.role as AppRole));
      setLoading(false);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, sess) => {
      void applySession(sess);
    });

    void supabase.auth.getSession().then(({ data: { session: sess } }) => {
      void applySession(sess);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setRoles([]);
  };

  const primaryRole: AppRole | null = roles.includes("admin")
    ? "admin"
    : roles.includes("hiring_party")
    ? "hiring_party"
    : roles.includes("worker")
    ? "worker"
    : null;

  return { user, session, roles, primaryRole, loading, signOut };
}
