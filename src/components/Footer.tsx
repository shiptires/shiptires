import Link from "next/link";
import Image from "next/image";

const tireLinks = [
  { name: "All-Season Tires", href: "/search?season=All-Season" },
  { name: "Winter Tires", href: "/search?season=Winter" },
  { name: "Performance Tires", href: "/search?category=performance" },
  { name: "All-Terrain Tires", href: "/search?terrain=All-Terrain+%28A%2FT%29" },
  { name: "Touring Tires", href: "/search?category=touring" },
  { name: "All Brands", href: "/tires" },
];

const topBrands = [
  { name: "Michelin", href: "/tires/michelin" },
  { name: "Goodyear", href: "/tires/goodyear" },
  { name: "Bridgestone", href: "/tires/bridgestone" },
  { name: "Continental", href: "/tires/continental" },
  { name: "Pirelli", href: "/tires/pirelli" },
  { name: "Cooper", href: "/tires/cooper" },
];

const companyLinks = [
  { name: "About Us", href: "/about" },
  { name: "Shipping Info", href: "/shipping" },
  { name: "Returns & Refunds", href: "/returns" },
  { name: "Find Installers", href: "/installers" },
  { name: "Vehicle Lookup", href: "/vehicle-lookup" },
  { name: "Blog", href: "/blog" },
  { name: "FAQ", href: "/faq" },
  { name: "Contact", href: "/contact" },
];

export default function Footer() {
  return (
    <footer className="bg-rubber">
      {/* Hairline top rule */}
      <div className="h-px bg-white/10" />

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Company Info */}
          <div>
            <Link href="/" className="inline-block">
              <Image
                src="/logo.png"
                alt="Ship.Tires"
                width={400}
                height={200}
                className="h-24 w-auto lg:h-28 brightness-150"
              />
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-white/60">
              Tires shipped free nationwide. 34 curated brands delivered
              to your door or local installer.
            </p>
            <div className="mt-4 flex items-center gap-2 text-sm font-mono text-kraft">
              <svg className="h-4 w-4 text-safety-orange" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
              </svg>
              FREE SHIPPING ON ALL ORDERS
            </div>
          </div>

          {/* Tire Types */}
          <div>
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-kraft mb-4 font-display">
              Shop Tires
            </h3>
            <ul className="space-y-2">
              {tireLinks.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-sm text-white/60 transition-colors hover:text-white">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Top Brands */}
          <div>
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-kraft mb-4 font-display">
              Top Brands
            </h3>
            <ul className="space-y-2">
              {topBrands.map((brand) => (
                <li key={brand.name}>
                  <Link href={brand.href} className="text-sm text-white/60 transition-colors hover:text-white">
                    {brand.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-kraft mb-4 font-display">
              Contact Us
            </h3>
            <ul className="space-y-3">
              <li>
                <a
                  href="tel:+12792388473"
                  className="flex items-center gap-2 text-sm font-mono font-semibold text-safety-orange transition-colors hover:text-safety-orange/80"
                >
                  <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
                  </svg>
                  (279) 238-8473 (TIRE)
                </a>
              </li>
              <li>
                <a
                  href="mailto:info@ship.tires"
                  className="flex items-center gap-2 text-sm text-white/60 transition-colors hover:text-white"
                >
                  <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                  </svg>
                  info@ship.tires
                </a>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="flex items-center gap-2 text-sm text-white/60 transition-colors hover:text-white"
                >
                  <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                  </svg>
                  Request a Quote
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 border-t border-white/10 pt-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-sm text-white/50">
              &copy; {new Date().getFullYear()} Ship.Tires. All rights reserved.
            </p>
            <div className="flex flex-wrap justify-center gap-6">
              {companyLinks.map((link) => (
                <Link key={link.name} href={link.href} className="text-sm text-white/50 hover:text-white transition-colors">
                  {link.name}
                </Link>
              ))}
            </div>
          </div>
          <div className="mt-4 text-center text-xs text-white/30">
            <a href="https://sigmaagents.ai" target="_blank" rel="noopener noreferrer" className="hover:text-white/50 transition-colors">
              Powered by Sigma Agents
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
