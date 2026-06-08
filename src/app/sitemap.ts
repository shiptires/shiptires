import type { MetadataRoute } from "next";
import { brands } from "@/data/brands";
import { blogPosts } from "@/data/blog-posts";
import { states } from "@/data/locations";
import { racingArticles } from "@/data/racing-articles";
import { racingTechArticles } from "@/data/racing-tech";
import { toLocationSlug, getBrandUniqueSizes } from "@/lib/location-seo";

// Split into multiple sitemaps (Google limit: 50,000 URLs per file)
export async function generateSitemaps() {
  // Sitemap 0: static + brand + model + blog + racing pages
  // Sitemap 1: legacy location pages + /locations state + city pages
  // Sitemap 2+: /locations brand pages (chunked by state)
  // Remaining: /locations size pages (chunked by state)
  const sitemaps: { id: number }[] = [];

  // 0 = core pages
  sitemaps.push({ id: 0 });
  // 1 = location index pages (state + city)
  sitemaps.push({ id: 1 });

  // 2 through 2+N = one per state for brand+size pages
  for (let i = 0; i < states.length; i++) {
    sitemaps.push({ id: 2 + i }); // brand-level for each state
  }

  return sitemaps;
}

export default async function sitemap(props: {
  id: Promise<string>;
}): Promise<MetadataRoute.Sitemap> {
  const id = Number(await props.id);
  const baseUrl = "https://ship.tires";

  // Sitemap 0: Core pages
  if (id === 0) {
    const staticPages: MetadataRoute.Sitemap = [
      { url: baseUrl, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
      { url: `${baseUrl}/tires`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
      { url: `${baseUrl}/locations`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
      { url: `${baseUrl}/vehicle-lookup`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
      { url: `${baseUrl}/rankings`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
      { url: `${baseUrl}/search`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
      { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
      { url: `${baseUrl}/contact`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
      { url: `${baseUrl}/shipping`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
      { url: `${baseUrl}/faq`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
      { url: `${baseUrl}/blog`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.6 },
      { url: `${baseUrl}/racing`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.6 },
      { url: `${baseUrl}/racing/f1`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.6 },
      { url: `${baseUrl}/racing/nascar`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.6 },
      { url: `${baseUrl}/racing/le-mans`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.6 },
      { url: `${baseUrl}/racing/indycar`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.6 },
      { url: `${baseUrl}/racing-tech`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.6 },
    ];

    const brandPages = brands.map((brand) => ({
      url: `${baseUrl}/tires/${brand.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));

    const modelPages = brands.flatMap((brand) =>
      brand.models.map((model) => ({
        url: `${baseUrl}/tires/${brand.slug}/${model.slug}`,
        lastModified: new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.7,
      }))
    );

    const blogPages = blogPosts.map((post) => ({
      url: `${baseUrl}/blog/${post.slug}`,
      lastModified: new Date(post.date),
      changeFrequency: "monthly" as const,
      priority: 0.5,
    }));

    const racingPages = racingArticles.map((article) => ({
      url: `${baseUrl}/racing/${article.series}/${article.slug}`,
      lastModified: new Date(article.date),
      changeFrequency: "monthly" as const,
      priority: 0.5,
    }));

    const racingTechPages = racingTechArticles.map((article) => ({
      url: `${baseUrl}/racing-tech/${article.slug}`,
      lastModified: new Date(article.date),
      changeFrequency: "monthly" as const,
      priority: 0.5,
    }));

    return [...staticPages, ...brandPages, ...modelPages, ...blogPages, ...racingPages, ...racingTechPages];
  }

  // Sitemap 1: Location index pages (legacy + state + city level)
  if (id === 1) {
    const legacyPages = states.flatMap((state) =>
      state.cities.map((city) => ({
        url: `${baseUrl}/${state.slug}/${city.slug}`,
        lastModified: new Date(),
        changeFrequency: "monthly" as const,
        priority: 0.6,
      }))
    );

    const statePages = states.map((state) => ({
      url: `${baseUrl}/locations/${state.slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    }));

    const cityPages = states.flatMap((state) =>
      state.cities.map((city) => ({
        url: `${baseUrl}/locations/${state.slug}/${toLocationSlug(city.slug)}`,
        lastModified: new Date(),
        changeFrequency: "monthly" as const,
        priority: 0.7,
      }))
    );

    return [...legacyPages, ...statePages, ...cityPages];
  }

  // Sitemap 2+: Per-state brand + size pages
  const stateIndex = id - 2;
  if (stateIndex >= 0 && stateIndex < states.length) {
    const state = states[stateIndex];
    const entries: MetadataRoute.Sitemap = [];

    for (const city of state.cities) {
      const cityLocSlug = toLocationSlug(city.slug);

      // Brand-level pages for this city
      for (const brand of brands) {
        entries.push({
          url: `${baseUrl}/locations/${state.slug}/${cityLocSlug}/${brand.slug}`,
          lastModified: new Date(),
          changeFrequency: "monthly" as const,
          priority: 0.6,
        });

        // Size-level pages for this city+brand
        const sizes = getBrandUniqueSizes(brand);
        for (const sizeEntry of sizes) {
          entries.push({
            url: `${baseUrl}/locations/${state.slug}/${cityLocSlug}/${brand.slug}/${sizeEntry.slug}`,
            lastModified: new Date(),
            changeFrequency: "monthly" as const,
            priority: 0.5,
          });
        }
      }
    }

    return entries;
  }

  return [];
}
