import Anthropic from "@anthropic-ai/sdk";
import { chatbotConfig } from "@/lib/chatbot-config";
import { brands } from "@/data/brands";

const anthropic = new Anthropic();

// Build condensed catalog for system prompt injection
function buildCatalogPrompt(): string {
  const lines: string[] = ["CATALOG DATA (use these exact slugs for CREATE_CHECKOUT):"];
  for (const brand of brands) {
    for (const model of brand.models) {
      const sizes = model.sizes
        .map((s) => `${s.size}=$${s.price}`)
        .join(", ");
      lines.push(
        `${brand.name} (${brand.slug}) — ${model.name} (${model.slug}) [${model.type}] ${model.warranty}: ${sizes}`
      );
    }
  }
  return lines.join("\n");
}

const catalogPrompt = buildCatalogPrompt();
const fullSystemPrompt = `${chatbotConfig.systemPrompt}\n\n${catalogPrompt}`;

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response("Invalid messages", { status: 400 });
    }

    const stream = anthropic.messages.stream({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: fullSystemPrompt,
      messages: messages.map((m: { role: string; content: string }) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          stream.on("text", (text) => {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ text })}\n\n`)
            );
          });

          await stream.finalMessage();
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ text: chatbotConfig.fallbackMessage })}\n\n`
            )
          );
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch {
    return new Response("Internal server error", { status: 500 });
  }
}
