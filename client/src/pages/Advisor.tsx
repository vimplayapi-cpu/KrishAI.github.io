import AppLayout from "@/components/AppLayout";
import { FreshnessBadge, MotionPage, NeumorphicCard } from "@/components/Neumorphic";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { useEffect, useRef, useState } from "react";
import { Loader2, SendHorizontal, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Streamdown } from "streamdown";

const SUGGESTIONS = [
  "What should I irrigate today given the forecast?",
  "Best fertilizer schedule for wheat at flowering stage",
  "Current mandi prices for soybean in Madhya Pradesh",
  "How do I control cotton leaf curl virus organically?",
];

export default function Advisor() {
  const [convoId, setConvoId] = useState<number | null>(null);
  const [input, setInput] = useState("");
  const [includeWeather, setIncludeWeather] = useState(true);
  const [includeMarket, setIncludeMarket] = useState(true);
  const [includeFarm, setIncludeFarm] = useState(true);
  const listConvos = trpc.advisor.conversations.useQuery();
  const profile = trpc.profile.get.useQuery();
  const getMessages = trpc.advisor.messages.useQuery(
    { conversationId: convoId ?? 0 },
    { enabled: convoId !== null },
  );
  const ask = trpc.advisor.ask.useMutation();
  const utils = trpc.useUtils();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!listConvos.data?.length && listConvos.isFetched && convoId === null) {
      ask.mutate({ question: "Hi" }, {
        onSuccess: (res) => setConvoId(res.conversationId),
        onError: () => {},
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listConvos.isFetched]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [getMessages.data, ask.data?.conversationId]);

  const messages = getMessages.data ?? [];
  const pending = ask.isPending;

  const send = (text: string) => {
    if (!text.trim() || pending) return;
    ask.mutate(
      {
        question: text.trim(),
        conversationId: convoId ?? undefined,
        contextOpts: { includeWeather, includeMarket, includeFarm },
      },
      {
        onSuccess: (res) => {
          setConvoId(res.conversationId);
          setInput("");
          utils.advisor.messages.invalidate({ conversationId: res.conversationId });
          utils.advisor.conversations.invalidate();
        },
        onError: (e) => toast.error(e.message),
      },
    );
  };

  return (
    <AppLayout>
      <MotionPage>
        <div className="mb-6">
          <h1 className="font-display text-2xl font-bold text-vivid-teal">AI Agriculture Advisor</h1>
          <p className="font-ui text-xs text-muted-foreground">Ask anything about your crops, market, weather, or soil. Every claim cites its source: LIVE, CACHED, or INFERRED.</p>
        </div>

        <div className="grid gap-5 lg:grid-cols-[260px_1fr]">
          {/* conversation list */}
          <NeumorphicCard className="p-4" delay={0.05}>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-display text-[11px] font-semibold tracking-widest text-primary">CONVERSATIONS</h3>
            </div>
            <div className="space-y-1.5">
              {(listConvos.data ?? []).map((c) => (
                <button
                  key={c.id}
                  className={`w-full rounded-xl px-3 py-2 text-left transition-colors ${c.id === convoId ? "shadow-soft-sm" : "hover:bg-foreground/5"}`}
                  onClick={() => setConvoId(c.id)}
                >
                  <span className="font-ui line-clamp-1 block text-xs text-ink">{c.title || "New conversation"}</span>
                  <span className="font-display block text-[10px] text-muted-foreground">{new Date(c.createdAt).toLocaleDateString()}</span>
                </button>
              ))}
            </div>
            <Button
              size="sm"
              className="neu-button mt-4 w-full font-ui text-xs"
              onClick={() => ask.mutate({ question: " " }, { onSuccess: (res) => setConvoId(res.conversationId), onError: () => toast.error("Could not start conversation") })}
              disabled={pending}
            >
              <Sparkles className="h-3.5 w-3.5" /> New Conversation
            </Button>
          </NeumorphicCard>

          {/* chat area */}
          <NeumorphicCard className="flex flex-col p-0" delay={0.1}>
            <div ref={scrollRef} className="max-h-[56vh] space-y-4 overflow-y-auto p-6">
              {!messages.length ? (
                <div className="flex h-40 flex-col items-center justify-center gap-4 text-center">
                  <Sparkles className="h-8 w-8 text-accent" />
                  <p className="font-ui max-w-md text-xs text-muted-foreground">Try one of these, or type your own question:</p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {SUGGESTIONS.map((s) => (
                      <button key={s} className="neu-button rounded-full px-3 py-1.5 font-ui text-[11px] text-primary" onClick={() => send(s)}>{s}</button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map((m: any) => (
                  <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[80%] rounded-2xl p-4 ${m.role === "user" ? "shadow-soft-sm" : "neu-pressed"}`}>
                      {m.role === "assistant" ? (
                        <>
                          <Streamdown>{(m.content as string) || ""}</Streamdown>
                          {Array.isArray(m.sources) && m.sources.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-1.5">
                              {m.sources.map((label: string, i: number) => (
                                <FreshnessBadge key={i} value={label === "LIVE" || label === "CACHED" || label === "INFERRED" ? (label as never) : "INFERRED"} />
                              ))}
                            </div>
                          )}
                        </>
                      ) : (
                        <p className="font-ui text-sm">{m.content}</p>
                      )}
                      <p className="font-display mt-1.5 text-[10px] text-muted-foreground">{new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                    </div>
                  </div>
                ))
              )}
              {pending && (
                <div className="flex justify-start">
                  <div className="neu-pressed flex items-center gap-2 rounded-2xl px-4 py-3">
                    <Loader2 className="h-4 w-4 animate-spin text-accent" />
                    <span className="font-ui text-xs text-muted-foreground">Advisor is thinking…</span>
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-border/50 p-4">
              <div className="mb-2 flex flex-wrap gap-1.5">
                {[
                  { on: includeWeather, set: setIncludeWeather, label: "Weather" },
                  { on: includeMarket, set: setIncludeMarket, label: "Market" },
                  { on: includeFarm, set: setIncludeFarm, label: "Farm context" },
                ].map((t) => (
                  <button
                    key={t.label}
                    onClick={() => t.set(!t.on)}
                    className={`neu-button rounded-full px-3 py-1 font-ui text-[11px] ${t.on ? "text-primary" : "text-muted-foreground opacity-60"}`}
                  >
                    {t.label}
                  </button>
                ))}
                <Button size="sm" variant="ghost" className="ml-auto h-7 w-7 shrink-0 p-0 text-muted-foreground" onClick={() => convoId && ask.mutate({ question: `__delete:${convoId}` }, { onSuccess: () => { utils.advisor.conversations.invalidate(); toast.success("Started fresh"); setConvoId(null); } })}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
              <div className="flex gap-2">
                <Input
                  className="neu-pressed font-ui"
                  placeholder="Ask about your farm, market prices, weather…"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send(input)}
                  disabled={pending}
                />
                <Button className="neu-button btn-vivid-teal shrink-0 text-white" onClick={() => send(input)} disabled={pending || !input.trim()}>
                  {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <SendHorizontal className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </NeumorphicCard>
        </div>
      </MotionPage>
    </AppLayout>
  );
}
