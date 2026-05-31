import ContactForm from "@/components/ContactForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us — Get a Free Tire Quote",
  description:
    "Contact Ship.Tires for a free quote, tire sizing help, or shipping questions. Call (916) 476-7689 or use our contact form.",
};

export default function ContactPage() {
  return (
    <div className="bg-gray-50">
      <div className="relative bg-navy py-14 text-white overflow-hidden">
        <div className="absolute inset-0 racing-stripe" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-bold uppercase tracking-widest text-orange">Get in Touch</p>
          <h1 className="mt-2 text-3xl font-black sm:text-4xl tracking-tight">Contact Us</h1>
          <p className="mt-3 text-lg text-gray-400">
            Get a free quote, ask about tire sizing, or just say hello.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
          {/* Contact Info */}
          <div className="space-y-6">
            <div className="rounded-xl bg-white border border-gray-200 p-6 shadow-sm">
              <h2 className="text-lg font-black text-gray-900">Get in Touch</h2>
              <ul className="mt-4 space-y-4">
                <li>
                  <a href="tel:+19164767689" className="flex items-center gap-3 text-gray-600 hover:text-orange transition-colors">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange/10 border border-orange/20">
                      <svg className="h-5 w-5 text-orange" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Phone</p>
                      <p className="font-bold">(916) 476-7689</p>
                    </div>
                  </a>
                </li>
                <li>
                  <a href="mailto:info@ship.tires" className="flex items-center gap-3 text-gray-600 hover:text-orange transition-colors">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue/10">
                      <svg className="h-5 w-5 text-blue" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Email</p>
                      <p className="font-bold">info@ship.tires</p>
                    </div>
                  </a>
                </li>
              </ul>
            </div>

            <div className="rounded-xl bg-navy p-6 text-white border border-orange/10">
              <h3 className="font-bold text-orange text-sm uppercase tracking-wider">Quick Tip</h3>
              <p className="mt-2 text-sm text-gray-400">
                For the fastest quote, include your tire size (e.g., 225/65R17),
                the quantity you need, and your shipping ZIP code in your message.
              </p>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="rounded-xl bg-white border border-gray-200 p-8 shadow-sm">
              <h2 className="text-xl font-black text-gray-900">Send Us a Message</h2>
              <p className="mt-1 text-sm text-gray-500">
                We respond to all inquiries within 24 hours.
              </p>
              <div className="mt-6">
                <ContactForm />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
