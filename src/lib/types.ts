export interface TireSize {
  size: string; // e.g. "225/65R17"
  loadIndex: number;
  speedRating: string;
  price: number; // MSRP estimate
}

export interface TireModel {
  name: string;
  slug: string;
  type: TireType;
  sizes: TireSize[];
  features: string[];
  warranty: string; // e.g. "70,000 miles"
  speedRatings: string[];
  priceRange: [number, number]; // [min, max]
  description: string;
  image?: string;
}

export interface Brand {
  name: string;
  slug: string;
  domain: string; // for logo.dev
  country: string;
  founded: number;
  description: string;
  models: TireModel[];
}

export type TireType =
  | "all-season"
  | "winter"
  | "summer"
  | "performance"
  | "all-terrain"
  | "mud-terrain"
  | "highway"
  | "touring";

export interface TireCategory {
  name: string;
  slug: string;
  type: TireType;
  description: string;
  image: string;
  features: string[];
}

export interface BlogPost {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  date: string;
  author: string;
  image: string;
  readTime: string;
}

export interface VehicleMake {
  MakeId: number;
  MakeName: string;
}

export interface VehicleModel {
  Model_ID: number;
  Model_Name: string;
}

export interface RacingArticle {
  title: string;
  slug: string;
  series: "f1" | "le-mans" | "wec" | "indycar" | "nascar" | "general";
  excerpt: string;
  content: string;
  date: string;
  author: string;
  image: string;
  readTime: string;
  tags: string[];
}

export interface RacingTechArticle {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  date: string;
  author: string;
  image: string;
  readTime: string;
  category: "compounds" | "wet-weather" | "temperature" | "engineering" | "consumer";
  consumerTakeaway: string;
}

export interface TireRanking {
  category: string;
  slug: string;
  description: string;
  tires: {
    rank: number;
    brand: string;
    model: string;
    score: number;
    racingConnection: string;
  }[];
}

export interface QuoteRequest {
  name: string;
  email: string;
  phone: string;
  tireSize: string;
  quantity: number;
  vehicleYear?: string;
  vehicleMake?: string;
  vehicleModel?: string;
  shippingZip: string;
  message?: string;
}
