import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { PageHeader } from "@/components/PageHeader";
import { hirerNav } from "@/lib/nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/supabase/client";
import { sb } from "@/lib/supabase-extras";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  jobCategories,
  skillOptions,
  tradeSlugs,
  tradeTitles,
  categoryToTradesSuggestion,
  type TradeSlug,
} from "@/lib/labels";
import { z } from "zod";

const schema = z.object({
  title: z.string().trim().min(4, "Give the job a clear title").max(120),
  category: z.string().min(1, "Pick a category"),
  description: z.string().trim().max(4000).optional().or(z.literal("")),
  city: z.string().trim().min(2, "City required").max(80),
  address: z.string().trim().max(200).optional().or(z.literal("")),
  date_needed: z.string().min(1, "Pick a date"),
  start_time: z.string().optional().or(z.literal("")),
  estimated_duration_hours: z.number().min(0.5).max(48).optional(),
  budget_type: z.enum(["hourly", "flat"]),
  budget_amount: z.number().min(1, "Set a budget"),
  workers_needed: z.number().min(1).max(50),
});

const JobNew = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [hpId, setHpId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    category: "",
    description: "",
    city: "St. Louis",
    address: "",
    date_needed: "",
    start_time: "07:00",
    estimated_duration_hours: 8,
    budget_type: "hourly" as "hourly" | "flat",
    budget_amount: 25,
    workers_needed: 1,
    required_skills: [] as string[],
    required_trades: [] as TradeSlug[],
    qualification_mode: "any" as "any" | "all",
  });

  // Pre-fill trades based on category, but only when the hirer hasn't yet
  // hand-picked a different set.
  const [tradesTouched, setTradesTouched] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("hiring_party_profiles").select("id").eq("user_id", user.id).maybeSingle().then(({ data }) => {
      setHpId(data?.id ?? null);
    });
  }, [user]);

  useEffect(() => {
    if (tradesTouched) return;
    const suggestion = categoryToTradesSuggestion[form.category] ?? [];
    setForm((f) => ({ ...f, required_trades: suggestion }));
  }, [form.category, tradesTouched]);

  const toggleSkill = (s: string) => {
    setForm((f) => ({ ...f, required_skills: f.required_skills.includes(s) ? f.required_skills.filter((x) => x !== s) : [...f.required_skills, s] }));
  };

  const toggleTrade = (slug: TradeSlug) => {
    setTradesTouched(true);
    setForm((f) => ({
      ...f,
      required_trades: f.required_trades.includes(slug)
        ? f.required_trades.filter((x) => x !== slug)
        : [...f.required_trades, slug],
    }));
  };

  const submit = async (status: "draft" | "open") => {
    if (!hpId) return toast.error("Set up your company profile first.");
    const parsed = schema.safeParse(form);
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    if (form.required_trades.length === 0) {
      return toast.error("Pick at least one required trade so we can match qualified workers.");
    }

    setSaving(true);
    const { data, error } = await sb
      .from("jobs")
      .insert({
        hiring_party_id: hpId,
        title: form.title.trim(),
        category: form.category,
        description: form.description.trim() || null,
        city: form.city.trim(),
        address: form.address.trim() || null,
        date_needed: form.date_needed,
        start_time: form.start_time || null,
        estimated_duration_hours: form.estimated_duration_hours || null,
        budget_type: form.budget_type,
        budget_amount: form.budget_amount,
        workers_needed: form.workers_needed,
        required_skills: form.required_skills,
        qualification_mode: form.qualification_mode,
        status,
      })
      .select("id")
      .single();
    if (error || !data) {
      setSaving(false);
      return toast.error(error?.message ?? "Could not create job.");
    }

    const tradeRows = form.required_trades.map((slug) => ({
      job_id: data.id,
      trade_slug: slug,
      is_required: true,
    }));
    const { error: tradesErr } = await sb.from("job_trades").insert(tradeRows);
    setSaving(false);
    if (tradesErr) {
      toast.error("Job saved, but trade tags failed: " + tradesErr.message);
    } else {
      toast.success(status === "open" ? "Job posted!" : "Draft saved.");
    }
    navigate(`/hire/jobs/${data.id}`);
  };

  const submitDisabled = useMemo(
    () => saving || form.required_trades.length === 0,
    [saving, form.required_trades.length],
  );

  if (!hpId) {
    return (
      <AppLayout role="hiring_party" nav={hirerNav}>
        <PageHeader eyebrow="Post a job" title="Set up your company first" />
        <Button onClick={() => navigate("/hire/profile")}>Go to company profile</Button>
      </AppLayout>
    );
  }

  return (
    <AppLayout role="hiring_party" nav={hirerNav}>
      <PageHeader eyebrow="Post a job" title="New labor job" description="Be specific. Clear jobs get better workers." />

      <form onSubmit={(e) => { e.preventDefault(); submit("open"); }} className="grid gap-5 max-w-2xl">
        <div className="space-y-1.5">
          <Label>Job title *</Label>
          <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="2 laborers needed for sod install — Saturday" />
        </div>

        <div className="grid sm:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <Label>Category *</Label>
            <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
              <SelectTrigger><SelectValue placeholder="Pick…" /></SelectTrigger>
              <SelectContent>{jobCategories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Workers needed</Label>
            <Input type="number" min={1} max={50} value={form.workers_needed} onChange={(e) => setForm({ ...form, workers_needed: Number(e.target.value) })} />
          </div>
        </div>

        <div className="space-y-2" data-testid="required-trades-picker">
          <div className="flex items-baseline justify-between">
            <Label>Required trades *</Label>
            <span className="text-xs text-muted-foreground">
              Workers need an active badge for at least one (or all) of these.
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {tradeSlugs.map((slug) => (
              <label
                key={slug}
                className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 cursor-pointer hover:border-primary/40"
              >
                <Checkbox
                  checked={form.required_trades.includes(slug)}
                  onCheckedChange={() => toggleTrade(slug)}
                />
                <span className="text-sm">{tradeTitles[slug]}</span>
              </label>
            ))}
          </div>
          {form.required_trades.length === 0 && (
            <p className="text-xs text-destructive">Pick at least one trade to publish this job.</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Qualification mode</Label>
          <RadioGroup
            value={form.qualification_mode}
            onValueChange={(v) => setForm({ ...form, qualification_mode: v as "any" | "all" })}
            className="grid sm:grid-cols-2 gap-2"
          >
            <label className="flex items-start gap-2 rounded-md border border-border bg-card px-3 py-2 cursor-pointer">
              <RadioGroupItem value="any" id="qm-any" className="mt-0.5" />
              <div>
                <div className="text-sm font-medium">Any selected trade</div>
                <div className="text-xs text-muted-foreground">Worker needs at least one matching active badge.</div>
              </div>
            </label>
            <label className="flex items-start gap-2 rounded-md border border-border bg-card px-3 py-2 cursor-pointer">
              <RadioGroupItem value="all" id="qm-all" className="mt-0.5" />
              <div>
                <div className="text-sm font-medium">All selected trades</div>
                <div className="text-xs text-muted-foreground">Worker must hold every selected badge.</div>
              </div>
            </label>
          </RadioGroup>
        </div>

        <div className="space-y-1.5">
          <Label>Description</Label>
          <Textarea rows={5} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What needs to get done. Tools provided? Heavy lifting? Anything else." />
        </div>

        <div className="grid sm:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <Label>City *</Label>
            <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="St. Louis" />
          </div>
          <div className="space-y-1.5">
            <Label>Address (optional)</Label>
            <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Shared after booking" />
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-5">
          <div className="space-y-1.5">
            <Label>Date *</Label>
            <Input type="date" value={form.date_needed} onChange={(e) => setForm({ ...form, date_needed: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>Start time</Label>
            <Input type="time" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>Est. hours</Label>
            <Input type="number" min={0.5} max={48} step={0.5} value={form.estimated_duration_hours} onChange={(e) => setForm({ ...form, estimated_duration_hours: Number(e.target.value) })} />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <Label>Budget type</Label>
            <Select value={form.budget_type} onValueChange={(v) => setForm({ ...form, budget_type: v as "hourly" | "flat" })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="hourly">Hourly</SelectItem>
                <SelectItem value="flat">Flat rate</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>{form.budget_type === "hourly" ? "Hourly rate ($)" : "Flat amount ($)"}</Label>
            <Input type="number" min={1} step={0.5} value={form.budget_amount} onChange={(e) => setForm({ ...form, budget_amount: Number(e.target.value) })} />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Skills required</Label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {skillOptions.map((s) => (
              <label key={s} className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 cursor-pointer hover:border-primary/40">
                <Checkbox checked={form.required_skills.includes(s)} onCheckedChange={() => toggleSkill(s)} />
                <span className="text-sm">{s}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="submit" size="lg" disabled={submitDisabled} data-testid="submit-job">
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Post job
          </Button>
          <Button type="button" variant="outline" size="lg" onClick={() => submit("draft")} disabled={submitDisabled}>
            Save as draft
          </Button>
        </div>
      </form>
    </AppLayout>
  );
};

export default JobNew;
