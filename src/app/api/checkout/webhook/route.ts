// Legacy webhook endpoint — redirects to /api/plaid/webhook
// Kept for backwards compatibility during transition.
// The Plaid webhook at /api/plaid/webhook handles all transfer events.

export { POST } from "@/app/api/plaid/webhook/route";
