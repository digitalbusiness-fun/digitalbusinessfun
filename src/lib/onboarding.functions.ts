import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { stepSchemas } from "./onboarding-schema";
import type { Json, TablesUpdate } from "@/integrations/supabase/types";

const tokenSchema = z.string().regex(/^[a-f0-9]{48}$/);
const COLUMNS = ["business_identity", "contact_channels", "goals_audience", "content_assets", "structure_preferences"] as const;

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

async function loadByToken(token: string) {
  const db = await admin();
  const { data, error } = await db
    .from("onboarding_intake")
    .select("*, applications!inner(business_name, pricing_tier, email, phone)")
    .eq("access_token", token)
    .maybeSingle();
  if (error) throw new Error("Could not load your onboarding");
  return data;
}

export const getOnboarding = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => z.object({ token: tokenSchema }).parse(d))
  .handler(async ({ data }) => {
    const row = await loadByToken(data.token);
    if (!row) return null;
    const app = row.applications as unknown as { business_name: string; pricing_tier: string; email: string; phone: string };
    return {
      businessName: app.business_name,
      isCampaign: app.pricing_tier === "campaign",
      email: app.email,
      phone: app.phone,
      steps: [row.business_identity, row.contact_channels, row.goals_audience, row.content_assets, row.structure_preferences, { caseStudy: row.consent_case_study, publicMedia: row.consent_public_media }] as Json[],
      stepsCompleted: row.steps_completed,
      status: row.completion_status,
    };
  });

export const saveOnboardingStep = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({ token: tokenSchema, step: z.number().int().min(0).max(5), values: z.unknown(), draft: z.boolean() }).parse(d),
  )
  .handler(async ({ data }) => {
    const row = await loadByToken(data.token);
    if (!row) throw new Error("Onboarding link not found");
    const isCampaign = (row.applications as unknown as { pricing_tier: string }).pricing_tier === "campaign";
    const total = isCampaign ? 6 : 5;
    if (data.step >= total) throw new Error("Invalid step");

    let values: Record<string, unknown>;
    if (data.draft) {
      // Drafts are saved as-is (auto-save) but still size-limited.
      if (typeof data.values !== "object" || data.values === null || JSON.stringify(data.values).length > 20000) throw new Error("Invalid draft");
      values = data.values as Record<string, unknown>;
    } else {
      const parsed = stepSchemas[data.step]!.safeParse(data.values);
      if (!parsed.success) throw new Error("Please check the highlighted fields");
      values = parsed.data as Record<string, unknown>;
    }

    const completed = new Set(row.steps_completed);
    if (!data.draft) completed.add(data.step);
    const stepsCompleted = [...completed].filter((s) => s < total).sort();
    const status = stepsCompleted.length >= total ? "COMPLETE" : "IN_PROGRESS";

    const update: TablesUpdate<"onboarding_intake"> = { steps_completed: stepsCompleted, completion_status: status, updated_at: new Date().toISOString() };
    if (data.step < 5) update[COLUMNS[data.step]!] = values as Json;
    else {
      update["consent_case_study"] = !!values["caseStudy"];
      update["consent_public_media"] = !!values["publicMedia"];
    }
    const db = await admin();
    const { error } = await db.from("onboarding_intake").update(update).eq("id", row.id);
    if (error) throw new Error("Could not save. Please try again.");
    if (status === "COMPLETE" && row.completion_status !== "COMPLETE") {
      await db.from("applications").update({ status: "ONBOARDING" }).eq("id", row.lead_id);
    }
    return { stepsCompleted, status };
  });

export const createUploadUrl = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({
      token: tokenSchema,
      kind: z.enum(["logo", "photo"]),
      filename: z.string().max(200),
      contentType: z.string().regex(/^image\/(png|jpe?g|webp|svg\+xml|gif)$/),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    const row = await loadByToken(data.token);
    if (!row) throw new Error("Onboarding link not found");
    const ext = data.filename.split(".").pop()?.replace(/[^a-z0-9]/gi, "").slice(0, 5) || "img";
    const path = `${row.lead_id}/${data.kind}-${crypto.randomUUID()}.${ext}`;
    const db = await admin();
    const { data: signed, error } = await db.storage.from("onboarding-assets").createSignedUploadUrl(path);
    if (error || !signed) throw new Error("Could not prepare upload");
    return { path, uploadToken: signed.token };
  });

/** Returns (creating if needed) the onboarding link token for a paid application. Server-only helper. */
export async function onboardingTokenForReference(reference: string) {
  const db = await admin();
  const { data: app } = await db.from("applications").select("id, business_name, category, payment_status").eq("paystack_reference", reference).maybeSingle();
  if (!app || app.payment_status !== "PAID") return null;
  await db.from("onboarding_intake").upsert(
    { lead_id: app.id, business_identity: { name: app.business_name, category: app.category } },
    { onConflict: "lead_id", ignoreDuplicates: true },
  );
  const { data: intake } = await db.from("onboarding_intake").select("access_token").eq("lead_id", app.id).maybeSingle();
  return intake?.access_token ?? null;
}
