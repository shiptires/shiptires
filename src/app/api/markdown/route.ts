import { states } from "@/data/locations";
import { brands } from "@/data/brands";
import { blogPosts } from "@/data/blog-posts";
import { racingArticles } from "@/data/racing-articles";
import { racingTechArticles } from "@/data/racing-tech";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const path = searchParams.get("path") || "/";

  const markdown = generateMarkdown(path);

  if (!markdown) {
    return new Response("# 404 - Page Not Found\n\nThis page does not exist.", {
      status: 404,
      headers: { "Content-Type": "text/markdown; charset=utf-8" },
    });
  }

  return new Response(markdown, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
    },
  });
}

function generateMarkdown(path: string): string | null {
  // Remove trailing slash
  const cleanPath = path === "/" ? "/" : path.replace(/\/$/, "");

  // Homepage
  if (cleanPath === "/") return homepageMarkdown();

  // Static pages
  if (cleanPath === "/about") return aboutMarkdown();
  if (cleanPath === "/contact") return contactMarkdown();
  if (cleanPath === "/faq") return faqMarkdown();
  if (cleanPath === "/shipping") return shippingMarkdown();
  if (cleanPath === "/vehicle-lookup") return vehicleLookupMarkdown();
  if (cleanPath === "/rankings") return rankingsMarkdown();
  if (cleanPath === "/search") return searchMarkdown();

  // Blog
  if (cleanPath === "/blog") return blogIndexMarkdown();
  if (cleanPath.startsWith("/blog/")) {
    const slug = cleanPath.replace("/blog/", "");
    return blogPostMarkdown(slug);
  }

  // Racing
  if (cleanPath === "/racing") return racingIndexMarkdown();
  if (cleanPath === "/racing/f1") return racingSeriesMarkdown("f1");
  if (cleanPath === "/racing/nascar") return racingSeriesMarkdown("nascar");
  if (cleanPath === "/racing/le-mans") return racingSeriesMarkdown("le-mans");
  if (cleanPath === "/racing/indycar") return racingSeriesMarkdown("indycar");
  if (cleanPath.startsWith("/racing/")) {
    const parts = cleanPath.replace("/racing/", "").split("/");
    if (parts.length === 2) {
      return racingArticleMarkdown(parts[1]);
    }
  }

  // Racing tech
  if (cleanPath === "/racing-tech") return racingTechIndexMarkdown();
  if (cleanPath.startsWith("/racing-tech/")) {
    const slug = cleanPath.replace("/racing-tech/", "");
    return racingTechArticleMarkdown(slug);
  }

  // Tires
  if (cleanPath === "/tires") return tiresIndexMarkdown();
  if (cleanPath.startsWith("/tires/")) {
    const parts = cleanPath.replace("/tires/", "").split("/");
    if (parts.length === 1) return tireBrandMarkdown(parts[0]);
    if (parts.length === 2) return tireModelMarkdown(parts[0], parts[1]);
  }

  // Location pages: /[state]/[city]
  const pathParts = cleanPath.slice(1).split("/");
  if (pathParts.length === 2) {
    return locationMarkdown(pathParts[0], pathParts[1]);
  }

  return null;
}

function homepageMarkdown(): string {
  return `# Ship.Tires — Tires Shipped Fast. Installed Near You.

> Nationwide tire shipping with free delivery. Browse 34 top brands, find the perfect fit for your vehicle, and get tires shipped to your door or local installer.

## Contact
- Phone/Text: (279) 238-8473 (call or text to order)
- Email: info@ship.tires
- Website: https://ship.tires

## How It Works

1. **Find Your Tires** — Search by vehicle (year/make/model) or enter your tire size directly
2. **Get a Quote** — Browse competitive pricing from 34 premium brands
3. **Free Shipping** — Tires shipped to your door or directly to a local installer near you

## Tire Categories
- All-Season Tires
- Winter Tires
- Performance Tires
- All-Terrain Tires
- Touring Tires
- Truck & SUV Tires

## Brands We Carry
${brands.map((b) => `- **${b.name}** (${b.country}, est. ${b.founded}) — ${b.description.slice(0, 100)}...`).join("\n")}

## Services
- Free nationwide tire shipping (3-7 business days)
- Ship-to-installer program
- Vehicle tire size lookup tool
- Tire size search by dimensions
- Free price quotes (phone, email, or online)

## Coverage
Ship.Tires delivers to all 50 US states. We serve ${states.reduce((acc, s) => acc + s.cities.length, 0)}+ major cities nationwide.

## Key Pages
- [All Tires & Brands](https://ship.tires/tires)
- [Vehicle Lookup Tool](https://ship.tires/vehicle-lookup)
- [Tire Rankings](https://ship.tires/rankings)
- [Shipping Info](https://ship.tires/shipping)
- [About Us](https://ship.tires/about)
- [Contact](https://ship.tires/contact)
- [FAQ](https://ship.tires/faq)
- [Blog](https://ship.tires/blog)
- [Racing](https://ship.tires/racing)
`;
}

