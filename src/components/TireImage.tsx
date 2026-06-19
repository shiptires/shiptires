"use client";

import { useState, useCallback } from "react";
import Image from "next/image";

interface TireImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  priority?: boolean;
  loading?: "lazy" | "eager";
}

/** Image wrapper that retries on transient errors and shows a tire placeholder on final failure. */
export default function TireImage({ src, alt, width, height, className, priority, loading }: TireImageProps) {
  const [failed, setFailed] = useState(false);
  const [retries, setRetries] = useState(0);
  const [imgKey, setImgKey] = useState(0);

  const handleError = useCallback(() => {
    if (retries < 2) {
      // Retry after a short delay (handles R2 rate limits / transient errors)
      setTimeout(() => {
        setRetries((r) => r + 1);
        setImgKey((k) => k + 1);
      }, 1000 * (retries + 1));
    } else {
      setFailed(true);
    }
  }, [retries]);

  if (failed) {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        strokeWidth={0.5}
        stroke="currentColor"
        className={className}
        style={{ width, height, color: "#d1d5db" }}
        aria-label={alt}
      >
        <circle cx="12" cy="12" r="9" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    );
  }

  return (
    <Image
      key={imgKey}
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      priority={priority}
      loading={priority ? undefined : (loading ?? "lazy")}
      onError={handleError}
    />
  );
}
