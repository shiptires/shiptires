import Link from "next/link";

const accountNav = [
  { name: "Dashboard", href: "/account" },
  { name: "Orders", href: "/account/orders" },
  { name: "Profile", href: "/account/profile" },
  { name: "Vehicles", href: "/account/vehicles" },
];

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-gray-50 min-h-[60vh]">
      <div className="bg-navy py-8 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold">My Account</h1>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[240px_1fr]">
          {/* Side nav */}
          <nav className="space-y-1">
            {accountNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block rounded-lg px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-white hover:shadow-sm transition-all"
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Page content */}
          <div>{children}</div>
        </div>
      </div>
    </div>
  );
}
