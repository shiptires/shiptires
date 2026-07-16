import TireSpinner from "@/components/TireSpinner";

export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-navy py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="h-9 w-80 bg-white/10 rounded animate-pulse" />
          <div className="mt-3 h-5 w-96 bg-white/10 rounded animate-pulse" />
        </div>
      </div>
      <TireSpinner message="Loading brands..." />
    </div>
  );
}
