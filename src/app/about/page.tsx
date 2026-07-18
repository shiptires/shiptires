import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Ship.Tires — America's Tire Delivery Network",
  description:
    "Ship.Tires is a nationwide tire shipping company delivering top brands to your door or local installer. Free shipping on every order.",
  alternates: { canonical: "https://ship.tires/about" },
};

const FEATURED_BRANDS = [
  { name: "Michelin", logo: "michelin.png" },
  { name: "Bridgestone", logo: "bridgestone.png" },
  { name: "Continental", logo: "continental.png" },
  { name: "Goodyear", logo: "goodyear.png" },
  { name: "Pirelli", logo: "pirelli.png" },
  { name: "Cooper", logo: "cooper.png" },
  { name: "Yokohama", logo: "yokohama.png" },
  { name: "Falken", logo: "falken.png" },
  { name: "Toyo", logo: "toyo.png" },
  { name: "BFGoodrich", logo: "bfgoodrich.png" },
  { name: "Firestone", logo: "firestone.png" },
  { name: "Kumho", logo: "kumho.png" },
  { name: "Nexen", logo: "nexen.png" },
  { name: "Nitto", logo: "nitto.png" },
  { name: "Maxxis", logo: "maxxis.png" },
];

const STATS = [
  { value: "300+", label: "Brands" },
  { value: "800+", label: "Models" },
  { value: "307K+", label: "Tire Sizes" },
  { value: "FREE", label: "Shipping Always" },
];

