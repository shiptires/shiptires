export interface BrandAuthority {
  slug: string;
  name: string;
  country: string;
  headquarters: string;
  founded: number;
  overview: string;
  technologies: string[];
  topModels: { name: string; description: string; type: string }[];
  market:
    | "luxury"
    | "performance"
    | "mainstream"
    | "value"
    | "off-road"
    | "commercial";
}

export const brandAuthority: BrandAuthority[] = [
  {
    slug: "michelin",
    name: "Michelin",
    country: "France",
    headquarters: "Clermont-Ferrand, France",
    founded: 1889,
    overview:
      "Michelin is one of the world's most recognized tire manufacturers, founded in 1889 by brothers Andre and Edouard Michelin in Clermont-Ferrand, France. The company pioneered the removable pneumatic tire, the radial tire, and countless innovations that shaped the modern tire industry. Today, Michelin is synonymous with premium quality and long tread life, and their tires consistently earn top marks in independent safety and performance testing.\n\nMichelin produces tires for passenger vehicles, SUVs, light trucks, commercial fleets, aircraft, and motorsport applications. Their commitment to sustainability is reflected in initiatives like the VISION concept, which envisions airless, connected, and fully recyclable tires. When you shop for Michelin tires, you invest in decades of engineering expertise, and retailers across the country ship them quickly to ensure drivers stay safe on the road.\n\nFrom the iconic Bibendum mascot to the prestigious Michelin Guide, the brand extends well beyond rubber. Their influence on automotive culture and tire technology is unmatched, making Michelin a benchmark that every competitor measures themselves against.",
    technologies: [
      "EverGrip Technology",
      "MaxTouch Construction",
      "Flex-Ice Compound",
      "Comfort Control Technology",
      "Green X Low Rolling Resistance",
    ],
    topModels: [
      {
        name: "Defender LTX M/S 2",
        description:
          "Michelin's flagship all-season tire for SUVs and light trucks, delivering exceptional tread life up to 70,000 miles with outstanding wet and dry traction.",
        type: "all-season",
      },
      {
        name: "Pilot Sport 4S",
        description:
          "An ultra-high-performance summer tire trusted by supercar manufacturers, offering extreme grip and razor-sharp handling on both road and track.",
        type: "performance",
      },
      {
        name: "X-Ice Snow",
        description:
          "A premium studless winter tire with Flex-Ice compound technology that maintains grip in extreme cold, delivering confident braking on ice and snow.",
        type: "winter",
      },
    ],
    market: "luxury",
  },
  {
    slug: "goodyear",
    name: "Goodyear",
    country: "USA",
    headquarters: "Akron, Ohio, USA",
    founded: 1898,
    overview:
      "Goodyear Tire & Rubber Company was founded in 1898 in Akron, Ohio, and has grown into one of the largest tire manufacturers in the world. Named after Charles Goodyear, who discovered the vulcanization of rubber, the company has a storied history that includes supplying tires for the first automobiles, aircraft, and even the Apollo 14 lunar vehicle. Goodyear's iconic winged-foot logo and its famous blimp are recognized worldwide.\n\nGoodyear manufactures tires for virtually every segment, from everyday passenger cars and SUVs to heavy-duty trucks, farm equipment, and racing applications. The company is the official tire supplier of NASCAR, which underscores its performance credentials. When drivers shop for Goodyear tires online, they benefit from a vast dealer network that can ship orders quickly to nearly any location in the United States.\n\nWith ongoing investments in smart tire technology, airless tires, and sustainable materials, Goodyear continues to push the boundaries of what a tire can do. Their product lineup balances performance, durability, and value, making them a go-to choice for millions of American drivers.",
    technologies: [
      "Weather Reactive Technology",
      "DuPont Kevlar Reinforcement",
      "ActiveGrip Technology",
      "TractiveGroove Technology",
      "SoundComfort Technology",
    ],
    topModels: [
      {
        name: "Assurance WeatherReady",
        description:
          "Goodyear's premium all-weather tire featuring Weather Reactive Technology that adapts to changing road conditions including rain, snow, and ice.",
        type: "all-season",
      },
      {
        name: "Wrangler AT Adventure with Kevlar",
        description:
          "A rugged all-terrain tire reinforced with DuPont Kevlar for enhanced durability and puncture resistance on and off the pavement.",
        type: "all-terrain",
      },
      {
        name: "Eagle F1 Asymmetric 6",
        description:
          "A max-performance summer tire engineered for sports cars and performance sedans, delivering exceptional grip and precise cornering.",
        type: "performance",
      },
    ],
    market: "mainstream",
  },
  {
    slug: "bridgestone",
    name: "Bridgestone",
    country: "Japan",
    headquarters: "Tokyo, Japan",
    founded: 1931,
    overview:
      "Bridgestone Corporation, founded in 1931 by Shojiro Ishibashi in Kurume, Japan, is the world's largest tire and rubber company by revenue. The name \"Bridgestone\" is an anglicized translation of the founder's surname, which means \"stone bridge\" in Japanese. From its modest origins in Kyushu, the company expanded globally through strategic acquisitions, including the landmark purchase of Firestone in 1988.\n\nBridgestone produces an extensive range of tires spanning passenger vehicles, light trucks, commercial fleets, off-road equipment, aircraft, and motorsport. Their engineering prowess is demonstrated through partnerships with Formula One, IndyCar, and OEM supply agreements with automakers like Toyota, BMW, and Ford. Drivers who shop for Bridgestone tires expect refined ride quality, balanced performance, and dependable longevity — and the brand consistently delivers on those expectations.\n\nThe company's commitment to sustainability includes the ambitious goal of using 100% sustainable materials by 2050. With manufacturing plants on six continents and an ability to ship tires efficiently through a massive distribution network, Bridgestone remains the benchmark for global tire excellence.",
    technologies: [
      "NanoPro-Tech Compound",
      "ENLITEN Lightweight Technology",
      "3D Sipe Technology",
      "Quiettrack Noise-Reduction",
      "Multi-Cell Compound (Blizzak)",
    ],
    topModels: [
      {
        name: "Turanza QuietTrack",
        description:
          "A premium grand touring tire engineered for a whisper-quiet ride with excellent wet and dry handling for luxury sedans and crossovers.",
        type: "touring",
      },
      {
        name: "Potenza Sport",
        description:
          "Bridgestone's flagship ultra-high-performance summer tire offering exceptional grip and stability at high speeds for sports cars.",
        type: "performance",
      },
      {
        name: "Blizzak WS90",
        description:
          "A highly regarded studless winter tire with Multi-Cell compound technology that bites into ice and evacuates water for confident cold-weather driving.",
        type: "winter",
      },
    ],
    market: "mainstream",
  },
  {
    slug: "continental",
    name: "Continental",
    country: "Germany",
    headquarters: "Hanover, Germany",
    founded: 1871,
    overview:
      "Continental AG, founded in 1871 in Hanover, Germany, is one of the oldest and most technologically advanced tire manufacturers in the world. Originally producing soft rubber products and solid tires for carriages, Continental quickly moved into pneumatic tires for bicycles and automobiles and has been at the forefront of tire innovation ever since. The company is also a major automotive technology supplier, producing braking systems, sensors, and vehicle electronics.\n\nContinental tires are engineered with German precision and are original equipment on a wide range of European and global vehicles, including BMW, Mercedes-Benz, Audi, Volkswagen, and Tesla. Their tires are celebrated for exceptional wet braking, responsive handling, and low rolling resistance. When you shop for Continental tires, you choose a brand that has earned top ratings in Euro NCAP and ADAC testing year after year, and authorized dealers ship them promptly across the country.\n\nThe company's vision extends to intelligent tire concepts and sustainable manufacturing. Continental's ContiSense and ContiAdapt technologies hint at a future where tires communicate with vehicles in real time, adjusting to road conditions automatically.",
    technologies: [
      "ContiSilent Noise-Dampening",
      "Black Chili Compound",
      "SSR Self-Supporting Runflat",
      "+Silane Wet Traction Compound",
      "EcoPlus Low Rolling Resistance",
    ],
    topModels: [
      {
        name: "ExtremeContact DWS 06 Plus",
        description:
          "A versatile ultra-high-performance all-season tire with SportPlus Technology, delivering outstanding grip in dry, wet, and snowy conditions.",
        type: "all-season",
      },
      {
        name: "CrossContact LX25",
        description:
          "A premium touring all-season tire for crossovers and SUVs, providing a quiet ride, long tread life, and excellent fuel efficiency.",
        type: "all-season",
      },
      {
        name: "VikingContact 7",
        description:
          "A Scandinavian-engineered studless winter tire using Nordic Compound technology for superb grip on ice and packed snow.",
        type: "winter",
      },
    ],
    market: "luxury",
  },
  {
    slug: "pirelli",
    name: "Pirelli",
    country: "Italy",
    headquarters: "Milan, Italy",
    founded: 1872,
    overview:
      "Pirelli, founded in 1872 in Milan, Italy, by Giovanni Battista Pirelli, is one of the most prestigious tire brands in the world. The company's deep Italian heritage and association with luxury, fashion, and motorsport have made it a status symbol among automotive enthusiasts. Pirelli has been the exclusive tire supplier to the FIA Formula One World Championship since 2011, and their tires are standard equipment on high-performance vehicles from Ferrari, Lamborghini, Porsche, and McLaren.\n\nPirelli's product line focuses on high-performance and prestige segments, with a range that includes ultra-high-performance summer tires, run-flat options, and specialized fitments for supercars and grand tourers. Their Elect marking identifies tires specifically developed for electric and plug-in hybrid vehicles. Enthusiasts who shop for Pirelli tires know they are choosing a brand that prioritizes driving engagement and cornering precision, and retailers ship these premium tires with care to preserve their quality.\n\nBeyond motorsport, Pirelli is renowned for the Pirelli Calendar, a cultural institution that blends photography and art. The brand's commitment to innovation, sustainability, and performance cements its position at the pinnacle of the tire industry.",
    technologies: [
      "PNCS Noise Cancelling System",
      "Elect Technology (EV-Optimized)",
      "Seal Inside Puncture Protection",
      "Run Flat Technology",
      "Adaptive Net Profile",
    ],
    topModels: [
      {
        name: "P Zero",
        description:
          "Pirelli's iconic ultra-high-performance summer tire developed alongside supercar manufacturers, delivering extraordinary grip and handling precision.",
        type: "performance",
      },
      {
        name: "Cinturato P7",
        description:
          "A premium touring tire offering an ideal balance of comfort, fuel efficiency, and all-season safety for luxury sedans and executive cars.",
        type: "touring",
      },
      {
        name: "Scorpion All Terrain Plus",
        description:
          "An all-terrain tire designed for SUVs and pickups that combines off-road capability with refined on-road manners and long tread life.",
        type: "all-terrain",
      },
    ],
    market: "performance",
  },
  {
    slug: "cooper",
    name: "Cooper",
    country: "USA",
    headquarters: "Findlay, Ohio, USA",
    founded: 1914,
    overview:
      "Cooper Tire & Rubber Company was founded in 1914 in Akron, Ohio, and later relocated its headquarters to Findlay, Ohio. For over a century, Cooper built its reputation as a trusted American tire brand offering quality products at fair prices. In 2021, Goodyear completed its acquisition of Cooper Tire, bringing Cooper's strong portfolio of passenger, SUV, and light truck tires under the Goodyear umbrella while maintaining the Cooper brand identity.\n\nCooper is best known for rugged all-terrain and all-season tires that appeal to truck owners, outdoor enthusiasts, and everyday drivers who want dependable performance without paying premium prices. The Discoverer line of light truck tires has been particularly successful, earning loyal followers among overlanders and off-road enthusiasts. When you shop for Cooper tires, you get American-engineered quality backed by a strong warranty program, and dealers across the nation ship them directly to your door or local installer.\n\nCooper's integration into the Goodyear family has expanded its distribution network and R&D resources while preserving the value-oriented positioning and rugged identity that made the brand a household name.",
    technologies: [
      "Adaptive-Traction Technology",
      "Whisper Grooves Noise Reduction",
      "Stabiledge Performance Technology",
      "Snow Groove Micro-Gauge",
      "Wear Square Visual Indicator",
    ],
    topModels: [
      {
        name: "Discoverer AT3 4S",
        description:
          "Cooper's best-selling all-terrain tire combining off-road toughness with all-season versatility and 3PMSF winter certification for year-round confidence.",
        type: "all-terrain",
      },
      {
        name: "Discoverer Rugged Trek",
        description:
          "A rugged terrain tire with an aggressive look and dual sidewall design, built for trucks and SUVs that work hard on and off pavement.",
        type: "all-terrain",
      },
      {
        name: "CS5 Ultra Touring",
        description:
          "A refined all-season touring tire with outstanding wet traction and a quiet, comfortable ride for sedans and crossovers.",
        type: "touring",
      },
    ],
    market: "value",
  },
  {
    slug: "firestone",
    name: "Firestone",
    country: "USA",
    headquarters: "Nashville, Tennessee, USA",
    founded: 1900,
    overview:
      "Firestone Tire and Rubber Company was founded in 1900 by Harvey Firestone in Akron, Ohio, and became one of the most influential tire brands in American history. Harvey Firestone's close friendship with Henry Ford led to Firestone becoming the original equipment tire supplier for Ford's Model T, which helped both companies grow into industrial giants. Bridgestone acquired Firestone in 1988, and today the brand operates as a subsidiary with its headquarters in Nashville, Tennessee.\n\nFirestone produces a broad range of tires for passenger cars, SUVs, light trucks, and commercial vehicles. The Destination line of SUV and truck tires is especially popular, and the WeatherGrip series provides confident all-weather performance. Firestone also operates one of the largest automotive service networks in the country through Firestone Complete Auto Care. Drivers who shop for Firestone tires benefit from accessible pricing, nationwide availability, and the ability to ship tires to over 1,700 company-owned service centers for professional installation.\n\nAs a Bridgestone subsidiary, Firestone leverages the parent company's advanced R&D capabilities while maintaining a distinct brand identity focused on delivering reliable, value-oriented tires for American families.",
    technologies: [
      "Fuel Fighter Technology",
      "Full-Depth Sipes",
      "Open-Slot Tread Design",
      "Long Link Carbon Compound",
      "IntelliShape Construction",
    ],
    topModels: [
      {
        name: "Destination LE3",
        description:
          "Firestone's flagship all-season tire for SUVs and crossovers, offering long tread life, responsive handling, and dependable wet traction.",
        type: "all-season",
      },
      {
        name: "WeatherGrip",
        description:
          "An all-weather tire with 3PMSF certification that handles rain, snow, and dry roads with equal confidence for year-round driving safety.",
        type: "all-season",
      },
      {
        name: "Firehawk Indy 500",
        description:
          "A summer performance tire inspired by Firestone's IndyCar racing heritage, delivering sharp handling and excellent dry grip at an accessible price.",
        type: "performance",
      },
    ],
    market: "mainstream",
  },
  {
    slug: "bfgoodrich",
    name: "BFGoodrich",
    country: "USA",
    headquarters: "Greenville, South Carolina, USA",
    founded: 1870,
    overview:
      "BFGoodrich was founded in 1870 by Benjamin Franklin Goodrich in Akron, Ohio, making it one of the oldest tire brands in the United States. The company has a legendary reputation in off-road and performance driving, with an unmatched record in events like the Baja 1000, the Dakar Rally, and King of the Hammers. BFGoodrich has been a subsidiary of Michelin since 1990, benefiting from Michelin's global R&D while maintaining its distinct adventure-driven identity.\n\nBFGoodrich is best known for its all-terrain and mud-terrain tires, particularly the iconic KO2 and KM3, which are staples in the truck, off-road, and overland communities. The brand also produces high-performance street tires and competition tires for autocross and track day enthusiasts. When you shop for BFGoodrich tires, you are choosing a brand forged in competition, and dealers nationwide ship these battle-tested tires to adventurers and racers across the country.\n\nThe brand's motto, \"Tires for the journey,\" captures its spirit perfectly. Whether tackling remote desert trails, navigating mountain passes in winter, or tearing up an autocross course, BFGoodrich tires are designed for drivers who push the limits.",
    technologies: [
      "CoreGard Max Technology",
      "Krawl-TEK Compound",
      "Interlocking Tread Design",
      "Serrated Shoulder Design",
      "Terrain-Attack Tread",
    ],
    topModels: [
      {
        name: "All-Terrain T/A KO2",
        description:
          "The benchmark all-terrain tire with CoreGard sidewall protection, aggressive tread, and 3PMSF winter rating — the most popular AT tire in North America.",
        type: "all-terrain",
      },
      {
        name: "Mud-Terrain T/A KM3",
        description:
          "A next-generation mud-terrain tire with Krawl-TEK compound and terrain-attack tread for maximum traction in extreme off-road conditions.",
        type: "mud-terrain",
      },
      {
        name: "g-Force Sport COMP-2",
        description:
          "An ultra-high-performance summer tire delivering strong cornering grip and responsive steering for sports cars and performance sedans.",
        type: "performance",
      },
    ],
    market: "off-road",
  },
  {
    slug: "yokohama",
    name: "Yokohama",
    country: "Japan",
    headquarters: "Tokyo, Japan",
    founded: 1917,
    overview:
      "Yokohama Rubber Company was founded in 1917 as a joint venture between Yokohama Cable Manufacturing and B.F. Goodrich, making it one of Japan's oldest tire manufacturers. Headquartered in Tokyo, the company has built a strong reputation in performance and motorsport applications, supplying tires for SUPER GT, the World Touring Car Championship, and historic racing events around the globe.\n\nYokohama produces tires across the full spectrum, including ultra-high-performance, touring, all-season, all-terrain, and winter segments. Their ADVAN line is particularly revered among driving enthusiasts for its exceptional dry grip and track-ready performance. Yokohama's BluEarth line demonstrates the company's commitment to eco-friendly tire technology with ultra-low rolling resistance compounds. Drivers who shop for Yokohama tires can expect Japanese engineering precision at competitive prices, and dealers ship their products to customers throughout North America.\n\nThe company continues to invest in next-generation technologies, including their use of orange oil in tire compounds to reduce petroleum dependence and improve wet traction — an innovation that has earned recognition from environmental organizations worldwide.",
    technologies: [
      "Orange Oil Technology",
      "ADVAN A.R.T. (Asymmetric R-compound Technology)",
      "BluEarth Low-RR Compound",
      "Triple 3D Sipe Technology",
      "Dynamic Chassis Shield",
    ],
    topModels: [
      {
        name: "ADVAN Apex V601",
        description:
          "Yokohama's flagship ultra-high-performance summer tire delivering exceptional dry grip, precise steering response, and track-worthy handling.",
        type: "performance",
      },
      {
        name: "Geolandar A/T G015",
        description:
          "A versatile all-terrain tire with 3PMSF certification, combining off-road capability with refined highway manners for trucks and SUVs.",
        type: "all-terrain",
      },
      {
        name: "BluEarth Winter V905",
        description:
          "A high-performance winter tire with directional tread and orange-oil-infused compound for outstanding grip on snow and ice.",
        type: "winter",
      },
    ],
    market: "performance",
  },
  {
    slug: "toyo",
    name: "Toyo",
    country: "Japan",
    headquarters: "Osaka, Japan",
    founded: 1945,
    overview:
      "Toyo Tire Corporation was founded in 1945 in Osaka, Japan, and has established itself as a leading manufacturer of performance and off-road tires. The company operates a major North American headquarters in Cypress, California, and manufactures tires at a state-of-the-art facility in White, Georgia. Toyo has built a strong following in the truck and off-road communities, and their tires are a common sight at SEMA and in the custom truck and Jeep world.\n\nToyo offers an extensive lineup that ranges from ultra-high-performance summer tires to heavy-duty mud-terrain options. Their Open Country line of truck and SUV tires is one of the most popular in the aftermarket, known for aggressive styling, durable construction, and serious off-road performance. When enthusiasts shop for Toyo tires, they value the brand's balance of Japanese engineering quality and bold, lifestyle-driven design. Dealers nationwide ship Toyo tires quickly to keep trucks and performance vehicles rolling.\n\nThe company's Nano Balance Technology uses advanced simulation to optimize tire compounds at the molecular level, resulting in improved grip, lower rolling resistance, and reduced wear. Toyo continues to sponsor events in motorsport, drifting, and off-road racing, reinforcing its image as a tire brand for enthusiasts.",
    technologies: [
      "Nano Balance Technology",
      "Open Country Armor Construction",
      "T-Mode Simulation",
      "Multi-Wave Sipe Technology",
      "Aggressive Tread Hook Design",
    ],
    topModels: [
      {
        name: "Open Country A/T III",
        description:
          "Toyo's latest all-terrain tire with aggressive styling, 3PMSF winter rating, and durable construction for on- and off-road versatility.",
        type: "all-terrain",
      },
      {
        name: "Open Country M/T",
        description:
          "A heavy-duty mud-terrain tire with a hook-shaped tread design for maximum traction in mud, rock, and loose terrain.",
        type: "mud-terrain",
      },
      {
        name: "Proxes Sport",
        description:
          "An ultra-high-performance summer tire with exceptional dry grip and high-speed stability developed through Toyo's motorsport experience.",
        type: "performance",
      },
    ],
    market: "performance",
  },
  {
    slug: "falken",
    name: "Falken",
    country: "Japan",
    headquarters: "Tokyo, Japan",
    founded: 1983,
    overview:
      "Falken Tires was launched in 1983 as the performance-oriented brand of Sumitomo Rubber Industries, one of Japan's oldest rubber companies. Originally created to target younger, sport-minded drivers, Falken quickly established credibility through motorsport involvement, including drifting, rally racing, and endurance events like the Nurburgring 24 Hours. The distinctive teal-and-blue Falken livery is among the most recognizable in motorsport.\n\nFalken offers a focused range of performance, all-season, all-terrain, and truck tires. The Wildpeak line has become a breakout success in the all-terrain and trail-running segments, earning praise from overland enthusiasts and everyday truck owners alike. Their Azenis performance tires cater to sports car drivers seeking precise handling and grip. When you shop for Falken tires, you get competition-proven engineering at prices that undercut many premium rivals, and authorized retailers ship orders efficiently to destinations across the continent.\n\nAs part of Sumitomo Rubber Industries, Falken benefits from extensive R&D resources and global manufacturing capabilities. The brand continues to grow its market share by offering compelling performance in every tire category it enters.",
    technologies: [
      "3D Canyon Sipe Technology",
      "Dynamic Range Technology",
      "APEXTM Sidewall Construction",
      "Silica Tread Compound",
      "Heat Diffuser Technology",
    ],
    topModels: [
      {
        name: "Wildpeak A/T3W",
        description:
          "Falken's award-winning all-terrain tire with rugged construction, 3PMSF winter certification, and impressive on-road comfort for trucks and SUVs.",
        type: "all-terrain",
      },
      {
        name: "Azenis FK510",
        description:
          "A premium ultra-high-performance summer tire offering excellent wet and dry grip, precise handling, and high-speed stability.",
        type: "performance",
      },
      {
        name: "Wildpeak M/T",
        description:
          "A mud-terrain tire with aggressive tread blocks and heat diffuser technology for confident performance in extreme off-road conditions.",
        type: "mud-terrain",
      },
    ],
    market: "performance",
  },
  {
    slug: "general",
    name: "General Tire",
    country: "USA",
    headquarters: "Fort Mill, South Carolina, USA",
    founded: 1915,
    overview:
      "General Tire was founded in 1915 in Akron, Ohio, and has been a subsidiary of Continental AG since 1987. The brand has carved out a strong identity in the value and off-road segments, offering capable tires at accessible prices backed by German-engineered Continental technology. General Tire is the official tire of the motorsport discipline Red Bull signature events and sponsors numerous off-road and adventure racing series.\n\nGeneral Tire's product lineup focuses on all-terrain, all-season, and highway tires for trucks, SUVs, and passenger cars. The Grabber line is their standout offering for light trucks and SUVs, with options ranging from highway comfort to aggressive mud-terrain traction. Drivers who shop for General tires appreciate straightforward, no-nonsense performance at prices that leave room in the budget for the adventure itself. The brand ships tires across the country through Continental's extensive dealer network.\n\nBy leveraging Continental's research and manufacturing infrastructure, General Tire delivers a level of quality and consistency that punches above its price class. It remains a solid choice for budget-conscious drivers who refuse to compromise on safety.",
    technologies: [
      "Duragen Technology",
      "TracGen Tread Design",
      "Comfort Balance Technology",
      "StabiliTread Technology",
      "Visual Alignment Indicators",
    ],
    topModels: [
      {
        name: "Grabber A/TX",
        description:
          "A versatile all-terrain tire with bold styling, 3PMSF winter certification, and Duragen technology for enhanced durability on and off the road.",
        type: "all-terrain",
      },
      {
        name: "AltiMAX RT45",
        description:
          "A dependable all-season touring tire offering balanced wet and dry traction, a quiet ride, and a 75,000-mile warranty for everyday driving.",
        type: "all-season",
      },
      {
        name: "Grabber X3",
        description:
          "An aggressive mud-terrain tire with open tread blocks and stone ejector features for maximum off-road traction in extreme conditions.",
        type: "mud-terrain",
      },
    ],
    market: "value",
  },
  {
    slug: "kumho",
    name: "Kumho",
    country: "South Korea",
    headquarters: "Seoul, South Korea",
    founded: 1960,
    overview:
      "Kumho Tire was founded in 1960 in Gwangju, South Korea, and has grown into one of the country's leading tire manufacturers with a global presence in over 180 countries. The company operates production facilities in South Korea, China, and Vietnam, and maintains a major technical center in Akron, Ohio. Kumho has earned OEM partnerships with automakers including Hyundai, Kia, BMW, and Mercedes-Benz, reflecting the quality of their engineering.\n\nKumho produces tires across all major segments, including passenger, performance, SUV, and commercial categories. The Ecsta line serves performance enthusiasts, while the Crugen and Solus lines cover SUV and touring applications respectively. When drivers shop for Kumho tires, they find a brand that delivers solid performance and above-average tread life at competitive prices. Retailers throughout the United States ship Kumho tires quickly, making them an easy choice for value-minded consumers.\n\nThe company continues to invest in research and development, with a focus on eco-friendly compounds, electric vehicle-specific tires, and advanced simulation technologies. Kumho's reputation for quality at a fair price has made it a consistent favorite in independent tire tests and consumer surveys.",
    technologies: [
      "ESCOT Carcass Technology",
      "Matrix Silica Compound",
      "Multi-Performance Blade Technology",
      "Jointless Nylon Cover",
      "HTCG (High-Tensile Content Gauge)",
    ],
    topModels: [
      {
        name: "Ecsta PS91",
        description:
          "Kumho's ultra-high-performance summer tire featuring asymmetric tread design and a stiff shoulder for exceptional dry handling and braking.",
        type: "performance",
      },
      {
        name: "Crugen HP71",
        description:
          "A premium all-season tire for SUVs and crossovers, offering a quiet ride, responsive handling, and confident wet traction.",
        type: "all-season",
      },
      {
        name: "Solus TA51a",
        description:
          "A value-oriented all-season tire with balanced performance, long tread life, and a 75,000-mile warranty for everyday passenger cars.",
        type: "all-season",
      },
    ],
    market: "value",
  },
  {
    slug: "nexen",
    name: "Nexen",
    country: "South Korea",
    headquarters: "Yangsan, South Korea",
    founded: 1942,
    overview:
      "Nexen Tire was founded in 1942 in Seoul, South Korea, originally as Heung-A Tire. The company rebranded as Nexen in 2000, combining \"next\" and \"century\" to signal its forward-looking ambitions. Nexen has experienced rapid growth in the global market, expanding into over 120 countries and opening a state-of-the-art manufacturing facility in Zatec, Czech Republic, to serve the European market. The company also has a technical center in Richfield, Ohio.\n\nNexen offers a diverse range of tires for passenger vehicles, SUVs, light trucks, and performance cars. Their Roadian line covers SUV and truck applications, while the N'Fera series targets performance-oriented drivers. Nexen tires consistently deliver surprising quality for their price point, earning OEM fitments on vehicles from Hyundai, Kia, Fiat, and Volkswagen. Drivers who shop for Nexen tires get strong warranties and solid performance, and retailers ship these competitively priced tires to customers nationwide.\n\nNexen's commitment to sustainability and technology includes their partnership with autonomous vehicle developers and investments in smart tire technology that can communicate real-time data to vehicle systems.",
    technologies: [
      "Advanced Multi-Layer Construction",
      "Nano-Gauge Silica Compound",
      "Dynamic Aqua Grooves",
      "3D Sipe Technology",
      "Active Block Noise Reduction",
    ],
    topModels: [
      {
        name: "Roadian GTX",
        description:
          "A premium all-season touring tire for SUVs and crossovers with excellent ride comfort, responsive handling, and a 70,000-mile warranty.",
        type: "all-season",
      },
      {
        name: "N'Fera AU7",
        description:
          "An ultra-high-performance all-season tire with a sport-tuned compound and aggressive tread pattern for sedans and coupes.",
        type: "performance",
      },
      {
        name: "Winguard Winspike 3",
        description:
          "A studdable winter tire with aggressive siping and an ice-biting compound for confident traction in severe winter conditions.",
        type: "winter",
      },
    ],
    market: "value",
  },
  {
    slug: "nitto",
    name: "Nitto",
    country: "Japan",
    headquarters: "Osaka, Japan",
    founded: 1949,
    overview:
      "Nitto Tire was founded in 1949 in Osaka, Japan, and operates as a subsidiary of Toyo Tire Corporation. The brand has carved out a distinctive niche in the North American market by targeting the custom truck, Jeep, and performance car communities with tires that combine bold aesthetics with serious capability. Nitto's presence at SEMA and in the custom vehicle scene is unrivaled, making it a lifestyle brand as much as a tire manufacturer.\n\nNitto's product line includes aggressive off-road tires, all-terrain options, highway cruisers, and ultra-high-performance tires. The Ridge Grappler, a hybrid all-terrain/mud-terrain tire, has become one of the most popular aftermarket truck tires in the country. Their NT555 and NT05 series serve performance enthusiasts with strong grip and predictable handling. When you shop for Nitto tires, you choose a brand that understands the truck and tuner culture, and dealers ship these distinctive tires to enthusiasts throughout North America.\n\nNitto's engineering benefits from Toyo's Nano Balance Technology and advanced simulation capabilities, ensuring that style never comes at the expense of performance or safety.",
    technologies: [
      "Variable Pitch Tread Design",
      "Lateral Z-Grooves",
      "Dynamic Hybrid Tread Pattern",
      "Reinforced Block Foundation",
      "Nano Balance Technology (via Toyo)",
    ],
    topModels: [
      {
        name: "Ridge Grappler",
        description:
          "A hybrid all-terrain/mud-terrain tire combining aggressive off-road styling with refined highway performance, a favorite in the custom truck community.",
        type: "all-terrain",
      },
      {
        name: "Terra Grappler G2",
        description:
          "A versatile all-terrain tire with a long-wearing compound, 3PMSF winter certification, and balanced performance for daily-driven trucks and SUVs.",
        type: "all-terrain",
      },
      {
        name: "NT555 G2",
        description:
          "An ultra-high-performance summer tire with a wide footprint and silica-enriched compound for maximum dry grip and responsive steering.",
        type: "performance",
      },
    ],
    market: "off-road",
  },
  {
    slug: "dunlop",
    name: "Dunlop",
    country: "United Kingdom",
    headquarters: "Birmingham, United Kingdom",
    founded: 1888,
    overview:
      "Dunlop was founded in 1888 by John Boyd Dunlop in Belfast, Ireland, making it one of the oldest tire brands in the world. Dunlop is credited with inventing the first practical pneumatic tire, a breakthrough that transformed transportation and motorsport forever. Today, Dunlop operates as a subsidiary of Goodyear Tire & Rubber Company in most global markets, leveraging Goodyear's manufacturing and distribution infrastructure.\n\nDunlop has a rich motorsport heritage, with victories at Le Mans, in the British Touring Car Championship, and across global endurance racing. Their product lineup includes performance, touring, all-season, and winter tires for passenger cars, SUVs, and motorcycles. Dunlop's Sport Maxx series is popular among performance car owners, while the Grandtrek line serves the SUV and truck market. When drivers shop for Dunlop tires, they connect with a brand steeped in racing history, and authorized retailers ship these legacy tires to customers across the country.\n\nDunlop continues to innovate with technologies like their noise shield system and multi-radius tread profiles, maintaining relevance in a competitive market while honoring more than 135 years of tire-making excellence.",
    technologies: [
      "Multi-Radius Tread Technology",
      "Noise Shield Technology",
      "JointlessBand Technology",
      "Touch Tread Technology",
      "4D Nano Design",
    ],
    topModels: [
      {
        name: "Sport Maxx RT2",
        description:
          "A high-performance summer tire with multi-radius tread design for sharp handling, strong braking, and consistent grip at high speeds.",
        type: "performance",
      },
      {
        name: "Grandtrek AT23",
        description:
          "An all-season tire for SUVs and crossovers offering a quiet ride, stable handling, and dependable traction in varied weather conditions.",
        type: "all-season",
      },
      {
        name: "Winter Maxx 2",
        description:
          "A studless winter tire with a sponge-like compound that absorbs water from ice surfaces for exceptional cold-weather braking and grip.",
        type: "winter",
      },
    ],
    market: "mainstream",
  },
  {
    slug: "nokian",
    name: "Nokian",
    country: "Finland",
    headquarters: "Nokia, Finland",
    founded: 1932,
    overview:
      "Nokian Tyres was founded in 1932 in Nokia, Finland, and holds the distinction of being the world's first manufacturer to develop a dedicated winter tire, the Hakkapeliitta, in 1934. The brand's Finnish heritage means it was literally born in one of the harshest winter climates on earth, giving Nokian unparalleled expertise in cold-weather tire engineering. The company also operates a major manufacturing facility in Dayton, Tennessee, to serve the North American market.\n\nNokian's product portfolio emphasizes winter, all-weather, and all-season tires that prioritize safety in challenging conditions. The Hakkapeliitta line remains the gold standard for studded and studless winter tires, while the WR series provides year-round performance with 3PMSF certification. Nokian also leads in sustainability, producing the world's first low-rolling-resistance tire made with purified canola oil. Drivers who shop for Nokian tires invest in purpose-built safety for cold climates, and retailers ship them efficiently to customers across northern states and Canada.\n\nWith a laser focus on safety and environmental responsibility, Nokian has earned a loyal following among drivers who face serious winter conditions and refuse to compromise on traction, braking, and control.",
    technologies: [
      "Arctic Sense Grip Compound",
      "Cryo-Silica Compound",
      "Dual Stud Technology",
      "Canola Oil Bio-Compound",
      "Driving Safety Indicator (DSI)",
    ],
    topModels: [
      {
        name: "Hakkapeliitta R5",
        description:
          "Nokian's flagship studless winter tire with Arctic Sense Grip particles and Cryo-Silica compound for supreme grip on ice and packed snow.",
        type: "winter",
      },
      {
        name: "WR G4",
        description:
          "An all-weather tire with 3PMSF certification providing year-round versatility and confident snow performance without seasonal tire swaps.",
        type: "all-season",
      },
      {
        name: "One",
        description:
          "A premium all-season tire designed and manufactured in North America, combining long tread life with a quiet, refined ride quality.",
        type: "all-season",
      },
    ],
    market: "luxury",
  },
  {
    slug: "maxxis",
    name: "Maxxis",
    country: "Taiwan",
    headquarters: "Yuanlin, Taiwan",
    founded: 1967,
    overview:
      "Maxxis International was founded in 1967 as Cheng Shin Rubber in Yuanlin, Taiwan, and has grown into one of the largest tire manufacturers in the world, ranking among the top ten globally by revenue. The company adopted the Maxxis brand name for international markets and produces over 60 million tires annually across facilities in Taiwan, China, Thailand, Vietnam, India, and Indonesia.\n\nMaxxis offers an extensive product range covering passenger cars, light trucks, SUVs, ATVs, motorcycles, bicycles, and industrial vehicles. Their off-road and all-terrain tires are particularly well-regarded, with the Razr and Buckshot lines earning loyal followings among ATV riders and off-road truck enthusiasts. When drivers shop for Maxxis tires, they get competitive pricing backed by a company with massive manufacturing scale and global distribution. Retailers across North America ship Maxxis tires to customers who want solid value without sacrificing quality.\n\nMaxxis has expanded into motorsport sponsorships and OEM supply agreements, raising brand visibility. Their investments in quality control and advanced compounds have elevated the brand's perception from budget to genuine mainstream contender.",
    technologies: [
      "Silkworm Silica Compound",
      "NanoEnergy Compound Technology",
      "Rear Center GrooveTech",
      "Multi-Pitch Tread Variation",
      "Durable Hybrid Construction",
    ],
    topModels: [
      {
        name: "Razr AT811",
        description:
          "A capable all-terrain tire with an aggressive tread pattern, reinforced sidewalls, and 3PMSF winter rating for trucks and SUVs.",
        type: "all-terrain",
      },
      {
        name: "Bravo HP-M3",
        description:
          "A performance all-season tire for sedans and crossovers, delivering responsive handling, low noise, and reliable wet traction.",
        type: "all-season",
      },
      {
        name: "Buckshot Mudder II MT-764",
        description:
          "A classic mud-terrain tire with deep tread lugs and self-cleaning channels for serious off-road enthusiasts who demand maximum traction.",
        type: "mud-terrain",
      },
    ],
    market: "value",
  },
  {
    slug: "radar",
    name: "Radar",
    country: "Singapore",
    headquarters: "Singapore",
    founded: 2006,
    overview:
      "Radar Tires is the flagship brand of Omni United, a Singapore-based tire company founded in 2006. Despite being a relatively young brand, Radar has achieved rapid growth by offering over 2,000 tire sizes across passenger, SUV, light truck, and trailer segments. The company designs tires in Singapore and partners with manufacturing facilities in Thailand, Indonesia, China, and India to deliver quality products at competitive price points.\n\nRadar's product lineup has matured considerably from its early budget positioning. The Dimax series covers everything from all-season touring to ultra-high-performance applications, while the Renegade line of all-terrain and rugged-terrain tires has earned strong reviews from truck owners. Notably, Radar co-developed the Dimax All Weather tire with Italian design house GFG Style, demonstrating a commitment to premium engineering partnerships. Drivers who shop for Radar tires find impressive features and warranties at prices that significantly undercut established brands, and dealers ship these value-oriented tires nationwide.\n\nThe company has invested in EV-specific tire development, sustainability initiatives, and a unique Eco-Warrior program that turns used tires into shoes for children in need. Radar continues to prove that newer brands can deliver compelling value in a market dominated by century-old competitors.",
    technologies: [
      "Silica-Enriched Compound",
      "Stone Ejector Technology",
      "M-Sipe Wet Weather System",
      "Dual Sidewall Design",
      "Circle of Treadlife Indicator",
    ],
    topModels: [
      {
        name: "Dimax AS-8",
        description:
          "Radar's premier all-season touring tire with a silica-enriched compound, delivering balanced performance and a 60,000-mile warranty at a competitive price.",
        type: "all-season",
      },
      {
        name: "Renegade A/T Pro",
        description:
          "A premium all-terrain tire with interlocking tread blocks, stone ejectors, and a dual sidewall design for trucks and SUVs.",
        type: "all-terrain",
      },
      {
        name: "Dimax R8+",
        description:
          "An ultra-high-performance summer tire with asymmetric tread and advanced silica compound for precise handling at high speeds.",
        type: "performance",
      },
    ],
    market: "value",
  },
  {
    slug: "ironman",
    name: "Ironman",
    country: "USA",
    headquarters: "Findlay, Ohio, USA",
    founded: 2010,
    overview:
      "Ironman Tires is a budget-friendly tire brand that was introduced around 2010 by Hercules Tire and Rubber Company, which itself is part of the American Tire Distributors network and was later absorbed into the Cooper-Goodyear family. The brand was created to fill the entry-level segment with tires that offer essential performance attributes at the lowest possible price point, making them an appealing option for cost-conscious drivers.\n\nIronman produces tires for passenger cars, SUVs, and light trucks in categories including all-season, highway, and all-terrain. The iMove series covers passenger and performance applications, while the All Country line serves the truck and SUV market. When budget-minded drivers shop for Ironman tires, they find reliable products that meet DOT safety standards at prices that make tire replacement more affordable. Dealers across the country ship Ironman tires quickly, keeping drivers on the road without breaking the bank.\n\nWhile Ironman occupies the budget tier, the brand benefits from the engineering and quality standards of its parent organizations. For drivers who prioritize affordability over brand prestige, Ironman delivers functional safety at an accessible price.",
    technologies: [
      "All-Season Compound",
      "Multi-Groove Traction Design",
      "Full-Depth Siping",
      "Optimized Pitch Sequence",
      "Reinforced Sidewall Construction",
    ],
    topModels: [
      {
        name: "All Country A/T",
        description:
          "An affordable all-terrain tire for trucks and SUVs with aggressive siping and a tough casing for light off-road and everyday highway use.",
        type: "all-terrain",
      },
      {
        name: "iMove Gen2 AS",
        description:
          "A budget-friendly all-season tire for sedans and coupes, delivering adequate traction and comfort for daily commuting.",
        type: "all-season",
      },
      {
        name: "All Country HT",
        description:
          "A highway touring tire for trucks and SUVs providing a smooth, quiet ride and dependable traction at an entry-level price.",
        type: "highway",
      },
    ],
    market: "value",
  },
  {
    slug: "sumitomo",
    name: "Sumitomo",
    country: "Japan",
    headquarters: "Tokyo, Japan",
    founded: 1909,
    overview:
      "Sumitomo Rubber Industries was founded in 1909 in Kobe, Japan, as part of the massive Sumitomo Group conglomerate that traces its origins back more than 400 years. The company is one of the largest tire manufacturers in the world, and in addition to its own Sumitomo-branded tires, it is the parent company of Falken Tires and Dunlop Tires in certain markets. Sumitomo's tires sold under their own name in North America are positioned in the value segment.\n\nSumitomo-branded tires cover passenger, touring, performance, and light truck segments. The HTR series handles performance applications, while the Encounter line serves the all-terrain and highway truck market. Drivers who shop for Sumitomo tires often discover a well-kept secret: these tires deliver reliable performance and reasonable tread life at prices well below comparable offerings from premium brands. Authorized dealers ship Sumitomo tires across the country, providing an accessible option for everyday drivers.\n\nBacked by the engineering capabilities of one of Japan's largest rubber companies, Sumitomo-branded tires offer a strong price-to-performance ratio. The brand quietly serves millions of drivers who prefer to spend wisely without sacrificing fundamental safety and performance.",
    technologies: [
      "4D Nano Design Technology",
      "Silent Core Noise Reduction",
      "Advanced Silica Tread Compound",
      "Jointless Band Construction",
      "Multi-Wave Siping",
    ],
    topModels: [
      {
        name: "HTR A/S P03",
        description:
          "A performance all-season tire with strong wet and dry grip, responsive steering, and a 50,000-mile warranty for sedans and coupes.",
        type: "all-season",
      },
      {
        name: "Encounter AT",
        description:
          "A capable all-terrain tire for trucks and SUVs offering balanced on-road comfort and off-road traction with a durable tread compound.",
        type: "all-terrain",
      },
      {
        name: "HTR Enhance WX2",
        description:
          "A grand touring all-season tire delivering smooth ride quality, low noise, and dependable all-weather traction for daily driving.",
        type: "touring",
      },
    ],
    market: "value",
  },
  {
    slug: "uniroyal",
    name: "Uniroyal",
    country: "USA",
    headquarters: "Greenville, South Carolina, USA",
    founded: 1892,
    overview:
      "Uniroyal traces its roots back to 1892 when the United States Rubber Company was formed through the merger of several rubber manufacturers. The brand became Uniroyal in 1961 and was later acquired by Michelin in 1990. Uniroyal made tire history by inventing the rain tire, and wet-weather performance remains the brand's defining characteristic to this day. Their famous \"Tiger Paw\" brand name has been a fixture in American garages for decades.\n\nUniroyal focuses on all-season and wet-performance tires for passenger cars, minivans, and SUVs. Their tires are engineered with Michelin-derived technology but positioned at more accessible price points, making premium wet-weather safety available to a broader audience. Drivers who shop for Uniroyal tires want confident rain traction without the premium price tag, and dealers throughout the country ship these wet-weather specialists quickly to keep families safe during storm season.\n\nAs part of the Michelin family, Uniroyal benefits from world-class R&D and manufacturing standards. The brand proves that you do not need to spend luxury-tier money to get tires with genuinely impressive wet braking and hydroplaning resistance.",
    technologies: [
      "Tru-Last Technology",
      "Circumferential Rain Grooves",
      "Wide Lateral Notches",
      "PowerGrip Compound",
      "DuraShield Construction",
    ],
    topModels: [
      {
        name: "Tiger Paw Touring A/S",
        description:
          "Uniroyal's flagship all-season touring tire with wide rain grooves and Tru-Last technology for even treadwear and confident wet traction.",
        type: "all-season",
      },
      {
        name: "Laredo Cross Country Trail",
        description:
          "An all-season tire for SUVs and light trucks with optimized siping and grooves for year-round traction on and off the highway.",
        type: "all-season",
      },
      {
        name: "Tiger Paw AWP 3",
        description:
          "An affordable all-season tire for passenger cars offering solid wet performance and a comfortable ride for everyday commuting.",
        type: "all-season",
      },
    ],
    market: "value",
  },
  {
    slug: "kelly",
    name: "Kelly",
    country: "USA",
    headquarters: "Akron, Ohio, USA",
    founded: 1894,
    overview:
      "Kelly-Springfield Tire Company was founded in 1894 in Springfield, Ohio, making it one of the oldest tire brands in the United States. The company became a subsidiary of Goodyear Tire & Rubber Company in 1935 and continues to operate as Goodyear's value-tier brand. Kelly tires are manufactured in Goodyear facilities using Goodyear engineering and quality standards, but at price points designed to compete in the entry-level and mid-range segments.\n\nKelly offers a focused lineup of all-season, touring, and highway tires for passenger cars, SUVs, and light trucks. The Edge series is their primary product family, covering everything from performance all-season to all-terrain applications. Drivers who shop for Kelly tires get the peace of mind that comes from Goodyear's manufacturing pedigree at a lower price point, and retailers ship these budget-friendly tires nationwide for fast, convenient delivery.\n\nFor drivers who need reliable tires without premium branding, Kelly provides a practical solution backed by over a century of tire-making heritage and Goodyear's global engineering resources.",
    technologies: [
      "EdgeTec Technology",
      "3-Ply Polyester Casing",
      "High-Density Siping",
      "Wide Circumferential Grooves",
      "Optimized Contact Patch",
    ],
    topModels: [
      {
        name: "Edge A/S",
        description:
          "A dependable all-season tire for passenger cars and crossovers with balanced performance, good tread life, and an affordable price.",
        type: "all-season",
      },
      {
        name: "Edge AT",
        description:
          "A light-duty all-terrain tire for SUVs and trucks, offering off-road traction and on-road comfort at a budget-friendly price point.",
        type: "all-terrain",
      },
      {
        name: "Edge HP",
        description:
          "A high-performance all-season tire delivering responsive handling and cornering grip for sport sedans and coupes at a competitive price.",
        type: "performance",
      },
    ],
    market: "value",
  },
  {
    slug: "mastercraft",
    name: "Mastercraft",
    country: "USA",
    headquarters: "Findlay, Ohio, USA",
    founded: 1909,
    overview:
      "Mastercraft Tires has been manufacturing tires since 1909 and operates as a subsidiary of Cooper Tire & Rubber Company, which itself became part of the Goodyear family in 2021. Based in Findlay, Ohio, Mastercraft is positioned as a value brand that delivers everyday reliability for passenger cars, SUVs, and light trucks. The brand's long history in American tire manufacturing gives it credibility that many newer budget brands cannot match.\n\nMastercraft's product lineup includes all-season, touring, all-terrain, and highway tires designed for drivers who want functional quality without premium pricing. The Courser line serves the truck and SUV segment with capable all-terrain and highway options, while the Stratus series covers passenger car needs. When budget-minded drivers shop for Mastercraft tires, they get American manufacturing heritage and Cooper's engineering expertise at prices that keep tire replacement affordable. Dealers across the country ship Mastercraft tires to customers who value straightforward performance.\n\nAs part of the Cooper-Goodyear ecosystem, Mastercraft benefits from advanced R&D and rigorous quality testing. The brand quietly serves a loyal customer base that appreciates dependable tires without the markup associated with household-name brands.",
    technologies: [
      "Advanced All-Season Compound",
      "Jointless Nylon Reinforcement",
      "Multi-Siping Technology",
      "Optimized Groove Geometry",
      "Durable Casing Construction",
    ],
    topModels: [
      {
        name: "Courser AXT2",
        description:
          "A versatile all-terrain tire for trucks and SUVs with aggressive tread, chip-and-tear-resistant compound, and a 60,000-mile warranty.",
        type: "all-terrain",
      },
      {
        name: "Stratus AS",
        description:
          "An all-season tire for passenger cars offering balanced wet and dry traction, comfortable ride quality, and a 50,000-mile warranty.",
        type: "all-season",
      },
      {
        name: "Courser HSX Tour",
        description:
          "A highway touring tire for SUVs and crossovers providing a quiet ride, stable handling, and long tread life for everyday driving.",
        type: "touring",
      },
    ],
    market: "value",
  },
  {
    slug: "federal",
    name: "Federal",
    country: "Taiwan",
    headquarters: "Taipei, Taiwan",
    founded: 1954,
    overview:
      "Federal Tires was founded in 1954 in Taipei, Taiwan, and has grown into one of the island's most prominent tire exporters. The company was originally established with technical assistance from Bridgestone and has since developed its own engineering capabilities, producing tires in Taiwan and China for markets worldwide. Federal has built a particularly strong reputation in the performance and motorsport communities, especially in drifting and time attack.\n\nFederal's product range includes ultra-high-performance summer tires, all-season options, and a growing lineup of SUV and truck tires. The Evoluzion and 595 series are well-known among performance enthusiasts for delivering aggressive grip at prices far below premium European competitors. When drivers shop for Federal tires, they often seek affordable performance that punches above its weight class, and retailers ship these Taiwanese-engineered tires to enthusiasts and daily drivers across North America.\n\nThe company has expanded its R&D investments in recent years, focusing on advanced compounds, motorsport development, and electric vehicle applications. Federal's strong value proposition makes it a popular choice for autocross competitors, drift drivers, and performance car owners looking to maximize grip per dollar.",
    technologies: [
      "Super Fine Nano Silica Compound",
      "Adaptive Cornering Technology",
      "V-SHAPE Aqua Groove Design",
      "3D Interlocking Siping",
      "Dual Layer Tread Construction",
    ],
    topModels: [
      {
        name: "595RS-RR",
        description:
          "A semi-slick extreme performance tire designed for track days, autocross, and competitive drifting with massive dry grip and quick warm-up.",
        type: "performance",
      },
      {
        name: "Evoluzion ST-1",
        description:
          "An ultra-high-performance summer tire offering sharp handling, low noise, and balanced wet and dry traction for sports cars and sedans.",
        type: "performance",
      },
      {
        name: "Couragia A/T",
        description:
          "An all-terrain tire for SUVs and light trucks with an open tread design for off-road traction and a comfortable highway ride.",
        type: "all-terrain",
      },
    ],
    market: "value",
  },
  {
    slug: "kenda",
    name: "Kenda",
    country: "Taiwan",
    headquarters: "Yuanlin, Taiwan",
    founded: 1962,
    overview:
      "Kenda Rubber Industrial Company was founded in 1962 in Yuanlin, Taiwan, and has grown into one of the world's most diversified tire manufacturers. While many consumers know Kenda for their bicycle and motorcycle tires, the company also produces a comprehensive lineup of passenger car, light truck, ATV, trailer, and industrial tires. Kenda operates manufacturing facilities across Asia and has a growing presence in North America.\n\nKenda's automotive tire lineup includes all-season, touring, performance, and highway options that emphasize value and dependability. The Klever series serves the SUV and truck market, while the Vezda line covers performance applications. Drivers who shop for Kenda tires find competitive pricing with solid fundamental performance, and dealers ship these versatile tires to customers across the country at prices that appeal to the value-conscious buyer.\n\nThe company's broad manufacturing expertise across tire categories gives Kenda unique insights into rubber compound technology and construction methods. Their continued investment in automotive tire development signals ambitions to capture a larger share of the North American passenger and light truck tire market.",
    technologies: [
      "Dynamic High-Silica Compound",
      "UltraFlex Sidewall Technology",
      "Multi-Pitch Tread Design",
      "Continuous Center Rib",
      "Advanced Casing Construction",
    ],
    topModels: [
      {
        name: "Klever A/T2 KR628",
        description:
          "A well-rounded all-terrain tire for trucks and SUVs with 3PMSF winter certification, stone ejectors, and a durable all-weather compound.",
        type: "all-terrain",
      },
      {
        name: "Vezda UHP A/S KR400",
        description:
          "An ultra-high-performance all-season tire offering sharp handling and confident traction for sports sedans and coupes at a competitive price.",
        type: "all-season",
      },
      {
        name: "Klever H/T2 KR600",
        description:
          "A highway touring tire for SUVs and light trucks delivering a smooth ride, even treadwear, and reliable all-season traction.",
        type: "highway",
      },
    ],
    market: "value",
  },
  {
    slug: "laufenn",
    name: "Laufenn",
    country: "South Korea",
    headquarters: "Seoul, South Korea",
    founded: 2014,
    overview:
      "Laufenn is a value-tier tire brand launched in 2014 with a focus on making advanced tire technology accessible at affordable price points. The name derives from the German word \"laufen,\" meaning \"to run,\" and the brand is built around delivering quality engineering without the premium markup. Laufenn tires are produced in modern global manufacturing facilities with rigorous quality control standards.\n\nLaufenn offers a streamlined range of all-season, performance, and SUV tires under the S FIT, G FIT, and X FIT product families. The simplified lineup makes it easy for drivers to find the right tire without navigating an overwhelming catalog. When cost-conscious drivers shop for Laufenn tires, they get solid engineering at a lower price, and retailers ship these well-made tires to budget-minded customers nationwide who want more than generic budget-tire quality.\n\nAs one of the newest brands in the tire market, Laufenn represents the growing trend of bringing advanced technology to the value segment, giving consumers more options than ever before.",
    technologies: [
      "Advanced Compound Technology",
      "Full-Depth Siping",
      "Jointless Belt Construction",
      "Aqua Skid Resistance Design",
      "Center Rib Stability Design",
    ],
    topModels: [
      {
        name: "S FIT AS",
        description:
          "A performance all-season tire delivering responsive handling, solid wet traction, and a comfortable ride for sedans and coupes.",
        type: "all-season",
      },
      {
        name: "G FIT AS",
        description:
          "An all-season touring tire offering balanced performance, even treadwear, and a quiet ride for everyday passenger cars at a budget-friendly price.",
        type: "all-season",
      },
      {
        name: "X FIT AT",
        description:
          "An all-terrain tire for trucks and SUVs providing capable off-road traction with acceptable highway comfort at a value price point.",
        type: "all-terrain",
      },
    ],
    market: "value",
  },
  {
    slug: "milestar",
    name: "Milestar",
    country: "USA",
    headquarters: "Gardena, California, USA",
    founded: 2000,
    overview:
      "Milestar is a tire brand managed by Tireco, Inc., an American tire distributor headquartered in Gardena, California, that has been importing and distributing tires since the 1970s. The Milestar brand was formalized around 2000 and has grown into one of the more recognized value brands in North America, offering a wide range of passenger, SUV, light truck, and trailer tires designed for the American market.\n\nMilestar's product lineup includes all-season, performance, all-terrain, mud-terrain, and highway tires. The Patagonia series has earned a following among off-road enthusiasts for its aggressive styling and capable trail performance at prices well below the premium competition. When drivers shop for Milestar tires, they find one of the strongest value propositions in the market, with performance-oriented options at budget-tier pricing. Retailers ship Milestar tires throughout the country, making them readily accessible to cost-conscious consumers.\n\nMilestar has invested in growing brand awareness through social media, off-road event sponsorships, and an expanding lineup that moves beyond basic budget offerings into genuine performance territory. The brand continues to challenge the assumption that affordable tires must compromise on styling or capability.",
    technologies: [
      "Advanced All-Season Compound",
      "Stone Ejector Ribs",
      "3-Ply Sidewall Construction",
      "Open Shoulder Tread Design",
      "Variable Pitch Tread Pattern",
    ],
    topModels: [
      {
        name: "Patagonia A/T R",
        description:
          "An all-terrain tire for trucks and SUVs with a rugged tread design, 3PMSF winter certification, and impressive off-road capability at a value price.",
        type: "all-terrain",
      },
      {
        name: "Patagonia M/T",
        description:
          "A mud-terrain tire with an aggressive tread pattern, 3-ply sidewall construction, and self-cleaning lugs for extreme off-road conditions.",
        type: "mud-terrain",
      },
      {
        name: "MS932 Sport",
        description:
          "An all-season touring tire for passenger cars delivering a smooth ride, adequate traction, and long tread life at a budget-friendly price.",
        type: "all-season",
      },
    ],
    market: "value",
  },
  {
    slug: "sailun",
    name: "Sailun",
    country: "China",
    headquarters: "Qingdao, China",
    founded: 2002,
    overview:
      "Sailun Group was founded in 2002 in Qingdao, China, and has rapidly grown into one of China's leading tire exporters with a presence in over 180 countries. The company went public on the Shanghai Stock Exchange in 2011 and has since invested heavily in modernizing its manufacturing capabilities and expanding into international markets. Sailun produces tires for passenger vehicles, SUVs, light trucks, and commercial trucks.\n\nSailun's product lineup includes all-season, touring, performance, and all-terrain tires positioned in the budget and value segments. The Atrezzo series covers passenger car applications, while the Terramax line serves the truck and SUV market. Drivers who shop for Sailun tires find some of the lowest prices in the market from a manufacturer that has invested significantly in quality control and modern production technology. Retailers ship Sailun tires nationwide, offering an affordable option for drivers who need to replace tires on a tight budget.\n\nThe company's rapid growth and willingness to invest in technology, including EV-specific tires and sustainable manufacturing processes, position Sailun as an increasingly competitive player in the global tire market. Their tires offer basic performance at prices that make tire ownership less burdensome for budget-conscious families.",
    technologies: [
      "EcoPoint3 Compound",
      "High-Density Silica Tread",
      "Multi-Angle Sipe Design",
      "Jointless Winding Technology",
      "Low Rolling Resistance Construction",
    ],
    topModels: [
      {
        name: "Atrezzo SH408",
        description:
          "An all-season touring tire for passenger cars offering a quiet ride, balanced traction, and competitive tread life at an entry-level price.",
        type: "all-season",
      },
      {
        name: "Terramax A/T",
        description:
          "An all-terrain tire for light trucks and SUVs with an open tread design and durable compound for mixed on- and off-road driving.",
        type: "all-terrain",
      },
      {
        name: "Inspire",
        description:
          "A touring all-season tire engineered for comfort and fuel efficiency, designed for sedans and crossovers seeking a smooth daily ride.",
        type: "touring",
      },
    ],
    market: "value",
  },
  {
    slug: "westlake",
    name: "Westlake",
    country: "China",
    headquarters: "Hangzhou, China",
    founded: 1958,
    overview:
      "Westlake Tires, manufactured by ZC Rubber (Zhongce Rubber Group), was founded in 1958 in Hangzhou, China. ZC Rubber is the largest tire manufacturer in China and ranks among the top ten globally by production volume. The Westlake brand is their primary export label for passenger, SUV, light truck, and commercial tires sold in North America and other international markets.\n\nWestlake offers a broad range of tires across all major categories, including all-season, touring, performance, highway, and all-terrain segments. The SA07 series covers performance applications, while the SU318 serves the SUV highway segment. Drivers who shop for Westlake tires find prices among the lowest in the market from one of the world's most experienced high-volume tire manufacturers. Retailers ship Westlake tires across the country to budget-conscious consumers who need functional tires at minimal cost.\n\nZC Rubber's massive manufacturing scale and continued investment in quality systems, automation, and compound technology mean that Westlake tires have improved steadily over the years. For drivers who prioritize affordability above all else, Westlake provides a functional option backed by a major global manufacturer.",
    technologies: [
      "Advanced Compound Blending",
      "Computer-Optimized Tread Design",
      "Reinforced Bead Construction",
      "Multi-Groove Aqua Channeling",
      "High-Tenacity Casing Plies",
    ],
    topModels: [
      {
        name: "SA07 Sport",
        description:
          "A performance all-season tire for sedans and coupes with an asymmetric tread design delivering responsive handling at a budget price.",
        type: "all-season",
      },
      {
        name: "SU318 H/T",
        description:
          "A highway touring tire for SUVs and crossovers offering a quiet, comfortable ride and dependable all-season traction at an entry-level price.",
        type: "highway",
      },
      {
        name: "SL369 A/T",
        description:
          "An all-terrain tire for trucks and SUVs with an open tread pattern for moderate off-road use and acceptable highway comfort.",
        type: "all-terrain",
      },
    ],
    market: "value",
  },
  {
    slug: "mickey-thompson",
    name: "Mickey Thompson",
    country: "USA",
    headquarters: "Stow, Ohio, USA",
    founded: 1963,
    overview:
      "Mickey Thompson Performance Tires & Wheels was founded in 1963 by legendary racer Mickey Thompson, who set over 485 speed and endurance records during his career and was the first American to exceed 400 mph on land. The brand is now owned by Goodyear Tire & Rubber Company and continues to embody the founder's passion for speed, power, and off-road adventure. Mickey Thompson tires are purpose-built for enthusiasts who demand maximum performance in extreme conditions.\n\nMickey Thompson specializes in off-road, mud-terrain, and performance tires for trucks, Jeeps, and high-performance vehicles. The Baja Boss series is their flagship off-road line, engineered with race-proven technology from the grueling Baja 1000. Their ET Street and Sportsman lines serve the drag racing and street performance communities. When off-road and performance enthusiasts shop for Mickey Thompson tires, they choose a brand with authentic motorsport DNA, and specialized dealers ship these extreme-duty tires to builders and racers nationwide.\n\nMickey Thompson's integration into the Goodyear family has expanded manufacturing capabilities and distribution reach while preserving the brand's uncompromising focus on extreme performance and off-road dominance.",
    technologies: [
      "PowerPly XD 3-Ply Sidewall",
      "SideBiter II Lug Design",
      "Silicx3 Rubber Compound",
      "Mud-Phobic Bar Design",
      "Asymmetric Scalloped Shoulders",
    ],
    topModels: [
      {
        name: "Baja Boss A/T",
        description:
          "A premium all-terrain tire with race-inspired engineering, PowerPly XD sidewalls, and aggressive styling for trucks and SUVs that go anywhere.",
        type: "all-terrain",
      },
      {
        name: "Baja Boss M/T",
        description:
          "A competition-grade mud-terrain tire with massive tread depth, Silicx3 compound, and asymmetric scalloped shoulders for extreme off-road traction.",
        type: "mud-terrain",
      },
      {
        name: "ET Street S/S",
        description:
          "A DOT-compliant drag radial tire delivering maximum straight-line traction for street-legal drag racing and high-horsepower builds.",
        type: "performance",
      },
    ],
    market: "off-road",
  },
  {
    slug: "achilles",
    name: "Achilles",
    country: "Indonesia",
    headquarters: "Jakarta, Indonesia",
    founded: 1991,
    overview:
      "Achilles Tires is manufactured by PT Multistrada Arah Sarana, an Indonesian tire company founded in 1991 and headquartered in Jakarta. The company operates one of the largest tire manufacturing facilities in Southeast Asia, located in Cikarang, and exports tires to over 100 countries worldwide. Achilles has built brand recognition in the drifting and motorsport communities, sponsoring professional drift teams and events globally.\n\nAchilles produces tires for passenger cars, SUVs, and light trucks across performance, all-season, and touring categories. The ATR Sport series is popular among drifting enthusiasts for its predictable breakaway characteristics and affordable price, while the 868 All Seasons line serves daily drivers seeking budget-friendly all-weather traction. When drivers shop for Achilles tires, they find competitive pricing from a manufacturer with genuine motorsport involvement, and retailers ship these Indonesian-made tires to value-seeking customers throughout North America.\n\nThe company continues to invest in expanding its product range and improving compound technology. Achilles has demonstrated that emerging-market tire manufacturers can build credible brands through motorsport participation and by delivering acceptable performance at accessible price points.",
    technologies: [
      "High-Performance Silica Compound",
      "Optimized Contact Patch Design",
      "Multi-Groove Drainage System",
      "Reinforced Internal Structure",
      "Low-Noise Pitch Sequencing",
    ],
    topModels: [
      {
        name: "ATR Sport 2",
        description:
          "A performance tire popular in the drifting community, offering predictable grip transitions and responsive handling at a budget-friendly price.",
        type: "performance",
      },
      {
        name: "868 All Seasons",
        description:
          "An affordable all-season tire for passenger cars providing basic wet and dry traction with an emphasis on long tread life and ride comfort.",
        type: "all-season",
      },
      {
        name: "Desert Hawk X-MT",
        description:
          "A mud-terrain tire with aggressive tread blocks and reinforced sidewalls for trucks and SUVs tackling challenging off-road terrain.",
        type: "mud-terrain",
      },
    ],
    market: "value",
  },
  {
    slug: "fuzion",
    name: "Fuzion",
    country: "USA",
    headquarters: "Nashville, Tennessee, USA",
    founded: 2004,
    overview:
      "Fuzion is a value-tier tire brand created in 2004 by Bridgestone Americas, the world's largest tire and rubber company. Fuzion was designed to give Bridgestone a competitive offering in the budget segment, providing essential performance attributes at entry-level prices while leveraging Bridgestone's manufacturing expertise and quality standards. Fuzion tires are produced in Bridgestone's North American facilities alongside their premium products.\n\nFuzion's streamlined product lineup covers all-season, touring, performance, and SUV categories. The Fuzion Touring is the brand's most popular model, offering a smooth ride and all-season traction at prices that compete with private-label and import value brands. When cost-conscious drivers shop for Fuzion tires, they get the reassurance of Bridgestone's manufacturing quality at a fraction of the premium brand price, and dealers ship these affordable tires to customers throughout the country.\n\nAs a Bridgestone sub-brand, Fuzion demonstrates that budget tires do not have to mean unknown manufacturing origins or questionable quality. For drivers who need functional, safe tires at the lowest possible cost from a trusted manufacturer, Fuzion fills an important gap in the market.",
    technologies: [
      "UNI-T AQII Technology",
      "Fuel-Saver Compound",
      "Full-Depth Tread Design",
      "Optimized Contact Footprint",
      "Bridgestone Manufacturing Standards",
    ],
    topModels: [
      {
        name: "Fuzion Touring",
        description:
          "An all-season touring tire for passenger cars and minivans, delivering a comfortable ride and dependable traction at a budget-friendly price.",
        type: "all-season",
      },
      {
        name: "Fuzion Sport",
        description:
          "A performance all-season tire with responsive handling and solid dry grip for sport sedans and coupes at an accessible price point.",
        type: "performance",
      },
      {
        name: "Fuzion SUV",
        description:
          "An all-season tire for SUVs and crossovers providing stable handling, adequate wet traction, and even treadwear at a value price.",
        type: "all-season",
      },
    ],
    market: "value",
  },
];

export function getBrandAuthority(slug: string): BrandAuthority | undefined {
  return brandAuthority.find((b) => b.slug === slug);
}
