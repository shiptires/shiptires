import { Resend } from "resend";

export async function POST(req: Request) {
  try {
    const { name, email, phone, subject, message } = await req.json();

    if (!name || !email || !message) {
      return Response.json(
        { error: "Name, email, and message are required" },
        { status: 400 }
      );
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    await resend.emails.send({
      from: "Ship.Tires <onboarding@resend.dev>",
      to: "info@ship.tires",
      replyTo: email,
      subject: `[Ship.Tires] ${subject || "New Inquiry"} from ${name}`,
      html: `
        <h2>New inquiry from Ship.Tires website</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone || "Not provided"}</p>
        <p><strong>Subject:</strong> ${subject || "General"}</p>
        <hr />
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, "<br />")}</p>
      `,
    });

    return Response.json({ success: true });
  } catch {
    return Response.json(
      { error: "Failed to send email" },
      { status: 500 }
    );
  }
}
