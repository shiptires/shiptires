import AdminSidebar from "@/components/admin/AdminSidebar";

export const metadata = {
  title: "Admin | Ship.Tires",
};

function LogoutButton() {
  return (
    <form action="/api/admin/auth/logout" method="POST">
      <button
        type="submit"
        className="text-sm text-gray-400 hover:text-white transition-colors"
      >
        Logout
      </button>
    </form>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[100] bg-gray-50 text-gray-900 flex flex-col">
      {/* Top bar */}
      <header className="bg-black border-b border-gray-800 pl-14 md:pl-6 pr-6 py-3 flex items-center justify-between shrink-0">
        <span className="text-white font-bold text-lg tracking-tight">
          Ship.Tires <span className="text-gray-500 font-normal text-sm ml-1">Admin</span>
        </span>
        <LogoutButton />
      </header>

      <div className="flex flex-1 min-h-0">
        <AdminSidebar />
        <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
