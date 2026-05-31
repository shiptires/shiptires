import { TireCategory } from "@/lib/types";

export const tireCategories: TireCategory[] = [
  {
    name: "All-Season Tires",
    slug: "all-season",
    type: "all-season",
    description:
      "All-season tires are engineered for year-round versatility, delivering reliable traction in dry, wet, and light snow conditions. They strike the perfect balance between comfort, tread life, and all-weather capability, making them the most popular choice for everyday drivers.",
    image:
      "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&q=80",
    features: [
      "Year-round traction in dry, wet, and light snow",
      "Extended tread life with durable compound technology",
      "Quiet, comfortable ride for daily commuting",
      "Versatile performance without seasonal tire swaps",
      "Available in a wide range of sizes for most vehicles",
    ],
  },
  {
    name: "Winter Tires",
    slug: "winter",
    type: "winter",
    description:
      "Winter tires are purpose-built for cold weather, ice, and heavy snow using specialized rubber compounds that stay flexible below 45°F. Their aggressive siping and deep tread patterns channel slush and bite into packed snow, providing stopping power and control when it matters most.",
    image:
      "https://images.unsplash.com/photo-1580655653885-65763b2597d0?w=800&q=80",
    features: [
      "Soft rubber compound stays pliable in freezing temperatures",
      "Deep sipes and biting edges grip ice and packed snow",
      "Shorter braking distances on cold and icy roads",
      "Enhanced lateral stability in winter driving conditions",
      "Snowflake-on-mountain (3PMSF) certified for severe snow",
    ],
  },
  {
    name: "Summer Tires",
    slug: "summer",
    type: "summer",
    description:
      "Summer tires deliver maximum grip and razor-sharp handling in warm, dry, and wet conditions. Their streamlined tread designs and high-performance compounds provide superior cornering and braking for drivers who demand the most from their vehicle during the warmer months.",
    image:
      "https://images.unsplash.com/photo-1525609004556-c46c5d6cf66c?w=800&q=80",
    features: [
      "Maximum dry grip with large, continuous tread blocks",
      "Hydroplaning resistance through optimized groove channels",
      "Responsive steering and precise cornering feedback",
      "Reduced rolling resistance for improved fuel efficiency",
    ],
  },
  {
    name: "Performance Tires",
    slug: "performance",
    type: "performance",
    description:
      "Performance tires are engineered for speed enthusiasts and sport-tuned vehicles, offering exceptional grip at higher speeds and aggressive cornering capability. Built with sticky compounds and reinforced sidewalls, they transform your driving experience on both the street and the track.",
    image:
      "https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=800&q=80",
    features: [
      "Ultra-high-grip compound for maximum traction at speed",
      "Reinforced sidewalls for sharp turn-in and stability",
      "High speed ratings (W, Y, and Z-rated options available)",
      "Wide contact patch for enhanced braking performance",
      "Asymmetric tread patterns for balanced wet and dry grip",
    ],
  },
  {
    name: "All-Terrain Tires",
    slug: "all-terrain",
    type: "all-terrain",
    description:
      "All-terrain tires bridge the gap between highway comfort and off-road capability, making them ideal for trucks and SUVs that split time between pavement and trails. Their rugged tread patterns handle gravel, dirt, and mud while still providing a civilized on-road ride.",
    image:
      "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&q=80",
    features: [
      "Aggressive tread pattern grips dirt, gravel, and light mud",
      "Reinforced construction resists punctures and sidewall damage",
      "Comfortable on-highway ride quality and low road noise",
      "Three-peak mountain snowflake rating on select models",
      "Long-lasting tread compound built for truck and SUV loads",
    ],
  },
  {
    name: "Mud-Terrain Tires",
    slug: "mud-terrain",
    type: "mud-terrain",
    description:
      "Mud-terrain tires are the ultimate choice for serious off-road adventurers, featuring massive tread lugs and deep voids that claw through deep mud, rocks, and sand. While they trade some on-road refinement for raw trail capability, nothing else comes close in extreme terrain.",
    image:
      "https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=800&q=80",
    features: [
      "Massive tread lugs for maximum grip in deep mud and sand",
      "Wide channel voids self-clean debris and prevent packing",
      "Heavy-duty sidewall armor protects against rocks and stumps",
      "Aggressive shoulder lugs provide extra traction on loose surfaces",
      "Built to withstand the harshest off-road environments",
    ],
  },
  {
    name: "Highway Tires",
    slug: "highway",
    type: "highway",
    description:
      "Highway tires are optimized for long-distance driving and daily commuting on paved roads, offering a smooth, quiet ride with excellent fuel efficiency. Designed primarily for trucks, SUVs, and vans, they deliver predictable handling and impressive tread life for high-mileage drivers.",
    image:
      "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&q=80",
    features: [
      "Smooth, quiet ride optimized for paved road surfaces",
      "Low rolling resistance for better fuel economy",
      "Long tread life backed by high-mileage warranties",
      "Stable handling and confident braking at highway speeds",
    ],
  },
  {
    name: "Touring Tires",
    slug: "touring",
    type: "touring",
    description:
      "Touring tires prioritize ride comfort and refined handling for sedans, crossovers, and luxury vehicles. They combine a plush, vibration-dampening ride with dependable all-season traction and some of the longest tread life warranties in the industry.",
    image:
      "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&q=80",
    features: [
      "Premium ride comfort with vibration-dampening construction",
      "All-season traction for confident year-round driving",
      "Industry-leading tread life warranties (up to 80,000+ miles)",
      "Low cabin noise for a quieter driving experience",
      "Refined handling tuned for sedans and luxury vehicles",
    ],
  },
];