function aboutMarkdown(): string {
  return `# About Ship.Tires

Ship.Tires is a nationwide online tire retailer based in Sacramento, California. We ship tires directly to your door or to a local installer near you — with free shipping on every order.

## Our Mission
Make buying tires as simple as ordering anything else online. No confusing part numbers, no driving to multiple shops for quotes, no lugging heavy tires in your car.

## What We Offer
- 34 premium tire brands
- 100+ tire models across all categories
- Free shipping to all 50 states
- Ship-to-installer convenience
- Expert tire size guidance
- Competitive pricing with free quotes

## Contact
- Phone/Text: (279) 238-8473 (call or text to order)
- Email: info@ship.tires
- Website: https://ship.tires
- Hours: Monday–Saturday, 8am–6pm PT
`;
}

function contactMarkdown(): string {
  return `# Contact Ship.Tires

## Get In Touch
- **Phone/Text:** (279) 238-8473 (call or text to order)
- **Email:** info@ship.tires
- **Website:** https://ship.tires

## Hours of Operation
Monday–Saturday: 8am–6pm Pacific Time

## What We Can Help With
- Tire size questions
- Vehicle compatibility lookup
- Price quotes
- Order status
- Shipping inquiries
- Installation recommendations

## Request a Quote
Call or text us, email us, or use the online quote form at https://ship.tires/contact for a free tire quote. We typically respond within a few hours.
`;
}

function faqMarkdown(): string {
  return `# Frequently Asked Questions — Ship.Tires

## How long does shipping take?
Most orders arrive within 3-7 business days via free ground shipping. Expedited options are available at checkout.

## Is shipping really free?
Yes. Every tire order ships free to anywhere in the continental United States — no minimum order, no hidden fees.

## Can you ship tires directly to an installer?
Absolutely. Choose from our network of certified installation partners at checkout, and we'll ship your tires straight to the shop. Just schedule your mounting appointment.

## How do I know what size tires I need?
Use our Vehicle Lookup tool — enter your year, make, model, and trim, and we'll show you the manufacturer-recommended tire sizes. You can also find your tire size on the placard inside your driver's door jamb.

## What brands do you carry?
We carry top brands including Michelin, Bridgestone, Continental, Goodyear, Pirelli, Cooper, Yokohama, Falken, Toyo, BFGoodrich, Firestone, Kumho, Nexen, Nitto, Maxxis, and many more.

## Can I return tires?
Unmounted tires can be returned within 30 days for a full refund. Once mounted, manufacturer warranties apply.

## Do you offer installation?
We partner with local installers nationwide. Select "Ship to Installer" at checkout to have tires delivered directly to a shop near you.

## How do I get a price quote?
Call or text (279) 238-8473, email info@ship.tires, or use our online quote form. We respond within hours.

## Contact
- Phone/Text: (279) 238-8473 (call or text to order)
- Email: info@ship.tires
- Website: https://ship.tires
`;
}

