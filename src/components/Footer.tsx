import Link from "next/link";
import Image from "next/image";

const tireLinks = [
  { name: "All-Season Tires", href: "/search?type=all-season" },
  { name: "Winter Tires", href: "/search?type=winter" },
  { name: "Performance Tires", href: "/search?type=performance" },
  { name: "All-Terrain Tires", href: "/search?type=all-terrain" },
  { name: "Touring Tires", href: "/search?type=touring" },
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
  { name: "Vehicle Lookup", href: "/vehicle-lookup" },
  { name: "Blog", href: "/blog" },
  { name: "FAQ", href: "/faq" },
  { name: "Contact", href: "/contact" },
];

export default function Footer() {
  return (
    <footer className="bg-navy-dark text-gray-400 relative">
      {/* GT racing stripe divider */}
      <div className="h-1 bg-gradient-to-r from-orange-dark via-orange to-orange-dark relative">
        <div className="absolute inset-0 checkered-accent opacity-50" />
      </div>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Company Info */}
          <div>
            <Link href="/" className="inline-block">
              <Image
                src="/logo.png"
                alt="Ship.Tires - Tires Delivered Fast"
                width={400}
                height={200}
                className="h-32 w-auto lg:h-36"
                unoptimized
              />
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-gray-300">
              Nationwide tire shipping with free delivery. Browse 20+ top brands,
              find the perfect fit for your vehicle, and get tires shipped to your
              door or local installer.
            </p>
            <div className="mt-4 flex items-center gap-2 text-sm">
              <svg className="h-4 w-4 text-orange" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
              </svg>
              <span className="text-gray-400">Free Shipping Nationwide</span>
            </div>
          </div>

          {/* Tire Types */}
          <div>
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-orange mb-4">
              Shop Tires
            </h3>
            <ul className="space-y-2">
              {tireLinks.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-sm text-gray-300 transition-colors hover:text-orange">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Top Brands */}
          <div>
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-orange mb-4">
              Top Brands
            </h3>
            <ul className="space-y-2">
              {topBrands.map((brand) => (
                <li key={brand.name}>
                  <Link href={brand.href} className="text-sm text-gray-300 transition-colors hover:text-orange">
                    {brand.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-orange mb-4">
              Contact Us
            </h3>
            <ul className="space-y-3">
              <li>
                <a
                  href="tel:+19164767689"
                  className="flex items-center gap-2 text-sm text-gray-300 transition-colors hover:text-orange"
                >
                  <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
                  </svg>
                  (916) 476-7689
                </a>
              </li>
              <li>
                <a
                  href="mailto:info@ship.tires"
                  className="flex items-center gap-2 text-sm text-gray-300 transition-colors hover:text-orange"
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
                  className="flex items-center gap-2 text-sm text-gray-300 transition-colors hover:text-orange"
                >
                  <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                  </svg>
                  Request a Quote
                </Link>
              </li>
            </ul>
            <div className="mt-4 space-y-2">
              {companyLinks.slice(0, 3).map((link) => (
                <Link key={link.name} href={link.href} className="block text-sm text-gray-300 transition-colors hover:text-orange">
                  {link.name}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Bar — GT Credits */}
        <div className="mt-12 border-t border-gray-800 pt-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-sm text-gray-400">
              &copy; {new Date().getFullYear()} Ship.Tires. All rights reserved.
            </p>
            <div className="flex flex-wrap justify-center gap-6">
              {companyLinks.map((link) => (
                <Link key={link.name} href={link.href} className="text-sm text-gray-400 hover:text-white transition-colors">
                  {link.name}
                </Link>
              ))}
            </div>
          </div>
          <div className="mt-4 text-center text-xs text-gray-700">
            <a href="https://sigmaagents.ai" target="_blank" rel="noopener noreferrer" className="hover:text-gray-500 transition-colors">
              Powered by Sigma Agents
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
