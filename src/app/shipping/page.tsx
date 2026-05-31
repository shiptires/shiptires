import Link from "next/link";
import Image from "next/image";
import OrderTracking from "@/components/OrderTracking";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Free Shipping Info & Order Tracking — Nationwide Tire Delivery",
  description:
    "Free shipping on all tire orders. Track your order, see delivery timelines, and learn about our nationwide shipping. 3-7 business day delivery.",
};

export default function ShippingPage() {
  return (
    <div className="bg-gray-50">
      <div className="relative bg-navy py-14 text-white overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1600&q=80"
          alt="Shipping and logistics"
          fill
          className="object-cover opacity-15"
          sizes="100vw"
        />
        <div className="absolute inset-0 racing-stripe" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-bold uppercase tracking-widest text-orange">Fast & Free</p>
          <h1 className="mt-2 text-3xl font-black sm:text-4xl tracking-tight">Shipping & Order Tracking</h1>
          <p className="mt-3 text-lg text-gray-400">
            Free shipping on every order. Track your delivery in real time.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8 space-y-8">
        {/* Order Tracking */}
        <OrderTracking />

        {/* Free Shipping Banner */}
        <div className="rounded-xl bg-navy border border-orange/20 p-6 text-center relative overflow-hidden">
          <div className="absolute inset-0 racing-stripe" />
          <div className="relative">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-orange/20 border border-orange/30">
              <svg className="h-7 w-7 text-orange" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
              </svg>
            </div>
            <h2 className="mt-4 text-2xl font-black text-white">100% Free Shipping</h2>
            <p className="mt-2 text-gray-400">
              Every tire order ships free to anywhere in the continental United States. No minimum purchase required.
            </p>
          </div>
        </div>

        <div className="rounded-xl bg-white border border-gray-200 p-8 shadow-sm space-y-8">
          <div>
            <h2 className="text-xl font-black text-gray-900">Delivery Options</h2>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-lg bg-gray-50 p-5 border border-gray-100">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="h-5 w-5 text-orange" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                  </svg>
                  <h3 className="font-bold text-gray-900">Ship to Your Home</h3>
                </div>
                <p className="text-sm text-gray-600">
                  Tires delivered right to your front door. Great if you want to inspect them before installation
                  or if you&apos;re storing them for the season.
                </p>
              </div>
              <div className="rounded-lg bg-orange/5 border border-orange/20 p-5">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="h-5 w-5 text-orange" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17l-5.384 3.024 1.229-5.997L2.01 7.264l6.09-.525L11.42 1.5l3.32 5.239 6.09.525-5.256 4.933 1.229 5.997z" />
                  </svg>
                  <h3 className="font-bold text-gray-900">Ship to Your Installer</h3>
                </div>
                <p className="text-sm text-gray-600">
                  We ship directly to your preferred tire shop. Just schedule your install appointment and
                  your tires will be waiting. The fastest way to get new tires.
                </p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-black text-gray-900">Shipping Timeline</h2>
            <dl className="mt-4 space-y-3">
              {[
                { label: "Processing", value: "1-2 business days", icon: "M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" },
                { label: "Standard Delivery", value: "3-7 business days", icon: "M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" },
                { label: "Total Time", value: "4-9 business days from order", icon: "M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between rounded-lg bg-gray-50 p-4 border border-gray-100">
                  <div className="flex items-center gap-3">
                    <svg className="h-5 w-5 text-orange" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                    </svg>
                    <dt className="text-sm font-medium text-gray-700">{item.label}</dt>
                  </div>
                  <dd className="text-sm font-bold text-gray-900">{item.value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div>
            <h2 className="text-xl font-black text-gray-900">Coverage Area</h2>
            <p className="mt-3 text-gray-600">
              We ship to all 50 states in the continental United States. Shipments to Alaska and Hawaii
              may require additional processing time. Contact us for international shipping inquiries.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-black text-gray-900">Packaging</h2>
            <p className="mt-3 text-gray-600">
              All tires are professionally packaged to prevent damage during transit. Tires arrive in
              protective wrapping and are inspected before shipment to ensure quality.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-black text-gray-900">Questions?</h2>
            <p className="mt-3 text-gray-600">
              Need help with shipping or have questions about delivery? Our team is here to help.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <a href="tel:+19164767689" className="inline-flex items-center gap-2 rounded-lg bg-orange px-5 py-2.5 text-sm font-bold text-white hover:bg-orange-dark transition-colors">
                Call (916) 476-7689
              </a>
              <Link href="/contact" className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors">
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
