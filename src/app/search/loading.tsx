export default function Loading() {
  return (
    <div className="min-h-screen bg-label-white">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-6" />
        <div className="h-12 w-full bg-gray-100 rounded animate-pulse mb-8" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-lg border border-ink-grey/10 bg-white p-4">
              <div className="h-40 w-full bg-gray-100 rounded animate-pulse mb-3" />
              <div className="h-5 w-48 bg-gray-100 rounded animate-pulse" />
              <div className="mt-2 h-4 w-32 bg-gray-100 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
