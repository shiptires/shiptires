/** Raw database row interfaces — match SQLite column names exactly */

export interface TireRow {
  id: number;
  name: string;
  item_number: string;
  tire_model_id: number | null;
  tire_make_id: number | null;
  make_name: string;
  make_image_url: string | null;
  model_name: string;
  width: string | null;
  aspect_ratio: string | null;
  rim_size: string | null;
  section_width: string | null;
  diameter_overall: string | null;
  load_rating: string | null;
  speed_rating: string | null;
  ply_rating: string | null;
  load_range: string | null;
  load_capacity_single: string | null;
  load_capacity_dual: string | null;
  max_inflation_pressure: string | null;
  tread_depth: string | null;
  weight: string | null;
  utqg: string | null;
  season: string | null;
  terrain: string | null;
  category: string | null;
  studdable: number | null;
  three_pmsf: number | null;
  run_flat: number | null;
  mud_and_snow: number | null;
  price_map: number | null;
  warranty: string | null;
  gm_code: string | null;
  upc: string | null;
  ean: string | null;
  asin: string | null;
  image_url_1: string | null;
  image_url_2: string | null;
  image_url_3: string | null;
  image_url_4: string | null;
  image_url_5: string | null;
  image_url_6: string | null;
  image_url_7: string | null;
  image_url_8: string | null;
  image_url_9: string | null;
  thumbnail_url: string | null;
  angle_image_url: string | null;
  front_image_url: string | null;
  side_image_url: string | null;
  side2_image_url: string | null;
  local_thumbnail: string | null;
  local_angle: string | null;
  local_front: string | null;
  local_side: string | null;
  local_side2: string | null;
  has_detail: number;
  updated_at: string;
}

export interface ManufacturerRow {
  id: number;
  name: string;
  image_url: string | null;
  local_logo: string | null;
  dot_reg_url: string | null;
  updated_at: string;
}

/** Aggregated brand info from GROUP BY queries */
export interface BrandSummaryRow {
  make_name: string;
  make_image_url: string | null;
  local_logo: string | null;
  tire_count: number;
  model_count: number;
}

/** Model summary from GROUP BY queries */
export interface ModelSummaryRow {
  model_name: string;
  tire_count: number;
  min_price: number | null;
  max_price: number | null;
  season: string | null;
  terrain: string | null;
  category: string | null;
  image_url_1: string | null;
}

export interface SearchParams {
  brand?: string;
  size?: string;
  width?: string;
  aspectRatio?: string;
  rimSize?: string;
  season?: string;
  terrain?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  query?: string;
  page?: number;
  limit?: number;
}

export interface SearchResult {
  tires: TireRow[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
