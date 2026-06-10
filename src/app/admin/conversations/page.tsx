import { getSupabase } from "@/lib/supabase";
import Link from "next/link";

export const dynamic = "force-dynamic";

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

interface SmsMessage {
  phone: string;
  body: string;
  direction: string;
  created_at: string;
}

export default async function ConversationsPage() {
  const { data } = await getSupabase()
    .from("sms_messages")
    .select("phone, body, direction, created_at")
    .order("created_at", { ascending: false });

  const allMessages = (data || []) as SmsMessage[];

  // Group by phone, keep most recent message per phone
  const conversations = new Map<string, SmsMessage>();
  const messageCounts = new Map<string, number>();

  for (const msg of allMessages) {
    if (!conversations.has(msg.phone)) {
      conversations.set(msg.phone, msg);
    }
    messageCounts.set(msg.phone, (messageCounts.get(msg.phone) || 0) + 1);
  }

  const conversationList = Array.from(conversations.values());

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">SMS Conversations</h1>

      <div className="bg-white rounded-lg border border-gray-200">
        {conversationList.length === 0 ? (
          <p className="px-5 py-12 text-center text-gray-400 text-sm">No conversations yet</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {conversationList.map((msg) => (
              <Link
                key={msg.phone}
                href={`/admin/conversations/${encodeURIComponent(msg.phone)}`}
                className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-gray-900">{msg.phone}</span>
                    <span className="text-xs text-gray-400">
                      {messageCounts.get(msg.phone)} messages
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 truncate mt-0.5">
                    {msg.direction === "outbound" ? "You: " : ""}
                    {msg.body}
                  </p>
                </div>
                <span className="text-xs text-gray-400 shrink-0 ml-4">
                  {formatDate(msg.created_at)}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
