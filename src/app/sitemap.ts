import type { MetadataRoute } from "next";
import { getAllBrands, getModelsByBrand, toSlug, getDistinctSizes } from "@/lib/db";
import { blogPosts } from "@/data/blog-posts";
import { states } from "@/data/locations";
import { racingArticles } from "@/data/racing-articles";
import { racingTechArticles } from "@/data/racing-tech";
import { toLocationSlug } from "@/lib/location-seo";

export const dynamic = "force-dynamic";

export default function sitemap(): MetadataRoute.Sitemap {
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
    { url: `${baseUrl}/faq`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/blog`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.6 },
    { url: `${baseUrl}/racing`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.6 },
    { url: `${baseUrl}/racing/f1`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.6 },
    { url: `${baseUrl}/racing/nascar`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.6 },
    { url: `${baseUrl}/racing/le-mans`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.6 },
    { url: `${baseUrl}/racing/indycar`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.6 },
    { url: `${baseUrl}/racing-tech`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.6 },
  ];

  // Brand pages from DB
  const brandRows = getAllBrands();
  const brandPages = brandRows.map((b) => ({
    url: `${baseUrl}/tires/${toSlug(b.make_name)}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  // Model pages from DB
  const modelPages: MetadataRoute.Sitemap = [];
  for (const b of brandRows) {
    const brandSlug = toSlug(b.make_name);
    const models = getModelsByBrand(brandSlug);
    for (const m of models) {
      modelPages.push({
        url: `${baseUrl}/tires/${brandSlug}/${toSlug(m.model_name)}`,
        lastModified: new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.7,
      });
    }
  }

  // Size pages — top 200 most popular sizes
  const sizes = getDistinctSizes();
  const sizePages = sizes.slice(0, 200).map((s) => ({
    url: `${baseUrl}/tires/size/${s.width}-${s.aspect_ratio}r${s.rim_size}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  // Vehicle pages — common vehicles from tire-sizes data
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

  return [
    ...staticPages,
    ...brandPages,
    ...modelPages,
    ...sizePages,
    ...vehiclePages,
    ...blogPages,
    ...racingPages,
    ...racingTechPages,
    ...statePages,
    ...cityPages,
  ];
}
