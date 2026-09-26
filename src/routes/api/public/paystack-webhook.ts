import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "crypto";

export const Route = createFileRoute("/api/public/paystack-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = await request.text();
        const signature = request.headers.get("x-paystack-signature") ?? "";
        const expected = createHmac("sha512", process.env["PAYSTACK_SECRET_KEY"]!).update(body).digest("hex");
        const a = Buffer.from(signature);
        const b = Buffer.from(expected);
        if (a.length !== b.length || !timingSafeEqual(a, b)) {
          return new Response("Invalid signature", { status: 401 });
        }
        const event = JSON.parse(body) as {
          event: string;
          data?: { reference?: string; amount?: number; currency?: string; channel?: string; status?: string };
        };
        const d = event.data;
        if (event.event === "charge.success" && d?.reference && typeof d.amount === "number" && d.currency === "NGN") {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const { error } = await supabaseAdmin.rpc("confirm_payment", {
            _reference: d.reference,
            _amount: d.amount,
            _channel: d.channel ?? "unknown",
            _from_webhook: true,
          });
          if (error) return new Response("Error", { status: 500 });
        }
        return new Response("ok");
      },
    },
  },
});
