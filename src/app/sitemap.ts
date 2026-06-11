import type { MetadataRoute } from "next";
import { getAllBrands, toSlug } from "@/lib/db";
// NOTE: Model/size pages are discovered by Google via brand pages + internal links (ISR).
// We intentionally do NOT query per-brand models here — that was causing 665+ DB queries
// during build, overwhelming Turso with 29 concurrent Vercel workers.
import { blogPosts } from "@/data/blog-posts";
import { states } from "@/data/locations";
import { racingArticles } from "@/data/racing-articles";
import { racingTechArticles } from "@/data/racing-tech";
import { toLocationSlug } from "@/lib/location-seo";
import { vehicleMakes } from "@/data/vehicle-content";

export const revalidate = 3600; // Rebuild sitemap hourly, not every 5 min

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://ship.tires";

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
    { url: `${baseUrl}/returns`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/faq`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/blog`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.6 },
    { url: `${baseUrl}/racing`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.6 },
    { url: `${baseUrl}/racing/f1`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.6 },
    { url: `${baseUrl}/racing/nascar`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.6 },
    { url: `${baseUrl}/racing/le-mans`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.6 },
    { url: `${baseUrl}/racing/indycar`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.6 },
    { url: `${baseUrl}/racing-tech`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.6 },
  ];

  // Single DB query for brands only — NO per-brand model queries during build
  let brandPages: MetadataRoute.Sitemap = [];

  try {
    const brandRows = await getAllBrands();
    brandPages = brandRows.map((b) => ({
      url: `${baseUrl}/tires/${toSlug(b.make_name)}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));
  } catch {
    console.warn("[sitemap] DB unavailable for brands, skipping brand pages");
  }

  // Model and size pages are discovered via ISR — no build-time DB queries needed
  // Google will discover them through brand pages and internal links

  // Vehicle make pages
  const vehicleMakePages: MetadataRoute.Sitemap = vehicleMakes.map((m) => ({
    url: `${baseUrl}/tires/vehicle/${m.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  // Vehicle model pages — common vehicles from tire-sizes data
  const vehiclePages: MetadataRoute.Sitemap = [
    "honda/accord", "honda/civic", "honda/cr-v", "honda/pilot",
    "toyota/camry", "toyota/corolla", "toyota/rav4", "toyota/highlander", "toyota/tacoma",
    "ford/f-150", "ford/escape", "ford/explorer", "ford/mustang", "ford/bronco",
    "chevrolet/silverado", "chevrolet/equinox", "chevrolet/tahoe", "chevrolet/camaro",
    "nissan/altima", "nissan/rogue", "nissan/sentra",
    "hyundai/tucson", "hyundai/elantra", "hyundai/sonata",
    "kia/sorento", "kia/forte", "kia/sportage",
    "bmw/3-series", "bmw/5-series", "bmw/x3", "bmw/x5",
    "mercedes-benz/c-class", "mercedes-benz/e-class",
    "tesla/model-3", "tesla/model-y",
    "jeep/wrangler", "jeep/grand-cherokee", "jeep/cherokee",
    "subaru/outback", "subaru/forester", "subaru/crosstrek",
    "ram/1500", "ram/2500",
    "mazda/cx-5", "mazda/3",
    "volkswagen/jetta", "volkswagen/tiguan",
    "gmc/sierra", "gmc/terrain", "gmc/yukon",
  ].map((v) => ({
    url: `${baseUrl}/tires/vehicle/${v}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

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

  // State pages
  const statePages = states.map((state) => ({
    url: `${baseUrl}/locations/${state.slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  // City pages
  const cityPages = states.flatMap((state) =>
    state.cities.map((city) => ({
      url: `${baseUrl}/locations/${state.slug}/${toLocationSlug(city.slug)}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    }))
  );

  // City + brand pages (top 6 priority brands per city — no DB query needed)
  const topBrandSlugs = ["michelin", "goodyear", "bridgestone", "continental", "pirelli", "cooper"];
  const cityBrandPages = states.flatMap((state) =>
    state.cities.flatMap((city) =>
      topBrandSlugs.map((brandSlug) => ({
        url: `${baseUrl}/locations/${state.slug}/${toLocationSlug(city.slug)}/${brandSlug}`,
        lastModified: new Date(),
        changeFrequency: "monthly" as const,
        priority: 0.6,
      }))
    )
  );

  // Installer pages — main page + popular zip codes
  const installerPages: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/installers`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.8 },
    ...["90001","10001","60601","77001","85001","19101","78201","92101",
      "75201","95624","95828","32801","30301","33101","98101","02101",
      "80201","55401","63101","97201","84101","37201","28201","23220",
      "46201","43201","73101","53201","64101","89101"].map((zip) => ({
      url: `${baseUrl}/installers/${zip}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];

  // Brand + Size pages — top combinations for discovery
  const topSizeSlugs = [
    "225-65r17","265-70r16","205-55r16","235-45r18","275-55r20",
    "195-65r15","245-40r19","215-55r17","255-70r18","285-45r22",
    "245-65r17","275-60r20","215-55r16","235-55r18","225-50r17",
    "245-45r18","225-45r17","235-70r16","265-60r18","255-55r20",
  ];
  const brandSizePages: MetadataRoute.Sitemap = topBrandSlugs.flatMap((brandSlug) =>
    topSizeSlugs.map((sizeSlug) => ({
      url: `${baseUrl}/tires/${brandSlug}/size/${sizeSlug}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }))
  );

  // Top tire size pages
  const topSizePages: MetadataRoute.Sitemap = [
    "225-65r17","265-70r16","205-55r16","235-45r18","275-55r20",
    "195-65r15","245-40r19","215-55r17","255-70r18","285-45r22",
    "245-65r17","275-60r20","215-55r16","235-55r18","225-50r17",
    "245-45r18","225-45r17","235-70r16","265-60r18","255-55r20",
    "225-55r18","225-55r17","235-65r17","245-50r20","265-65r17",
    "265-70r17","275-60r20","285-70r17","305-30r20","225-40r18",
    "235-40r18","245-35r20","255-35r19","275-35r19","225-60r18",
    "215-60r17","235-50r18","245-55r19","255-45r20","275-45r21",
    "205-65r16","215-45r17","225-65r16","235-75r15","265-75r16",
    "275-65r18","285-65r18","315-70r17","235-85r16","33x1250r15",
  ].map((s) => ({
    url: `${baseUrl}/tires/size/${s}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [
    ...staticPages,
    ...brandPages,
    ...vehicleMakePages,
    ...vehiclePages,
    ...blogPages,
    ...racingPages,
    ...racingTechPages,
    ...statePages,
    ...cityPages,
    ...cityBrandPages,
    ...installerPages,
    ...brandSizePages,
    ...topSizePages,
  ];
}
