import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Returns & Refunds Policy — Easy 30-Day Returns",
  description:
    "Ship.Tires offers a 30-day return policy on unmounted tires. Learn about our return process, refund timeline, and exchange options. Free return shipping on wrong orders.",
  alternates: { canonical: "https://ship.tires/returns" },
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "How long do I have to return tires?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "You have 30 days from the date of delivery to initiate a return. Tires must be unmounted, unused, and in their original condition.",
      },
    },
    {
      "@type": "Question",
      name: "Is return shipping free?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Return shipping is $20 per tire. This fee is waived if we shipped the wrong tire or if you are placing a new order with Ship.Tires.",
      },
    },
    {
      "@type": "Question",
      name: "Can I return tires that have been mounted?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No. Only unmounted, unused tires in original condition are eligible for return. Once a tire has been mounted on a wheel or driven on, it cannot be returned. Manufacturer warranties cover defects after installation.",
      },
    },
    {
      "@type": "Question",
      name: "How long does a refund take?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Once we receive and inspect your returned tires, refunds are processed within 5-7 business days to your original payment method.",
      },
    },
  ],
};

export default function ReturnsPage() {
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
            <p className="text-xs font-bold uppercase tracking-widest text-orange">
              Policy
            </p>
            <h1 className="mt-2 text-3xl font-black sm:text-4xl tracking-tight">
              Returns & Refunds
            </h1>
            <p className="mt-3 text-lg text-gray-400">
              30-day returns on unmounted tires. Simple, fair, no surprises.
            </p>
          </div>
        </div>

        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8 space-y-8">
          {/* Overview */}
          <div className="rounded-xl bg-white border border-gray-200 p-8 shadow-sm">
            <h2 className="text-xl font-black text-gray-900">
              Our Return Promise
            </h2>
            <p className="mt-3 text-gray-600 leading-relaxed">
              We want you to be completely satisfied with your tire purchase. If
              for any reason you need to return your tires, we offer a
              straightforward 30-day return policy. No runaround, no hidden
              conditions&mdash;just a fair process to make things right.
            </p>
          </div>

          {/* Return Eligibility */}
          <div className="rounded-xl bg-white border border-gray-200 p-8 shadow-sm space-y-6">
            <div>
              <h2 className="text-xl font-black text-gray-900">
                Return Eligibility
              </h2>
              <p className="mt-2 text-sm text-gray-500">
                To qualify for a return, all of the following must be true:
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {[
                {
                  title: "Within 30 Days",
                  desc: "Return must be initiated within 30 days of the delivery date.",
                  icon: "M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5",
                },
                {
                  title: "Unmounted & Unused",
                  desc: "Tires must not have been mounted on a wheel or driven on.",
                  icon: "M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
                },
                {
                  title: "Original Condition",
                  desc: "Tires must be free of damage, marks, or alterations from their shipped condition.",
                  icon: "M21 7.5l-2.25-1.313M21 7.5v2.25m0-2.25l-2.25 1.313M3 7.5l2.25-1.313M3 7.5l2.25 1.313M3 7.5v2.25m9 3l2.25-1.313M12 12.75l-2.25-1.313M12 12.75V15m0 6.75l2.25-1.313M12 21.75V19.5m0 2.25l-2.25-1.313m0-16.875L12 2.25l2.25 1.313M21 14.25v2.25l-2.25 1.313m-13.5 0L3 16.5v-2.25",
                },
                {
                  title: "Not Custom-Ordered",
                  desc: "Special-order or custom tires may have different return terms. Contact us for details.",
                  icon: "M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded-lg bg-gray-50 p-5 border border-gray-100"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <svg
                      className="h-5 w-5 text-orange"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d={item.icon}
                      />
                    </svg>
                    <h3 className="font-bold text-gray-900">{item.title}</h3>
                  </div>
                  <p className="text-sm text-gray-600">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Return Process */}
          <div className="rounded-xl bg-white border border-gray-200 p-8 shadow-sm">
            <h2 className="text-xl font-black text-gray-900">
              How to Return Your Tires
            </h2>
            <ol className="mt-6 space-y-6">
              {[
                {
                  step: "1",
                  title: "Contact Us",
                  desc: "Call or text (279) 238-8473 (TIRE) or email info@ship.tires to initiate your return. Provide your order number and reason for return.",
                },
                {
                  step: "2",
                  title: "Receive Return Label",
                  desc: "We\u2019ll email you a prepaid return shipping label. If you have multiple tires, you\u2019ll receive a label for each.",
                },
                {
                  step: "3",
                  title: "Ship the Tires Back",
                  desc: "Take the tires to any FedEx location with the return label securely attached. If you can\u2019t get to a FedEx location, contact us and we\u2019ll schedule a pickup from your home or business.",
                },
                {
                  step: "4",
                  title: "Refund Processed",
                  desc: "Once we receive and inspect the tires at our warehouse, your refund will be issued within 5\u20137 business days to your original payment method.",
                },
              ].map((item) => (
                <li key={item.step} className="flex gap-4">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-orange text-sm font-black text-white">
                    {item.step}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{item.title}</h3>
                    <p className="mt-1 text-sm text-gray-600">{item.desc}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {/* Fees & Refunds */}
          <div className="rounded-xl bg-white border border-gray-200 p-8 shadow-sm space-y-6">
            <h2 className="text-xl font-black text-gray-900">
              Fees & Refund Details
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-gray-200 text-left text-xs font-medium uppercase text-gray-500">
                    <th className="py-3 pr-4">Scenario</th>
                    <th className="py-3 pr-4">Return Shipping Fee</th>
                    <th className="py-3">Refund Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr>
                    <td className="py-3 pr-4 text-gray-900 font-medium">
                      Standard return (changed mind, wrong size ordered)
                    </td>
                    <td className="py-3 pr-4 text-gray-600">$20 per tire</td>
                    <td className="py-3 text-gray-600">
                      Full purchase price minus return shipping fee
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 pr-4 text-gray-900 font-medium">
                      Wrong tire shipped by Ship.Tires
                    </td>
                    <td className="py-3 pr-4 text-green-600 font-bold">Free</td>
                    <td className="py-3 text-gray-600">
                      Full refund including any original shipping charges
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 pr-4 text-gray-900 font-medium">
                      Exchange for different tire (placing new order)
                    </td>
                    <td className="py-3 pr-4 text-green-600 font-bold">Free</td>
                    <td className="py-3 text-gray-600">
                      Full refund on original; new order at current price
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 pr-4 text-gray-900 font-medium">
                      Tire arrived damaged in shipping
                    </td>
                    <td className="py-3 pr-4 text-green-600 font-bold">Free</td>
                    <td className="py-3 text-gray-600">
                      Full refund or free replacement shipped
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="rounded-lg bg-orange/5 border border-orange/20 p-4">
              <p className="text-sm text-gray-700">
                <strong>Note:</strong> The $20/tire return shipping fee is waived
                in two cases: (1) if Ship.Tires shipped the wrong tire, or (2)
                if you are placing a new order with us. We believe in making the
                return process as fair as possible.
              </p>
            </div>
          </div>

          {/* Non-Returnable Items */}
          <div className="rounded-xl bg-white border border-gray-200 p-8 shadow-sm">
            <h2 className="text-xl font-black text-gray-900">
              Non-Returnable Items
            </h2>
            <ul className="mt-4 space-y-2">
              {[
                "Tires that have been mounted on a wheel (even briefly)",
                "Tires that have been driven on or show signs of use",
                "Tires with damage not caused during shipping (cuts, punctures, improper storage)",
                "Tires returned after 30 days from delivery",
                "Tires purchased as clearance or final-sale items (noted at time of purchase)",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-gray-600">
                  <svg
                    className="h-4 w-4 mt-0.5 text-red-400 flex-shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Manufacturer Warranty */}
          <div className="rounded-xl bg-white border border-gray-200 p-8 shadow-sm">
            <h2 className="text-xl font-black text-gray-900">
              Manufacturer Warranties
            </h2>
            <p className="mt-3 text-gray-600 leading-relaxed">
              All tires sold by Ship.Tires include the manufacturer&apos;s
              warranty, which covers defects in materials and workmanship.
              Warranty terms vary by brand and model&mdash;many include mileage
              guarantees ranging from 40,000 to 90,000 miles. Warranty claims
              after tire installation are handled directly through the tire
              manufacturer or an authorized dealer. Check the product page for
              specific warranty details.
            </p>
            <p className="mt-3 text-gray-600 leading-relaxed">
              Manufacturer warranties do <strong>not</strong> cover normal
              tread wear, road hazard damage (nails, glass, potholes), or damage
              caused by improper inflation, alignment, or overloading.
            </p>
          </div>

          {/* FAQ */}
          <div className="rounded-xl bg-white border border-gray-200 p-8 shadow-sm">
            <h2 className="text-xl font-black text-gray-900">
              Returns FAQ
            </h2>
            <div className="mt-4 space-y-3">
              {[
                {
                  q: "How long do I have to return tires?",
                  a: "You have 30 days from the date of delivery to initiate a return. Tires must be unmounted, unused, and in their original condition.",
                },
                {
                  q: "Is return shipping free?",
                  a: "Return shipping is $20 per tire. This fee is waived if we shipped the wrong tire or if you are placing a new order with Ship.Tires.",
                },
                {
                  q: "Can I return tires that have been mounted?",
                  a: "No. Only unmounted, unused tires in original condition are eligible for return. Once a tire has been mounted on a wheel or driven on, it cannot be returned. Manufacturer warranties cover defects after installation.",
                },
                {
                  q: "How long does a refund take?",
                  a: "Once we receive and inspect your returned tires, refunds are processed within 5-7 business days to your original payment method.",
                },
                {
                  q: "Can I exchange tires instead of returning?",
                  a: "Yes. If you need a different size, brand, or model, contact us to arrange an exchange. Return shipping on the original tires is free when you place a new order.",
                },
                {
                  q: "What if my tire arrived damaged?",
                  a: "Contact us immediately. We will arrange a free replacement shipment or full refund at no cost to you. All tires are inspected before shipping, but transit damage can occasionally occur.",
                },
              ].map((item) => (
                <details
                  key={item.q}
                  className="group rounded-lg bg-gray-50 border border-gray-100"
                >
                  <summary className="flex cursor-pointer items-center justify-between px-5 py-3 text-sm font-medium text-gray-900">
                    {item.q}
                    <svg
                      className="h-5 w-5 text-gray-400 transition-transform group-open:rotate-180"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                      />
                    </svg>
                  </summary>
                  <div className="px-5 pb-3 text-sm text-gray-600 leading-relaxed">
                    {item.a}
                  </div>
                </details>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="rounded-xl bg-navy p-8 text-center text-white relative overflow-hidden">
            <div className="absolute inset-0 racing-stripe" />
            <div className="relative">
              <h2 className="text-xl font-black">Need to Start a Return?</h2>
              <p className="mt-2 text-gray-400">
                Our team will walk you through the process and get it handled
                quickly.
              </p>
              <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                <a
                  href="tel:+12792388473"
                  className="rounded-lg bg-orange px-6 py-3 text-sm font-bold text-white hover:bg-orange-light transition-colors"
                >
                  Call/Text (279) 238-8473 (TIRE)
                </a>
                <Link
                  href="/contact"
                  className="rounded-lg border border-gray-600 px-6 py-3 text-sm font-bold text-white hover:bg-navy-light transition-colors"
                >
                  Contact Us
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
