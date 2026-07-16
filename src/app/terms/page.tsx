import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service — Ship.Tires",
  description:
    "Ship.Tires terms of service. Read our terms and conditions for purchasing tires, shipping, returns, warranties, and use of our website.",
  alternates: { canonical: "https://ship.tires/terms" },
};

export default function TermsPage() {
  return (
    <div className="bg-gray-50">
      <div className="bg-navy py-14 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-bold uppercase tracking-widest text-orange">Legal</p>
          <h1 className="mt-2 text-3xl font-black sm:text-4xl tracking-tight">Terms of Service</h1>
          <p className="mt-3 text-lg text-gray-400">
            Last updated: July 2026
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-xl bg-white border border-gray-200 p-8 shadow-sm space-y-8">

          <section>
            <h2 className="text-xl font-black text-gray-900">1. Agreement to Terms</h2>
            <p className="mt-3 text-gray-600 leading-relaxed">
              By accessing or using the Ship.Tires website at{" "}
              <Link href="/" className="text-orange hover:underline">ship.tires</Link>{" "}
              (the &quot;Site&quot;), you agree to be bound by these Terms of Service
              (&quot;Terms&quot;). If you do not agree to these Terms, do not use the Site.
              These Terms apply to all visitors, users, and customers of Ship.Tires.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-gray-900">2. About Ship.Tires</h2>
            <p className="mt-3 text-gray-600 leading-relaxed">
              Ship.Tires is an online tire retailer based in Sacramento, California. We sell new
              tires from major manufacturers and ship them directly to customers or their chosen
              tire installer across the continental United States. Our business contact information:
            </p>
            <ul className="mt-3 list-disc pl-6 space-y-1 text-gray-600">
              <li>Phone: <a href="tel:+12792388473" className="text-orange hover:underline">(279) 238-8473</a></li>
              <li>Email: <a href="mailto:info@ship.tires" className="text-orange hover:underline">info@ship.tires</a></li>
              <li>Location: Sacramento, CA, United States</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-black text-gray-900">3. Products & Pricing</h2>
            <p className="mt-3 text-gray-600 leading-relaxed">
              All tires sold on Ship.Tires are new and sourced from authorized distributors. We
              make every effort to display accurate product information including specifications,
              images, and pricing. However:
            </p>
            <ul className="mt-3 list-disc pl-6 space-y-2 text-gray-600">
              <li>
                <strong>Pricing:</strong> All prices are listed in US Dollars (USD). Prices are
                subject to change without notice. The price at the time of order placement is the
                price you pay. State and local taxes, tire disposal fees, and any applicable
                environmental fees are calculated at checkout based on your shipping destination.
              </li>
              <li>
                <strong>Availability:</strong> Product availability is subject to change. If an
                item becomes unavailable after you place an order, we will notify you and offer a
                full refund or a comparable alternative.
              </li>
              <li>
                <strong>Images:</strong> Product images are provided by manufacturers and are
                representative of the product. Actual tire appearance may vary slightly from images
                shown.
              </li>
              <li>
                <strong>Errors:</strong> We reserve the right to correct any errors in pricing or
                product descriptions. If an error affects your order, we will contact you before
                processing.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-black text-gray-900">4. Orders & Payment</h2>
            <p className="mt-3 text-gray-600 leading-relaxed">
              By placing an order, you represent that you are at least 18 years of age and that all
              information you provide is accurate and complete.
            </p>
            <ul className="mt-3 list-disc pl-6 space-y-2 text-gray-600">
              <li>
                <strong>Order acceptance:</strong> Your order is an offer to purchase. We reserve
                the right to refuse or cancel any order for any reason, including product
                availability, pricing errors, or suspected fraud.
              </li>
              <li>
                <strong>Payment:</strong> We accept payment via ACH bank transfer through Plaid.
                Payment is processed at the time of order placement. ACH transfers typically settle
                within 1&ndash;3 business days.
              </li>
              <li>
                <strong>Order confirmation:</strong> You will receive an email confirmation after
                your order is placed. This confirmation does not guarantee shipment until payment
                has settled and inventory is verified.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-black text-gray-900">5. Shipping</h2>
            <p className="mt-3 text-gray-600 leading-relaxed">
              Ship.Tires offers free standard shipping on all orders within the continental United
              States. For full details on our shipping policies, delivery timelines, and order
              tracking, please visit our{" "}
              <Link href="/shipping" className="text-orange hover:underline">Shipping Info</Link> page.
            </p>
            <ul className="mt-3 list-disc pl-6 space-y-2 text-gray-600">
              <li>Estimated delivery: 3&ndash;7 business days after shipment</li>
              <li>Orders ship from warehouses across the US for fastest delivery</li>
              <li>You may ship to your home address or directly to a tire installer</li>
              <li>Shipping to Alaska, Hawaii, and US territories is not available at this time</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-black text-gray-900">6. Returns & Refunds</h2>
            <p className="mt-3 text-gray-600 leading-relaxed">
              We offer a 30-day return policy on unmounted, unused tires in original condition. For
              full details on eligibility, return shipping fees, exchange options, and refund
              processing, please visit our{" "}
              <Link href="/returns" className="text-orange hover:underline">Returns & Refunds</Link> page.
            </p>
            <ul className="mt-3 list-disc pl-6 space-y-1 text-gray-600">
              <li>Returns must be initiated within 30 days of delivery</li>
              <li>Tires must be unmounted, unused, and in original condition</li>
              <li>Standard return shipping fee: $20 per tire</li>
              <li>Free return shipping if we shipped the wrong tire</li>
              <li>Refunds processed within 5&ndash;7 business days after inspection</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-black text-gray-900">7. Warranties</h2>
            <p className="mt-3 text-gray-600 leading-relaxed">
              All tires sold by Ship.Tires carry the manufacturer&apos;s original warranty. Ship.Tires
              is not the manufacturer and does not provide independent warranties on products. Warranty
              claims are handled directly through the tire manufacturer or their authorized dealers.
            </p>
            <ul className="mt-3 list-disc pl-6 space-y-1 text-gray-600">
              <li>Manufacturer warranties vary by brand and model</li>
              <li>Warranty coverage typically begins on the date of purchase</li>
              <li>Proof of purchase (your Ship.Tires order confirmation) is required for warranty claims</li>
              <li>Improper installation, maintenance, or use may void the manufacturer warranty</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-black text-gray-900">8. Tire Safety & Fitment</h2>
            <p className="mt-3 text-gray-600 leading-relaxed">
              It is the customer&apos;s responsibility to ensure that tires ordered are the correct
              size and type for their vehicle. We provide fitment tools and vehicle lookup features
              to assist you, but these are for reference only. Always consult your vehicle owner&apos;s
              manual or a qualified tire professional before purchasing.
            </p>
            <p className="mt-3 text-gray-600 leading-relaxed">
              Tires must be installed by a qualified tire professional. Improper installation can
              result in tire failure, vehicle damage, or injury. Ship.Tires is not responsible for
              damages resulting from incorrect tire selection or improper installation.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-gray-900">9. Website Use</h2>
            <ul className="mt-3 list-disc pl-6 space-y-2 text-gray-600">
              <li>
                <strong>Accuracy:</strong> You agree to provide accurate, current, and complete
                information when creating an account, placing orders, or contacting us.
              </li>
              <li>
                <strong>Prohibited uses:</strong> You may not use the Site for any unlawful purpose,
                to transmit harmful code, to interfere with the Site&apos;s operation, to scrape or
                harvest data without permission, or to impersonate another person or entity.
              </li>
              <li>
                <strong>Account security:</strong> If you create an account, you are responsible for
                maintaining the confidentiality of your credentials and for all activity under your
                account.
              </li>
              <li>
                <strong>Intellectual property:</strong> All content on the Site&mdash;including text,
                images, logos, and software&mdash;is the property of Ship.Tires or its licensors and
                is protected by copyright and trademark laws.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-black text-gray-900">10. Limitation of Liability</h2>
            <p className="mt-3 text-gray-600 leading-relaxed">
              To the fullest extent permitted by law, Ship.Tires shall not be liable for any
              indirect, incidental, special, consequential, or punitive damages arising from your
              use of the Site or purchase of products, including but not limited to vehicle damage,
              personal injury, or lost profits. Our total liability for any claim shall not exceed
              the amount you paid for the specific product giving rise to the claim.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-gray-900">11. Indemnification</h2>
            <p className="mt-3 text-gray-600 leading-relaxed">
              You agree to indemnify and hold harmless Ship.Tires, its officers, employees, and
              agents from any claims, damages, losses, or expenses (including reasonable attorney
              fees) arising from your use of the Site, violation of these Terms, or infringement of
              any third-party rights.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-gray-900">12. Dispute Resolution</h2>
            <p className="mt-3 text-gray-600 leading-relaxed">
              These Terms are governed by the laws of the State of California. Any disputes arising
              from these Terms or your use of the Site shall be resolved in the state or federal
              courts located in Sacramento County, California. Before filing any claim, you agree to
              attempt to resolve the dispute informally by contacting us at{" "}
              <a href="mailto:info@ship.tires" className="text-orange hover:underline">info@ship.tires</a>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-gray-900">13. Changes to Terms</h2>
            <p className="mt-3 text-gray-600 leading-relaxed">
              We reserve the right to modify these Terms at any time. Changes will be posted on this
              page with an updated &quot;Last updated&quot; date. Your continued use of the Site
              after changes are posted constitutes acceptance of the revised Terms. We encourage you
              to review this page periodically.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-gray-900">14. Severability</h2>
            <p className="mt-3 text-gray-600 leading-relaxed">
              If any provision of these Terms is found to be unenforceable or invalid, that
              provision shall be limited or eliminated to the minimum extent necessary, and the
              remaining provisions shall remain in full force and effect.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-gray-900">15. Contact Us</h2>
            <p className="mt-3 text-gray-600 leading-relaxed">
              If you have any questions about these Terms, please contact us:
            </p>
            <ul className="mt-3 list-disc pl-6 space-y-1 text-gray-600">
              <li>Email: <a href="mailto:info@ship.tires" className="text-orange hover:underline">info@ship.tires</a></li>
              <li>Phone: <a href="tel:+12792388473" className="text-orange hover:underline">(279) 238-8473</a></li>
              <li>Mail: Ship.Tires, Sacramento, CA</li>
            </ul>
          </section>

          <div className="border-t border-gray-200 pt-6">
            <p className="text-sm text-gray-500">
              See also:{" "}
              <Link href="/privacy-policy" className="text-orange hover:underline">Privacy Policy</Link>
              {" "}&middot;{" "}
              <Link href="/returns" className="text-orange hover:underline">Returns & Refunds</Link>
              {" "}&middot;{" "}
              <Link href="/shipping" className="text-orange hover:underline">Shipping Info</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
