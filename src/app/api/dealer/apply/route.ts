import { getSupabase } from "@/lib/supabase";
import { Resend } from "resend";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { business_name, contact_name, email, phone, street, city, state, zip, business_type, estimated_monthly_volume, tax_id, website, message } = body;

    if (!business_name || !contact_name || !email || !phone || !business_type) {
      return Response.json(
        { error: "Business name, contact name, email, phone, and business type are required" },
        { status: 400 }
      );
    }

    const { error } = await getSupabase().from("dealer_applications").insert({
      business_name,
      contact_name,
      email,
      phone: phone || null,
      street: street || null,
      city: city || null,
      state: state || null,
      zip: zip || null,
      business_type,
      estimated_monthly_volume: estimated_monthly_volume || null,
      tax_id: tax_id || null,
      website: website || null,
      message: message || null,
      status: "pending",
    });

    if (error) {
      console.error("Failed to insert dealer application:", error.message);
      return Response.json({ error: "Failed to submit application" }, { status: 500 });
    }

    // Send notification email
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: "Ship.Tires <onboarding@resend.dev>",
        to: "info@ship.tires",
        replyTo: email,
        subject: `[Dealer Application] ${business_name} — ${contact_name}`,
        html: `
          <h2>New Dealer Application</h2>
          <p><strong>Business:</strong> ${business_name}</p>
          <p><strong>Contact:</strong> ${contact_name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Phone:</strong> ${phone || "Not provided"}</p>
          <p><strong>Address:</strong> ${[street, city, state, zip].filter(Boolean).join(", ") || "Not provided"}</p>
          <p><strong>Business Type:</strong> ${business_type}</p>
          <p><strong>Est. Monthly Volume:</strong> ${estimated_monthly_volume || "Not provided"}</p>
          <p><strong>Tax ID:</strong> ${tax_id || "Not provided"}</p>
          <p><strong>Website:</strong> ${website || "Not provided"}</p>
          <hr />
          <p><strong>Message:</strong></p>
          <p>${message ? message.replace(/\n/g, "<br />") : "None"}</p>
        `,
      });
    } catch {
      console.error("Failed to send dealer application notification email");
    }

    return Response.json({ success: true });
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
}
