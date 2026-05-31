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
];
