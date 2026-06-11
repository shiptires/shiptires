"use client";

import { useEffect } from "react";

function getSource(referrer: string): string {
  if (!referrer) return "Direct";

  let hostname: string;
  try {
    hostname = new URL(referrer).hostname.toLowerCase();
  } catch {
    return "Direct";
  }

  if (/google\./i.test(hostname)) return "Google";
  if (hostname.includes("bing.com")) return "Bing";
  if (hostname.includes("yahoo.com")) return "Yahoo";
  if (hostname.includes("duckduckgo.com")) return "DuckDuckGo";
  if (hostname.includes("chat.openai.com") || hostname.includes("chatgpt.com"))
    return "ChatGPT";
  if (hostname.includes("perplexity.ai")) return "Perplexity";
  if (hostname.includes("claude.ai")) return "Claude";
  if (hostname.includes("reddit.com")) return "Reddit";
  if (hostname.includes("facebook.com") || hostname.includes("fb.com"))
    return "Facebook";
  if (
    hostname.includes("twitter.com") ||
    hostname.includes("x.com") ||
    hostname.includes("t.co")
  )
    return "Twitter/X";

  return hostname;
}

export default function NewVisitorTracker() {
  useEffect(() => {
    if (document.cookie.includes("ship-tires-visitor=")) return;

    document.cookie =
      "ship-tires-visitor=1; path=/; max-age=" + 60 * 60 * 24 * 30 + "; SameSite=Lax";

    const referrer = document.referrer;
    const source = getSource(referrer);

    fetch("/api/new-visitor-alert", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        landingPage: window.location.pathname,
        referrer,
        source,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
      }),
    }).catch(() => {});
  }, []);

  return null;
}
