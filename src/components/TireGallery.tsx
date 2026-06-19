"use client";

import { useState, useCallback } from "react";
import Image from "next/image";

interface TireGalleryProps {
  images: string[];
  alt: string;
}

const angleLabels = ["Main", "Angle", "Front", "Side", "Side 2", "Detail", "Detail", "Tread", "Tread"];

export default function TireGallery({ images, alt }: TireGalleryProps) {
  const [failedUrls, setFailedUrls] = useState<Set<string>>(new Set());
  const [loadedUrls, setLoadedUrls] = useState<Set<string>>(new Set());
  const [mainIdx, setMainIdx] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIdx, setLightboxIdx] = useState(0);

  const handleError = useCallback((url: string) => {
    setFailedUrls((prev) => {
      const next = new Set(prev);
      next.add(url);
      return next;
    });
  }, []);

  const handleLoad = useCallback((url: string) => {
    setLoadedUrls((prev) => {
      const next = new Set(prev);
      next.add(url);
      return next;
    });
  }, []);

  const gallery = images.filter((url) => !failedUrls.has(url));

  // If main image was filtered out, reset index
  const safeMainIdx = mainIdx >= gallery.length ? 0 : mainIdx;
  const safeLightboxIdx = lightboxIdx >= gallery.length ? 0 : lightboxIdx;

  const openLightbox = (idx: number) => {
    setLightboxIdx(idx);
    setLightboxOpen(true);
  };

  if (gallery.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-12 flex items-center justify-center min-h-[360px]">
        <div className="text-center">
          <svg className="mx-auto h-24 w-24 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={0.5} stroke="currentColor">
            <circle cx="12" cy="12" r="9" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          <p className="mt-3 text-sm text-gray-400">Image coming soon</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div>
        {/* Main image */}
        <button
          type="button"
          onClick={() => openLightbox(safeMainIdx)}
          className="cursor-zoom-in w-full"
          aria-label={`View larger image of ${alt}`}
        >
          <div className="relative bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-200 p-6 flex items-center justify-center min-h-[360px] sm:min-h-[420px]">
            <Image
              src={gallery[safeMainIdx]}
              alt={alt}
              width={400}
              height={400}
              className={`max-h-[350px] sm:max-h-[400px] w-auto object-contain transition-opacity duration-300 ${loadedUrls.has(gallery[safeMainIdx]) ? "opacity-100" : "opacity-0"}`}
              priority
              onLoad={() => handleLoad(gallery[safeMainIdx])}
              onError={() => handleError(gallery[safeMainIdx])}
            />
            <div className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 text-[11px] text-white">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607ZM10.5 7.5v6m3-3h-6" />
              </svg>
              Click to zoom
            </div>
          </div>
        </button>

        {/* Thumbnail strip */}
        {gallery.length > 1 && (
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {gallery.map((img, i) => (
              <button
                key={img}
                type="button"
                onClick={() => { setMainIdx(i); openLightbox(i); }}
                className={`flex-shrink-0 rounded-lg border-2 bg-white p-1.5 transition-colors ${
                  i === safeMainIdx ? "border-safety-orange" : "border-gray-200 hover:border-safety-orange/50"
                }`}
              >
                <Image
                  src={img}
                  alt={`View ${i + 1}`}
                  width={64}
                  height={64}
                  className={`h-14 w-14 object-contain transition-opacity duration-300 ${loadedUrls.has(img) ? "opacity-100" : "opacity-0"}`}
                  onLoad={() => handleLoad(img)}
                  onError={() => handleError(img)}
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxOpen && gallery.length > 0 && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setLightboxOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Image lightbox"
        >
          <button
            onClick={() => setLightboxOpen(false)}
            className="absolute top-4 right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
            aria-label="Close lightbox"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>

          {gallery.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); setLightboxIdx((i) => (i - 1 + gallery.length) % gallery.length); }}
                className="absolute left-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
                aria-label="Previous image"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                </svg>
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setLightboxIdx((i) => (i + 1) % gallery.length); }}
                className="absolute right-16 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
                aria-label="Next image"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </button>
            </>
          )}

          <div className="relative max-h-[85vh] max-w-[90vw] flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
            <Image
              src={gallery[safeLightboxIdx]}
              alt={`${alt} — ${angleLabels[safeLightboxIdx] || "View"}`}
              width={800}
              height={800}
              className={`max-h-[75vh] w-auto object-contain rounded-lg transition-opacity duration-300 ${loadedUrls.has(gallery[safeLightboxIdx]) ? "opacity-100" : "opacity-0"}`}
              priority
              onLoad={() => handleLoad(gallery[safeLightboxIdx])}
              onError={() => handleError(gallery[safeLightboxIdx])}
            />
            {gallery.length > 1 && (
              <div className="mt-4 flex gap-2">
                {gallery.map((img, i) => (
                  <button
                    key={img}
                    onClick={() => setLightboxIdx(i)}
                    className={`relative h-14 w-14 rounded-md overflow-hidden border-2 transition-colors ${
                      i === safeLightboxIdx ? "border-white" : "border-white/20 hover:border-white/50"
                    }`}
                  >
                    <Image src={img} alt="" width={56} height={56} className={`h-full w-full object-cover transition-opacity duration-300 ${loadedUrls.has(img) ? "opacity-100" : "opacity-0"}`} onLoad={() => handleLoad(img)} onError={() => handleError(img)} />
                  </button>
                ))}
              </div>
            )}
            <div className="mt-2 text-center text-sm text-white/70">
              {alt}{gallery.length > 1 ? ` — ${safeLightboxIdx + 1} of ${gallery.length}` : ""}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
