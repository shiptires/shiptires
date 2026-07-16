/**
 * Fetches vehicle thumbnail images from Wikipedia's PageImages API.
 * No API key required. Images are CC-licensed via Wikimedia Commons.
 */

// Override map for models whose Wikipedia article title differs from "Make Model"
const TITLE_OVERRIDES: Record<string, string> = {
  "Ford|F-150": "Ford F-Series",
  "Ford|F-250": "Ford Super Duty",
  "Ford|F-350": "Ford Super Duty",
  "Chevrolet|Silverado 1500": "Chevrolet Silverado",
  "Chevrolet|Silverado 2500": "Chevrolet Silverado",
  "Toyota|GR86": "Toyota GR86",
  "Toyota|Gr86": "Toyota GR86",
  "Toyota|86": "Toyota 86",
  "BMW|3 Series": "BMW 3 Series",
  "BMW|5 Series": "BMW 5 Series",
  "BMW|X3": "BMW X3",
  "BMW|X5": "BMW X5",
  "Mercedes-Benz|C-Class": "Mercedes-Benz C-Class",
  "Mercedes-Benz|E-Class": "Mercedes-Benz E-Class",
  "Mercedes Benz|C-Class": "Mercedes-Benz C-Class",
  "Mercedes Benz|E-Class": "Mercedes-Benz E-Class",
  "Volkswagen|Jetta": "Volkswagen Jetta",
  "Volkswagen|Golf": "Volkswagen Golf",
  "Land Rover|Range Rover": "Range Rover",
  "Land Rover|Range Rover Sport": "Range Rover Sport",
};

export async function getVehicleImage(
  makeName: string,
  modelName: string
): Promise<string | null> {
  try {
    const key = `${makeName}|${modelName}`;
    const title = (
      TITLE_OVERRIDES[key] ?? `${makeName} ${modelName}`
    ).replace(/ /g, "_");

    const url = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=pageimages&format=json&pithumbsize=800`;

    const res = await fetch(url, {
      headers: { "User-Agent": "ShipTires/1.0" },
      next: { revalidate: 3600 }, // cache for 1 hour; retries on failure
    });

    if (!res.ok) return null;

    const data = await res.json();
    const pages = data?.query?.pages;
    if (!pages) return null;

    const page = Object.values(pages)[0] as Record<string, unknown> | undefined;
    if (!page) return null;

    const thumbnail = page.thumbnail as { source?: string } | undefined;
    return thumbnail?.source ?? null;
  } catch {
    return null;
  }
}
