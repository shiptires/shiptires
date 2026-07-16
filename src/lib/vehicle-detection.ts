import { lookupTireSizes } from "@/data/tire-sizes";
import { toSlug } from "@/lib/db";

// Common vehicle makes for fuzzy matching
const VEHICLE_MAKES: Record<string, string> = {
  toyota: "Toyota", honda: "Honda", ford: "Ford", chevrolet: "Chevrolet",
  chevy: "Chevrolet", nissan: "Nissan", hyundai: "Hyundai", kia: "Kia",
  bmw: "BMW", mercedes: "Mercedes-Benz", "mercedes-benz": "Mercedes-Benz",
  benz: "Mercedes-Benz", audi: "Audi", lexus: "Lexus", subaru: "Subaru",
  mazda: "Mazda", volkswagen: "Volkswagen", vw: "Volkswagen", jeep: "Jeep",
  ram: "Ram", dodge: "Dodge", gmc: "GMC", cadillac: "Cadillac",
  chrysler: "Chrysler", buick: "Buick", lincoln: "Lincoln", acura: "Acura",
  infiniti: "Infiniti", volvo: "Volvo", tesla: "Tesla", porsche: "Porsche",
  "land rover": "Land Rover", landrover: "Land Rover", jaguar: "Jaguar",
  genesis: "Genesis", mitsubishi: "Mitsubishi", mini: "MINI",
};

// Common model names
const VEHICLE_MODELS = new Set([
  "camry", "corolla", "rav4", "highlander", "tacoma", "tundra", "4runner",
  "prius", "sienna", "supra", "venza", "sequoia", "civic", "accord", "cr-v",
  "crv", "pilot", "odyssey", "hr-v", "hrv", "ridgeline", "passport",
  "f-150", "f150", "f-250", "f250", "f-350", "f350", "escape", "explorer",
  "edge", "mustang", "bronco", "ranger", "expedition", "maverick", "fusion",
  "silverado", "equinox", "tahoe", "suburban", "traverse", "malibu", "camaro",
  "corvette", "colorado", "blazer", "trailblazer", "trax", "impala",
  "altima", "rogue", "sentra", "pathfinder", "frontier", "murano", "maxima",
  "kicks", "versa", "titan", "armada",
  "elantra", "tucson", "sonata", "santa fe", "santafe", "palisade", "kona",
  "venue", "ioniq",
  "sorento", "sportage", "telluride", "forte", "k5", "seltos", "carnival",
  "soul", "stinger", "ev6",
  "3-series", "5-series", "x3", "x5", "x1", "x7",
  "c-class", "e-class", "glc", "gle", "gla",
  "a4", "a3", "q5", "q3", "q7",
  "rx", "es", "nx", "is", "gx",
  "outback", "forester", "crosstrek", "impreza", "wrx", "ascent",
  "cx-5", "cx5", "mazda3", "cx-50", "cx50", "cx-30", "cx30", "mx-5",
  "jetta", "tiguan", "atlas", "golf", "passat", "id.4", "taos",
  "wrangler", "grand cherokee", "cherokee", "gladiator", "compass",
  "renegade",
  "1500", "2500", "3500",
  "charger", "challenger", "durango", "hornet",
  "sierra", "terrain", "yukon", "acadia", "canyon",
  "escalade", "xt5", "xt4", "ct5", "lyriq",
  "model 3", "model y", "model s", "model x", "cybertruck",
  "cayenne", "macan", "911", "taycan",
  "cts", "aviator", "corsair", "nautilus",
  "mdx", "rdx", "tlx", "integra",
  "q50", "q60", "qx50", "qx60", "qx80",
  "xc90", "xc60", "xc40", "s60", "v60",
  "outlander", "eclipse cross",
  "defender", "discovery", "range rover", "evoque",
  "g70", "g80", "gv70", "gv80",
]);

export interface VehicleMatch {
  year?: string;
  make: string;
  makeDisplay: string;
  model: string;
  sizes: string[];
  url: string;
}

