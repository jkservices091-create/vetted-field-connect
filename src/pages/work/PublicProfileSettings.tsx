import { useEffect, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { PageHeader } from "@/components/PageHeader";
import { workerNav } from "@/lib/nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { ExternalLink, Loader2, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { db } from "@/lib/db";
import { useAuth } from "@/hooks/useAuth";
import { isValidHandle } from "@/lib/badges";
import { toast } from "sonner";

const PublicProfileSettings = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [workerId, setWorkerId] = useState<string | null>(null);
  const [handle, setHandle] = useState("");
  const [savedHandle, setSavedHandle] = useState<string | null>(null);
  const [isPublic, setIsPublic] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: wp } = await supabase
        .from("worker_profiles")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!wp) {
        setLoading(false);
        return;
      }
      setWorkerId(wp.id);
      const { data } = await db
        .from("public_worker_handles")
        .select("*")
        .eq("worker_profile_id", wp.id)
        .maybeSingle();
      if (data) {
        setHandle(data.handle);
        setSavedHandle(data.handle);
        setIsPublic(data.is_public);
      }
      setLoading(false);
    })();
  }, [user]);

  const save = async () => {
    if (!workerId) return;
    const normalized = handle.trim().toLowerCase();
    if (!isValidHandle(normalized)) {
      toast.error("Handle must be 3-32 chars, lowercase letters/numbers/hyphens, no leading or trailing hyphen.");
      return;
    }
    setSaving(true);
    const { error } = await db.from("public_worker_handles").upsert(
      { worker_profile_id: workerId, handle: normalized, is_public: isPublic },
      { onConflict: "worker_profile_id" },
    );
    setSaving(false);
    if (error) {
      if ((error.message || "").includes("unique") || (error.message || "").includes("duplicate")) {
        toast.error("That handle is taken.");
      } else {
        toast.error(error.message);
      }
      return;
    }
    setSavedHandle(normalized);
    toast.success("Public profile saved.");
  };

  if (loading) {
    return (
      <AppLayout role="worker" nav={workerNav}>
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!workerId) {
    return (
      <AppLayout role="worker" nav={workerNav}>
        <PageHeader eyebrow="Public profile" title="Build your profile first" />
      </AppLayout>
    );
  }

  const previewHref = savedHandle ? `/p/${savedHandle}` : null;

  return (
    <AppLayout role="worker" nav={workerNav}>
      <PageHeader
        eyebrow="Public profile"
        title="Shareable profile page"
        description="Pick a handle and share a public page that lists your active trade badges. Hirers can find you without logging in."
      />

      <Card>
        <CardContent className="p-5 grid gap-5">
          <div className="space-y-1.5">
            <Label htmlFor="handle">Handle</Label>
            <Input
              id="handle"
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              placeholder="tony-reyes"
              maxLength={32}
            />
            <p className="text-xs text-muted-foreground">3-32 characters. Lowercase letters, numbers, and hyphens.</p>
          </div>

          <label className="flex items-center justify-between rounded-md border border-border bg-card p-4">
            <div>
              <p className="font-medium text-sm">Profile is public</p>
              <p className="text-xs text-muted-foreground">Turn off to hide your page from anyone who isn't logged in.</p>
            </div>
            <Switch checked={isPublic} onCheckedChange={setIsPublic} />
          </label>

          <div className="flex items-center gap-3 flex-wrap">
            <Button onClick={save} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="h-4 w-4 mr-1" /> Save
            </Button>
            {previewHref && (
              <a
                href={previewHref}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
              >
                Preview {window.location.origin}{previewHref} <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </CardContent>
      </Card>
    </AppLayout>
  );
};

export default PublicProfileSettings;
