"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";

interface TireImageLightboxProps {
  src: string;
  alt: string;
  images?: string[];
  children: React.ReactNode;
}

const angleLabels = ["Main", "Angle", "Front", "Side", "Side 2", "Detail", "Detail", "Tread", "Tread"];

export default function TireImageLightbox({ src, alt, images, children }: TireImageLightboxProps) {
  const [open, setOpen] = useState(false);
  const [idx, setIdx] = useState(0);
  const gallery = images && images.length > 1 ? images : [src];

  const close = useCallback(() => setOpen(false), []);
  const prev = useCallback(() => setIdx((i) => (i - 1 + gallery.length) % gallery.length), [gallery.length]);
  const next = useCallback(() => setIdx((i) => (i + 1) % gallery.length), [gallery.length]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, close, prev, next]);

  return (
    <>
      <button
        type="button"
        onClick={() => { setIdx(0); setOpen(true); }}
        className="cursor-zoom-in"
        aria-label={`View larger image of ${alt}`}
      >
        {children}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={close}
          role="dialog"
          aria-modal="true"
          aria-label="Image lightbox"
        >
          {/* Close button */}
          <button
            onClick={close}
            className="absolute top-4 right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
            aria-label="Close lightbox"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Nav arrows */}
          {gallery.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); prev(); }}
                className="absolute left-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
                aria-label="Previous image"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                </svg>
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); next(); }}
                className="absolute right-16 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
                aria-label="Next image"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </button>
            </>
          )}

          {/* Image */}
          <div
            className="relative max-h-[85vh] max-w-[90vw] flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={gallery[idx]}
              alt={`${alt} — ${angleLabels[idx] || "View"}`}
              width={800}
              height={800}
              className="max-h-[75vh] w-auto object-contain rounded-lg"
              priority
            />

            {/* Thumbnail strip */}
            {gallery.length > 1 && (
              <div className="mt-4 flex gap-2">
                {gallery.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setIdx(i)}
                    className={`relative h-14 w-14 rounded-md overflow-hidden border-2 transition-colors ${
                      i === idx ? "border-white" : "border-white/20 hover:border-white/50"
                    }`}
                  >
                    <Image src={img} alt="" width={56} height={56} className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            <div className="mt-2 text-center text-sm text-white/70">
              {alt}{gallery.length > 1 ? ` — ${idx + 1} of ${gallery.length}` : ""}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
