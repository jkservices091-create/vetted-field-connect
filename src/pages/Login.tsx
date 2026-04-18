import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PublicLayout } from "@/components/PublicLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const Login = () => {
  const navigate = useNavigate();
  const { user, primaryRole, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (!authLoading && user && primaryRole) {
      navigate(primaryRole === "admin" ? "/admin" : primaryRole === "hiring_party" ? "/hire" : "/work", { replace: true });
    }
  }, [user, primaryRole, authLoading, navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Welcome back.");
  };

  const onForgot = async () => {
    if (!email) {
      toast.error("Enter your email first");
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) toast.error(error.message);
    else toast.success("Reset email sent if account exists");
  };

  return (
    <PublicLayout>
      <section className="container max-w-sm py-16 md:py-24">
        <h1 className="display-lg">Log in</h1>
        <p className="mt-2 text-muted-foreground">Welcome back to FieldHands.</p>

        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between items-baseline">
              <Label htmlFor="password">Password</Label>
              <button type="button" onClick={onForgot} className="text-xs text-primary hover:underline">Forgot?</button>
            </div>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <Button type="submit" size="lg" className="w-full h-12" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Log in
          </Button>
        </form>

        <div className="mt-8 text-sm text-center text-muted-foreground space-y-1">
          <div>New worker? <Link to="/apply" className="text-primary font-semibold">Apply here</Link></div>
          <div>Hiring? <Link to="/for-hiring" className="text-primary font-semibold">Create a hirer account</Link></div>
        </div>
      </section>
    </PublicLayout>
  );
};

export default Login;
