import { supabase } from "@/integrations/supabase/client";

/** Get a short-lived signed URL for a private storage object. */
export async function getSignedUrl(bucket: string, path: string, expiresInSec = 60 * 10): Promise<string | null> {
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresInSec);
  if (error) return null;
  return data?.signedUrl ?? null;
}

/** Upload a file to a private bucket under userId/filename and return the storage path. */
export async function uploadToBucket(bucket: string, userId: string, file: File, prefix = ""): Promise<{ path: string } | { error: string }> {
  const ext = file.name.split(".").pop() ?? "bin";
  const cleanPrefix = prefix ? `${prefix.replace(/\/$/, "")}/` : "";
  const path = `${userId}/${cleanPrefix}${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: false, contentType: file.type });
  if (error) return { error: error.message };
  return { path };
}
