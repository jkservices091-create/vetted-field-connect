import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { PageHeader } from "@/components/PageHeader";
import { hirerNav } from "@/lib/nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { companyTypes } from "@/lib/labels";
import { z } from "zod";

const schema = z.object({
  company_name: z.string().trim().min(2, "Company name required").max(120),
  contact_name: z.string().trim().max(80).optional().or(z.literal("")),
  company_type: z.string().trim().max(60).optional().or(z.literal("")),
  service_area: z.string().trim().max(120).optional().or(z.literal("")),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  email: z.string().trim().email().max(255).optional().or(z.literal("")),
  about: z.string().trim().max(2000).optional().or(z.literal("")),
});

const HirerProfile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    company_name: "",
    contact_name: "",
    company_type: "",
    service_area: "",
    phone: "",
    email: "",
    about: "",
  });

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    supabase
      .from("hiring_party_profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setForm({
            company_name: data.company_name ?? "",
            contact_name: data.contact_name ?? "",
            company_type: data.company_type ?? "",
            service_area: data.service_area ?? "",
            phone: data.phone ?? "",
            email: data.email ?? user.email ?? "",
            about: data.about ?? "",
          });
        } else {
          setForm((f) => ({ ...f, email: user.email ?? "" }));
        }
        setLoading(false);
      });
  }, [user]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("hiring_party_profiles")
      .upsert({ user_id: user.id, ...form }, { onConflict: "user_id" });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Company profile saved.");
    navigate("/hire");
  };

  return (
    <AppLayout role="hiring_party" nav={hirerNav}>
      <PageHeader
        eyebrow="Setup"
        title="Company profile"
        description="Workers will see this when reviewing your jobs. Keep it real."
      />

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : (
        <form onSubmit={onSubmit} className="grid gap-5 max-w-2xl">
          <Field id="company_name" label="Company name *" value={form.company_name} onChange={(v) => setForm({ ...form, company_name: v })} placeholder="Reyes Landscape Co." />
          <div className="grid sm:grid-cols-2 gap-5">
            <Field id="contact_name" label="Contact name" value={form.contact_name} onChange={(v) => setForm({ ...form, contact_name: v })} placeholder="Sarah Chen" />
            <div className="space-y-1.5">
              <Label htmlFor="company_type">Company type</Label>
              <Select value={form.company_type} onValueChange={(v) => setForm({ ...form, company_type: v })}>
                <SelectTrigger id="company_type"><SelectValue placeholder="Choose…" /></SelectTrigger>
                <SelectContent>{companyTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-5">
            <Field id="phone" label="Phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} placeholder="(209) 555-0188" />
            <Field id="email" label="Contact email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
          </div>
          <Field id="service_area" label="Service area" value={form.service_area} onChange={(v) => setForm({ ...form, service_area: v })} placeholder="Stockton, Lodi, Manteca" />

          <div className="space-y-1.5">
            <Label htmlFor="about">About your company</Label>
            <Textarea id="about" rows={5} value={form.about} onChange={(e) => setForm({ ...form, about: e.target.value })} placeholder="What kind of work do you usually do? How long have you been operating?" />
          </div>

          <div className="rounded-lg border border-dashed border-border bg-muted/40 p-4 text-sm text-muted-foreground">
            <strong className="text-foreground">Payment:</strong> Workers are paid directly. Stripe payouts coming soon.
          </div>

          <div className="flex gap-3">
            <Button type="submit" size="lg" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save profile
            </Button>
          </div>
        </form>
      )}
    </AppLayout>
  );
};

function Field({ id, label, value, onChange, type = "text", placeholder }: { id: string; label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  );
}

export default HirerProfile;
