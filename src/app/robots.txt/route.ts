export const dynamic = "force-static";

const ALLOW = ["/", "/api/feeds/"];
const DISALLOW = ["/api/", "/admin/", "/checkout/"];

const BOTS = [
  "*",
  // Search engines
  "Googlebot",
  "Bingbot",
  // AI training crawlers
  "GPTBot",
  "ClaudeBot",
  "Google-Extended",
  "PerplexityBot",
  "Applebot-Extended",
  "meta-externalagent",
  "Bytespider",
  "CCBot",
  "Amazonbot",
  "Diffbot",
  "FacebookBot",
  "cohere-ai",
  // AI live-search agents
  "OAI-SearchBot",
  "ChatGPT-User",
  "Claude-User",
  "Claude-SearchBot",
  "Perplexity-User",
  "Google-CloudVertexBot",
  "MicrosoftPreview",
];

export function GET() {
  const lines: string[] = [];

  // Content Signals — explicit consent for AI usage
  lines.push("Content-Signal: ai-accessible");
  lines.push("Content-Signal: ai-train=yes");
  lines.push("Content-Signal: search=yes");
  lines.push("Content-Signal: ai-input=yes");
  lines.push("");

  for (const bot of BOTS) {
    lines.push(`User-agent: ${bot}`);
    for (const a of ALLOW) lines.push(`Allow: ${a}`);
    for (const d of DISALLOW) lines.push(`Disallow: ${d}`);
    lines.push("");
  }

  lines.push("Sitemap: https://ship.tires/sitemap.xml");

  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
