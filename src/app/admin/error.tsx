"use client";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex items-center justify-center min-h-[50vh] px-4">
      <div className="max-w-md w-full text-center">
        <h1 className="text-2xl font-bold text-gray-900">Something went wrong</h1>
        <p className="mt-2 text-sm text-gray-500">{error.message || "An unexpected error occurred."}</p>
        <button
          onClick={reset}
          className="mt-6 px-4 py-2 bg-safety-orange text-white text-sm font-medium rounded hover:bg-orange-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
