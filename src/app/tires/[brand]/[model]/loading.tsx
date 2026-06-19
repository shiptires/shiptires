export default function Loading() {
  return (
    <div className="min-h-screen bg-label-white">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="h-80 bg-gray-100 rounded-lg animate-pulse" />
          <div>
            <div className="h-4 w-48 bg-gray-100 rounded animate-pulse mb-3" />
            <div className="h-8 w-72 bg-gray-200 rounded animate-pulse mb-4" />
            <div className="h-10 w-36 bg-gray-100 rounded animate-pulse mb-6" />
            <div className="space-y-2">
              <div className="h-4 w-full bg-gray-100 rounded animate-pulse" />
              <div className="h-4 w-5/6 bg-gray-100 rounded animate-pulse" />
              <div className="h-4 w-4/6 bg-gray-100 rounded animate-pulse" />
            </div>
            <div className="mt-6 h-12 w-full bg-gray-100 rounded animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}
