import { supabase } from "./supabase";
import { supabaseAdmin } from "./supabaseAdmin";
import type { Template, Design } from "@/types";

// ─── Template Queries ─────────────────────────────────────────────────────────

export async function getTemplatesByProduct(productSlug: string): Promise<Template[]> {
  const { data, error } = await supabase
    .from("templates")
    .select("*")
    .eq("product_id", productSlug)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getTemplatesByProduct error:", error.message);
    return [];
  }
  return data as Template[];
}

export async function getTemplateById(id: string): Promise<Template | null> {
  const { data, error } = await supabase
    .from("templates")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("getTemplateById error:", error.message);
    return null;
  }
  return data as Template;
}

export async function getAllTemplates(): Promise<Template[]> {
  const { data, error } = await supabase
    .from("templates")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getAllTemplates error:", error.message);
    return [];
  }
  return data as Template[];
}

export async function createTemplate(
  template: Omit<Template, "id" | "created_at">,
  imageFile: File
): Promise<Template | null> {
  // Upload base image to Supabase Storage
  const fileName = `templates/${Date.now()}-${imageFile.name}`;
  const { error: uploadError } = await supabase.storage
    .from("designs")
    .upload(fileName, imageFile, { upsert: false });

  if (uploadError) {
    console.error("Template image upload error:", uploadError.message);
    throw new Error(uploadError.message);
  }

  const { data: urlData } = supabase.storage.from("designs").getPublicUrl(fileName);

  const { data, error } = await supabase
    .from("templates")
    .insert([{ ...template, base_image_url: urlData.publicUrl }])
    .select()
    .single();

  if (error) {
    console.error("createTemplate error:", error.message);
    throw new Error(error.message);
  }
  return data as Template;
}

export async function updateTemplate(
  id: string,
  updates: Partial<Pick<Template, "name" | "placements" | "colors" | "is_active">>
): Promise<Template | null> {
  const { data, error } = await supabase
    .from("templates")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("updateTemplate error:", error.message);
    return null;
  }
  return data as Template;
}

export async function deleteTemplate(id: string): Promise<boolean> {
  const { error } = await supabase.from("templates").delete().eq("id", id);
  if (error) {
    console.error("deleteTemplate error:", error.message);
    return false;
  }
  return true;
}

// ─── Design Queries ───────────────────────────────────────────────────────────

export async function saveDesign(
  design: Omit<Design, "id" | "created_at">
): Promise<Design | null> {
  const { data, error } = await supabase
    .from("designs")
    .insert([design])
    .select()
    .single();

  if (error) {
    console.error("saveDesign error:", error.message);
    return null;
  }
  return data as Design;
}

export async function getDesignById(id: string): Promise<Design | null> {
  const { data, error } = await supabase
    .from("designs")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("getDesignById error:", error.message);
    return null;
  }
  return data as Design;
}

export async function getUserDesigns(userId: string): Promise<Design[]> {
  const { data, error } = await supabase
    .from("designs")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getUserDesigns error:", error.message);
    return [];
  }
  return data as Design[];
}

export async function updateDesignStatus(
  id: string,
  status: Design["status"]
): Promise<boolean> {
  const { error } = await supabase
    .from("designs")
    .update({ status })
    .eq("id", id);

  if (error) {
    console.error("updateDesignStatus error:", error.message);
    return false;
  }
  return true;
}

// ─── Design Image Upload ──────────────────────────────────────────────────────

export async function uploadDesignImage(
  blob: Blob,
  userId: string
): Promise<string | null> {
  const fileName = `user-designs/${userId}/${Date.now()}.png`;

  const { error } = await supabase.storage
    .from("designs")
    .upload(fileName, blob, { contentType: "image/png", upsert: false });

  if (error) {
    console.error("uploadDesignImage error:", error.message);
    return null;
  }

  const { data: urlData } = supabase.storage.from("designs").getPublicUrl(fileName);
  return urlData.publicUrl;
}
