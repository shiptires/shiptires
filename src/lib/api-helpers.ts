const NHTSA_BASE = "https://vpic.nhtsa.dot.gov/api/vehicles";

export async function fetchMakes() {
  const res = await fetch(
    `${NHTSA_BASE}/GetMakesForVehicleType/car?format=json`,
    { next: { revalidate: 86400 } }
  );
  if (!res.ok) throw new Error("Failed to fetch makes");
  const data = await res.json();
  return data.Results as { MakeId: number; MakeName: string }[];
}

export async function fetchModels(make: string, year: string) {
  const res = await fetch(
    `${NHTSA_BASE}/GetModelsForMakeYear/make/${encodeURIComponent(make)}/modelyear/${year}?format=json`,
    { next: { revalidate: 86400 } }
  );
  if (!res.ok) throw new Error("Failed to fetch models");
  const data = await res.json();
  return data.Results as { Model_ID: number; Model_Name: string }[];
}

export async function fetchTireSizes(
  make: string,
  model: string,
  year: string
) {
  try {
    const res = await fetch(
      `/api/vehicle/tires?make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}&year=${year}`
    );
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export function getLogoUrl(domain: string): string {
  const token = process.env.NEXT_PUBLIC_LOGO_DEV_TOKEN || "pk_ZRXBnppQSK6bIlXZ0EiXIg";
  return `https://img.logo.dev/${domain}?token=${token}&size=120&format=png`;
}

export function parseTireSize(input: string): {
  width: number;
  aspectRatio: number;
  diameter: number;
} | null {
  const match = input.match(/^(\d{3})\/(\d{2,3})R(\d{2})$/i);
  if (!match) return null;
  return {
    width: parseInt(match[1]),
    aspectRatio: parseInt(match[2]),
    diameter: parseInt(match[3]),
  };
}

export const currentYear = new Date().getFullYear();
export const yearRange = Array.from(
  { length: 30 },
  (_, i) => currentYear + 1 - i
);