function shippingMarkdown(): string {
  return `# Shipping Information — Ship.Tires

## Free Shipping on Every Order
All tire orders ship free to anywhere in the continental United States. No minimum quantity, no promo codes needed.

## Delivery Timeline
- **Standard Shipping:** 3-7 business days (FREE)
- **Expedited Shipping:** 2-3 business days (available at checkout)

## Ship to Your Door
Tires are delivered to your doorstep or garage. Someone should be available to receive the delivery.

## Ship to Installer
Choose a certified installation partner at checkout. We ship directly to the shop — just schedule your appointment.

## Packaging
Tires are shipped banded on pallets (sets of 4) or individually boxed depending on order size. Inspected before shipping.

## Order Tracking
Track your order status online or call or text (279) 238-8473 for updates.

## Coverage
We ship to all 50 US states including Alaska and Hawaii.

## Contact
- Phone/Text: (279) 238-8473 (call or text to order)
- Email: info@ship.tires
`;
}

function vehicleLookupMarkdown(): string {
  return `# Vehicle Tire Lookup Tool — Ship.Tires

## Find Your Tire Size by Vehicle

Enter your vehicle's year, make, and model to instantly see manufacturer-recommended tire sizes.

## How It Works
1. Select your vehicle year
2. Choose the make (manufacturer)
3. Select the model
4. View compatible tire sizes and recommendations

## Data Source
Vehicle fitment data sourced from NHTSA and manufacturer specifications.

## Why Use the Vehicle Lookup?
- Guaranteed correct tire size for your specific vehicle
- No guessing or measuring needed
- See all compatible size options
- Direct links to matching tires in stock

## Alternative: Search by Tire Size
If you already know your tire size (e.g., 225/65R17), you can search directly at https://ship.tires/search

## Contact for Help
- Phone/Text: (279) 238-8473 (call or text to order)
- Email: info@ship.tires
`;
}

function rankingsMarkdown(): string {
  return `# Tire Rankings — Ship.Tires

## Top-Rated Tires by Category

### Best All-Season Tires
Top picks for year-round performance, long tread life, and versatile grip in dry, wet, and light snow conditions.

### Best Winter Tires
Top picks for ice, snow, and cold-weather traction below 45°F. Dedicated winter compounds stay soft in freezing temperatures.

### Best Performance Tires
Top picks for sports cars and spirited driving. Maximum grip, precise handling, and high-speed stability.

### Best All-Terrain Tires
Top picks for trucks and SUVs that split time between pavement and trails. Aggressive tread with highway manners.

### Best Touring Tires
Top picks for quiet, comfortable highway driving with excellent tread life warranties (60,000+ miles).

### Best Truck & SUV Tires
Top picks for pickup trucks, SUVs, and crossovers. Built for heavier loads and larger wheel sizes.

## How We Rank
Rankings are based on independent testing, customer reviews, tread life data, and value for money.

## Browse All Brands
Visit https://ship.tires/tires to see our full catalog of 34 brands and 800+ models.
`;
}

function searchMarkdown(): string {
  return `# Search Tires — Ship.Tires

## Search by Tire Size
Enter your tire size (e.g., 225/65R17, 245/40R18) to find all compatible tires from our catalog of 34 brands.

## Search by Vehicle
Use our Vehicle Lookup tool to find tires by year, make, and model.

## Search by Brand
Browse our complete brand catalog at https://ship.tires/tires

## Popular Tire Sizes
- 225/65R17 (SUVs, Crossovers)
- 205/55R16 (Sedans)
- 245/75R16 (Trucks)
- 265/70R17 (Full-size trucks)
- 225/45R17 (Sports sedans)

## Contact
- Phone/Text: (279) 238-8473 (call or text to order)
- Email: info@ship.tires
`;
}

function blogIndexMarkdown(): string {
  let md = `# Ship.Tires Blog — Tire Guides, Tips & News\n\n`;
  md += `Expert tire advice, buying guides, and maintenance tips from the Ship.Tires team.\n\n## Articles\n\n`;
  for (const post of blogPosts) {
    md += `### [${post.title}](https://ship.tires/blog/${post.slug})\n`;
    md += `*${post.date} · ${post.readTime}*\n\n`;
    md += `${post.excerpt}\n\n---\n\n`;
  }
  return md;
}

function blogPostMarkdown(slug: string): string | null {
  const post = blogPosts.find((p) => p.slug === slug);
  if (!post) return null;
  return `# ${post.title}

*Published: ${post.date} · ${post.readTime} · By ${post.author}*

${post.content}

---

## About Ship.Tires
Ship.Tires offers free nationwide tire shipping with 34 premium brands. Visit https://ship.tires or call or text (279) 238-8473 to order.
`;
}

