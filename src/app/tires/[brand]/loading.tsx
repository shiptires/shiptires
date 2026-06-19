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
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-lg border border-ink-grey/10 bg-white p-4">
              <div className="h-40 w-full bg-gray-100 rounded animate-pulse mb-3" />
              <div className="h-5 w-48 bg-gray-100 rounded animate-pulse" />
              <div className="mt-2 h-4 w-32 bg-gray-100 rounded animate-pulse" />
              <div className="mt-3 h-8 w-24 bg-gray-100 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
