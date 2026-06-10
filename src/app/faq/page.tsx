import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FAQ — Frequently Asked Questions About Tire Shipping",
  description:
    "Get answers to common questions about buying tires online, shipping, sizing, installation, warranties, and more from Ship.Tires.",
  alternates: { canonical: "https://ship.tires/faq" },
};

const faqs = [
  {
    category: "Ordering & Pricing",
    items: [
      { q: "How do I order tires?", a: "Browse our catalog, find the tires you want, and click 'Request Quote' to get pricing. You can also call or text us at (279) 238-8473 (TIRE) to order. We'll provide a quote and process your order quickly." },
      { q: "How much do tires cost?", a: "Tire prices vary by brand, model, and size. Economy brands start around $70/tire, mid-range brands $100-180/tire, and premium brands $140-300+/tire. Request a quote for exact pricing — we offer competitive rates." },
      { q: "Do you offer bulk discounts?", a: "Yes! Most customers order sets of 4 tires and we offer competitive set pricing. Contact us for fleet or bulk orders." },
      { q: "What payment methods do you accept?", a: "We accept all major credit cards, debit cards, and bank transfers. Payment is processed when your order is confirmed." },
    ],
  },
  {
    category: "Shipping & Delivery",
    items: [
      { q: "Is shipping really free?", a: "Yes! Every tire order ships completely free to anywhere in the continental United States. No minimum purchase, no hidden fees." },
      { q: "How long does shipping take?", a: "Most orders are processed within 1-2 business days and delivered within 3-7 business days. Total delivery time is typically 4-9 business days." },
      { q: "Can you ship to my tire installer?", a: "Absolutely! Just provide your installer's name and address when ordering. We'll ship directly to them so your tires are ready when you arrive for your appointment." },
      { q: "Do you ship to Alaska and Hawaii?", a: "Yes, we ship to all 50 states. Shipments to Alaska and Hawaii may require additional processing time. Contact us for details." },
    ],
  },
  {
    category: "Tire Sizing & Fitment",
    items: [
      { q: "How do I find my tire size?", a: "Check the sidewall of your current tires for a number like 225/65R17. You can also look inside the driver's door jamb, check your owner's manual, or use our Vehicle Lookup tool." },
      { q: "What do tire size numbers mean?", a: "In a size like 225/65R17: 225 is the width in mm, 65 is the aspect ratio (sidewall height as % of width), R means radial construction, and 17 is the wheel diameter in inches." },
      { q: "Can I change my tire size?", a: "In some cases, yes — but it depends on your vehicle. Different sizes can affect speedometer accuracy, handling, and clearance. Call or text us and our experts can advise on safe alternatives." },
      { q: "What's a speed rating?", a: "Speed ratings indicate the maximum speed a tire is designed to sustain. Common ratings: S (112 mph), T (118 mph), H (130 mph), V (149 mph), W (168 mph), Y (186 mph). Your replacement tires should match or exceed your original speed rating." },
    ],
  },
  {
    category: "Warranties & Returns",
    items: [
      { q: "Do tires come with a warranty?", a: "Yes, all tires include the manufacturer's warranty which varies by brand and model. Warranty details are listed on each product page." },
      { q: "What if my tires arrive damaged?", a: "Contact us immediately if tires arrive damaged. We'll arrange a replacement shipment at no cost. All tires are inspected before shipping and packaged to prevent transit damage." },
      { q: "Can I return tires?", a: "Unmounted, undamaged tires can be returned within 30 days. Contact us to initiate a return. Shipping for returns is the customer's responsibility." },
    ],
  },
  {
    category: "Installation",
    items: [
      { q: "Do you install tires?", a: "We don't directly install tires, but we can ship them to any local tire shop of your choice. Most tire shops charge $15-30 per tire for mounting and balancing." },
      { q: "Where can I get tires installed?", a: "Any local tire shop, auto dealership, or national chain (Discount Tire, Tire Rack, Walmart, Costco) can install tires. Many shops will install tires shipped directly to them." },
    ],
  },
];

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.flatMap((cat) =>
    cat.items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    }))
  ),
};

export default function FAQPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <div className="bg-gray-50">
        <div className="relative bg-navy py-14 text-white overflow-hidden">
          <div className="absolute inset-0 racing-stripe" />
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <p className="text-xs font-bold uppercase tracking-widest text-orange">Support</p>
            <h1 className="mt-2 text-3xl font-black sm:text-4xl tracking-tight">Frequently Asked Questions</h1>
            <p className="mt-3 text-lg text-gray-400">
              Everything you need to know about buying and shipping tires.
            </p>
          </div>
        </div>

        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8 space-y-10">
          {faqs.map((category) => (
            <div key={category.category}>
              <h2 className="text-xl font-black text-gray-900">{category.category}</h2>
              <div className="mt-4 space-y-3">
                {category.items.map((item) => (
                  <details key={item.q} className="group rounded-xl bg-white border border-gray-200 shadow-sm">
                    <summary className="flex cursor-pointer items-center justify-between px-6 py-4 text-sm font-medium text-gray-900">
                      {item.q}
                      <svg className="h-5 w-5 text-gray-400 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                      </svg>
                    </summary>
                    <div className="px-6 pb-4 text-sm text-gray-600 leading-relaxed">{item.a}</div>
                  </details>
                ))}
              </div>
            </div>
          ))}

          <div className="rounded-xl bg-navy p-8 text-center text-white relative overflow-hidden">
            <div className="absolute inset-0 racing-stripe" />
            <div className="relative">
              <h2 className="text-xl font-black">Still Have Questions?</h2>
              <p className="mt-2 text-gray-400">Our tire experts are here to help.</p>
              <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                <a href="tel:+12792388473" className="rounded-lg bg-orange px-6 py-3 text-sm font-bold text-white hover:bg-orange-light transition-colors">
                  Call/Text (279) 238-8473 (TIRE)
                </a>
                <a href="/contact" className="rounded-lg border border-gray-600 px-6 py-3 text-sm font-bold text-white hover:bg-navy-light transition-colors">
                  Contact Us
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
