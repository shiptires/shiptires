/**
 * Shared XML sitemap utilities for route handlers.
 */

const XML_HEADER = '<?xml version="1.0" encoding="UTF-8"?>';

/** Escape XML special characters in text content. */
export function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export interface UrlEntry {
  loc: string;
  lastmod?: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: number;
}

/** Build a single <url> entry. */
export function buildUrlEntry(entry: UrlEntry): string {
  const parts = [`  <url>\n    <loc>${escapeXml(entry.loc)}</loc>`];
  if (entry.lastmod) parts.push(`    <lastmod>${entry.lastmod}</lastmod>`);
  if (entry.changefreq) parts.push(`    <changefreq>${entry.changefreq}</changefreq>`);
  if (entry.priority !== undefined) parts.push(`    <priority>${entry.priority.toFixed(1)}</priority>`);
  parts.push("  </url>");
  return parts.join("\n");
}

/** Wrap URL entries in a <urlset>. */
export function wrapUrlset(entries: string[]): string {
  return [
    XML_HEADER,
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...entries,
    "</urlset>",
  ].join("\n");
}

/** Wrap sitemap references in a <sitemapindex>. */
export function wrapSitemapIndex(
  sitemaps: { loc: string; lastmod?: string }[]
): string {
  const entries = sitemaps.map((s) => {
    const parts = ["  <sitemap>", `    <loc>${escapeXml(s.loc)}</loc>`];
    if (s.lastmod) parts.push(`    <lastmod>${s.lastmod}</lastmod>`);
    parts.push("  </sitemap>");
    return parts.join("\n");
  });

  return [
    XML_HEADER,
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...entries,
    "</sitemapindex>",
  ].join("\n");
}

/** Return a Response with XML content type and cache headers. */
export function sitemapResponse(xml: string, maxAge = 3600): Response {
  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": `public, s-maxage=${maxAge}, stale-while-revalidate=${maxAge * 2}`,
    },
  });
}
