"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import DealerSidebar from "@/components/dealer/DealerSidebar";

function LogoutButton() {
  return (
    <form action="/api/dealer/auth/logout" method="POST">
      <button
        type="submit"
        className="text-sm text-gray-400 hover:text-white transition-colors"
      >
        Logout
      </button>
    </form>
  );
}

export default function DealerDashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [dealer, setDealer] = useState<{ id: string; business_name: string; email: string } | null>(null);

  useEffect(() => {
    fetch("/api/dealer/auth/verify")
      .then((res) => res.json())
      .then((data) => {
        if (!data.authenticated) {
          router.push("/dealer/login");
        } else {
          setDealer(data.dealer);
          setChecking(false);
        }
      })
      .catch(() => {
        router.push("/dealer/login");
      });
  }, [router, pathname]);

  if (checking) {
    return (
      <div className="fixed inset-0 z-[100] bg-gray-50 flex items-center justify-center">
        <div className="text-gray-400 text-sm">Loading...</div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] bg-gray-50 text-gray-900 flex flex-col">
      {/* Top bar */}
      <header className="bg-black border-b border-gray-800 pl-14 md:pl-6 pr-6 py-3 flex items-center justify-between shrink-0">
        <span className="text-white font-bold text-lg tracking-tight">
          Ship.Tires <span className="text-gray-500 font-normal text-sm ml-1">Dealer</span>
          {dealer && (
            <span className="text-gray-600 font-normal text-xs ml-2 hidden sm:inline">
              — {dealer.business_name}
            </span>
          )}
        </span>
        <LogoutButton />
      </header>

      <div className="flex flex-1 min-h-0">
        <DealerSidebar />
        <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
