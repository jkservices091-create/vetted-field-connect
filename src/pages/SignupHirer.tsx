import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PublicLayout } from "@/components/PublicLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Briefcase } from "lucide-react";
import { z } from "zod";

const schema = z.object({
  full_name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().min(7).max(30),
  password: z.string().min(8).max(72),
});

const SignupHirer = () => {
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
        emailRedirectTo: `${window.location.origin}/hire`,
        data: { full_name: form.full_name, phone: form.phone, role: "hiring_party" },
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Account created — set up your company next.");
    navigate("/hire/profile");
  };

  return (
    <PublicLayout>
      <section className="container max-w-md py-12 md:py-20">
        <span className="eyebrow">For hirers</span>
        <h1 className="display-lg mt-3">Post your first job.</h1>
        <p className="mt-3 text-muted-foreground">
          Create your hiring account, set up your company, and start posting labor jobs in minutes.
        </p>

        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <Field id="full_name" label="Your name" value={form.full_name} onChange={(v) => setForm({ ...form, full_name: v })} placeholder="Sarah Chen" />
          <Field id="email" label="Work email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} placeholder="you@yourcompany.com" />
          <Field id="phone" label="Phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} placeholder="(314) 555-0188" />
          <Field id="password" label="Password" type="password" value={form.password} onChange={(v) => setForm({ ...form, password: v })} placeholder="At least 8 characters" />

          <Button type="submit" size="lg" className="w-full h-12 mt-2" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create hiring account
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            Already have an account? <Link to="/login" className="text-primary font-semibold">Log in</Link>
          </p>
        </form>

        <div className="mt-8 rounded-lg bg-muted/50 border border-border p-4 text-sm text-muted-foreground flex gap-3">
          <Briefcase className="h-5 w-5 text-primary flex-shrink-0" />
          <p>Plans from <strong>$29/mo</strong> with a <strong>30-day free trial</strong>. Earn up to 20% off your plan with strong worker reviews. <Link to="/pricing" className="text-primary font-semibold">See pricing</Link></p>
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

export default SignupHirer;
