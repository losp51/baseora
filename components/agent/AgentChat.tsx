"use client";

import { useChat } from "ai/react";
import { useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, User, Loader2, Zap, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const SUGGESTIONS = [
  { icon: "🔄", text: "What's the best route for ETH → USDC?" },
  { icon: "📊", text: "Analyze my portfolio" },
  { icon: "🔥", text: "What are today's trending tokens on Base?" },
  { icon: "⛽", text: "When is the best time to swap for low gas?" },
  { icon: "💡", text: "What's the difference between cbETH and stETH?" },
  { icon: "🎯", text: "How does Aerodrome compare to Uniswap?" },
  { icon: "💰", text: "How do I earn yield on Base?" },
  { icon: "🛡️", text: "What are the main DeFi risks I should know?" },
];

export function AgentChat() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } =
    useChat({ api: "/api/agent" });

  const endRef  = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fillSuggestion = (text: string) => {
    handleInputChange({ target: { value: text } } as React.ChangeEvent<HTMLInputElement>);
    inputRef.current?.focus();
  };

  return (
    <div className="flex flex-col h-full">

      {/* ── Message list ── */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">

        {/* Empty state */}
        {messages.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center h-full text-center py-8"
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-base flex items-center justify-center mb-4">
              <Sparkles className="w-8 h-8 text-white" />
            </div>

            <h2 className="text-xl font-bold text-text-primary mb-1">
              Baseora AI Agent
            </h2>
            <p className="text-text-secondary text-sm max-w-sm mb-1">
              Your DeFi assistant for the Base ecosystem.
            </p>
            <p className="text-text-muted text-xs mb-6">
              Ask in English or Turkish — always answers in English.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
              {SUGGESTIONS.map((s, i) => (
                <button
                  key={i}
                  onClick={() => fillSuggestion(s.text)}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-border
                             bg-bg-secondary hover:border-base-blue/40 hover:bg-base-blue/5
                             text-sm text-left transition-all group"
                >
                  <span className="text-base flex-shrink-0">{s.icon}</span>
                  <span className="text-text-secondary group-hover:text-text-primary transition-colors text-xs">
                    {s.text}
                  </span>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Messages */}
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "flex gap-3",
                msg.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              {msg.role === "assistant" && (
                <div className="w-8 h-8 rounded-xl bg-gradient-base flex items-center justify-center flex-shrink-0 mt-1">
                  <Zap className="w-4 h-4 text-white" />
                </div>
              )}

              <div
                className={cn(
                  "max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                  msg.role === "user"
                    ? "bg-base-blue text-white rounded-tr-sm"
                    : "bg-bg-secondary border border-border text-text-primary rounded-tl-sm"
                )}
              >
                <div className="whitespace-pre-wrap">{msg.content}</div>
              </div>

              {msg.role === "user" && (
                <div className="w-8 h-8 rounded-xl bg-bg-tertiary border border-border
                                flex items-center justify-center flex-shrink-0 mt-1">
                  <User className="w-4 h-4 text-text-secondary" />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing indicator */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex gap-3"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-base flex items-center justify-center flex-shrink-0">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <div className="bg-bg-secondary border border-border rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1.5 items-center">
                <Loader2 className="w-4 h-4 text-base-blue animate-spin" />
                <span className="text-sm text-text-muted">Thinking...</span>
              </div>
            </div>
          </motion.div>
        )}

        <div ref={endRef} />
      </div>

      {/* ── Input bar ── */}
      <div className="p-4 border-t border-border">
        <form onSubmit={handleSubmit} className="flex gap-3">
          <input
            ref={inputRef}
            value={input}
            onChange={handleInputChange}
            placeholder="Ask about swaps, tokens, gas, DeFi strategies… (EN or TR)"
            className="input-base flex-1 px-4 py-3 text-sm"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="btn-primary px-4 py-3 flex items-center justify-center"
          >
            {isLoading
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <Send className="w-4 h-4" />
            }
          </button>
        </form>
        <p className="text-xs text-text-muted text-center mt-2">
          Informational only — always DYOR before trading.
        </p>
      </div>
    </div>
  );
}
