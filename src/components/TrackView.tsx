"use client";

import { useEffect } from "react";
import { trackRecentlyViewed } from "@/components/RecentlyViewed";

interface TrackViewProps {
  id: number;
  brand: string;
  brandSlug: string;
  model: string;
  modelSlug: string;
  size: string;
  sizeSlug: string;
  price: number;
  image?: string;
}

export default function TrackView(props: TrackViewProps) {
  useEffect(() => {
    trackRecentlyViewed(props);
  }, [props.id]); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}
