import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tire Protection Plan — Road Hazard Coverage | Ship.Tires",
  description:
    "Protect your tires from nails, potholes, and road debris with our $12.99/tire Tire Protection Plan. 36-month coverage with repair and replacement benefits.",
  alternates: { canonical: "https://ship.tires/tire-protection" },
};

export default function TireProtectionPage() {
  return (
    <div className="bg-gray-50">
      <div className="bg-navy py-14 text-white">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-bold uppercase tracking-widest text-safety-orange">
            Add-On Protection
          </p>
          <h1 className="mt-2 text-3xl font-black sm:text-4xl tracking-tight">
            Tire Protection Plan
          </h1>
          <p className="mt-3 text-lg text-gray-400">
            Road hazard coverage for just $12.99 per tire. Repair or replace
            for 36 months.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Pricing card */}
        <div className="rounded-2xl bg-white border border-gray-200 p-8 shadow-sm text-center -mt-10 relative z-10">
          <p className="text-5xl font-black text-gray-900">
            $12<span className="text-2xl">.99</span>
          </p>
          <p className="mt-1 text-sm text-gray-500">per tire &middot; one-time payment</p>
          <p className="mt-4 text-sm text-gray-700">
            Add protection at checkout for any tires in your cart.
          </p>
          <Link
            href="/tires"
            className="mt-6 inline-block rounded-xl bg-safety-orange px-8 py-3 text-sm font-bold text-white hover:bg-safety-orange/90 transition-colors"
          >
            Shop Tires
          </Link>
        </div>

        {/* What's covered */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900">What&apos;s Covered</h2>
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              {
                icon: (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                  />
                ),
                title: "Nail & Screw Punctures",
                desc: "Coverage for damage from nails, screws, glass, and other sharp road debris.",
              },
              {
                icon: (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                  />
                ),
                title: "Pothole Damage",
                desc: "Impact damage from potholes, road cracks, and uneven road surfaces.",
              },
              {
                icon: (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                  />
                ),
                title: "Flat Tire Repair",
                desc: "Reimbursement up to $40 per occurrence for flat tire repair services.",
              },
              {
                icon: (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                  />
                ),
                title: "Tire Replacement",
                desc: "Up to 100% of purchase price in the first 12 months for non-repairable damage.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-xl bg-white border border-gray-200 p-5"
              >
                <div className="flex items-center gap-3">
                  <svg
                    className="h-6 w-6 text-green-500 flex-shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                  >
                    {item.icon}
                  </svg>
                  <h3 className="font-bold text-gray-900">{item.title}</h3>
                </div>
                <p className="mt-2 text-sm text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Coverage schedule */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900">
            Replacement Coverage Schedule
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            If your tire is damaged beyond repair, we&apos;ll credit you toward a
            replacement based on when the damage occurs.
          </p>
          <div className="mt-6 overflow-hidden rounded-xl border border-gray-200">
            <table className="w-full text-sm">
              <thead className="bg-navy text-white">
                <tr>
                  <th className="px-5 py-3 text-left font-bold">Period</th>
                  <th className="px-5 py-3 text-left font-bold">
                    Coverage
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                <tr>
                  <td className="px-5 py-3 text-gray-700">
                    Months 1&ndash;12
                  </td>
                  <td className="px-5 py-3 font-bold text-green-600">
                    100% of purchase price
                  </td>
                </tr>
                <tr>
                  <td className="px-5 py-3 text-gray-700">
                    Months 13&ndash;24
                  </td>
                  <td className="px-5 py-3 font-bold text-green-600">
                    50% of purchase price
                  </td>
                </tr>
                <tr>
                  <td className="px-5 py-3 text-gray-700">
                    Months 25&ndash;36
                  </td>
                  <td className="px-5 py-3 font-bold text-green-600">
                    25% of purchase price
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-gray-500">
            Maximum replacement value: $500 per tire. Coverage ends at 36 months
            or when tread reaches 2/32&quot;, whichever comes first.
          </p>
        </div>

        {/* What's not covered */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900">
            What&apos;s Not Covered
          </h2>
          <ul className="mt-4 space-y-2">
            {[
              "Racing, off-road abuse, or reckless driving",
              "Cosmetic damage (curb rash, sidewall scuffs)",
              "Damage from vehicle accidents or collisions",
              "Vandalism or intentional damage",
              "Commercial vehicle or fleet use",
              "Normal tread wear",
              "Manufacturer defects (covered by manufacturer warranty)",
            ].map((item) => (
              <li
                key={item}
                className="flex items-start gap-2 text-sm text-gray-600"
              >
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
                    d="M6 18 18 6M6 6l12 12"
                  />
                </svg>
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* How to file a claim */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900">
            How to File a Claim
          </h2>
          <div className="mt-6 space-y-4">
            {[
              {
                step: "1",
                title: "Contact Us",
                desc: "Email support@ship.tires or call us with your order number and a description of the damage.",
              },
              {
                step: "2",
                title: "Provide Photos",
                desc: "Send photos of the damaged tire showing the road hazard damage. Include a photo of the tire sidewall showing the DOT code.",
              },
              {
                step: "3",
                title: "Get Your Credit",
                desc: "Once approved, we'll issue a credit toward a replacement tire based on the coverage schedule above.",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="flex gap-4 rounded-xl bg-white border border-gray-200 p-5"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-safety-orange text-sm font-bold text-white flex-shrink-0">
                  {item.step}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">{item.title}</h3>
                  <p className="mt-1 text-sm text-gray-600">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900">
            Frequently Asked Questions
          </h2>
          <div className="mt-6 space-y-4">
            {[
              {
                q: "When can I add the Tire Protection Plan?",
                a: "The Tire Protection Plan is available as an add-on during checkout. It cannot be added after your order has been placed.",
              },
              {
                q: "Does the plan cover all tires in my order?",
                a: "Yes. When you opt in, every tire in your order is covered at $12.99 per tire.",
              },
              {
                q: "Is there a deductible?",
                a: "No. There is no deductible for claims. Flat tire repair reimbursements are covered up to $40 per occurrence.",
              },
              {
                q: "Can I transfer my coverage to a new vehicle?",
                a: "No. Coverage is tied to the specific tires purchased and cannot be transferred.",
              },
              {
                q: "How does this compare to manufacturer warranties?",
                a: "Manufacturer warranties cover defects in materials and workmanship. Our Tire Protection Plan covers road hazard damage from nails, potholes, and debris — events that manufacturer warranties specifically exclude.",
              },
            ].map((item) => (
              <div
                key={item.q}
                className="rounded-xl bg-white border border-gray-200 p-5"
              >
                <h3 className="font-bold text-gray-900">{item.q}</h3>
                <p className="mt-2 text-sm text-gray-600">{item.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-12 rounded-2xl bg-navy p-8 text-center text-white">
          <h2 className="text-xl font-black">
            Protect Your Investment
          </h2>
          <p className="mt-2 text-gray-400">
            Add the Tire Protection Plan at checkout for just $12.99 per tire.
          </p>
          <Link
            href="/tires"
            className="mt-6 inline-block rounded-xl bg-safety-orange px-8 py-3 text-sm font-bold text-white hover:bg-safety-orange/90 transition-colors"
          >
            Shop Tires
          </Link>
        </div>
      </div>
    </div>
  );
}
