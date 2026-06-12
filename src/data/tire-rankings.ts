import { TireRanking } from "@/lib/types";

export const tireRankings: TireRanking[] = [
  {
    category: "Best Wet Weather Tires",
    slug: "best-wet-weather-tires",
    description:
      "Top-rated tires for hydroplaning resistance, wet braking, and confident handling in rain and standing water. These picks leverage racing-derived tread designs and silica compounds to keep you safe when the roads get slick.",
    tires: [
      {
        rank: 1,
        brand: "Michelin",
        model: "Pilot Sport 4S",
        score: 9.6,
        racingConnection:
          "Uses silica-enriched compound technology directly derived from Michelin's Le Mans 24 Hours wet-weather tire program.",
      },
      {
        rank: 2,
        brand: "Continental",
        model: "ExtremeContact DWS 06 Plus",
        score: 9.3,
        racingConnection:
          "Features Continental's SportPlus Technology with tread compounding refined through DTM and IMSA wet-weather testing.",
      },
      {
        rank: 3,
        brand: "Bridgestone",
        model: "Potenza Sport",
        score: 9.1,
        racingConnection:
          "Incorporates NanoPro-Tech compound with silica dispersion techniques pioneered for Bridgestone's Formula 1 rain tires.",
      },
      {
        rank: 4,
        brand: "Pirelli",
        model: "P Zero All Season Plus 3",
        score: 8.8,
        racingConnection:
          "Draws from Pirelli's F1 intermediate and wet tire compound library, adapting high-silica formulations for street use.",
      },
      {
        rank: 5,
        brand: "Goodyear",
        model: "Eagle Exhilarate",
        score: 8.5,
        racingConnection:
          "Utilizes ActiveGrip Technology with aqua-channel tread design informed by Goodyear's NASCAR wet-weather tire development.",
      },
    ],
  },
  {
    category: "Best Performance Tires for Track Days",
    slug: "best-track-day-tires",
    description:
      "High-performance tires engineered for aggressive driving on both the track and the street. These selections prioritize cornering grip, braking precision, and thermal stability under sustained high-speed use.",
    tires: [
      {
        rank: 1,
        brand: "Michelin",
        model: "Pilot Sport Cup 2 R",
        score: 9.8,
        racingConnection:
          "Developed alongside Michelin's GT3 racing slicks, sharing the same bi-compound tread architecture used in professional endurance racing.",
      },
      {
        rank: 2,
        brand: "Pirelli",
        model: "P Zero Trofeo RS",
        score: 9.5,
        racingConnection:
          "Born from Pirelli's World Challenge and GT racing programs, featuring a track-optimized compound with road-legal tread depth.",
      },
      {
        rank: 3,
        brand: "Bridgestone",
        model: "Potenza RE-71RS",
        score: 9.3,
        racingConnection:
          "Engineered with motorsport-grade sidewall reinforcement technology from Bridgestone's Super GT racing tire development.",
      },
      {
        rank: 4,
        brand: "Continental",
        model: "SportContact 7",
        score: 9.0,
        racingConnection:
          "Features Black Chili compound technology stress-tested through Continental's touring car racing partnerships in ADAC GT Masters.",
      },
      {
        rank: 5,
        brand: "Yokohama",
        model: "Advan Apex V601",
        score: 8.7,
        racingConnection:
          "Leverages Yokohama's decades of Super Formula and SUPER GT experience, using orange oil compound technology for consistent track-day grip.",
      },
    ],
  },
  {
    category: "Best All-Terrain Tires for Off-Road",
    slug: "best-all-terrain-off-road",
    description:
      "Rugged all-terrain tires built to handle dirt, gravel, mud, and rock while remaining comfortable on the highway. These top picks blend off-road capability with on-road refinement using rally and Baja-proven engineering.",
    tires: [
      {
        rank: 1,
        brand: "BFGoodrich",
        model: "All-Terrain T/A KO2",
        score: 9.5,
        racingConnection:
          "Engineered with CoreGard sidewall technology developed through decades of Baja 1000 desert racing, where sidewall punctures end races.",
      },
      {
        rank: 2,
        brand: "Falken",
        model: "Wildpeak A/T3W",
        score: 9.2,
        racingConnection:
          "Uses heat-diffuser technology in the lower sidewall derived from Falken's Nurburgring 24 Hours endurance racing program.",
      },
      {
        rank: 3,
        brand: "Toyo",
        model: "Open Country A/T III",
        score: 9.0,
        racingConnection:
          "Features Toyo's T-Mode simulation technology, the same finite element analysis platform used to design their Dakar Rally race tires.",
      },
      {
        rank: 4,
        brand: "Goodyear",
        model: "Wrangler DuraTrac RT",
        score: 8.7,
        racingConnection:
          "Incorporates TractiveGroove Technology with self-cleaning tread blocks refined through Goodyear's off-road racing partnerships in King of the Hammers.",
      },
      {
        rank: 5,
        brand: "Nitto",
        model: "Ridge Grappler",
        score: 8.5,
        racingConnection:
          "Utilizes variable pitch tread block sequencing and reinforced shoulder grooves developed from Nitto's Ultra4 off-road racing support program.",
      },
    ],
  },
  {
    category: "Best Touring Tires for Long Distance",
    slug: "best-touring-long-distance",
    description:
      "Premium touring tires designed for maximum comfort, low road noise, and exceptional tread life on long highway drives. These selections deliver refined ride quality using low-rolling-resistance technology born from endurance racing fuel-efficiency mandates.",
    tires: [
      {
        rank: 1,
        brand: "Michelin",
        model: "Defender LTX M/S 2",
        score: 9.4,
        racingConnection:
          "Uses EverGrip technology with expanding rain grooves derived from Michelin's WEC endurance racing program's focus on consistent multi-hour performance.",
      },
      {
        rank: 2,
        brand: "Continental",
        model: "TrueContact Tour",
        score: 9.2,
        racingConnection:
          "Features EcoPlus Technology with low-rolling-resistance compounds developed through Continental's Formula E energy-efficiency research.",
      },
      {
        rank: 3,
        brand: "Bridgestone",
        model: "Turanza QuietTrack",
        score: 9.0,
        racingConnection:
          "Incorporates a noise-optimized tread pattern using computational modeling tools originally built for Bridgestone's Formula 1 tire aeroacoustics research.",
      },
      {
        rank: 4,
        brand: "Pirelli",
        model: "Cinturato P7 All Season Plus 3",
        score: 8.8,
        racingConnection:
          "Employs Pirelli's Seal Inside puncture-protection technology adapted from run-flat systems developed for their motorsport safety programs.",
      },
      {
        rank: 5,
        brand: "Yokohama",
        model: "Avid Ascend LX",
        score: 8.5,
        racingConnection:
          "Leverages Yokohama's BluEarth compound technology, a low-hysteresis rubber formulation refined through the brand's endurance racing fuel-saving initiatives.",
      },
    ],
  },
  {
    category: "Best Winter Tires",
    slug: "best-winter-tires",
    description:
      "Top-performing winter tires engineered for ice traction, snow braking, and sub-zero flexibility. These picks use Arctic-tested compounds and micro-sipe technology to deliver confidence when temperatures drop below 45\u00B0F.",
    tires: [
      {
        rank: 1,
        brand: "Michelin",
        model: "X-Ice Snow",
        score: 9.5,
        racingConnection:
          "Uses Flex-Ice 2.0 compound with micro-roughness technology derived from Michelin's WRC rally snow stage tire development.",
      },
      {
        rank: 2,
        brand: "Bridgestone",
        model: "Blizzak WS90",
        score: 9.3,
        racingConnection:
          "Features NanoPro-Tech Multicell compound with microscopic bite particles developed through Bridgestone's decades of Scandinavian ice racing research.",
      },
      {
        rank: 3,
        brand: "Continental",
        model: "WinterContact SI",
        score: 9.0,
        racingConnection:
          "Incorporates PolarPlus Technology with temperature-activated silica compounds refined through Continental's Nordic winter testing programs.",
      },
      {
        rank: 4,
        brand: "Nokian",
        model: "Hakkapeliitta R5",
        score: 8.8,
        racingConnection:
          "Developed in Nokian's Ivalo Arctic proving ground, the world's northernmost tire test facility, using Cryo Crystal 3 particle technology.",
      },
      {
        rank: 5,
        brand: "Pirelli",
        model: "Winter Sottozero 3",
        score: 8.5,
        racingConnection:
          "Draws from Pirelli's F1 cold-weather compound research, adapting low-temperature polymer flexibility for winter street driving.",
      },
    ],
  },
  {
    category: "Best EV Tires",
    slug: "best-ev-tires",
    description:
      "Purpose-built tires for electric vehicles, optimized for instant torque handling, low rolling resistance for maximum range, and reduced cabin noise. These picks address the unique demands of EVs with advanced engineering.",
    tires: [
      {
        rank: 1,
        brand: "Michelin",
        model: "Pilot Sport EV",
        score: 9.6,
        racingConnection:
          "Developed through Michelin's exclusive tire supply for Formula E, optimizing rolling resistance and torque management for electric powertrains.",
      },
      {
        rank: 2,
        brand: "Continental",
        model: "EcoContact 6",
        score: 9.2,
        racingConnection:
          "Features Green Chili 2.0 compound with ultra-low rolling resistance technology refined through Continental's Formula E energy-efficiency program.",
      },
      {
        rank: 3,
        brand: "Hankook",
        model: "iON evo",
        score: 9.0,
        racingConnection:
          "Engineered as the official tire of Porsche Taycan and ABB FIA Formula E Championship, with EV-specific noise dampening and torque handling.",
      },
      {
        rank: 4,
        brand: "Pirelli",
        model: "P Zero E",
        score: 8.7,
        racingConnection:
          "Carries Pirelli's Elect marking with high-load construction and low rolling resistance developed through their Jaguar I-PACE eTrophy racing series.",
      },
      {
        rank: 5,
        brand: "Bridgestone",
        model: "Turanza EV",
        score: 8.5,
        racingConnection:
          "Uses Enliten technology for 30% weight reduction and improved range, leveraging Bridgestone's lightweight construction research from endurance racing.",
      },
    ],
  },
  {
    category: "Best Truck Tires",
    slug: "best-truck-tires",
    description:
      "Heavy-duty tires built for pickups and full-size SUVs, balancing towing capability, highway comfort, and off-road readiness. These top picks deliver durability and load-carrying confidence across every terrain.",
    tires: [
      {
        rank: 1,
        brand: "BFGoodrich",
        model: "All-Terrain T/A KO2",
        score: 9.5,
        racingConnection:
          "Engineered with CoreGard sidewall technology developed through decades of Baja 1000 desert racing, where sidewall punctures end races.",
      },
      {
        rank: 2,
        brand: "Michelin",
        model: "Defender LTX M/S 2",
        score: 9.3,
        racingConnection:
          "Uses EverGrip technology with expanding rain grooves derived from Michelin's WEC endurance racing program's focus on consistent multi-hour performance.",
      },
      {
        rank: 3,
        brand: "Toyo",
        model: "Open Country R/T Trail",
        score: 9.0,
        racingConnection:
          "Features Toyo's T-Mode tire simulation technology refined through their Dakar Rally and Baja racing programs for optimized tread pattern design.",
      },
      {
        rank: 4,
        brand: "Cooper",
        model: "Discoverer Rugged Trek",
        score: 8.7,
        racingConnection:
          "Incorporates Armor-Tek3 construction with cut-and-chip resistant compounds developed through Cooper's off-road racing sponsorship programs.",
      },
      {
        rank: 5,
        brand: "Falken",
        model: "Wildpeak A/T3W",
        score: 8.5,
        racingConnection:
          "Uses heat-diffuser technology in the lower sidewall derived from Falken's Nurburgring 24 Hours endurance racing program.",
      },
    ],
  },
  {
    category: "Best Budget Tires",
    slug: "best-budget-tires",
    description:
      "High-value tires that deliver reliable performance without the premium price tag. These selections prove you don't need to overspend for safe, comfortable, and long-lasting everyday driving.",
    tires: [
      {
        rank: 1,
        brand: "Kumho",
        model: "Solus TA51a",
        score: 9.0,
        racingConnection:
          "Benefits from Kumho's ECSTA racing tire compound research, delivering premium wet-grip technology at a value price point.",
      },
      {
        rank: 2,
        brand: "Nexen",
        model: "N Priz AH5",
        score: 8.7,
        racingConnection:
          "Uses Dynamic Tread Design with computer-optimized pitch sequencing technology shared across Nexen's performance tire lineup.",
      },
      {
        rank: 3,
        brand: "Hankook",
        model: "Kinergy PT",
        score: 8.5,
        racingConnection:
          "Features Hankook's advanced compound technology from their DTM and Formula E racing programs, filtered into their value-tier lineup.",
      },
      {
        rank: 4,
        brand: "General",
        model: "Altimax RT45",
        score: 8.3,
        racingConnection:
          "Leverages Continental parent company's motorsport R&D, including Visual Alignment Indicators and Replacement Tire Monitor technology.",
      },
      {
        rank: 5,
        brand: "Sumitomo",
        model: "HTR A/S P03",
        score: 8.0,
        racingConnection:
          "Draws from Dunlop/Sumitomo Rubber's extensive motorsport compound library to deliver competitive wet and dry grip at an accessible price.",
      },
    ],
  },
];
