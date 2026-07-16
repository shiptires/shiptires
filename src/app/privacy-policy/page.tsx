import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — Ship.Tires",
  description:
    "Ship.Tires privacy policy. Learn how we collect, use, and protect your personal information when you shop for tires online.",
  alternates: { canonical: "https://ship.tires/privacy-policy" },
};

export default function PrivacyPolicyPage() {
  return (
    <div className="bg-gray-50">
      <div className="bg-navy py-14 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-bold uppercase tracking-widest text-orange">Legal</p>
          <h1 className="mt-2 text-3xl font-black sm:text-4xl tracking-tight">Privacy Policy</h1>
          <p className="mt-3 text-lg text-gray-400">
            Last updated: July 2026
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-xl bg-white border border-gray-200 p-8 shadow-sm space-y-8">

          <section>
            <h2 className="text-xl font-black text-gray-900">1. Introduction</h2>
            <p className="mt-3 text-gray-600 leading-relaxed">
              Ship.Tires (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) operates the website{" "}
              <Link href="/" className="text-orange hover:underline">ship.tires</Link> and related
              services. This Privacy Policy explains how we collect, use, disclose, and safeguard your
              information when you visit our website, place an order, or interact with us. By using our
              services, you agree to the practices described in this policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-gray-900">2. Information We Collect</h2>
            <h3 className="mt-4 text-lg font-bold text-gray-800">Personal Information</h3>
            <p className="mt-2 text-gray-600 leading-relaxed">
              When you place an order, create an account, or contact us, we may collect:
            </p>
            <ul className="mt-2 list-disc pl-6 space-y-1 text-gray-600">
              <li>Name (first and last)</li>
              <li>Email address</li>
              <li>Phone number</li>
              <li>Shipping and billing address</li>
              <li>Payment information (processed securely via Plaid ACH bank transfer — we do not store bank credentials)</li>
              <li>Vehicle information (year, make, model) for tire recommendations</li>
            </ul>

            <h3 className="mt-4 text-lg font-bold text-gray-800">Automatically Collected Information</h3>
            <p className="mt-2 text-gray-600 leading-relaxed">
              When you browse our website, we may automatically collect:
            </p>
            <ul className="mt-2 list-disc pl-6 space-y-1 text-gray-600">
              <li>IP address and approximate location</li>
              <li>Browser type and device information</li>
              <li>Pages visited, time spent, and referral source</li>
              <li>Cookies and similar tracking technologies</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-black text-gray-900">3. How We Use Your Information</h2>
            <p className="mt-3 text-gray-600 leading-relaxed">We use the information we collect to:</p>
            <ul className="mt-2 list-disc pl-6 space-y-1 text-gray-600">
              <li>Process and fulfill your tire orders</li>
              <li>Send order confirmations, shipping updates, and delivery notifications</li>
              <li>Provide customer support via phone, email, and SMS</li>
              <li>Recommend tires based on your vehicle and preferences</li>
              <li>Improve our website, products, and services</li>
              <li>Detect and prevent fraud</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-black text-gray-900">4. How We Share Your Information</h2>
            <p className="mt-3 text-gray-600 leading-relaxed">
              We do not sell your personal information. We may share your information with:
            </p>
            <ul className="mt-2 list-disc pl-6 space-y-1 text-gray-600">
              <li><strong>Payment processors</strong> (Plaid) to securely process ACH bank transfers</li>
              <li><strong>Shipping carriers</strong> to deliver your tires</li>
              <li><strong>Email service providers</strong> to send order confirmations and updates</li>
              <li><strong>Analytics providers</strong> to understand website usage and improve our services</li>
              <li><strong>Law enforcement</strong> when required by law or to protect our rights</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-black text-gray-900">5. Third-Party Marketplaces</h2>
            <p className="mt-3 text-gray-600 leading-relaxed">
              Ship.Tires may list products on third-party marketplaces including eBay, Amazon, and
              Walmart. When you purchase through these platforms, the marketplace&apos;s privacy policy
              governs the transaction. We only receive the information necessary to fulfill your order.
              If you request deletion of your marketplace account, we will delete any associated personal
              data we hold within 30 days of notification.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-gray-900">6. Data Security</h2>
            <p className="mt-3 text-gray-600 leading-relaxed">
              We implement industry-standard security measures to protect your personal information,
              including HTTPS encryption, secure payment processing through Plaid (SOC 2 Type II certified),
              and access controls on our systems. However, no method of electronic transmission or
              storage is 100% secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-gray-900">7. Cookies</h2>
            <p className="mt-3 text-gray-600 leading-relaxed">
              We use cookies and similar technologies to keep you signed in, remember your cart,
              and understand how you use our site. You can control cookies through your browser
              settings, though disabling them may affect site functionality.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-gray-900">8. Your Rights</h2>
            <p className="mt-3 text-gray-600 leading-relaxed">
              Depending on your location, you may have the right to:
            </p>
            <ul className="mt-2 list-disc pl-6 space-y-1 text-gray-600">
              <li>Access the personal information we hold about you</li>
              <li>Request correction of inaccurate information</li>
              <li>Request deletion of your personal information</li>
              <li>Opt out of marketing communications</li>
              <li>Request a copy of your data in a portable format</li>
            </ul>
            <p className="mt-3 text-gray-600 leading-relaxed">
              To exercise any of these rights, contact us at{" "}
              <a href="mailto:info@ship.tires" className="text-orange hover:underline">info@ship.tires</a>{" "}
              or call{" "}
              <a href="tel:+12792388473" className="text-orange hover:underline">(279) 238-8473</a>.
              We will respond within 30 days.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-gray-900">9. California Privacy Rights (CCPA)</h2>
            <p className="mt-3 text-gray-600 leading-relaxed">
              If you are a California resident, you have the right to know what personal information we
              collect, request its deletion, and opt out of the sale of personal information. We do not
              sell personal information. To submit a request, contact us at{" "}
              <a href="mailto:info@ship.tires" className="text-orange hover:underline">info@ship.tires</a>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-gray-900">10. Children&apos;s Privacy</h2>
            <p className="mt-3 text-gray-600 leading-relaxed">
              Our services are not directed to individuals under 18. We do not knowingly collect
              personal information from children. If we learn that we have collected information from
              a child, we will promptly delete it.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-gray-900">11. Data Retention</h2>
            <p className="mt-3 text-gray-600 leading-relaxed">
              We retain your personal information for as long as necessary to fulfill the purposes
              outlined in this policy, including order fulfillment, customer support, and legal
              compliance. Order records are retained for 7 years for tax and legal purposes.
              You may request deletion of your account and associated data at any time.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-gray-900">12. Changes to This Policy</h2>
            <p className="mt-3 text-gray-600 leading-relaxed">
              We may update this Privacy Policy from time to time. Changes will be posted on this page
              with an updated &quot;Last updated&quot; date. Your continued use of our services after
              changes are posted constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-gray-900">13. Contact Us</h2>
            <p className="mt-3 text-gray-600 leading-relaxed">
              If you have questions about this Privacy Policy or your personal data, contact us:
            </p>
            <ul className="mt-3 space-y-2 text-gray-600">
              <li>
                <strong>Email:</strong>{" "}
                <a href="mailto:info@ship.tires" className="text-orange hover:underline">info@ship.tires</a>
              </li>
              <li>
                <strong>Phone:</strong>{" "}
                <a href="tel:+12792388473" className="text-orange hover:underline">(279) 238-8473 (TIRE)</a>
              </li>
              <li>
                <strong>Website:</strong>{" "}
                <Link href="/contact" className="text-orange hover:underline">ship.tires/contact</Link>
              </li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
