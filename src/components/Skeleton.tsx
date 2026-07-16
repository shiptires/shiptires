"use client";

export function SkeletonBox({ className = "" }: { className?: string }) {
  return <div className={`animate-shimmer rounded ${className}`} />;
}

export function ProductCardSkeleton() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <SkeletonBox className="h-40 w-full rounded-lg" />
      <SkeletonBox className="mt-3 h-4 w-3/4" />
      <SkeletonBox className="mt-2 h-3 w-1/2" />
      <SkeletonBox className="mt-3 h-6 w-1/3" />
      <SkeletonBox className="mt-3 h-9 w-full rounded-lg" />
    </div>
  );
}

export function CartItemSkeleton() {
  return (
    <div className="flex gap-3 py-4">
      <SkeletonBox className="h-16 w-16 rounded-lg flex-shrink-0" />
      <div className="flex-1">
        <SkeletonBox className="h-4 w-3/4" />
        <SkeletonBox className="mt-1 h-3 w-1/2" />
        <div className="mt-2 flex items-center justify-between">
          <SkeletonBox className="h-8 w-24" />
          <SkeletonBox className="h-4 w-16" />
        </div>
      </div>
    </div>
  );
}

export function SearchResultSkeleton() {
  return (
    <div className="flex items-center gap-3 p-3">
      <SkeletonBox className="h-12 w-12 rounded-lg flex-shrink-0" />
      <div className="flex-1">
        <SkeletonBox className="h-4 w-3/4" />
        <SkeletonBox className="mt-1.5 h-3 w-1/2" />
      </div>
      <SkeletonBox className="h-5 w-16 flex-shrink-0" />
    </div>
  );
}
