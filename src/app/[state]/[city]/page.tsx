import { permanentRedirect } from "next/navigation";
import { states } from "@/data/locations";
import { toLocationSlug } from "@/lib/location-seo";

export async function generateStaticParams() {
  const params: { state: string; city: string }[] = [];
  for (const state of states) {
    for (const city of state.cities) {
      params.push({ state: state.slug, city: city.slug });
    }
  }
  return params;
}

export default async function CityTiresRedirect({
  params,
}: {
  params: Promise<{ state: string; city: string }>;
}) {
  const { state: stateSlug, city: citySlug } = await params;
  const locationCitySlug = toLocationSlug(citySlug);
  permanentRedirect(`/locations/${stateSlug}/${locationCitySlug}`);
}