function inferMakeFromModel(model: string): { make: string; makeDisplay: string } | null {
  const modelToMake: Record<string, string> = {
    camry: "toyota", corolla: "toyota", rav4: "toyota", highlander: "toyota",
    tacoma: "toyota", tundra: "toyota", "4runner": "toyota", prius: "toyota",
    sienna: "toyota", supra: "toyota", venza: "toyota", sequoia: "toyota",
    civic: "honda", accord: "honda", "cr-v": "honda", crv: "honda",
    pilot: "honda", odyssey: "honda", "hr-v": "honda", hrv: "honda",
    ridgeline: "honda", passport: "honda",
    "f-150": "ford", f150: "ford", "f-250": "ford", f250: "ford",
    escape: "ford", explorer: "ford", mustang: "ford", bronco: "ford",
    ranger: "ford", expedition: "ford", maverick: "ford",
    silverado: "chevrolet", equinox: "chevrolet", tahoe: "chevrolet",
    suburban: "chevrolet", malibu: "chevrolet", camaro: "chevrolet",
    corvette: "chevrolet", colorado: "chevrolet", blazer: "chevrolet",
    altima: "nissan", rogue: "nissan", sentra: "nissan", pathfinder: "nissan",
    frontier: "nissan", murano: "nissan", titan: "nissan",
    elantra: "hyundai", tucson: "hyundai", sonata: "hyundai", palisade: "hyundai",
    kona: "hyundai",
    sorento: "kia", sportage: "kia", telluride: "kia", forte: "kia",
    k5: "kia", seltos: "kia", soul: "kia", stinger: "kia",
    wrangler: "jeep", gladiator: "jeep", compass: "jeep", renegade: "jeep",
    outback: "subaru", forester: "subaru", crosstrek: "subaru", wrx: "subaru",
    ascent: "subaru", impreza: "subaru",
    "cx-5": "mazda", cx5: "mazda", mazda3: "mazda", "cx-50": "mazda",
    cx50: "mazda", "cx-30": "mazda", cx30: "mazda",
    jetta: "volkswagen", tiguan: "volkswagen", atlas: "volkswagen",
    golf: "volkswagen",
    charger: "dodge", challenger: "dodge", durango: "dodge",
    sierra: "gmc", terrain: "gmc", yukon: "gmc", acadia: "gmc",
    escalade: "cadillac",
    cayenne: "porsche", macan: "porsche", taycan: "porsche",
    rx: "lexus", es: "lexus", nx: "lexus", is: "lexus", gx: "lexus",
    mdx: "acura", rdx: "acura", tlx: "acura", integra: "acura",
  };
  const makeKey = modelToMake[model];
  if (!makeKey) return null;
  return { make: makeKey, makeDisplay: VEHICLE_MAKES[makeKey] };
}

export function detectVehicle(query: string): VehicleMatch | null {
  if (!query || query.length < 3) return null;
  const words = query.trim().toLowerCase().split(/\s+/);
  if (words.length < 1 || words.length > 5) return null;

  let year: string | undefined;
  let make: string | undefined;
  let makeDisplay: string | undefined;
  let modelWords: string[] = [];

  // Extract year if present (2000-2027)
  for (let i = 0; i < words.length; i++) {
    if (/^20[0-2]\d$/.test(words[i])) {
      year = words[i];
      words.splice(i, 1);
      break;
    }
  }

  // Try to find make
  for (let i = 0; i < words.length; i++) {
    if (VEHICLE_MAKES[words[i]]) {
      make = words[i];
      makeDisplay = VEHICLE_MAKES[words[i]];
      modelWords = [...words.slice(0, i), ...words.slice(i + 1)];
      break;
    }
    if (i < words.length - 1) {
      const twoWord = `${words[i]} ${words[i + 1]}`;
      if (VEHICLE_MAKES[twoWord]) {
        make = twoWord;
        makeDisplay = VEHICLE_MAKES[twoWord];
        modelWords = [...words.slice(0, i), ...words.slice(i + 2)];
        break;
      }
    }
  }

  // If no make found, check if any word is a known model (e.g. just "camry")
  if (!make || !makeDisplay) {
    for (const word of words) {
      if (VEHICLE_MODELS.has(word)) {
        const inferred = inferMakeFromModel(word);
        if (inferred) {
          const sizes = lookupTireSizes(inferred.make, word);
          const mSlug = toSlug(inferred.makeDisplay);
          const modelSlug = toSlug(word);
          return {
            year,
            make: inferred.make,
            makeDisplay: inferred.makeDisplay,
            model: word,
            sizes,
            url: year
              ? `/tires/vehicle/${mSlug}/${modelSlug}/${year}`
              : `/tires/vehicle/${mSlug}/${modelSlug}`,
          };
        }
      }
    }
    return null;
  }

  const model = modelWords.join(" ") || "";
  if (!model && !year) return null;

  if (model) {
    const sizes = lookupTireSizes(make, model);
    const makeSlug = toSlug(makeDisplay);
    const modelSlug = toSlug(model);
    return {
      year,
      make,
      makeDisplay,
      model,
      sizes,
      url: year
        ? `/tires/vehicle/${makeSlug}/${modelSlug}/${year}`
        : `/tires/vehicle/${makeSlug}/${modelSlug}`,
    };
  }

  return null;
}

export function parseFlexibleSize(query: string): string | null {
  const q = query.trim();
  const standard = q.match(/^(?:LT|P)?(\d{3})[\/ ](\d{2,3})(?:R|[\/ ])(\d{2})$/i);
  if (standard) return `${standard[1]}/${standard[2]}R${standard[3]}`;
  const spaced = q.match(/^(\d{3})[\s\-]+(\d{2,3})[\s\-]+(\d{2})$/);
  if (spaced) return `${spaced[1]}/${spaced[2]}R${spaced[3]}`;
  return null;
}

export function parseRimSize(query: string): string | null {
  const q = query.trim();
  const rimOnly = q.match(/^(\d{2})\s*(?:inch|in|"|''|tires?)?$/i);
  if (rimOnly && parseInt(rimOnly[1]) >= 13 && parseInt(rimOnly[1]) <= 26) {
    return rimOnly[1];
  }
  return null;
}
