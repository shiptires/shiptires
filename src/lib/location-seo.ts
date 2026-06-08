import { brands } from "@/data/brands";
import { states } from "@/data/locations";
import type { Brand, TireModel, TireSize } from "@/lib/types";
import type { CityData, StateData } from "@/data/locations";

// ---------------------------------------------------------------------------
// Slug Utilities
// ---------------------------------------------------------------------------

/** Convert tire size to URL-safe slug: "225/65R17" → "225-65r17" */
export function sizeToSlug(size: string): string {
  return size.toLowerCase().replace(/\//g, "-").replace(/\./g, "-");
}

/** Convert slug back to display format: "225-65r17" → "225/65R17" */
export function slugToDisplaySize(slug: string): string {
  const std = slug.match(/^(\d+)-(\d+)r(\d+)$/i);
  if (std) return `${std[1]}/${std[2]}R${std[3]}`;
  const special = slug.match(/^(\d+)x(\d+)-(\d+)r(\d+)$/i);
  if (special) return `${special[1]}X${special[2]}.${special[3]}R${special[4]}`;
  return slug.toUpperCase();
}

/** Strip "-tires" suffix from city slug for clean /locations/ URLs */
export function toLocationSlug(citySlug: string): string {
  return citySlug.replace(/-tires$/, "");
}

// ---------------------------------------------------------------------------
// Brand / Size Lookups
// ---------------------------------------------------------------------------

export interface BrandSizeEntry {
  size: string;
  slug: string;
  lowestPrice: number;
  highestPrice: number;
  models: { model: TireModel; sizeInfo: TireSize }[];
}

/** All unique sizes for a brand, with the models that carry each size */
export function getBrandUniqueSizes(brand: Brand): BrandSizeEntry[] {
  const map = new Map<string, { model: TireModel; sizeInfo: TireSize }[]>();

  for (const model of brand.models) {
    for (const s of model.sizes) {
      const key = s.size;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push({ model, sizeInfo: s });
    }
  }

  return Array.from(map.entries())
    .map(([size, models]) => {
      const prices = models.map((m) => m.sizeInfo.price);
      return {
        size,
        slug: sizeToSlug(size),
        lowestPrice: Math.min(...prices),
        highestPrice: Math.max(...prices),
        models,
      };
    })
    .sort((a, b) => a.size.localeCompare(b.size));
}

/** Models from one brand that carry a specific size (by slug) */
export function getBrandModelsForSize(
  brand: Brand,
  sizeSlug: string
): { model: TireModel; sizeInfo: TireSize }[] {
  const results: { model: TireModel; sizeInfo: TireSize }[] = [];
  for (const model of brand.models) {
    for (const s of model.sizes) {
      if (sizeToSlug(s.size) === sizeSlug) {
        results.push({ model, sizeInfo: s });
      }
    }
  }
  return results;
}

/** Other brands offering the same size */
export function getOtherBrandsWithSize(
  currentBrandSlug: string,
  sizeSlug: string
): { brand: Brand; lowestPrice: number; modelCount: number }[] {
  return brands
    .filter((b) => b.slug !== currentBrandSlug)
    .map((brand) => {
      const models = getBrandModelsForSize(brand, sizeSlug);
      if (models.length === 0) return null;
      return {
        brand,
        lowestPrice: Math.min(...models.map((m) => m.sizeInfo.price)),
        modelCount: models.length,
      };
    })
    .filter(Boolean) as { brand: Brand; lowestPrice: number; modelCount: number }[];
}

// ---------------------------------------------------------------------------
// Vehicle ↔ Size Mapping
// ---------------------------------------------------------------------------

const sizeVehicles: Record<string, string[]> = {
  "195/65R15": ["Honda Fit", "Toyota Prius", "Hyundai Accent", "Nissan Versa", "Kia Rio"],
  "205/55R16": ["Honda Civic", "Toyota Corolla", "VW Jetta", "Mazda3", "Subaru Impreza"],
  "205/60R16": ["Mazda3", "Kia Soul"],
  "215/45R17": ["Mazda3", "Bridgestone Turanza"],
  "215/50R17": ["Honda Insight", "Acura Integra", "Kia Forte"],
  "215/55R17": ["Toyota Camry", "Nissan Altima", "Hyundai Sonata", "Kia K5", "Volvo S60"],
  "215/55R18": ["Hyundai Kona", "Volkswagen Taos", "Volvo XC40"],
  "215/60R17": ["Nissan Kicks", "Kia Seltos", "Chevrolet Trailblazer"],
  "215/65R17": ["Volkswagen Tiguan", "Jeep Compass", "Audi Q3"],
  "225/40R18": ["Michelin Pilot Sport", "Subaru WRX", "VW GTI"],
  "225/45R17": ["Honda Accord", "Subaru WRX", "VW Golf GTI", "Audi A3"],
  "225/45R18": ["BMW 3 Series", "BMW 4 Series", "Mercedes C-Class"],
  "225/50R17": ["Honda Accord", "Subaru Legacy", "Audi A4", "Infiniti Q50"],
  "225/50R18": ["Acura TLX", "Lincoln Corsair", "Cadillac CT5"],
  "225/55R17": ["Chevrolet Malibu", "Volkswagen Passat"],
  "225/55R18": ["Dodge Hornet", "Jeep Cherokee"],
  "225/55R19": ["Hyundai Ioniq 5", "Kia EV6", "Mazda CX-50"],
  "225/60R17": ["Hyundai Tucson", "Kia Sportage", "Subaru Forester"],
  "225/60R18": ["Ford Escape", "Ford Maverick", "Buick Encore"],
  "225/65R17": ["Toyota RAV4", "Honda CR-V", "Ford Escape", "Subaru Outback", "Chevrolet Equinox", "Mazda CX-5"],
  "235/35R19": ["VW GTI", "Michelin Pilot Sport 4S"],
  "235/40R18": ["Honda Accord", "Subaru WRX"],
  "235/40R19": ["Acura Integra", "Volvo S60"],
  "235/45R18": ["Toyota Camry", "Honda Accord", "Hyundai Sonata", "Kia K5", "Nissan Altima"],
  "235/50R18": ["Acura RDX"],
  "235/50R19": ["Volvo XC40", "Kia Carnival"],
  "235/55R17": ["Chevrolet Malibu"],
  "235/55R18": ["Honda Passport", "Goodyear Assurance WeatherReady"],
  "235/55R19": ["Hyundai Ioniq 5", "Kia EV6", "Hyundai Santa Fe"],
  "235/55R20": ["Lexus RX", "Nissan Murano", "Cadillac XT5", "Buick Enclave"],
  "235/60R18": ["Honda CR-V", "Mercedes GLC", "Volvo XC60", "Ford Edge", "Acura RDX"],
  "235/65R17": ["Hyundai Santa Fe", "Kia Sorento", "Buick Enclave", "GMC Acadia"],
  "235/65R18": ["Lexus RX", "Cadillac XT5"],
  "235/70R16": ["Michelin Defender LTX", "Goodyear Wrangler AT"],
  "245/40R18": ["Audi A4", "BMW 3 Series"],
  "245/40R19": ["Audi A4", "BMW 3 Series"],
  "245/45R18": ["Nissan Maxima", "Lexus IS"],
  "245/45R19": ["Toyota Supra"],
  "245/45R20": ["Dodge Charger", "Dodge Challenger"],
  "245/50R18": ["BMW 5 Series"],
  "245/50R20": ["Hyundai Palisade", "Kia Telluride", "Acura MDX", "Infiniti QX60"],
  "245/60R18": ["Hyundai Palisade", "Kia Telluride", "Acura MDX"],
  "245/65R17": ["Subaru Ascent"],
  "245/70R17": ["Ford Ranger"],
  "255/35R19": ["Tesla Model 3", "BMW 3 Series", "Audi A5"],
  "255/40R19": ["BMW 5 Series"],
  "255/45R19": ["Mercedes GLE"],
  "255/45R20": ["Tesla Model Y", "Hyundai Ioniq 5", "Kia EV6", "Lincoln Corsair"],
  "255/50R20": ["Ford Explorer", "Kia Telluride", "Acura MDX", "Infiniti QX60"],
  "255/55R18": ["BMW X5", "Porsche Cayenne"],
  "255/55R19": ["Land Rover Range Rover Sport", "Land Rover Discovery"],
  "255/55R20": ["Chevrolet Tahoe", "Cadillac Escalade", "Lincoln Aviator", "Buick Enclave"],
  "255/60R18": ["Nissan Pathfinder"],
  "255/65R18": ["Jeep Grand Cherokee"],
  "255/65R19": ["Land Rover Defender"],
  "255/70R18": ["Michelin Defender LTX"],
  "255/75R17": ["Jeep Wrangler", "Jeep Gladiator"],
  "265/35R18": ["BMW M3", "BMW M4"],
  "265/45R20": ["Honda Passport", "Honda Ridgeline"],
  "265/50R20": ["Jeep Grand Cherokee", "Dodge Durango"],
  "265/55R19": ["Lexus GX"],
  "265/60R18": ["Nissan Pathfinder", "Jeep Grand Cherokee", "Dodge Durango"],
  "265/65R17": ["Toyota Tacoma", "GMC Canyon", "Nissan Frontier"],
  "265/65R18": ["Nissan Frontier"],
  "265/70R16": ["Toyota Tacoma"],
  "265/70R17": ["Ford F-150", "Chevrolet Silverado", "Toyota Tacoma", "GMC Sierra", "Toyota 4Runner"],
  "275/35R19": ["BMW M3", "BMW M4", "Michelin Pilot Sport 4S"],
  "275/35R20": ["BMW 7 Series"],
  "275/40R20": ["Dodge Challenger"],
  "275/40R21": ["BMW X5", "Volvo XC90"],
  "275/40R22": ["Lincoln Aviator", "Jeep Grand Wagoneer"],
  "275/45R20": ["BMW X5"],
  "275/45R21": ["Land Rover Range Rover", "Land Rover Discovery"],
  "275/50R20": ["BMW X7", "Lincoln Navigator", "Mercedes GLS"],
  "275/50R22": ["Cadillac Escalade", "Toyota Sequoia", "Infiniti QX80"],
  "275/55R20": ["Ram 1500", "Toyota Tundra", "Chevrolet Tahoe", "Ford Expedition", "GMC Yukon", "Land Rover Defender"],
  "275/60R20": ["Michelin Defender LTX"],
  "275/65R18": ["Ford F-150", "Ram 1500", "Toyota Tundra", "Chevrolet Silverado", "GMC Sierra", "Toyota 4Runner"],
  "275/70R16": ["Toyota Tacoma"],
  "275/70R18": ["Ford F-250", "Ford F-350", "Ram 2500", "Ram 3500"],
  "285/30R20": ["BMW M3", "BMW M4"],
  "285/40R21": ["Audi Q7", "Porsche Macan"],
  "285/40R22": ["BMW X7", "Mercedes GLS", "Cadillac Escalade", "Lincoln Navigator"],
  "285/45R22": ["Chevrolet Tahoe", "GMC Yukon", "Jeep Grand Wagoneer"],
  "285/60R20": ["Ram 2500", "Ram 3500"],
  "285/65R20": ["Tesla Cybertruck"],
  "285/70R17": ["Jeep Wrangler", "Ford Bronco", "Jeep Gladiator"],
  "285/75R16": ["Michelin Defender LTX"],
  "295/30R20": ["Chevrolet Corvette"],
  "305/30R20": ["Chevrolet Corvette", "Michelin Pilot Sport 4S"],
  "305/30R21": ["Porsche 911"],
  "315/70R17": ["Jeep Wrangler", "Goodyear Wrangler AT Adventure"],
};

export function getVehiclesForSize(size: string): string[] {
  return sizeVehicles[size] || [];
}

// ---------------------------------------------------------------------------
// Tire Size Parsing
// ---------------------------------------------------------------------------

export function parseTireSize(size: string): {
  width: number;
  aspectRatio: number;
  rimDiameter: number;
  sidewall: number;
  diameter: number;
} | null {
  const m = size.match(/^(\d+)\/(\d+)R(\d+)$/);
  if (!m) return null;
  const width = parseInt(m[1]);
  const aspectRatio = parseInt(m[2]);
  const rimDiameter = parseInt(m[3]);
  const sidewallMm = (width * aspectRatio) / 100;
  const sidewallIn = sidewallMm / 25.4;
  const diameter = rimDiameter + 2 * sidewallIn;
  return { width, aspectRatio, rimDiameter, sidewall: Math.round(sidewallMm * 10) / 10, diameter: Math.round(diameter * 10) / 10 };
}

// ---------------------------------------------------------------------------
// Location Lookups
// ---------------------------------------------------------------------------

export function findState(stateSlug: string): StateData | undefined {
  return states.find((s) => s.slug === stateSlug);
}

export function findCity(state: StateData, locationSlug: string): CityData | undefined {
  return state.cities.find((c) => toLocationSlug(c.slug) === locationSlug);
}

export function findBrand(brandSlug: string): Brand | undefined {
  return brands.find((b) => b.slug === brandSlug);
}

// ---------------------------------------------------------------------------
// SEO Content Helpers
// ---------------------------------------------------------------------------

const typeLabels: Record<string, string> = {
  "all-season": "All-Season",
  winter: "Winter",
  summer: "Summer",
  performance: "Performance",
  "all-terrain": "All-Terrain",
  "mud-terrain": "Mud-Terrain",
  highway: "Highway",
  touring: "Touring",
};

export function getTypeLabel(type: string): string {
  return typeLabels[type] || type;
}

/** Climate description by state for unique content */
const stateClimate: Record<string, string> = {
  alabama: "hot summers and mild winters",
  alaska: "extreme cold, ice, and snow",
  arizona: "intense desert heat and dry conditions",
  arkansas: "hot, humid summers and mild winters",
  california: "varied climates from coastal fog to inland heat",
  colorado: "snowy mountain passes and dry plains",
  connecticut: "cold, snowy winters and warm summers",
  delaware: "moderate coastal climate with occasional storms",
  florida: "tropical heat, heavy rain, and hurricane season",
  georgia: "hot, humid summers and mild winters",
  hawaii: "tropical conditions with occasional heavy rain",
  idaho: "cold winters with mountain snow and warm summers",
  illinois: "harsh winters, hot summers, and lake-effect conditions",
  indiana: "cold, snowy winters and humid summers",
  iowa: "extreme seasonal swings from hot to sub-zero",
  kansas: "severe weather, extreme heat, and ice storms",
  kentucky: "humid summers and moderate winter snowfall",
  louisiana: "subtropical heat, heavy rainfall, and flooding",
  maine: "harsh winters with heavy snow and ice",
  maryland: "hot, humid summers and moderate winters",
  massachusetts: "cold, snowy winters and warm coastal summers",
  michigan: "heavy lake-effect snow and cold winters",
  minnesota: "sub-zero winters and heavy snowfall",
  mississippi: "hot, humid conditions year-round",
  missouri: "ice storms, hot summers, and severe weather",
  montana: "extreme cold, mountain snow, and wind",
  nebraska: "severe winter cold and hot summer plains",
  nevada: "extreme desert heat and mountain snow",
  "new-hampshire": "heavy snow, ice, and cold mountain winters",
  "new-jersey": "hot summers and cold, wet winters",
  "new-mexico": "arid desert heat and mountain cold",
  "new-york": "cold, snowy winters and urban driving",
  "north-carolina": "humid summers and mountain winter weather",
  "north-dakota": "extreme cold and blizzard conditions",
  ohio: "lake-effect snow and freeze-thaw cycles",
  oklahoma: "ice storms, tornadoes, and summer heat",
  oregon: "wet Pacific Northwest rain and mountain snow",
  pennsylvania: "cold winters with ice and heavy snow",
  "rhode-island": "coastal weather with cold, wet winters",
  "south-carolina": "hot, humid summers and mild winters",
  "south-dakota": "extreme cold and Great Plains weather",
  tennessee: "humid summers and occasional winter ice",
  texas: "extreme heat, flash floods, and varied terrain",
  utah: "mountain snow, desert heat, and altitude changes",
  vermont: "heavy snow, ice, and cold mountain winters",
  virginia: "humid summers and occasional winter storms",
  washington: "wet coastal rain and Cascade mountain snow",
  "west-virginia": "mountain roads with ice and snow",
  wisconsin: "sub-zero winters and heavy lake-effect snow",
  wyoming: "extreme wind, cold, and mountain conditions",
};

export function getStateClimate(stateSlug: string): string {
  return stateClimate[stateSlug] || "varied seasonal conditions";
}

/** Population-based city tier for content variation */
export function getCityTier(population: number): "metro" | "large" | "mid" | "small" {
  if (population >= 500000) return "metro";
  if (population >= 150000) return "large";
  if (population >= 50000) return "mid";
  return "small";
}

/** Unique intro paragraph for city+brand+size pages */
export function generateSizePageIntro(
  cityName: string,
  stateAbbr: string,
  stateName: string,
  stateSlug: string,
  brandName: string,
  displaySize: string,
  vehicles: string[],
  lowestPrice: number,
  population: number
): string {
  const tier = getCityTier(population);
  const climate = getStateClimate(stateSlug);
  const vehicleText =
    vehicles.length > 0
      ? `This size commonly fits the ${vehicles.slice(0, 3).join(", ")}${vehicles.length > 3 ? `, and ${vehicles.length - 3} more popular vehicles` : ""}.`
      : "";

  const intros: Record<string, string> = {
    metro: `Looking for ${brandName} ${displaySize} tires in ${cityName}, ${stateAbbr}? Ship.Tires delivers free to the ${cityName} metro area — one of the largest markets in ${stateName}. With ${climate}, choosing the right tires matters for the ${(population / 1000000).toFixed(1)}M+ residents navigating ${cityName} roads daily. ${vehicleText} Prices start at $${lowestPrice} per tire with free delivery to your door or local installer.`,
    large: `Ship.Tires offers ${brandName} ${displaySize} tires with free shipping to ${cityName}, ${stateAbbr}. As a major ${stateName} city, ${cityName} drivers face ${climate} — and the right tires make all the difference for safe daily driving. ${vehicleText} Starting at $${lowestPrice} per tire, we deliver directly to your home or preferred ${cityName} tire shop.`,
    mid: `Get ${brandName} ${displaySize} tires shipped free to ${cityName}, ${stateAbbr}. Drivers across the ${cityName} area deal with ${climate}, and ${brandName} tires are engineered to handle exactly these conditions. ${vehicleText} With prices from $${lowestPrice} per tire and free delivery, getting quality tires in ${cityName} has never been easier.`,
    small: `Need ${brandName} ${displaySize} tires in ${cityName}, ${stateAbbr}? Ship.Tires delivers free even to smaller ${stateName} communities. With ${climate} to contend with, reliable tires are essential for ${cityName} drivers. ${vehicleText} Starting at just $${lowestPrice} per tire, we ship directly to your address or any installer in the ${cityName} area.`,
  };

  return intros[tier];
}

/** Unique intro for city+brand pages (no specific size) */
export function generateBrandPageIntro(
  cityName: string,
  stateAbbr: string,
  stateName: string,
  stateSlug: string,
  brand: Brand,
  totalSizes: number,
  population: number
): string {
  const climate = getStateClimate(stateSlug);
  return `Browse the full ${brand.name} tire lineup available for free shipping to ${cityName}, ${stateAbbr}. Founded in ${brand.founded} in ${brand.country}, ${brand.name} offers ${brand.models.length} tire lines across ${totalSizes} sizes — from all-season touring tires to high-performance and all-terrain options. ${cityName} drivers face ${climate}, and ${brand.name} engineers tires to deliver confident performance in every condition. Every ${brand.name} tire ships free to your door or any ${cityName}-area installer.`;
}
