"use client";

import { useEffect, useRef, useCallback } from "react";
import Script from "next/script";

interface Props {
  value: string;
  onChange: (address: {
    address1: string;
    city: string;
    state: string;
    zip: string;
  }) => void;
  onInput: (value: string) => void;
  className?: string;
  id?: string;
}

export default function AddressAutocomplete({ value, onChange, onInput, className, id }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  const stableOnChange = useRef(onChange);
  stableOnChange.current = onChange;

  const initAutocomplete = useCallback(() => {
    if (!inputRef.current || !window.google?.maps?.places) return;
    if (autocompleteRef.current) return;

    const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
      types: ["address"],
      componentRestrictions: { country: "us" },
      fields: ["address_components"],
    });

    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      if (!place.address_components) return;

      let streetNumber = "", route = "", city = "", state = "", zip = "";
      for (const comp of place.address_components) {
        const type = comp.types[0];
        if (type === "street_number") streetNumber = comp.long_name;
        if (type === "route") route = comp.short_name;
        if (type === "locality") city = comp.long_name;
        if (type === "administrative_area_level_1") state = comp.short_name;
        if (type === "postal_code") zip = comp.long_name;
      }

      stableOnChange.current({
        address1: `${streetNumber} ${route}`.trim(),
        city,
        state,
        zip,
      });
    });

    autocompleteRef.current = autocomplete;
  }, []);

  useEffect(() => {
    // If the Google Maps script was already loaded (e.g. cached), init immediately
    if (window.google?.maps?.places) {
      initAutocomplete();
    }
  }, [initAutocomplete]);

  return (
    <>
      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY}&libraries=places`}
        strategy="afterInteractive"
        onLoad={initAutocomplete}
      />
      <input
        ref={inputRef}
        type="text"
        id={id}
        value={value}
        onChange={(e) => onInput(e.target.value)}
        placeholder="Start typing your address..."
        autoComplete="off"
        className={className}
      />
    </>
  );
}
