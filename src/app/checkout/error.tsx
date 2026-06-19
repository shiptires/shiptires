"use client";

export default function CheckoutError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="bg-gray-50 min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-lg w-full text-center">
        <h1 className="text-2xl font-bold text-gray-900">Checkout Error</h1>
        <pre className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-left text-xs text-red-800 overflow-auto whitespace-pre-wrap">
          {error.message}
          {"\n\n"}
          {error.stack}
        </pre>
        <button
          onClick={reset}
          className="mt-6 inline-block rounded-lg bg-orange px-6 py-3 text-sm font-bold text-white hover:bg-orange-dark transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
