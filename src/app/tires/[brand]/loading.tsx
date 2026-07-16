import TireSpinner from "@/components/TireSpinner";

export default function Loading() {
  return (
    <div className="min-h-screen bg-label-white">
      <div className="bg-rubber py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-xl bg-white/10 animate-pulse" />
            <div>
              <div className="h-8 w-64 bg-white/10 rounded animate-pulse" />
              <div className="mt-2 h-4 w-40 bg-white/10 rounded animate-pulse" />
            </div>
          </div>
        </div>
      </div>
      <TireSpinner message="Loading tires..." />
    </div>
  );
}
