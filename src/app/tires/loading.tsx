export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-navy py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="h-9 w-80 bg-white/10 rounded animate-pulse" />
          <div className="mt-3 h-5 w-96 bg-white/10 rounded animate-pulse" />
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center rounded-xl border border-gray-200 bg-white p-4">
              <div className="h-16 w-16 rounded-xl bg-gray-100 animate-pulse mb-3" />
              <div className="h-4 w-20 bg-gray-100 rounded animate-pulse" />
              <div className="mt-1 h-3 w-14 bg-gray-100 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
