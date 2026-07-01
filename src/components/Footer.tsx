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

const tireSizes = [
  { name: '14" Tires', href: "/search?rimSize=14" },
  { name: '15" Tires', href: "/search?rimSize=15" },
  { name: '16" Tires', href: "/search?rimSize=16" },
  { name: '17" Tires', href: "/search?rimSize=17" },
  { name: '18" Tires', href: "/search?rimSize=18" },
  { name: '19" Tires', href: "/search?rimSize=19" },
  { name: '20" Tires', href: "/search?rimSize=20" },
  { name: '21" Tires', href: "/search?rimSize=21" },
  { name: '22" Tires', href: "/search?rimSize=22" },
];

const vehicles = [
  { name: "Honda Civic", href: "/tires/vehicle/honda/civic" },
  { name: "Toyota Camry", href: "/tires/vehicle/toyota/camry" },
  { name: "Ford F-150", href: "/tires/vehicle/ford/f-150" },
  { name: "Toyota RAV4", href: "/tires/vehicle/toyota/rav4" },
  { name: "Honda CR-V", href: "/tires/vehicle/honda/cr-v" },
  { name: "Chevrolet Silverado", href: "/tires/vehicle/chevrolet/silverado" },
  { name: "Tesla Model 3", href: "/tires/vehicle/tesla/model-3" },
  { name: "BMW 3 Series", href: "/tires/vehicle/bmw/3-series" },
];

const companyLinks = [
  { name: "About Us", href: "/about" },
  { name: "Shipping Info", href: "/shipping" },
  { name: "Returns & Refunds", href: "/returns" },
  { name: "Find Installers", href: "/installers" },
  { name: "Shop by Vehicle", href: "/vehicle-lookup" },
  { name: "Locations", href: "/locations" },
  { name: "Blog", href: "/blog" },
  { name: "FAQ", href: "/faq" },
  { name: "Contact", href: "/contact" },
  { name: "Dealer Program", href: "/dealer" },
  { name: "Privacy Policy", href: "/privacy-policy" },
];

export default function Footer() {
  return (
    <footer className="bg-rubber">
      {/* Hairline top rule */}
      <div className="h-px bg-white/10" />

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-6">
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
              Tires shipped free nationwide. Top brands delivered
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

          {/* Tire Sizes */}
          <div>
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-kraft mb-4 font-display">
              Tire Sizes
            </h3>
            <ul className="space-y-2">
              {tireSizes.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-sm text-white/60 transition-colors hover:text-white">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Vehicles */}
          <div>
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-kraft mb-4 font-display">
              Vehicles
            </h3>
            <ul className="space-y-2">
              {vehicles.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-sm text-white/60 transition-colors hover:text-white">
                    {link.name}
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

            {/* Social Media */}
            <div className="mt-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-kraft mb-3 font-display">
                Follow Us
              </p>
              <div className="flex items-center gap-3">
                {/* Facebook */}
                <a href="https://facebook.com/ship.tires" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="text-white/40 hover:text-safety-orange transition-colors">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
                {/* Instagram */}
                <a href="https://instagram.com/ship.tires" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="text-white/40 hover:text-safety-orange transition-colors">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                  </svg>
                </a>
                {/* LinkedIn */}
                <a href="https://linkedin.com/company/ship.tires" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="text-white/40 hover:text-safety-orange transition-colors">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>
                {/* Pinterest */}
                <a href="https://pinterest.com/ship.tires" target="_blank" rel="noopener noreferrer" aria-label="Pinterest" className="text-white/40 hover:text-safety-orange transition-colors">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 01.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12.017 24c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641 0 12.017 0z"/>
                  </svg>
                </a>
                {/* TikTok */}
                <a href="https://tiktok.com/@ship.tires" target="_blank" rel="noopener noreferrer" aria-label="TikTok" className="text-white/40 hover:text-safety-orange transition-colors">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                  </svg>
                </a>
                {/* X / Twitter */}
                <a href="https://twitter.com/ship.tires" target="_blank" rel="noopener noreferrer" aria-label="X" className="text-white/40 hover:text-safety-orange transition-colors">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </a>
                {/* YouTube */}
                <a href="https://youtube.com/@shiptires" target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="text-white/40 hover:text-safety-orange transition-colors">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                </a>
              </div>
            </div>
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
        </div>
      </div>
    </footer>
  );
}
