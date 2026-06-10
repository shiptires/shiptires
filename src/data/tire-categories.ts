import { TireCategory } from "@/lib/types";

export const tireCategories: TireCategory[] = [
  {
    name: "All-Season Tires",
    slug: "all-season",
    type: "all-season",
    description:
      "All-season tires from Michelin, Goodyear, Bridgestone, Continental, and Cooper deliver year-round traction in dry, wet, and light snow. Shop the Michelin Defender, Goodyear Assurance, and Bridgestone Turanza — the most popular all-season tires for Honda, Toyota, Ford, and all vehicles. Ship free.",
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
      "Winter tires from Michelin, Bridgestone, Nokian, Continental, and Pirelli are purpose-built for cold weather, ice, and heavy snow. Shop the Michelin X-Ice, Bridgestone Blizzak, and Nokian Hakkapeliitta — trusted by drivers in the coldest climates. Ship free to your door.",
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
      "Summer tires from Michelin, Pirelli, Continental, Bridgestone, and Yokohama deliver maximum grip in warm and wet conditions. Shop the Michelin Pilot Sport, Pirelli P Zero, and Continental ExtremeContact — engineered for BMW, Mercedes, Porsche, and sport-tuned vehicles. Ship free.",
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
      "Performance tires from Michelin, Pirelli, Continental, Falken, and Nitto are built for speed and precision. Shop the Michelin Pilot Sport 4S, Pirelli P Zero, and Nitto NT555 — ultra-high-performance tires for Mustang, Camaro, BMW M, and every sports car. Ship free.",
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
      "All-terrain tires from BFGoodrich, Falken, Toyo, Cooper, and Nitto handle gravel, dirt, and trails while keeping a smooth highway ride. Shop the BFGoodrich KO2, Falken Wildpeak, and Toyo Open Country — top-rated for F-150, Tacoma, Jeep Wrangler, and every truck and SUV. Ship free.",
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
      "Mud-terrain tires from BFGoodrich, Nitto, Toyo, Mickey Thompson, and Cooper are built for extreme off-road. Shop the BFGoodrich KM3, Nitto Trail Grappler, and Toyo Open Country M/T — massive tread lugs that claw through mud, rocks, and sand. Ship free to your door.",
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
      "Highway tires from Michelin, Cooper, Firestone, Hankook, and General are optimized for trucks, SUVs, and vans on paved roads. Shop the Michelin Defender LTX, Cooper Discoverer HTP, and Firestone Destination — smooth ride, long tread life, and free shipping on every order.",
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
      "Touring tires from Michelin, Continental, Bridgestone, Pirelli, and Hankook deliver premium comfort for sedans, crossovers, and luxury vehicles. Shop the Michelin Primacy, Continental PureContact, and Bridgestone Ecopia — up to 80,000-mile warranties and free shipping.",
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
