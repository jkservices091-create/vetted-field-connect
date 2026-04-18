import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PublicLayout } from "@/components/PublicLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, ShieldCheck } from "lucide-react";
import { z } from "zod";

const schema = z.object({
  full_name: z.string().trim().min(2, "Enter your full name").max(80),
  email: z.string().trim().email("Invalid email").max(255),
  phone: z.string().trim().min(7, "Enter a phone number").max(30),
  password: z.string().min(8, "At least 8 characters").max(72),
});

const SignupWorker = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ full_name: "", email: "", phone: "", password: "" });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        emailRedirectTo: `${window.location.origin}/work`,
        data: { full_name: form.full_name, phone: form.phone, role: "worker" },
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Account created — let's set up your profile.");
    navigate("/work/profile");
  };

  return (
    <PublicLayout>
      <section className="container max-w-md py-12 md:py-20">
        <span className="eyebrow">Apply to work</span>
        <h1 className="display-lg mt-3">Get on the list.</h1>
        <p className="mt-3 text-muted-foreground">
          Create your worker account. You'll set up your profile and complete vetting next.
        </p>

        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <Field id="full_name" label="Full name" value={form.full_name} onChange={(v) => setForm({ ...form, full_name: v })} placeholder="Marcus Reyes" />
          <Field id="email" label="Email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} placeholder="you@example.com" />
          <Field id="phone" label="Phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} placeholder="(314) 555-0142" />
          <Field id="password" label="Password" type="password" value={form.password} onChange={(v) => setForm({ ...form, password: v })} placeholder="At least 8 characters" />

          <Button type="submit" size="lg" className="w-full h-12 mt-2" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create worker account
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            Already have an account? <Link to="/login" className="text-primary font-semibold">Log in</Link>
          </p>
        </form>

        <div className="mt-8 rounded-lg border border-success/30 bg-success/10 p-4 text-sm flex gap-3">
          <ShieldCheck className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-foreground">$15/month, locked in. 30-day free trial.</p>
            <p className="text-muted-foreground mt-1">One flat rate gets you a verified profile, unlimited bidding, and direct hirer messaging. New workers also pay a 5% cut on completed-job payouts — earn it down to as low as 2% with great ratings. Top pros keep 98% of every paycheck. <Link to="/pricing" className="text-primary font-semibold">See pricing</Link></p>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
};

function Field({ id, label, value, onChange, type = "text", placeholder }: { id: string; label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} required />
    </div>
  );
}

export default SignupWorker;
