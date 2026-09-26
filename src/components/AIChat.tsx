import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, MessageCircle, RotateCcw } from "lucide-react";
import { Conversation, ConversationContent, ConversationScrollButton } from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import { PromptInput, PromptInputFooter, PromptInputSubmit, PromptInputTextarea } from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { Tool, ToolContent, ToolHeader, ToolInput } from "@/components/ai-elements/tool";
import { Button } from "@/components/Button";
import { customRequestMessage, whatsappLink } from "@/lib/whatsapp";
import avatar from "@/assets/guide-avatar.png";

const STORE = "dbf-ai-chat";

type Recommendation = { recommended_tier: "website" | "custom_handoff"; reason: string; industry: string; goals: string[]; pages_needed: string[]; notes: string };

function loadStored(): { id: string; messages: UIMessage[] } {
  if (typeof window === "undefined") return { id: "", messages: [] };
  try {
    const s = JSON.parse(localStorage.getItem(STORE) ?? "null");
    if (s?.id && Array.isArray(s.messages)) return s;
  } catch { /* ignore */ }
  return { id: crypto.randomUUID(), messages: [] };
}

export function AIChat({ campaignOpen, onProceed }: { campaignOpen: boolean; onProceed: () => void }) {
  const [stored, setStored] = useState(loadStored);
  return <ChatWindow key={stored.id} sessionId={stored.id} initial={stored.messages} campaignOpen={campaignOpen} onProceed={onProceed} onReset={() => { localStorage.removeItem(STORE); setStored({ id: crypto.randomUUID(), messages: [] }); }} />;
}

function ChatWindow({ sessionId, initial, campaignOpen, onProceed, onReset }: { sessionId: string; initial: UIMessage[]; campaignOpen: boolean; onProceed: () => void; onReset: () => void }) {
  const [error, setError] = useState("");
  const transport = useMemo(() => new DefaultChatTransport({ api: "/api/public/ai-chat", body: { sessionId } }), [sessionId]);
  const { messages, sendMessage, status, stop } = useChat({ id: sessionId, messages: initial, transport, onError: (e) => setError(e.message || "Something went wrong. Please try again.") });

  useEffect(() => {
    if (status === "ready" && messages.length) localStorage.setItem(STORE, JSON.stringify({ id: sessionId, messages }));
  }, [messages, status, sessionId]);

  const busy = status === "submitted" || status === "streaming";
  const price = campaignOpen ? "₦49,999" : "₦149,999";

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center gap-3 border-b border-border pb-4">
        <img src={avatar} alt="" width={40} height={40} loading="lazy" className="size-10" />
        <div className="flex-1"><p className="font-extrabold">Website guide</p><p className="text-xs text-muted-foreground">Answers a few questions, then recommends the right fit</p></div>
        {messages.length > 0 && <button type="button" onClick={onReset} className="inline-flex items-center gap-1 text-xs font-bold text-muted-foreground hover:text-foreground"><RotateCcw size={14} /> Start over</button>}
      </div>
      <Conversation className="min-h-0 flex-1">
        <ConversationContent>
          {messages.length === 0 && (
            <div className="py-6 text-sm leading-6 text-muted-foreground">
              <p>Hi! Tell me a little about your business — what you sell or do, and what you'd like a website to help with.</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {["I run a small fashion store", "I need bookings for my salon", "I want an online shop with payments"].map((s) => (
                  <button key={s} type="button" onClick={() => sendMessage({ text: s })} className="rounded-full border border-border px-3 py-1.5 text-xs font-bold text-foreground hover:border-primary">{s}</button>
                ))}
              </div>
            </div>
          )}
          {messages.map((m) => (
            <Message key={m.id} from={m.role}>
              <MessageContent className={m.role === "user" ? "bg-primary text-primary-foreground" : ""}>
                {m.parts.map((p, i) => {
                  if (p.type === "text") return <MessageResponse key={i}>{p.text}</MessageResponse>;
                  if (p.type === "tool-give_recommendation") {
                    const rec = (p.state === "output-available" ? p.output : undefined) as Recommendation | undefined;
                    return (
                      <div key={i} className="grid gap-3">
                        <Tool defaultOpen={false}><ToolHeader type={p.type} state={p.state} title="Recommendation" /><ToolContent><ToolInput input={p.input} /></ToolContent></Tool>
                        {rec && <RecommendationCard rec={rec} price={price} onProceed={onProceed} />}
                      </div>
                    );
                  }
                  return null;
                })}
              </MessageContent>
            </Message>
          ))}
          {status === "submitted" && <Shimmer>Thinking…</Shimmer>}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>
      {error && <p className="mb-2 text-sm text-destructive">{error}</p>}
      <PromptInput onSubmit={({ text }) => { if (!text.trim() || busy) return; setError(""); sendMessage({ text }); }}>
        <PromptInputTextarea autoFocus placeholder="Type your answer…" maxLength={1000} />
        <PromptInputFooter className="justify-end">
          <PromptInputSubmit status={status} onStop={stop} />
        </PromptInputFooter>
      </PromptInput>
    </div>
  );
}

function RecommendationCard({ rec, price, onProceed }: { rec: Recommendation; price: string; onProceed: () => void }) {
  if (rec.recommended_tier === "custom_handoff") {
    const summary = [rec.industry && `Industry: ${rec.industry}`, rec.goals.length && `Goals: ${rec.goals.join(", ")}`, rec.pages_needed.length && `Pages: ${rec.pages_needed.join(", ")}`, rec.notes].filter(Boolean).join("\n");
    return (
      <div className="rounded-md border border-accent/40 bg-card p-4">
        <p className="text-xs font-bold uppercase text-accent">Custom request</p>
        <p className="mt-2 text-sm text-foreground">{rec.reason}</p>
        <Button asChild className="mt-4 w-full"><a href={whatsappLink(customRequestMessage(undefined, summary))} target="_blank" rel="noreferrer"><MessageCircle size={16} /> Continue on WhatsApp</a></Button>
      </div>
    );
  }
  return (
    <div className="rounded-md border border-primary/40 bg-card p-4">
      <p className="text-xs font-bold uppercase text-primary">Recommended: Professional website</p>
      <p className="mt-1 text-3xl font-extrabold text-primary">{price}</p>
      <p className="mt-2 text-sm text-foreground">{rec.reason}</p>
      <Button className="mt-4 w-full" onClick={onProceed}>Proceed to payment <ArrowRight size={16} /></Button>
    </div>
  );
}
