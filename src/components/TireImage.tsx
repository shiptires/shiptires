"use client";

import { useState } from "react";
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

/** Image wrapper that shows a tire placeholder when the source URL fails to load. */
export default function TireImage({ src, alt, width, height, className, priority, loading }: TireImageProps) {
  const [failed, setFailed] = useState(false);

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
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      priority={priority}
      loading={priority ? undefined : (loading ?? "lazy")}
      onError={() => setFailed(true)}
    />
  );
}