function racingIndexMarkdown(): string {
  return `# Racing & Motorsport Tire Coverage �� Ship.Tires

Explore how tire technology from the world's top racing series powers the tires on your vehicle.

## Racing Series Coverage

### [Formula 1](https://ship.tires/racing/f1)
Pirelli compounds, tire strategy, and how F1 tire tech trickles down to consumer tires.

### [NASCAR](https://ship.tires/racing/nascar)
Goodyear Eagles, oval racing demands, and stock car tire science.

### [Le Mans & WEC](https://ship.tires/racing/le-mans)
Endurance racing tire technology, Michelin's dominance, and 24-hour durability engineering.

### [IndyCar](https://ship.tires/racing/indycar)
Firestone Firehawk tires, oval vs. street course compounds, and open-wheel tire engineering.

## Racing Technology
Visit our [Racing Tech section](https://ship.tires/racing-tech) for deep dives into compound science, wet-weather engineering, and temperature management.
`;
}

function racingSeriesMarkdown(series: string): string | null {
  const articles = racingArticles.filter((a) => a.series === series);
  if (articles.length === 0) return null;

  const seriesNames: Record<string, string> = {
    f1: "Formula 1",
    nascar: "NASCAR",
    "le-mans": "Le Mans & WEC",
    indycar: "IndyCar",
  };

  let md = `# ${seriesNames[series] || series} Tire Coverage — Ship.Tires\n\n`;
  md += `## Articles\n\n`;
  for (const article of articles) {
    md += `### [${article.title}](https://ship.tires/racing/${series}/${article.slug})\n`;
    md += `*${article.date} · ${article.readTime}*\n\n`;
    md += `${article.excerpt}\n\n---\n\n`;
  }
  return md;
}

function racingArticleMarkdown(slug: string): string | null {
  const article = racingArticles.find((a) => a.slug === slug);
  if (!article) return null;
  return `# ${article.title}

*Published: ${article.date} · ${article.readTime} · By ${article.author}*

${article.content}

---

## About Ship.Tires
Ship.Tires offers free nationwide tire shipping. Racing-derived tire technology is available in our consumer tire catalog. Visit https://ship.tires or call or text (279) 238-8473 to order.
`;
}

function racingTechIndexMarkdown(): string {
  let md = `# Racing Technology — Ship.Tires\n\n`;
  md += `Deep dives into how motorsport tire engineering shapes the tires on your vehicle.\n\n## Articles\n\n`;
  for (const article of racingTechArticles) {
    md += `### [${article.title}](https://ship.tires/racing-tech/${article.slug})\n`;
    md += `*${article.date} · ${article.readTime} · Category: ${article.category}*\n\n`;
    md += `${article.excerpt}\n\n---\n\n`;
  }
  return md;
}

function racingTechArticleMarkdown(slug: string): string | null {
  const article = racingTechArticles.find((a) => a.slug === slug);
  if (!article) return null;
  return `# ${article.title}

*Published: ${article.date} · ${article.readTime} · By ${article.author}*
*Category: ${article.category}*

${article.content}

## Consumer Takeaway
${article.consumerTakeaway}

---

## About Ship.Tires
Ship.Tires offers free nationwide tire shipping with racing-derived tire technology. Visit https://ship.tires or call or text (279) 238-8473 to order.
`;
}

function tiresIndexMarkdown(): string {
  let md = `# All Tire Brands — Ship.Tires\n\n`;
  md += `Browse our complete catalog of 34 premium tire brands with free nationwide shipping.\n\n`;
  for (const brand of brands) {
    md += `## [${brand.name}](https://ship.tires/tires/${brand.slug})\n`;
    md += `*${brand.country} · Founded ${brand.founded}*\n\n`;
    md += `${brand.description}\n\n`;
    md += `**Models:** ${brand.models.map((m) => m.name).join(", ")}\n\n---\n\n`;
  }
  return md;
}

