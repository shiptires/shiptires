import Link from "next/link";
import DealerApplicationForm from "@/components/dealer/DealerApplicationForm";

export const metadata = {
  title: "Dealer Program | Ship.Tires",
  description: "Apply for a Ship.Tires wholesale dealer account. Wholesale tire pricing, 9 distribution locations, Stripe checkout, and order tracking for tire shops, installers, and fleet managers.",
};

export default function DealerPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-[#0a1628] text-white py-20 px-4">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Dealer Program
          </h1>
          <p className="mt-6 text-lg text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Ship.Tires is your wholesale tire distribution partner. We white-label inventory from Express Tire across 9 warehouse locations, offering competitive wholesale pricing with fast nationwide shipping. Apply for a dealer account to access B2B pricing and streamlined ordering.
          </p>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="mx-auto max-w-5xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
              <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-orange-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900">Wholesale Pricing</h3>
              <p className="mt-2 text-sm text-gray-600">Distributor cost + 10% markup. No retail markups, no hidden fees.</p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 21h7.5V10.75M2.25 21h1.5m18 0h-18M2.25 9l4.5-1.636M18.75 3l-1.5.545m0 6.205 3 1m1.5.5-1.5-.5M6.75 7.364V3h-3v18m3-13.636 10.5-3.819" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900">9 Distribution Locations</h3>
              <p className="mt-2 text-sm text-gray-600">Orders fulfilled from the nearest warehouse for fastest delivery.</p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900">Stripe Checkout</h3>
              <p className="mt-2 text-sm text-gray-600">Secure payment processing. Pay per order, no credit applications.</p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900">Order Tracking</h3>
              <p className="mt-2 text-sm text-gray-600">Track every order from placement through delivery in your dashboard.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Main content: Login/Contact + Application Form */}
      <section className="py-16 px-4">
        <div className="mx-auto max-w-5xl">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* Left column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Login Card */}
              <div className="bg-[#0a1628] rounded-xl p-6 text-white">
                <h2 className="text-lg font-bold">Existing Dealers</h2>
                <p className="mt-2 text-sm text-gray-300">
                  Already have a dealer account? Log in to browse inventory, place orders, and track shipments.
                </p>
                <Link
                  href="/dealer/login"
                  className="mt-4 inline-block rounded-lg bg-orange-500 px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-orange-600"
                >
                  Dealer Login
                </Link>
              </div>

              {/* Contact Card */}
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <h2 className="text-lg font-bold text-gray-900">Contact Us Directly</h2>
                <p className="mt-2 text-sm text-gray-600">
                  Prefer to talk? Reach out and we&apos;ll get you set up.
                </p>
                <div className="mt-4 space-y-3">
                  <a
                    href="mailto:info@ship.tires"
                    className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-orange-600 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                    </svg>
                    info@ship.tires
                  </a>
                  <a
                    href="tel:+12792388473"
                    className="flex items-center gap-2 text-sm font-medium text-orange-600 hover:text-orange-700 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
                    </svg>
                    (279) 238-8473
                  </a>
                </div>
              </div>
            </div>

            {/* Right column: Application Form */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-xl border border-gray-200 p-6 sm:p-8 shadow-sm">
                <h2 className="text-xl font-bold text-gray-900">Apply for a Dealer Account</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Fill out the form below and we&apos;ll review your application within 1-2 business days.
                </p>
                <div className="mt-6">
                  <DealerApplicationForm />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