export default function AboutPage() {
  return (
    <div className="bg-gray-50">
      {/* Hero */}
      <div className="relative bg-navy py-20 text-white overflow-hidden">
        <Image
          src="/about-hero.jpg"
          alt="Mechanic inspecting a tire"
          fill
          className="object-cover opacity-20"
          sizes="100vw"
          priority
        />
        <div className="absolute inset-0 racing-stripe" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-orange">Our Story</p>
          <h1 className="mt-3 text-4xl font-black sm:text-5xl tracking-tight">
            Tires Shipped Free.<br className="hidden sm:block" /> Installed Near You.
          </h1>
          <p className="mt-4 text-lg text-gray-300 max-w-2xl mx-auto">
            Ship.Tires is America&apos;s tire delivery network — from the track to the trail,
            we ship the right tires to your door or your local installer.
          </p>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="relative -mt-8 z-10 mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {STATS.map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl bg-white border border-gray-200 p-5 text-center shadow-md"
            >
              <p className="text-2xl font-black text-orange sm:text-3xl">{stat.value}</p>
              <p className="mt-1 text-xs font-bold uppercase tracking-wide text-gray-500">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6 lg:px-8 space-y-10">
        {/* Mission */}
        <section className="rounded-xl bg-white border border-gray-200 p-8 shadow-sm">
          <h2 className="text-2xl font-black text-gray-900">Our Mission</h2>
          <p className="mt-4 text-gray-600 leading-relaxed">
            Ship.Tires was built on a simple idea: buying tires should be easy, affordable, and hassle-free.
            We connect customers with the tires they need from top brands and ship them free to anywhere
            in the continental United States — directly to your home or your local installer.
          </p>
        </section>

        {/* Why We Exist */}
        <section className="rounded-xl bg-white border border-gray-200 p-8 shadow-sm">
          <h2 className="text-2xl font-black text-gray-900">Why We Exist</h2>
          <p className="mt-4 text-gray-600 leading-relaxed">
            Most people dread buying tires. The process is confusing, prices vary wildly, and finding the
            right size feels like a guessing game. We built Ship.Tires to fix that. Our vehicle lookup tool
            finds your exact tire size in seconds, our catalog has hundreds of options across every major
            brand, and our team of tire experts is always a call or text away.
          </p>
        </section>

        {/* What Makes Us Different */}
        <section className="rounded-xl bg-white border border-gray-200 p-8 shadow-sm">
          <h2 className="text-2xl font-black text-gray-900">What Makes Us Different</h2>
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
            {[
              {
                icon: (
                  <svg className="h-7 w-7 text-orange" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0H21M3.375 14.25h3.75L8.25 9h7.5l1.125 5.25h3.75M8.25 9V5.25a1.125 1.125 0 0 1 1.125-1.125h5.25A1.125 1.125 0 0 1 15.75 5.25V9" />
                  </svg>
                ),
                title: "Free Shipping, Always",
                desc: "Every order ships free. No minimum purchase, no hidden fees, no surprises.",
              },
              {
                icon: (
                  <svg className="h-7 w-7 text-orange" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                  </svg>
                ),
                title: "Ship to Your Installer",
                desc: "We ship directly to your preferred tire shop so they're ready when you arrive.",
              },
              {
                icon: (
                  <svg className="h-7 w-7 text-orange" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3a49.5 49.5 0 0 1-4.02-.163 2.115 2.115 0 0 1-1.23-.61L7.5 14.25M20.25 8.511c.126-.04.248-.091.366-.15A2.108 2.108 0 0 0 21.75 6.4V2.114c0-1.136-.847-2.1-1.98-2.193A48.424 48.424 0 0 0 12 .75a48.38 48.38 0 0 0-7.77.918C3.098.014 2.25.978 2.25 2.114V6.4c0 .969.616 1.813 1.5 2.097m15 .014A47.78 47.78 0 0 0 12 8.25a47.78 47.78 0 0 0-7.5.261" />
                  </svg>
                ),
                title: "Expert Guidance",
                desc: "Our tire experts help you find the perfect fit for your vehicle, driving style, and budget.",
              },
              {
                icon: (
                  <svg className="h-7 w-7 text-orange" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                  </svg>
                ),
                title: "Huge Selection",
                desc: "Hundreds of brands and models. From economy to ultra-premium, we have it all.",
              },
            ].map((item) => (
              <div key={item.title} className="flex gap-4 rounded-lg bg-gray-50 p-5 border border-gray-100">
                <div className="flex-shrink-0 mt-0.5">{item.icon}</div>
                <div>
                  <h3 className="font-bold text-gray-900">{item.title}</h3>
                  <p className="mt-1 text-sm text-gray-600">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Brands */}
        <section className="rounded-xl bg-white border border-gray-200 p-8 shadow-sm">
          <h2 className="text-2xl font-black text-gray-900">Brands You Trust</h2>
          <p className="mt-3 text-gray-600">
            We carry top brands from budget-friendly to ultra-premium — including these and many more.
          </p>
          <div className="mt-6 grid grid-cols-4 sm:grid-cols-8 gap-4">
            {FEATURED_BRANDS.map((brand) => (
              <div key={brand.name} className="flex flex-col items-center gap-2">
                <div className="relative h-10 w-full">
                  <Image
                    src={`/brand-logos/${brand.logo}`}
                    alt={brand.name}
                    fill
                    className="object-contain"
                    sizes="80px"
                  />
                </div>
                <span className="text-[10px] font-medium text-gray-500 text-center leading-tight">
                  {brand.name}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-6 text-center">
            <Link href="/tires" className="text-sm font-bold text-orange hover:underline">
              View all brands &rarr;
            </Link>
          </p>
        </section>

        {/* Location */}
        <section className="rounded-xl bg-white border border-gray-200 p-8 shadow-sm">
          <h2 className="text-2xl font-black text-gray-900">Our Location</h2>
          <p className="mt-4 text-gray-600 leading-relaxed">
            Ship.Tires ships from our warehouse in Fresno, California — centrally located for fast
            delivery to the entire West Coast and nationwide.
          </p>
          <div className="mt-4 flex items-start gap-3">
            <svg className="h-5 w-5 text-orange flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
            </svg>
            <div>
              <p className="font-bold text-gray-900">363 N Blackstone Ave</p>
              <p className="text-gray-600">Fresno, CA 93701</p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <div className="rounded-xl bg-navy p-10 text-center text-white relative overflow-hidden">
          <div className="absolute inset-0 racing-stripe" />
          <div className="relative">
            <h2 className="text-2xl font-black sm:text-3xl">Ready to Find Your Tires?</h2>
            <p className="mt-3 text-gray-400 max-w-lg mx-auto">
              Browse our catalog, use our vehicle lookup, or talk to a tire expert today.
            </p>
            <div className="mt-7 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/vehicle-lookup"
                className="rounded-lg bg-orange px-7 py-3 text-sm font-bold text-white hover:bg-orange-light transition-colors"
              >
                Find Tires for Your Vehicle
              </Link>
              <a
                href="tel:+12792388473"
                className="rounded-lg border border-gray-600 px-7 py-3 text-sm font-bold text-white hover:bg-navy-light transition-colors"
              >
                Call/Text (279) 238-TIRE
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
