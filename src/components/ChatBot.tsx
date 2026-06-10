"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { chatbotConfig } from "@/lib/chatbot-config";
import { useCart } from "@/contexts/CartContext";
import { brands } from "@/data/brands";

interface Message {
  role: "user" | "assistant";
  content: string;
}

// Extract [CREATE_CHECKOUT:{...}] commands handling nested braces
function extractCheckoutCommands(content: string): { json: string; fullMatch: string }[] {
  const results: { json: string; fullMatch: string }[] = [];
  const marker = "[CREATE_CHECKOUT:";
  let searchFrom = 0;

  while (searchFrom < content.length) {
    const idx = content.indexOf(marker, searchFrom);
    if (idx === -1) break;

    const jsonStart = idx + marker.length;
    if (content[jsonStart] !== "{") { searchFrom = jsonStart; continue; }

    let depth = 0;
    let jsonEnd = -1;
    for (let i = jsonStart; i < content.length; i++) {
      if (content[i] === "{") depth++;
      else if (content[i] === "}") { depth--; if (depth === 0) { jsonEnd = i; break; } }
    }

    if (jsonEnd === -1 || content[jsonEnd + 1] !== "]") { searchFrom = jsonStart; continue; }

    results.push({
      json: content.substring(jsonStart, jsonEnd + 1),
      fullMatch: content.substring(idx, jsonEnd + 2),
    });
    searchFrom = jsonEnd + 2;
  }
  return results;
}