function tireBrandMarkdown(brandSlug: string): string | null {
  const brand = brands.find((b) => b.slug === brandSlug);
  if (!brand) return null;

  let md = `# ${brand.name} Tires — Ship.Tires\n\n`;
  md += `*${brand.country} · Founded ${brand.founded}*\n\n`;
  md += `${brand.description}\n\n`;
  md += `## Models\n\n`;
  for (const model of brand.models) {
    md += `### [${model.name}](https://ship.tires/tires/${brand.slug}/${model.slug})\n`;
    md += `**Type:** ${model.type} · **Warranty:** ${model.warranty} · **Price:** $${model.priceRange[0]}–$${model.priceRange[1]}\n\n`;
    md += `${model.description}\n\n`;
    md += `**Features:** ${model.features.join(", ")}\n\n`;
    md += `**Available Sizes:** ${model.sizes.map((s) => s.size).join(", ")}\n\n---\n\n`;
  }
  md += `## Free Shipping\nAll ${brand.name} tires ship free to anywhere in the US. Call or text (279) 238-8473 to order.\n`;
  return md;
}

function tireModelMarkdown(brandSlug: string, modelSlug: string): string | null {
  const brand = brands.find((b) => b.slug === brandSlug);
  if (!brand) return null;
  const model = brand.models.find((m) => m.slug === modelSlug);
  if (!model) return null;

  let md = `# ${brand.name} ${model.name} — Ship.Tires\n\n`;
  md += `**Brand:** ${brand.name} · **Type:** ${model.type} · **Warranty:** ${model.warranty}\n\n`;
  md += `## Overview\n${model.description}\n\n`;
  md += `## Price Range\n$${model.priceRange[0]}–$${model.priceRange[1]} (free shipping included)\n\n`;
  md += `## Features\n${model.features.map((f) => `- ${f}`).join("\n")}\n\n`;
  md += `## Speed Ratings\n${model.speedRatings.join(", ")}\n\n`;
  md += `## Available Sizes & Pricing\n\n`;
  md += `| Size | Load Index | Speed Rating | Price |\n`;
  md += `|------|-----------|--------------|-------|\n`;
  for (const size of model.sizes) {
    md += `| ${size.size} | ${size.loadIndex} | ${size.speedRating} | $${size.price} |\n`;
  }
  md += `\n## Free Shipping\nAll orders ship free. Call or text (279) 238-8473 to order, or visit https://ship.tires\n`;
  return md;
}

function locationMarkdown(stateSlug: string, citySlug: string): string | null {
  const state = states.find((s) => s.slug === stateSlug);
  if (!state) return null;
  const city = state.cities.find((c) => c.slug === citySlug);
  if (!city) return null;

  const otherCities = state.cities.filter((c) => c.slug !== citySlug);

  let md = `# Tire Shipping to ${city.name}, ${state.abbreviation} — Ship.Tires\n\n`;
  md += `Free tire delivery to ${city.name}, ${state.name}. Browse 34 brands, find your size, and get tires shipped to your door or a local installer in ${city.name}.\n\n`;
  md += `## How to Get Tires in ${city.name}\n\n`;
  md += `1. **Find Your Size** — Use our vehicle lookup or enter your tire size\n`;
  md += `2. **Choose Your Tires** — Browse 34 brands with competitive pricing\n`;
  md += `3. **Free Delivery** — Shipped to your ${city.name} address or local installer\n\n`;
  md += `## Brands Available in ${city.name}, ${state.abbreviation}\n`;
  md += brands.slice(0, 10).map((b) => `- ${b.name}`).join("\n") + "\n\n";
  md += `## Tire Categories\n`;
  md += `- All-Season Tires\n- Winter Tires\n- Performance Tires\n- All-Terrain Tires\n- Touring Tires\n- Truck & SUV Tires\n\n`;
  md += `## Shipping to ${city.name}\n`;
  md += `- Free standard shipping (3-7 business days)\n`;
  md += `- Ship to your door or local installer\n`;
  md += `- All 50 states covered\n\n`;
  if (otherCities.length > 0) {
    md += `## Also Serving in ${state.name}\n`;
    md += otherCities.map((c) => `- [${c.name}](https://ship.tires/${state.slug}/${c.slug})`).join("\n") + "\n\n";
  }
  md += `## Contact\n`;
  md += `- Phone/Text: (279) 238-8473 (call or text to order)\n`;
  md += `- Email: info@ship.tires\n`;
  md += `- Website: https://ship.tires\n`;
  return md;
}
