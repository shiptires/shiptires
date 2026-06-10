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
  id: string;
  phone: string;
  body: string;
  direction: string;
  created_at: string;
}

export default async function ConversationThreadPage({
  params,
}: {
  params: Promise<{ phone: string }>
}) {
  const { phone } = await params;
  const decodedPhone = decodeURIComponent(phone);

  const { data } = await getSupabase()
    .from("sms_messages")
    .select("*")
    .eq("phone", decodedPhone)
    .order("created_at", { ascending: true });

  const messages = (data || []) as SmsMessage[];

  // Check if customer exists
  const { data: customer } = await getSupabase()
    .from("tire_customers")
    .select("name")
    .eq("phone", decodedPhone)
    .single();

  return (
    <div>
      <Link href="/admin/conversations" className="text-blue-600 hover:text-blue-800 text-sm">
        &larr; Back to Conversations
      </Link>

      <div className="mt-4 mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{decodedPhone}</h1>
          {customer?.name && <p className="text-gray-500">{customer.name}</p>}
        </div>
        {customer && (
          <Link
            href={`/admin/customers/${encodeURIComponent(decodedPhone)}`}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            View customer profile
          </Link>
        )}
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-5">
        {messages.length === 0 ? (
          <p className="text-center text-gray-400 text-sm py-8">No messages</p>
        ) : (
          <div className="space-y-3 max-h-[calc(100vh-250px)] overflow-y-auto">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.direction === "outbound" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[70%] rounded-lg px-4 py-2.5 ${
                    msg.direction === "outbound"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-900"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.body}</p>
                  <p
                    className={`text-xs mt-1.5 ${
                      msg.direction === "outbound" ? "text-blue-200" : "text-gray-400"
                    }`}
                  >
                    {msg.direction === "outbound" ? "Sent" : "Received"} {formatDate(msg.created_at)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
