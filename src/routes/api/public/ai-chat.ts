import { createFileRoute } from "@tanstack/react-router";
import { createOpenAI } from "@ai-sdk/openai";
import { convertToModelMessages, stepCountIs, streamText, tool, type UIMessage } from "ai";
import { z } from "zod";
import { createRunIdFetch, incomingRunId, withRunIdHeader } from "@/lib/ai-gateway.server";

const MAX_USER_TURNS = 10;

const SYSTEM = `You are the DigitalBusiness.fun needs-tailoring assistant for Nigerian small businesses.
We offer ONE package right now: a professional business website. Price: ₦49,999 for the first 100 businesses (campaign rate), ₦149,999 after that. Do not invent other packages or prices.
Your job: in a friendly, short conversation (1-3 sentences per reply, one question at a time), learn the business's industry, goals (sales, bookings, inquiries, credibility), who their customers are, and which pages they need. Understand Nigerian English and Pidgin.
When you have enough information (usually 3-6 exchanges), call the give_recommendation tool:
- recommended_tier "website" when a standard business website (home, about, services, gallery, contact, WhatsApp button, simple product list) fits.
- recommended_tier "custom_handoff" when they need something complex: online payments/checkout for many products, booking systems, user accounts, marketplaces, apps, integrations, or anything clearly beyond a standard website.
After calling the tool, give a one or two sentence closing message. Never ask for payment details.`;

const bodySchema = z.object({
  sessionId: z.string().uuid(),
  businessName: z.string().max(120).optional(),
  messages: z.array(z.any()).min(1).max(60),
});

export const Route = createFileRoute("/api/public/ai-chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const parsed = bodySchema.safeParse(await request.json().catch(() => null));
        if (!parsed.success) return new Response("Invalid request", { status: 400 });
        const { sessionId, messages } = parsed.data as { sessionId: string; messages: UIMessage[] };
        if (JSON.stringify(messages).length > 60000) return new Response("Conversation too long", { status: 400 });

        const apiKey = process.env["LOVABLE_API_KEY"];
        if (!apiKey) return new Response("AI is not configured", { status: 500 });
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const userTurns = messages.filter((m) => m.role === "user").length;
        const system = userTurns >= MAX_USER_TURNS
          ? `${SYSTEM}\nThe conversation has reached its limit. Call give_recommendation NOW with your best judgement.`
          : SYSTEM;

        const runId = createRunIdFetch(incomingRunId(request));
        const provider = createOpenAI({
          baseURL: "https://ai.gateway.lovable.dev/v1",
          apiKey,
          headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
          fetch: runId.fetch,
        });

        const result = streamText({
          model: provider.responses("openai/gpt-6-astra"),
          system,
          messages: await convertToModelMessages(messages),
          abortSignal: request.signal,
          stopWhen: stepCountIs(50),
          providerOptions: {
            openai: { forceReasoning: true, reasoningEffort: "low", reasoningSummary: "auto", store: false, include: ["reasoning.encrypted_content"] },
          },
          tools: {
            give_recommendation: tool({
              description: "Give the final package recommendation once you understand the business's needs.",
              inputSchema: z.object({
                recommended_tier: z.enum(["website", "custom_handoff"]),
                reason: z.string().describe("One short sentence explaining why, addressed to the customer."),
                industry: z.string(),
                goals: z.array(z.string()),
                pages_needed: z.array(z.string()),
                notes: z.string().describe("Short summary of special needs, empty if none."),
              }),
              execute: async (input) => {
                const { error } = await supabaseAdmin.from("ai_chat_sessions").upsert({
                  id: sessionId,
                  extracted_summary: input,
                  recommended_tier: input.recommended_tier,
                  status: "COMPLETED",
                  updated_at: new Date().toISOString(),
                });
                if (error) console.error("ai_chat_sessions save failed", error);
                return { saved: true, ...input };
              },
            }),
          },
        });

        return withRunIdHeader(
          result.toUIMessageStreamResponse({
            originalMessages: messages,
            sendReasoning: false,
            onError: (e) => {
              console.error("ai-chat error", e);
              const status = (e as { statusCode?: number })?.statusCode;
              if (status === 429) return "We're getting a lot of messages right now. Please try again in a minute.";
              if (status === 402) return "The assistant is unavailable right now. Please chat with us on WhatsApp instead.";
              return "Sorry, something went wrong. Please try again or chat with us on WhatsApp.";
            },
            onFinish: async ({ messages: all }) => {
              const { error } = await supabaseAdmin.from("ai_chat_sessions").upsert({
                id: sessionId,
                messages: all.map((m) => ({
                  role: m.role,
                  content: m.parts.filter((p) => p.type === "text").map((p) => (p as { text: string }).text).join("\n"),
                  timestamp: new Date().toISOString(),
                })),
                updated_at: new Date().toISOString(),
              });
              if (error) console.error("ai_chat_sessions messages save failed", error);
            },
          }),
          runId.getRunId,
        );
      },
    },
  },
});
