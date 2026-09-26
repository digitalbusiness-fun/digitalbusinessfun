import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const applicationSchema = z.object({
  business: z.string().trim().min(1).max(100),
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().regex(/^[+0-9()\-\s]{7,20}$/),
  category: z.string().trim().min(1).max(60),
  challenge: z.string().trim().min(1).max(1000),
  origin: z.string().url().max(200),
});

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

export const getCampaignSlots = createServerFn({ method: "GET" }).handler(async () => {
  const db = await admin();
  const { data, error } = await db.rpc("campaign_slots_used");
  if (error) throw new Error("Could not load campaign progress");
  return { used: data ?? 0, total: 100 };
});

export const startApplication = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => applicationSchema.parse(d))
  .handler(async ({ data }) => {
    const origin = new URL(data.origin);
    if (!["http:", "https:"].includes(origin.protocol)) throw new Error("Invalid origin");
    const db = await admin();
    const reference = `dbf_${crypto.randomUUID().replace(/-/g, "")}`;
    const { data: rows, error } = await db.rpc("create_application", {
      _business: data.business,
      _contact: data.name,
      _email: data.email,
      _phone: data.phone,
      _category: data.category,
      _challenge: data.challenge,
      _reference: reference,
    });
    const row = rows?.[0];
    if (error || !row) throw new Error("Could not save your application. Please try again.");

    const res = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env["PAYSTACK_SECRET_KEY"]}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: data.email,
        amount: row.amount_due,
        currency: "NGN",
        reference,
        callback_url: `${origin.origin}/payment/callback`,
        metadata: { application_id: row.id, pricing_tier: row.pricing_tier },
      }),
    });
    const json = (await res.json()) as { status: boolean; data?: { authorization_url: string } };
    if (!res.ok || !json.status || !json.data) {
      console.error("Paystack init failed", json);
      throw new Error("Payment could not be started. Please try again.");
    }
    return { authorizationUrl: json.data.authorization_url, tier: row.pricing_tier, amount: row.amount_due };
  });

export const verifyPayment = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ reference: z.string().regex(/^dbf_[a-f0-9]{32}$/) }).parse(d))
  .handler(async ({ data }) => {
    const res = await fetch(`https://api.paystack.co/transaction/verify/${data.reference}`, {
      headers: { Authorization: `Bearer ${process.env["PAYSTACK_SECRET_KEY"]}` },
    });
    const json = (await res.json()) as {
      data?: { status: string; amount: number; currency: string; channel: string };
    };
    const tx = json.data;
    if (!res.ok || !tx) return { status: "failed" as const };
    if (tx.status !== "success" || tx.currency !== "NGN") {
      if (tx.status !== "success") {
        const db = await admin();
        await db.from("payments").update({ status: "failed" }).eq("reference", data.reference);
      }
      return { status: tx.status === "abandoned" || tx.status === "ongoing" ? ("pending" as const) : ("failed" as const) };
    }
    const db = await admin();
    const { data: result, error } = await db.rpc("confirm_payment", {
      _reference: data.reference,
      _amount: tx.amount,
      _channel: tx.channel,
      _from_webhook: false,
    });
    if (error || (result !== "paid" && result !== "already_paid")) return { status: "failed" as const };
    const { onboardingTokenForReference } = await import("./onboarding.functions");
    const onboardingToken = await onboardingTokenForReference(data.reference);
    return { status: "paid" as const, onboardingToken };
  });