function replaceCheckoutCommands(content: string, replacement: string): string {
  const commands = extractCheckoutCommands(content);
  let result = content;
  for (const cmd of commands) {
    result = result.replace(cmd.fullMatch, replacement);
  }
  return result;
}

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: chatbotConfig.welcomeMessage },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [autoOpened, setAutoOpened] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { addItem } = useCart();

  // Auto-open after 3s on first visit (sessionStorage)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const key = "ship-tires-chatbot-opened";
    if (!sessionStorage.getItem(key)) {
      const timer = setTimeout(() => {
        setIsOpen(true);
        setAutoOpened(true);
        sessionStorage.setItem(key, "1");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Handle CREATE_CHECKOUT commands — add items directly to cart
  const handleCheckoutCommand = useCallback((jsonStr: string) => {
    try {
      const data = JSON.parse(jsonStr);
      const rawItems: { brandSlug: string; modelSlug: string; size: string; quantity?: number }[] = data.items;
      if (!rawItems?.length) throw new Error("No items");

      let subtotal = 0;
      const addedNames: string[] = [];

      for (const item of rawItems) {
        const brand = brands.find((b) => b.slug === item.brandSlug);
        if (!brand) throw new Error(`Brand not found: ${item.brandSlug}`);
        const model = brand.models.find((m) => m.slug === item.modelSlug);
        if (!model) throw new Error(`Model not found: ${item.modelSlug}`);
        const size = model.sizes.find((s) => s.size === item.size);
        if (!size) throw new Error(`Size not found: ${item.size}`);

        const qty = item.quantity || 4;
        addItem({
          brand: brand.name,
          brandSlug: brand.slug,
          model: model.name,
          modelSlug: model.slug,
          size: size.size,
          price: size.price,
          quantity: qty,
          loadIndex: size.loadIndex,
          speedRating: size.speedRating,
        });
        subtotal += size.price * qty;
        addedNames.push(`${qty}x ${brand.name} ${model.name} ${size.size}`);
      }

      const cartMsg = `Added to your cart!\n${addedNames.join("\n")}\nSubtotal: $${subtotal.toFixed(2)} — Free shipping included.\n\n[CART_LINK]`;
      setMessages((prev) => {
        const updated = [...prev];
        const lastIdx = updated.length - 1;
        if (updated[lastIdx]?.role === "assistant") {
          updated[lastIdx] = {
            ...updated[lastIdx],
            content: updated[lastIdx].content.replace("[Creating checkout link...]", cartMsg),
          };
        }
        return updated;
      });
    } catch {
      const errorMsg = "I couldn't add those tires to your cart. Please call or text (279) 238-8473 (TIRE) to complete your order!";
      setMessages((prev) => {
        const updated = [...prev];
        const lastIdx = updated.length - 1;
        if (updated[lastIdx]?.role === "assistant") {
          updated[lastIdx] = {
            ...updated[lastIdx],
            content: updated[lastIdx].content.replace("[Creating checkout link...]", errorMsg),
          };
        }
        return updated;
      });
    }
  }, [addItem]);

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const userMessage: Message = { role: "user", content: trimmed };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);

    try {
      const history = updatedMessages.slice(-20);
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
      });

      if (!res.ok || !res.body) throw new Error("Failed to get response");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let assistantContent = "";

      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") break;
            try {
              const parsed = JSON.parse(data);
              if (parsed.text) {
                assistantContent += parsed.text;
                const content = assistantContent;
                setMessages((prev) => {
                  const updated = [...prev];
                  updated[updated.length - 1] = {
                    role: "assistant",
                    content,
                  };
                  return updated;
                });
              }
            } catch {
              // skip malformed chunks
            }
          }
        }
      }

      // After streaming is done, check for checkout commands
      const commands = extractCheckoutCommands(assistantContent);
      if (commands.length > 0) {
        const processed = replaceCheckoutCommands(assistantContent, "[Creating checkout link...]");
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: "assistant",
            content: processed,
          };
          return updated;
        });
        for (const cmd of commands) {
          handleCheckoutCommand(cmd.json);
        }
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: chatbotConfig.fallbackMessage },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Render message content with clickable links
  const renderContent = (content: string) => {
    // Split on URLs and [CART_LINK] placeholders
    const tokenRegex = /(https?:\/\/[^\s]+|\[CART_LINK\])/g;
    const parts = content.split(tokenRegex);
    return parts.map((part, i) => {
      if (part === "[CART_LINK]") {
        return (
          <a
            key={i}
            href="/cart"
            style={{
              display: "inline-block",
              marginTop: "8px",
              padding: "8px 16px",
              backgroundColor: "#DC2626",
              color: "#ffffff",
              borderRadius: "8px",
              textDecoration: "none",
              fontWeight: 600,
              fontSize: "14px",
            }}
          >
            View Cart & Checkout
          </a>
        );
      }
      if (/^https?:\/\//.test(part)) {
        return (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "#2563EB", textDecoration: "underline", wordBreak: "break-all" }}
          >
            {part.includes("/checkout/") ? "Complete Checkout" : part}
          </a>
        );
      }
      return part;
    });
  };

  const { colors } = chatbotConfig;

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          aria-label="Open chat"
          style={{
            position: "fixed",
            bottom: "24px",
            right: "24px",
            width: "60px",
            height: "60px",
            borderRadius: "50%",
            backgroundColor: colors.accent,
            color: "#ffffff",
            border: "none",
            cursor: "pointer",
            boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            transition: "transform 0.2s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.1)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </button>
      )}

      {isOpen && (
        <div
          style={{
            position: "fixed",
            bottom: "24px",
            right: "24px",
            width: "380px",
            maxWidth: "calc(100vw - 32px)",
            height: "520px",
            maxHeight: "calc(100vh - 48px)",
            backgroundColor: "#ffffff",
            borderRadius: "16px",
            border: "2px solid #DC2626",
            boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            zIndex: 9999,
          }}
        >
          {/* Header */}
          <div
            style={{
              backgroundColor: colors.primary,
              color: "#ffffff",
              padding: "12px 16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexShrink: 0,
              borderBottom: "2px solid #DC2626",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <img
                src="/logo.png"
                alt="Ship.Tires"
                style={{ height: "64px", width: "auto" }}
              />
              <div>
                <div style={{ fontWeight: 700, fontSize: "16px" }}>
                  {chatbotConfig.businessName}
                </div>
                <div style={{ fontSize: "12px", opacity: 0.85 }}>
                  Tire Expert AI
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              aria-label="Close chat"
              style={{
                background: "none",
                border: "none",
                color: "#ffffff",
                cursor: "pointer",
                padding: "4px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div
            className="chat-scrollbar"
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "16px",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            {messages.map((msg, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                }}
              >
                <div
                  style={{
                    maxWidth: "80%",
                    padding: "10px 14px",
                    borderRadius: msg.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                    backgroundColor: msg.role === "user" ? colors.userBubble : colors.botBubble,
                    color: msg.role === "user" ? colors.userText : colors.botText,
                    fontSize: "14px",
                    lineHeight: "1.5",
                    wordBreak: "break-word",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {msg.role === "assistant" ? renderContent(msg.content) : msg.content}
                </div>
              </div>
            ))}
            {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
              <div style={{ display: "flex", justifyContent: "flex-start" }}>
                <div
                  style={{
                    padding: "10px 14px",
                    borderRadius: "16px 16px 16px 4px",
                    backgroundColor: colors.botBubble,
                    color: colors.botText,
                    fontSize: "14px",
                  }}
                >
                  <span className="animate-pulse">Thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div
            style={{
              padding: "12px 16px",
              borderTop: "2px solid #DC2626",
              display: "flex",
              gap: "8px",
              flexShrink: 0,
            }}
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about tires..."
              disabled={isLoading}
              style={{
                flex: 1,
                padding: "10px 14px",
                borderRadius: "24px",
                border: "1px solid #d1d5db",
                outline: "none",
                fontSize: "14px",
                color: "#000000",
                backgroundColor: isLoading ? "#f9fafb" : "#ffffff",
              }}
            />
            <button
              onClick={sendMessage}
              disabled={isLoading || !input.trim()}
              aria-label="Send message"
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                backgroundColor: isLoading || !input.trim() ? "#d1d5db" : colors.accent,
                color: "#ffffff",
                border: "none",
                cursor: isLoading || !input.trim() ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
