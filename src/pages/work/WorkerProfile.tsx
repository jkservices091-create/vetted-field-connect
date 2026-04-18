import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { PageHeader } from "@/components/PageHeader";
import { workerNav } from "@/lib/nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { skillOptions } from "@/lib/labels";
import { z } from "zod";

const schema = z.object({
  city: z.string().trim().min(2, "City required").max(80),
  bio: z.string().trim().max(2000).optional().or(z.literal("")),
  service_radius_miles: z.number().min(1).max(200),
});

const WorkerProfile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [form, setForm] = useState({
    city: "",
    service_radius_miles: 25,
    bio: "",
    transportation: "own_vehicle" as "own_vehicle" | "public_transit" | "none",
    skills: [] as string[],
  });

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    supabase
      .from("worker_profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setProfileId(data.id);
          setForm({
            city: data.city ?? "",
            service_radius_miles: data.service_radius_miles ?? 25,
            bio: data.bio ?? "",
            transportation: (data.transportation as "own_vehicle" | "public_transit" | "none") ?? "own_vehicle",
            skills: data.skills ?? [],
          });
        }
        setLoading(false);
      });
  }, [user]);

  const toggleSkill = (s: string) => {
    setForm((f) => ({ ...f, skills: f.skills.includes(s) ? f.skills.filter((x) => x !== s) : [...f.skills, s] }));
  };

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
      .from("worker_profiles")
      .upsert({ user_id: user.id, ...form }, { onConflict: "user_id" });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Profile saved.");
    if (!profileId) {
      navigate("/work/verification");
    } else {
      navigate("/work");
    }
  };

  return (
    <AppLayout role="worker" nav={workerNav}>
      <PageHeader
        eyebrow="Your profile"
        title="Labor profile"
        description="This is what hirers see. Be real about your skills — strong hands earn better jobs."
      />
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : (
        <form onSubmit={onSubmit} className="grid gap-5 max-w-2xl">
          <div className="grid sm:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <Label htmlFor="city">City *</Label>
              <Input id="city" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="Stockton" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="radius">Service radius (mi)</Label>
              <Input id="radius" type="number" min={1} max={200} value={form.service_radius_miles} onChange={(e) => setForm({ ...form, service_radius_miles: Number(e.target.value) })} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="transportation">Transportation</Label>
            <Select value={form.transportation} onValueChange={(v) => setForm({ ...form, transportation: v as "own_vehicle" | "public_transit" | "none" })}>
              <SelectTrigger id="transportation"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="own_vehicle">Own vehicle</SelectItem>
                <SelectItem value="public_transit">Public transit</SelectItem>
                <SelectItem value="none">None</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="bio">Short bio</Label>
            <Textarea id="bio" rows={4} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="4 years on landscape crews. Strong with sod, topsoil, and irrigation. Always on time." />
          </div>

          <div className="space-y-2">
            <Label>Skills</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {skillOptions.map((s) => (
                <label key={s} className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 cursor-pointer hover:border-primary/40 transition-colors">
                  <Checkbox checked={form.skills.includes(s)} onCheckedChange={() => toggleSkill(s)} />
                  <span className="text-sm">{s}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-dashed border-primary/40 bg-primary/5 p-4 text-sm">
            <strong>Next step:</strong> After saving, you'll complete the verification intake (ID + references). You can't apply to jobs until you're verified.
          </div>

          <div>
            <Button type="submit" size="lg" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save & continue
            </Button>
          </div>
        </form>
      )}
    </AppLayout>
  );
};

export default WorkerProfile;
