import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 minute timeout for scraping

/**
 * Vercel Cron endpoint — scrapes competitor prices weekly (Monday 6am UTC).
 * Runs a lightweight subset of the scraper inline (no child process).
 *
 * For full scraping, run: node scripts/scrape-competitor-prices.mjs --source all --limit 500
 */
export async function GET(request: Request) {
  // Validate cron secret
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startTime = Date.now();
  const results = { simpletire: 0, tireseasy: 0, gigatires: 0, errors: 0 };

  try {
    // Scrape a subset from each source inline
    // SimpleTire uses JSON API, others use HTML with JSON-LD
    const sources = ["simpletire", "tireseasy", "gigatires"] as const;

    for (const source of sources) {
      try {
        const count = await scrapeSourceSubset(source, 300);
        results[source] = count;
      } catch (e) {
        console.error(`[cron] Error scraping ${source}:`, e);
        results.errors++;
      }
    }
  } catch (e) {
    console.error("[cron] Scrape failed:", e);
    return NextResponse.json(
      { error: "Scrape failed", details: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  return NextResponse.json({
    ok: true,
    results,
    elapsed: `${elapsed}s`,
  });
}

const USER_AGENT = "ShipTires-CronBot/1.0 (+https://ship.tires)";
const RATE_DELAY_MS = 1000;

async function rateLimitedFetch(url: string): Promise<string | null> {
  await new Promise((r) => setTimeout(r, RATE_DELAY_MS));
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

interface ScrapedProduct {
  price: number;
  brand: string;
  model: string;
  size: string;
  mpn: string | null;
  upc: string | null;
  url: string;
}

function extractJsonLdProduct(html: string): ScrapedProduct | null {
  // Extract JSON-LD Product data using regex (no cheerio in the edge runtime)
  const jsonLdMatch = html.match(
    /<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi
  );
  if (!jsonLdMatch) return null;

  for (const match of jsonLdMatch) {
    const jsonStr = match.replace(/<\/?script[^>]*>/gi, "");
    try {
      const data = JSON.parse(jsonStr);
      const product =
        data["@type"] === "Product"
          ? data
          : Array.isArray(data["@graph"])
            ? data["@graph"].find((d: Record<string, string>) => d["@type"] === "Product")
            : null;

      if (!product) continue;

      const price = product.offers?.price || product.offers?.lowPrice;
      const brand = product.brand?.name;
      const name = product.name;

      if (price && brand && name) {
        const sizeMatch = name.match(/(\d{3}\/\d{2,3}R\d{2})/i);
        return {
          price: parseFloat(price),
          brand,
          model: name,
          size: sizeMatch ? sizeMatch[1] : "",
          mpn: product.mpn || null,
          upc: product.gtin13 || product.gtin12 || null,
          url: product.url || "",
        };
      }
    } catch {
      continue;
    }
  }

  return null;
}

async function scrapeSourceSubset(source: string, limit: number): Promise<number> {
  // Fetch sitemap to discover product URLs
  const sitemapUrls: Record<string, string> = {
    simpletire: "https://simpletire.com/sitemap/product-line.xml",
    tireseasy: "https://www.tires-easy.com/medias/sys_master/root/h62/h7e/12505137020958/tiresSite-PRODUCT-en-USD-0-9291984079572096371.xml",
    gigatires: "https://www.giga-tires.com/sitemap.xml",
  };

  const sitemapUrl = sitemapUrls[source];
  if (!sitemapUrl) return 0;

  const xml = await rateLimitedFetch(sitemapUrl);
  if (!xml) return 0;

  // Extract URLs from sitemap XML
  const urlMatches = xml.match(/<loc>(https?:\/\/[^<]+)<\/loc>/gi) || [];
  const productUrls = urlMatches
    .map((m) => m.replace(/<\/?loc>/gi, ""))
    .filter((url) => {
      // Filter to product pages (heuristic: URLs with tire sizes in them)
      return url.match(/\d{3}[/-]\d{2,3}[r/-]\d{2}/i) || url.includes("/tire/");
    })
    .sort(() => Math.random() - 0.5) // Shuffle
    .slice(0, limit);

  let matched = 0;

  for (const url of productUrls) {
    // Check function timeout (leave 30s buffer)
    if (Date.now() > Date.now() + 270000) break;

    const html = await rateLimitedFetch(url);
    if (!html) continue;

    const product = extractJsonLdProduct(html);
    if (!product || product.price <= 0) continue;

    // Quick upsert — skip DB matching in cron (the full script does proper matching)
    // Just store with basic info; the full scraper script handles tire_id matching
    if (product.mpn) {
      const { error } = await getSupabase()
        .from("competitor_prices")
        .upsert(
          {
            tire_id: 0, // Placeholder — full script matches properly
            source,
            competitor_price: product.price,
            competitor_url: url,
            brand: product.brand,
            model: product.model,
            size: product.size,
            matched_by: "pending",
            match_confidence: 0,
            active: false, // Inactive until matched by full script
            scraped_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          { onConflict: "source,tire_id", ignoreDuplicates: true }
        );

      if (!error) matched++;
    }
  }

  return matched;
}
