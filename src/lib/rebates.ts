const API_BASE = "https://app.tireweblibrary.com/api/v1";
const API_KEY = process.env.TIRE_API_KEY || "tl_live_b156d4176d1919835462908551f0955b";

export interface Rebate {
  id: number;
  name: string;
  description: string;
  imageUrl: string | null;
  imageHorizontalUrl: string | null;
  imagePreviewUrl: string | null;
  formUrl: string | null;
  startDate: string;
  endDate: string;
  status: string;
  brandName: string;
  amount: number;
  qualifyingModels: { id: number; name: string; description: string; imageUrl: string | null }[];
}

interface RebateListItem {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  status: string;
}

interface RebateDetail {
  id: number;
  name: string;
  description: string;
  image_url: string | null;
  image_horizontal_url: string | null;
  image_preview_url: string | null;
  form_url: string | null;
  start_date: string;
  end_date: string;
  status: string;
  rebate_items: {
    amount: number;
    amount_reason: string;
    quantity_required: number;
    tire_patterns: { id: number; name: string; description: string; image_url: string | null }[];
  }[];
}

// Cache rebates for 1 hour in memory
let _cachedRebates: Rebate[] | null = null;
let _cacheTime = 0;
const CACHE_TTL = 3600_000; // 1 hour

function extractBrand(name: string): string {
  // "Continental Get a $110 Rebate" -> "Continental"
  // "Goodyear Get up to $180 Back" -> "Goodyear"
  const match = name.match(/^([A-Za-z]+(?:\s[A-Za-z]+)?)\s+(?:Get|Buy|Save|Receive|Earn)/i);
  return match ? match[1] : name.split(" ")[0];
}

function extractAmount(name: string): number {
  const match = name.match(/\$(\d+)/);
  return match ? parseInt(match[1]) : 0;
}

export async function getActiveRebates(): Promise<Rebate[]> {
  if (_cachedRebates && Date.now() - _cacheTime < CACHE_TTL) {
    return _cachedRebates;
  }

  try {
    // Fetch list of rebates
    const listRes = await fetch(`${API_BASE}/rebate`, {
      headers: { "x-api-key": API_KEY },
      next: { revalidate: 3600 },
    });

    if (!listRes.ok) return _cachedRebates || [];

    const listData = await listRes.json();
    const activeRebates = (listData.data as RebateListItem[]).filter(
      (r) => r.status === "Active"
    );

    // Fetch details for each active rebate (in parallel, max 10)
    const detailPromises = activeRebates.slice(0, 10).map(async (r) => {
      try {
        const detailRes = await fetch(`${API_BASE}/rebate/${r.id}`, {
          headers: { "x-api-key": API_KEY },
          next: { revalidate: 3600 },
        });
        if (!detailRes.ok) return null;
        return (await detailRes.json()) as RebateDetail;
      } catch {
        return null;
      }
    });

    const details = (await Promise.all(detailPromises)).filter(Boolean) as RebateDetail[];

    const rebates: Rebate[] = details.map((d) => {
      const firstItem = d.rebate_items?.[0];
      return {
        id: d.id,
        name: d.name,
        description: d.description || "",
        imageUrl: d.image_url,
        imageHorizontalUrl: d.image_horizontal_url,
        imagePreviewUrl: d.image_preview_url,
        formUrl: d.form_url,
        startDate: d.start_date,
        endDate: d.end_date,
        status: d.status,
        brandName: extractBrand(d.name),
        amount: firstItem?.amount || extractAmount(d.name),
        qualifyingModels: (firstItem?.tire_patterns || []).map((p) => ({
          id: p.id,
          name: p.name,
          description: p.description || "",
          imageUrl: p.image_url,
        })),
      };
    });

    _cachedRebates = rebates;
    _cacheTime = Date.now();
    return rebates;
  } catch {
    return _cachedRebates || [];
  }
}

export function getRebatesForBrand(rebates: Rebate[], brandName: string): Rebate[] {
  const lower = brandName.toLowerCase();
  return rebates.filter((r) => r.brandName.toLowerCase() === lower);
}
