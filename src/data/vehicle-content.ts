/**
 * Vehicle-specific SEO content for make and model pages.
 * Structured to mirror TireRack-style landing pages.
 */

export interface VehicleMakeContent {
  slug: string;
  name: string;
  intro: string;
  overview?: string;
  tireGuide: string;
  popularBrands: string[];
  faqs: { q: string; a: string }[];
}

export interface VehicleModelContent {
  slug: string;
  name: string;
  intro: string;
  vehicleClass: "sedan" | "suv" | "truck" | "sports" | "compact" | "minivan" | "luxury" | "electric";
}

// ---------------------------------------------------------------------------
// Make-level content
// ---------------------------------------------------------------------------

export const vehicleMakes: VehicleMakeContent[] = [
  {
    slug: "honda",
    name: "Honda",
    intro:
      "Honda vehicles are known for their dependability, efficiency, and versatile performance. Whether you own a Civic, Accord, CR-V, Pilot, or Odyssey, the right tires ensure your Honda delivers comfort, traction, and fuel economy mile after mile.",
    overview:
      "Honda Motor Company, founded in 1948 in Hamamatsu, Japan, has become one of the world's most trusted automakers. Known for engineering reliability and fuel efficiency, Honda's lineup spans the compact Civic and midsize Accord sedans, the versatile CR-V and Pilot crossovers, the rugged Passport and Ridgeline, and the family-friendly Odyssey minivan. Honda consistently ranks among the top-selling vehicle brands in the United States, with the CR-V, Civic, and Accord regularly appearing in the top 20 best-selling vehicles nationwide.\n\nWhen shopping for Honda tires, the most common sizes include 215/55R16 and 235/40R18 for the Civic, 225/50R17 and 235/45R18 for the Accord, and 225/65R17 and 235/60R18 for the CR-V. Top tire brands recommended for Honda vehicles include Michelin, Bridgestone, Continental, and Goodyear — all available to shop and ship free at Ship.Tires. Touring all-season tires are the most popular choice for daily Honda drivers, while performance tires suit sportier trims like the Civic Si and Type R.\n\nHonda's i-VTEC engine technology and advanced safety systems (Honda Sensing) work best when paired with quality tires that maintain proper grip and handling characteristics. Whether you drive in sunny California or snowy Minnesota, the right tire choice ensures your Honda performs safely year-round.",
    tireGuide:
      "The best tires depend on your Honda model and how you drive. For commuting and family travel, touring all-season tires provide a smooth ride with reliable traction. For sporty models like the Civic Si or Accord Sport, performance tires enhance cornering and grip. If you live in a snowy climate, winter tires offer superior traction and safety in cold weather.",
    popularBrands: ["Michelin", "Bridgestone", "Goodyear", "Continental", "Pirelli", "Cooper"],
    faqs: [
      {
        q: "What tires are best for my Honda?",
        a: "The best tires depend on your Honda model and driving conditions. For daily commuting, touring all-season tires like the Michelin Defender or Continental TrueContact offer a smooth ride with long tread life. For sportier Hondas like the Civic Si, performance tires like the Michelin Pilot Sport deliver sharper handling.",
      },
      {
        q: "What size tires does a Honda Civic use?",
        a: "Most Honda Civics use 215/55R16, 215/50R17, or 235/40R18 tires depending on the year and trim. Check your door jamb sticker or use our vehicle lookup tool for the exact size.",
      },
      {
        q: "How often should I replace my Honda tires?",
        a: "Most tires last 40,000-70,000 miles depending on the brand and driving habits. Replace tires when tread depth reaches 2/32\" or if you notice uneven wear, bulges, or cracks.",
      },
    ],
  },
  {
    slug: "toyota",
    name: "Toyota",
    intro:
      "Toyota vehicles are built for reliability and long-term value. From the best-selling Camry and RAV4 to the rugged Tacoma and legendary 4Runner, Toyota drivers demand tires that deliver dependable performance across every road condition.",
    overview:
      "Toyota Motor Corporation, founded in 1937 in Toyota City, Japan, is the world's largest automaker by sales volume. Toyota has built its reputation on bulletproof reliability and strong resale value, with models like the Camry, Corolla, RAV4, and Highlander dominating their respective segments. The Tacoma and Tundra serve the truck market, while the 4Runner and Land Cruiser are legendary off-road platforms. Toyota also leads in hybrid technology with the Prius and hybrid variants across its lineup.\n\nThe most popular tire sizes for Toyota vehicles include 215/55R17 and 235/45R18 for the Camry, 225/65R17 for the RAV4, 265/70R16 and 265/65R17 for the Tacoma, and 265/70R17 for the 4Runner. Michelin, Bridgestone, BFGoodrich, Falken, and Toyo are top-recommended brands for Toyota vehicles — shop all of them and ship free at Ship.Tires. All-season touring tires suit the Camry and Corolla, while the Tacoma and 4Runner benefit from all-terrain options like the BFGoodrich KO2 or Falken Wildpeak AT3W.\n\nToyota's Safety Sense suite and dynamic stability control systems rely on proper tire traction to function effectively. Choosing the right tire for your Toyota ensures optimal braking distances, fuel economy, and handling characteristics across all driving conditions.",
    tireGuide:
      "Toyota vehicles cover a wide range from fuel-efficient sedans to off-road capable trucks. For the Camry and Corolla, all-season touring tires maximize comfort and fuel economy. For the RAV4 and Highlander, highway or all-terrain tires provide year-round traction. Tacoma and 4Runner owners benefit from all-terrain or mud-terrain tires for off-road adventures.",
    popularBrands: ["Michelin", "Bridgestone", "Goodyear", "BFGoodrich", "Falken", "Toyo"],
    faqs: [
      {
        q: "What tires are best for my Toyota RAV4?",
        a: "The Toyota RAV4 performs well with all-season tires like the Michelin CrossClimate2 or Bridgestone Alenza for year-round traction. For light off-road use, consider the Falken Wildpeak A/T Trail for added grip on dirt and gravel roads.",
      },
      {
        q: "What size tires does a Toyota Camry use?",
        a: "Most Toyota Camrys use 215/55R17 or 235/45R18 tires. Check your door jamb sticker for the exact size recommended for your year and trim level.",
      },
      {
        q: "Are all-terrain tires good for the Toyota Tacoma?",
        a: "All-terrain tires are an excellent choice for the Tacoma, providing a balance of on-road comfort and off-road capability. Popular options include the BFGoodrich KO2 and Falken Wildpeak AT3W.",
      },
    ],
  },
  {
    slug: "ford",
    name: "Ford",
    intro:
      "Ford builds America's best-selling trucks and some of the most capable SUVs on the road. From the legendary F-150 and rugged Bronco to the versatile Explorer and iconic Mustang, Ford vehicles need tires that match their bold performance.",
    overview:
      "Ford Motor Company, founded by Henry Ford in 1903 in Dearborn, Michigan, is one of America's most iconic automakers. The Ford F-150 has been the best-selling vehicle in the United States for over 40 consecutive years, and the brand's truck and SUV lineup — including the Ranger, Bronco, Explorer, and Expedition — dominates the American market. The Mustang remains one of the world's most recognized sports cars, while the Maverick and Escape serve the growing compact truck and crossover segments.\n\nCommon tire sizes for Ford vehicles include 275/60R20 and 275/55R20 for the F-150, 255/75R17 and 285/70R17 for the Bronco, 245/60R18 for the Explorer, and 255/40R19 for the Mustang GT. Shop Ford tires from BFGoodrich, Goodyear, Michelin, Nitto, Falken, and Cooper — all ship free at Ship.Tires. The F-150 and Bronco pair well with all-terrain tires for off-road capability, while the Mustang demands high-performance summer or all-season tires.\n\nFord's advanced traction management systems, including Trail Control on the Bronco and SelectShift on the F-150, are engineered to work with properly sized and rated tires. Matching the right tire to your Ford's factory specifications ensures optimal performance, safety, and warranty compliance.",
    tireGuide:
      "Ford's lineup spans performance cars, work trucks, and family SUVs. For the F-150 and Ranger, all-terrain tires provide excellent on- and off-road traction. The Bronco benefits from aggressive all-terrain or mud-terrain tires. For the Mustang, performance tires unlock its handling potential. Explorer and Escape owners find all-season touring tires ideal for everyday comfort.",
    popularBrands: ["BFGoodrich", "Goodyear", "Michelin", "Nitto", "Falken", "Cooper"],
    faqs: [
      {
        q: "What tires are best for my Ford F-150?",
        a: "For daily driving, all-season truck tires like the Michelin Defender LTX M/S offer long tread life and a quiet ride. For off-road capability, the BFGoodrich KO2 or Falken Wildpeak AT3W are top choices. Towing demands load-rated tires with proper weight capacity.",
      },
      {
        q: "What size tires does a Ford Bronco use?",
        a: "The Ford Bronco uses 255/75R17 or 285/70R17 tires in stock configuration. Many owners upgrade to 315/70R17 for a more aggressive stance and improved off-road grip.",
      },
      {
        q: "Do I need special tires for my Ford Mustang?",
        a: "Performance tires like the Michelin Pilot Sport 4S or Continental ExtremeContact Sport significantly improve the Mustang's cornering and braking. Summer performance tires provide the best grip in warm conditions, while all-season performance tires offer year-round versatility.",
      },
    ],
  },
  {
    slug: "chevrolet",
    name: "Chevrolet",
    intro:
      "Chevrolet covers everything from full-size trucks and SUVs to sports cars and electric vehicles. Whether you drive a Silverado, Tahoe, Equinox, Camaro, or Bolt, the right tires keep your Chevy performing at its best in every season.",
    overview:
      "Chevrolet, founded in 1911 and now a division of General Motors, is one of America's highest-volume automakers. The Silverado is the second-best-selling truck in the US, while the Tahoe, Suburban, and Traverse serve families needing full-size SUV capability. The Equinox is a top-selling compact crossover, and the Camaro and Corvette represent Chevrolet's performance heritage. Chevrolet is also expanding into the EV market with the Bolt, Equinox EV, and Silverado EV.\n\nPopular tire sizes for Chevrolet vehicles include 275/60R20 for the Silverado 1500, 265/65R18 for the Tahoe, 225/65R17 for the Equinox, and 245/40R20 for the Camaro. Goodyear, Michelin, Bridgestone, Cooper, and Firestone are recommended tire brands for Chevy vehicles — shop them all and ship free at Ship.Tires. Truck and SUV owners benefit from highway terrain or all-terrain tires, while Camaro and Corvette drivers need ultra-high-performance tires.\n\nChevrolet's StabiliTrak electronic stability control and advanced trailering systems depend on proper tire specifications for optimal function. The right tires ensure your Chevy delivers its full potential in towing, handling, and all-weather traction.",
    tireGuide:
      "Chevy trucks like the Silverado and Colorado need durable all-terrain or highway tires built for hauling and towing. For the Tahoe and Suburban, highway tires provide a smooth ride with long tread life. The Camaro and Corvette demand high-performance tires for maximum grip. Equinox and Traverse owners benefit from all-season touring tires for family comfort.",
    popularBrands: ["Goodyear", "Michelin", "BFGoodrich", "Bridgestone", "Nitto", "Toyo"],
    faqs: [
      {
        q: "What tires fit the Chevy Silverado 1500?",
        a: "The Silverado 1500 commonly uses 265/70R17, 275/65R18, or 275/55R20 tires depending on the trim. For all-around use, the Michelin Defender LTX or Goodyear Wrangler DuraTrac are popular options.",
      },
      {
        q: "What are the best tires for a Chevy Tahoe?",
        a: "The Tahoe rides best on highway tires like the Michelin Defender LTX M/S or Bridgestone Dueler H/L Alenza. These provide a smooth, quiet ride with good tread life for highway driving and family trips.",
      },
    ],
  },
  {
    slug: "nissan",
    name: "Nissan",
    intro:
      "Nissan offers a diverse lineup from the affordable Sentra and Versa to the popular Rogue crossover, capable Pathfinder, and rugged Frontier and Titan trucks. The right tires enhance your Nissan's comfort, safety, and fuel efficiency.",
    overview:
      "Nissan Motor Corporation, founded in 1933 in Yokohama, Japan, has grown into one of the world's leading automakers with a diverse vehicle lineup spanning every major segment. Nissan's best-known models include the midsize Altima sedan, the top-selling Rogue crossover, the practical Sentra compact, the three-row Pathfinder, the midsize Frontier pickup, the full-size Titan truck, and the iconic 370Z and its successor, the Nissan Z sports car. The Rogue consistently ranks among America's best-selling SUVs, and the Altima remains a strong competitor in the midsize sedan market.\n\nWhen you shop for Nissan tires, the most common sizes include 215/55R17 for the Altima, 225/65R17 for the Rogue, 205/55R16 and 215/50R17 for the Sentra, 255/60R18 for the Pathfinder, 265/70R17 for the Frontier, and 275/65R18 for the Titan. Top recommended tire brands for Nissan vehicles include Michelin, Bridgestone, and Yokohama — all available to shop and ship free at Ship.Tires. Touring all-season tires are the best choice for the Altima and Sentra, while the Frontier and Titan benefit from all-terrain options for drivers who venture off the pavement.\n\nNissan's Intelligent Mobility suite, including ProPILOT Assist and Intelligent All-Wheel Drive, relies on consistent tire traction for proper function. Whether you drive a Rogue through rainy Pacific Northwest commutes or a Frontier across dusty Southwest trails, selecting the right tires and keeping them properly maintained ensures your Nissan delivers the safety and performance it was engineered to provide.",
    tireGuide:
      "For Nissan sedans like the Altima and Sentra, touring all-season tires provide the best balance of ride comfort and tread life. The Rogue and Murano benefit from crossover-specific all-season tires. For the Frontier and Titan trucks, all-terrain tires deliver on-road comfort with off-road capability.",
    popularBrands: ["Michelin", "Continental", "Bridgestone", "Falken", "Yokohama"],
    faqs: [
      {
        q: "What tires are best for my Nissan Rogue?",
        a: "The Nissan Rogue pairs well with crossover all-season tires like the Michelin CrossClimate2 or Continental CrossContact LX25, providing year-round traction and a comfortable ride for daily commuting.",
      },
    ],
  },
  {
    slug: "bmw",
    name: "BMW",
    intro:
      "BMW's performance-focused engineering demands tires that deliver precise handling, confident braking, and a connected driving feel. From the 3 Series and 5 Series sedans to the X3 and X5 SUVs, every BMW benefits from premium tire selection.",
    overview:
      "Bayerische Motoren Werke, better known as BMW, was founded in 1916 in Munich, Germany, and has become synonymous with the phrase \"Ultimate Driving Machine.\" BMW's lineup includes the benchmark-setting 3 Series and executive 5 Series sedans, the versatile X3 and commanding X5 SUVs, the flagship 7 Series luxury sedan, and the high-performance M models — including the M3, M5, and X5 M — that push driving dynamics to their limits. BMW continues to expand its electric offerings with the i4, iX, and i5.\n\nThe most common tire sizes for BMW vehicles include 225/45R18 for the 3 Series, 245/40R19 for the 5 Series, 245/50R19 for the X3, and 275/40R20 for the X5. Premium tire brands recommended for BMW vehicles include Michelin, Continental, Pirelli, and Bridgestone — shop all of them and ship free at Ship.Tires. Many BMW models come equipped with run-flat tires, which allow continued driving after a puncture since most BMWs do not include a spare tire. Performance all-season tires suit daily drivers, while dedicated summer tires are the right choice for M models.\n\nBMW's xDrive all-wheel-drive system and Dynamic Stability Control are engineered to work in concert with properly specified tires. Using the correct tire size, speed rating, and load index is especially important for BMWs, as the suspension geometry and electronic systems are calibrated for specific tire characteristics. Whether you drive a 3 Series through winding roads or an X5 on a family road trip, quality tires are essential for preserving the driving experience BMW owners expect.",
    tireGuide:
      "BMW vehicles are engineered for driving dynamics, so tire choice matters more than most. For the 3 Series and 5 Series, performance all-season or summer tires maintain the car's sharp handling. M models require ultra-high-performance tires rated for their power. X-series SUVs benefit from premium all-season tires that balance grip with ride comfort.",
    popularBrands: ["Michelin", "Continental", "Pirelli", "Bridgestone", "Goodyear", "Dunlop"],
    faqs: [
      {
        q: "Do I need run-flat tires for my BMW?",
        a: "Many BMWs come equipped with run-flat tires since they lack a spare tire. While you can switch to standard tires with a tire repair kit, run-flat tires provide the peace of mind of extended mobility after a puncture.",
      },
      {
        q: "What tires are best for a BMW 3 Series?",
        a: "The BMW 3 Series excels with performance tires like the Michelin Pilot Sport 4S (summer) or Continental ExtremeContact DWS06 Plus (all-season). These maintain the car's signature handling precision.",
      },
    ],
  },
  {
    slug: "mercedes-benz",
    name: "Mercedes-Benz",
    intro:
      "Mercedes-Benz vehicles combine luxury, comfort, and performance across a comprehensive lineup. From the C-Class and E-Class sedans to the GLE and GLC SUVs, the iconic G-Class, flagship S-Class, and electric EQS and EQE, choosing the right tires ensures your Mercedes delivers the refined driving experience it was designed for.",
    overview:
      "Mercedes-Benz, founded in 1926 in Stuttgart, Germany, is one of the world's most prestigious automotive brands, building vehicles that define luxury, safety, and engineering excellence. The current Mercedes lineup spans every segment: the compact A-Class and CLA sedans, the benchmark C-Class and executive E-Class, the flagship S-Class, the sporty CLE coupe, and the elegant SL roadster. The SUV range includes the compact GLA and GLB, the popular GLC, the midsize GLE and GLE Coupe, the full-size GLS, and the legendary G-Class (G-Wagen). Mercedes-AMG models — including the AMG GT, AMG C 63, and AMG G 63 — deliver track-ready performance. The brand's electric EQ lineup includes the EQB, EQE, EQS sedan, and EQS SUV.\n\nCommon tire sizes for Mercedes-Benz vehicles include 225/45R18 for the C-Class, 245/45R18 for the E-Class, 255/45R19 for the S-Class, 235/60R18 for the GLC, 255/55R19 for the GLE, 275/50R20 for the GLS, and 275/55R19 for the G-Class. Premium tire brands recommended for Mercedes vehicles include Continental, Michelin, Pirelli, and Bridgestone — shop all of them and ship free at Ship.Tires. Many Mercedes models are available with run-flat tires (MOExtended) that allow continued driving after a puncture.\n\nMercedes-Benz's 4MATIC all-wheel-drive system, AIRMATIC air suspension, and advanced driver assistance systems rely on properly specified tires for optimal performance. Whether you drive a C-Class through city traffic, a GLE on family road trips, or an AMG GT on track days, selecting the right tires ensures your Mercedes delivers the comfort, safety, and performance its engineers intended.",
    tireGuide:
      "Mercedes vehicles are tuned for a balance of comfort and sportiness. For sedans like the C-Class and E-Class, premium touring or performance tires maintain ride quality and handling precision. SUVs like the GLE and GLC benefit from all-season tires that handle varied road conditions while preserving interior quietness. The G-Class needs capable all-terrain or highway tires. AMG models demand ultra-high-performance tires. For the EQS and EQE, EV-optimized low rolling resistance tires maximize range.",
    popularBrands: ["Continental", "Michelin", "Pirelli", "Bridgestone", "Goodyear"],
    faqs: [
      {
        q: "Do Mercedes-Benz vehicles require special tires?",
        a: "While not strictly required, Mercedes recommends tires that meet their MOE (Mercedes Original Equipment) or MOExtended (run-flat) specifications. These tires are optimized for ride comfort, noise levels, and handling characteristics specific to each Mercedes model.",
      },
      {
        q: "What tires are best for the Mercedes GLE?",
        a: "The GLE performs well with premium all-season tires like the Continental CrossContact LX25 or Michelin Primacy. For the GLE 63 AMG, performance all-season or summer tires provide the grip needed for its powerful V8.",
      },
      {
        q: "Does the Mercedes G-Class need special tires?",
        a: "The G-Class benefits from highway or all-terrain tires that handle its weight while providing off-road capability. For on-road use, premium all-season tires maintain its luxury ride quality.",
      },
    ],
  },
  {
    slug: "hyundai",
    name: "Hyundai",
    intro:
      "Hyundai has rapidly become one of America's most popular brands, with vehicles like the Tucson, Elantra, Sonata, Santa Fe, and Palisade offering exceptional value and modern features. The right tires maximize your Hyundai's comfort, efficiency, and safety.",
    overview:
      "Hyundai Motor Company, founded in 1967 in Seoul, South Korea, has risen from a budget automaker to one of the most respected brands in the global automotive market. Hyundai's current lineup includes the compact Tucson and midsize Santa Fe crossovers, the Elantra compact sedan, the Sonata midsize sedan, the three-row Palisade, the subcompact Kona, and the Ioniq family of electric vehicles including the Ioniq 5 and Ioniq 6. Hyundai vehicles are known for their generous warranty coverage, modern design, and strong value proposition.\n\nWhen you shop for Hyundai tires, the most common sizes include 225/60R18 for the Tucson, 215/55R17 for the Elantra, 215/55R17 for the Sonata, 235/65R18 for the Santa Fe, 245/60R18 for the Palisade, and 235/55R19 for the Ioniq 5. Value-oriented and premium tire brands alike work well on Hyundai vehicles — Kumho and Nexen offer excellent quality at competitive prices, while Michelin and Continental deliver premium performance. Shop all of these brands and ship free at Ship.Tires. Touring all-season tires are the most popular choice for Hyundai sedans and crossovers, while EV-specific low rolling resistance tires are recommended for the Ioniq lineup.\n\nHyundai's SmartSense safety suite, which includes Forward Collision-Avoidance Assist and Highway Driving Assist, relies on consistent tire grip for optimal performance. South Korean tire manufacturers like Kumho and Nexen are natural partners for Hyundai vehicles, as they are often fitted as original equipment. Whether you are commuting in an Elantra, road-tripping in a Palisade, or maximizing range in an Ioniq 5, the right tires ensure your Hyundai delivers the comfort, safety, and efficiency its engineers intended.",
    tireGuide:
      "For Hyundai sedans like the Elantra and Sonata, touring all-season tires deliver long tread life and a comfortable ride. The Tucson and Santa Fe perform well with crossover all-season tires. The Palisade benefits from premium touring tires that provide a quiet, luxury-like ride. For the Ioniq 5, low rolling resistance tires maximize electric range.",
    popularBrands: ["Michelin", "Continental", "Kumho", "Bridgestone", "Yokohama"],
    faqs: [
      {
        q: "What tires should I get for my Hyundai Tucson?",
        a: "The Hyundai Tucson works well with all-season crossover tires like the Michelin CrossClimate2 or Continental TrueContact Tour. These provide reliable all-weather traction and a comfortable ride for daily driving.",
      },
    ],
  },
  {
    slug: "kia",
    name: "Kia",
    intro:
      "Kia has earned a reputation for exceptional value, bold design, and impressive warranties. From the family-friendly Telluride to the practical Sportage, sporty K5, and efficient Forte, Kia vehicles deserve tires that complement their quality and performance.",
    overview:
      "Kia Corporation, founded in 1944 in Seoul, South Korea, has undergone a remarkable transformation from a manufacturer of bicycles and steel tubing to one of the world's most dynamic automakers. Kia's current lineup features the award-winning three-row Telluride, the midsize Sorento, the compact Sportage, the practical Forte sedan, the funky Soul, and the groundbreaking EV6 electric crossover. Kia's bold design language, industry-leading warranty (10-year/100,000-mile powertrain), and competitive pricing have made it one of the fastest-growing brands in the United States.\n\nCommon tire sizes for Kia vehicles include 235/65R17 for the Sorento, 225/45R17 for the Forte, 225/60R17 for the Sportage, 245/50R20 for the Telluride, and 235/55R19 for the EV6. Recommended tire brands for Kia vehicles include Kumho, Michelin, and Continental — shop all of them and ship free at Ship.Tires. Kumho is frequently fitted as original equipment on Kia vehicles, offering strong performance at value-oriented price points. For drivers seeking premium options, Michelin and Continental tires deliver top-tier grip, tread life, and ride comfort.\n\nKia's Drive Wise advanced driver-assistance technology, including Lane Following Assist and Highway Driving Assist, depends on reliable tire traction to function as designed. The EV6, with its 800-volt architecture and ultra-fast charging capability, benefits specifically from EV-optimized tires that minimize rolling resistance for maximum range. Whether you are hauling the family in a Telluride, commuting in a Forte, or pushing the limits of the EV6's impressive acceleration, choosing the right tires ensures your Kia delivers the performance and safety that have earned the brand its growing reputation.",
    tireGuide:
      "Kia vehicles span multiple segments, each with different tire needs. For the Telluride and Sorento, all-season SUV tires provide the traction and comfort families need. The K5 and Forte perform best with touring all-season tires for daily commuting. The EV6 benefits from EV-specific tires designed for instant torque and range efficiency.",
    popularBrands: ["Kumho", "Michelin", "Continental", "Bridgestone", "Falken"],
    faqs: [
      {
        q: "What tires are best for my Kia Telluride?",
        a: "The Kia Telluride is a premium three-row SUV that rides best on touring all-season tires like the Michelin Defender LTX or Continental CrossContact LX25. These provide a quiet ride with excellent wet and dry traction.",
      },
    ],
  },
  {
    slug: "jeep",
    name: "Jeep",
    intro:
      "Jeep is synonymous with off-road capability and adventure. Whether you drive a Wrangler on the trails, a Grand Cherokee on the highway, or a Compass around town, the right tires transform your Jeep's performance both on and off the pavement.",
    overview:
      "Jeep, founded in 1941 in Toledo, Ohio, is one of the most iconic American automotive brands, built on a legacy of rugged off-road capability that dates back to World War II military vehicles. Today's Jeep lineup includes the legendary Wrangler, the refined Grand Cherokee, the midsize Cherokee, the truck-based Gladiator pickup, and the compact Compass crossover. The Wrangler remains the gold standard for open-air trail driving, while the Grand Cherokee offers a premium blend of on-road luxury and off-road prowess with its Quadra-Trac and Quadra-Drive systems.\n\nCommon tire sizes for Jeep vehicles include 255/75R17 for the Wrangler, 265/60R18 for the Grand Cherokee, 245/65R17 for the Cherokee, and 285/70R17 for lifted Wranglers and Gladiators. Off-road tire brands favored by Jeep owners include BFGoodrich, Goodyear, Falken, Nitto, and Mickey Thompson — shop all of them and ship free at Ship.Tires. All-terrain tires like the BFGoodrich KO2 and Falken Wildpeak AT3W are the most popular choice for Wrangler and Gladiator owners, balancing trail grip with highway comfort. For Grand Cherokee and Compass drivers who stay mostly on pavement, all-season tires deliver everyday comfort with wet-weather confidence.\n\nJeep's Trail Rated badge signifies that a vehicle has been tested across five categories: traction, ground clearance, maneuverability, articulation, and water fording. The tires you choose directly impact every one of these capabilities. Whether you are building a Wrangler for Moab rock crawling or equipping a Grand Cherokee for snowy mountain passes, selecting the right tire compound and tread pattern is the single most impactful upgrade for your Jeep's real-world performance.",
    tireGuide:
      "Jeep tire selection depends heavily on how you use your vehicle. For the Wrangler and Gladiator, all-terrain tires like the BFGoodrich KO2 provide excellent off-road grip without sacrificing highway manners. Mud-terrain tires are ideal for serious off-roading. For the Grand Cherokee, Compass, and Cherokee, all-season tires provide everyday comfort with capable wet traction.",
    popularBrands: ["BFGoodrich", "Goodyear", "Nitto", "Falken", "Toyo", "Cooper"],
    faqs: [
      {
        q: "What are the best off-road tires for a Jeep Wrangler?",
        a: "For mixed on/off-road use, the BFGoodrich KO2, Falken Wildpeak AT3W, and Goodyear Wrangler DuraTrac are top choices. For extreme off-road, consider the BFGoodrich KM3 or Nitto Trail Grappler mud-terrain tires.",
      },
      {
        q: "Can I put bigger tires on my Jeep?",
        a: "Many Jeep models support upsizing tires with a lift kit. The Wrangler commonly upgrades from 255/75R17 to 285/70R17 or 315/70R17. A lift may be required for larger sizes to prevent rubbing.",
      },
    ],
  },
  {
    slug: "subaru",
    name: "Subaru",
    intro:
      "Subaru's standard all-wheel drive system makes tire selection especially important. The Outback, Forester, Crosstrek, and WRX all rely on matched tires for optimal AWD performance, traction, and safety in every weather condition.",
    overview:
      "Subaru Corporation, founded in 1953 in Tokyo, Japan, has carved out a distinctive niche in the automotive world as the only mainstream automaker to offer standard all-wheel drive across its entire lineup. Subaru's vehicles include the versatile Outback wagon-crossover, the compact Forester, the adventure-ready Crosstrek, the rally-inspired WRX performance sedan, the practical Impreza, and the three-row Ascent. Subaru's Symmetrical All-Wheel Drive system, paired with the horizontally opposed Boxer engine, delivers a low center of gravity and balanced traction that has earned a devoted following, particularly in regions with harsh winter weather.\n\nThe most common tire sizes for Subaru vehicles include 225/65R17 for the Outback, 225/60R18 for the Forester, 225/60R17 for the Crosstrek, 245/40R18 for the WRX, and 245/65R17 for the Ascent. Recommended tire brands for Subaru vehicles include Yokohama, Falken, Michelin, and Bridgestone — shop all of them and ship free at Ship.Tires. All-season tires with strong wet and snow traction ratings are the most popular choice for Outback, Forester, and Crosstrek owners, while the WRX demands performance-oriented tires that can handle its turbocharged power through all four wheels.\n\nOne critical consideration for Subaru owners is that the Symmetrical AWD system requires all four tires to be the same size, brand, model, and within 2/32 of an inch in tread depth. Mismatched tires can cause excessive wear on the center differential, leading to costly drivetrain repairs. This means when one tire is damaged beyond repair, Subaru owners often need to replace all four tires at once — or have the new tire shaved to match the remaining three. When it is time to shop for a full set, Ship.Tires makes it easy to find matched tires and ship them directly to your door or preferred installer.",
    tireGuide:
      "With Subaru's symmetrical AWD, it's critical that all four tires match in size and tread depth. For the Outback and Forester, all-season crossover tires provide excellent year-round traction. The Crosstrek benefits from tires with light off-road capability. For the WRX, performance tires unlock its sporty handling. Many Subaru owners in northern climates run dedicated winter tires for optimal snow traction.",
    popularBrands: ["Michelin", "Bridgestone", "Continental", "Falken", "Yokohama", "Nokian"],
    faqs: [
      {
        q: "Do all four Subaru tires need to match?",
        a: "Yes. Subaru's AWD system requires all four tires to be the same size, brand, model, and within 2/32\" of tread depth. Mismatched tires can damage the AWD system and lead to expensive repairs.",
      },
    ],
  },
  {
    slug: "ram",
    name: "Ram",
    intro:
      "Ram trucks are built for work and recreation, from the versatile 1500 to the heavy-duty 2500 and 3500. The right tires ensure your Ram delivers the towing capacity, off-road capability, and highway comfort you expect from a full-size truck.",
    overview:
      "Ram Trucks, established as its own brand in 2010 when it was split from the Dodge lineup, has quickly built a reputation for combining work-truck capability with segment-leading ride comfort and interior refinement. The Ram lineup centers on the Ram 1500 half-ton, the Ram 2500 three-quarter-ton, and the Ram 3500 one-ton heavy-duty trucks. The Ram 1500's coil-spring rear suspension (unique in the full-size truck segment) and available air suspension deliver a ride quality that rivals many luxury SUVs, while the 2500 and 3500 offer some of the highest towing and payload capacities available in production trucks.\n\nCommon tire sizes for Ram trucks include 275/60R20 and 285/60R20 for the Ram 1500, LT275/70R18 for the Ram 2500, and LT275/70R18 for the Ram 3500. Truck-focused tire brands recommended for Ram vehicles include BFGoodrich, Goodyear, Toyo, Cooper, and Nitto — shop all of them and ship free at Ship.Tires. For Ram 1500 owners who primarily drive on highways and city streets, all-season truck tires like the Michelin Defender LTX provide long tread life and a comfortable ride. For off-road use, all-terrain tires like the BFGoodrich KO2 or Nitto Ridge Grappler offer rugged traction without sacrificing too much highway refinement.\n\nRam 2500 and 3500 owners who tow heavy trailers or haul maximum payloads need to pay close attention to load ratings when selecting tires. LT-rated (Light Truck) tires with appropriate load range ratings (typically Load Range E for heavy-duty applications) are essential for safe towing and hauling. The tire's load capacity must meet or exceed the vehicle's Gross Vehicle Weight Rating. Whether you use your Ram 1500 as a comfortable daily driver or your Ram 3500 as a serious work truck, selecting properly rated tires and having them ship directly to your installer ensures your truck performs safely under every load condition.",
    tireGuide:
      "For the Ram 1500 used primarily on highways, all-season truck tires provide long tread life and a comfortable ride. For off-road use, all-terrain tires balance on- and off-road performance. Heavy-duty Ram 2500 and 3500 trucks need load-rated tires capable of handling serious towing and hauling duties.",
    popularBrands: ["BFGoodrich", "Goodyear", "Michelin", "Nitto", "Toyo", "Falken"],
    faqs: [
      {
        q: "What tires are best for towing with my Ram 1500?",
        a: "For towing, look for LT (Light Truck) rated tires with high load capacity. The Michelin Defender LTX M/S and Goodyear Wrangler All-Terrain Adventure with Kevlar are popular choices that handle heavy loads while providing a smooth highway ride.",
      },
    ],
  },
  {
    slug: "gmc",
    name: "GMC",
    intro:
      "GMC trucks and SUVs combine premium features with professional-grade capability. From the Sierra and Canyon trucks to the Terrain, Acadia, and Yukon, GMC vehicles need tires that deliver on their promise of refined toughness.",
    tireGuide:
      "GMC trucks like the Sierra perform best with all-terrain or highway tires depending on your use. The AT4 trim benefits from aggressive all-terrain tires, while Denali trims ride best on highway tires for maximum comfort. The Yukon and Acadia need touring SUV tires for family-friendly comfort and long tread life.",
    popularBrands: ["Goodyear", "Michelin", "BFGoodrich", "Bridgestone", "Nitto", "Cooper"],
    faqs: [
      {
        q: "What tires are best for the GMC Sierra AT4?",
        a: "The Sierra AT4 is designed for off-road capability, so all-terrain tires like the BFGoodrich KO2, Goodyear Wrangler DuraTrac, or Falken Wildpeak AT3W are ideal matches that complement its rugged character.",
      },
    ],
  },
  {
    slug: "volkswagen",
    name: "Volkswagen",
    intro:
      "Volkswagen combines German engineering with practical everyday performance. Whether you drive a Jetta, Tiguan, Atlas, or GTI, the right tires enhance your VW's precise handling, ride comfort, and fuel efficiency.",
    tireGuide:
      "For VW sedans like the Jetta and Passat, touring all-season tires provide comfort and long tread life. The GTI and Golf R deserve performance tires that match their sporty character. SUVs like the Tiguan and Atlas benefit from all-season crossover tires. For the ID.4, EV-optimized tires maximize range and handle instant torque.",
    popularBrands: ["Continental", "Michelin", "Pirelli", "Bridgestone", "Yokohama"],
    faqs: [
      {
        q: "What tires are best for a VW GTI?",
        a: "The GTI deserves performance tires that match its sporty character. The Michelin Pilot Sport 4S (summer) or Continental ExtremeContact DWS06 Plus (all-season) are excellent choices that unlock the GTI's handling potential.",
      },
    ],
  },
  {
    slug: "mazda",
    name: "Mazda",
    intro:
      "Mazda builds vehicles that prioritize driving enjoyment and premium feel. From the CX-5 and CX-50 crossovers to the Mazda3 hatchback and iconic MX-5 Miata, Mazda vehicles respond exceptionally well to quality tires that complement their chassis tuning.",
    tireGuide:
      "Mazda vehicles are tuned for handling precision, making tire choice especially impactful. The CX-5 and CX-50 benefit from all-season crossover tires that maintain Mazda's responsive steering feel. The Mazda3 pairs well with touring or performance all-season tires. The MX-5 Miata demands lightweight performance tires for maximum driving fun.",
    popularBrands: ["Michelin", "Bridgestone", "Continental", "Yokohama", "Falken", "Dunlop"],
    faqs: [
      {
        q: "What tires are best for a Mazda CX-5?",
        a: "The CX-5 performs well with all-season crossover tires like the Michelin CrossClimate2 or Bridgestone Alenza AS Ultra. These maintain the CX-5's engaging driving feel while providing year-round traction.",
      },
    ],
  },
  {
    slug: "tesla",
    name: "Tesla",
    intro:
      "Tesla vehicles require tires engineered for the unique demands of electric performance — instant torque, heavy battery weight, and regenerative braking. The Model 3, Model Y, Model S, Model X, and Cybertruck all benefit from EV-optimized tires that maximize range and grip.",
    overview:
      "Tesla, Inc., founded in 2003 in Palo Alto, California, has transformed the automotive industry by proving that electric vehicles can be desirable, high-performance, and practical for everyday use. Tesla's current lineup includes the Model 3 compact sedan, the Model Y compact SUV (now the best-selling vehicle globally), the Model S luxury sedan, the Model X full-size SUV, and the Cybertruck all-electric pickup. Each Tesla model delivers instant torque, over-the-air software updates, and access to the Supercharger network.\n\nCommon tire sizes for Tesla vehicles include 235/45R18 for the Model 3, 255/45R19 for the Model Y, 265/35R21 for the Model S, 255/45R20 for the Model X, and 285/65R20 for the Cybertruck. EV-optimized tire brands recommended for Tesla include Michelin and Continental — shop all of them and ship free at Ship.Tires. Low rolling resistance is especially important for Tesla owners because it directly impacts driving range. Tires designed for EVs feature reinforced sidewalls to support the heavier battery weight, specialized rubber compounds for reduced rolling resistance, and acoustic foam inserts for a quieter cabin experience.\n\nTesla's regenerative braking system puts unique demands on tires compared to conventional vehicles, as deceleration forces are applied through the drive wheels rather than traditional brake pads. This means front tires on rear-wheel-drive Model 3s and rear tires on all-wheel-drive variants may wear differently than expected. Regular tire rotation every 5,000 to 7,500 miles is essential for maximizing tread life. When it is time to replace your Tesla tires, choosing EV-specific options from Michelin or Continental ensures you maintain optimal range, grip, and the whisper-quiet ride that defines the Tesla ownership experience.",
    tireGuide:
      "Tesla's instant torque and heavy batteries accelerate tire wear compared to gas vehicles. EV-specific tires have reinforced sidewalls for extra load capacity and low rolling resistance for maximum range. For the Model 3 and Model Y, all-season EV tires like the Michelin e.Primacy or Continental EcoContact provide the best balance of range and grip. Performance variants benefit from summer performance tires.",
    popularBrands: ["Michelin", "Continental", "Pirelli", "Bridgestone", "Goodyear"],
    faqs: [
      {
        q: "Do Teslas need special tires?",
        a: "While not required, EV-specific tires are recommended. They feature reinforced sidewalls for the heavier battery weight, low rolling resistance for maximum range, and foam inserts for a quieter cabin. Standard tires will work but may wear faster and reduce range.",
      },
      {
        q: "How long do Tesla tires last?",
        a: "Tesla tires typically last 25,000-40,000 miles due to the vehicle's weight and instant torque. Regular rotation every 5,000-7,500 miles helps maximize tread life. EV-specific tires often last longer than standard tires on a Tesla.",
      },
    ],
  },
  {
    slug: "dodge",
    name: "Dodge",
    intro:
      "Dodge is built for performance and bold style. From the muscle-car heritage of the Charger and Challenger to the capable Durango SUV and Hornet crossover, Dodge vehicles demand tires that deliver power to the pavement.",
    tireGuide:
      "Dodge performance vehicles like the Charger and Challenger benefit from high-performance tires that handle their power. SRT and Hellcat variants need ultra-high-performance summer tires for maximum grip. The Durango pairs well with all-season SUV tires that balance towing capability with ride comfort. For the Hornet, crossover all-season tires provide year-round versatility.",
    popularBrands: ["Nitto", "Michelin", "Continental", "Pirelli", "Goodyear", "Bridgestone"],
    faqs: [
      {
        q: "What tires are best for a Dodge Challenger?",
        a: "For daily driving, performance all-season tires like the Continental ExtremeContact DWS06 Plus provide year-round grip. For track days and spirited driving, summer performance tires like the Nitto NT555 G2 or Michelin Pilot Sport 4S maximize grip and handling.",
      },
    ],
  },
  {
    slug: "lexus",
    name: "Lexus",
    intro:
      "Lexus delivers a premium ownership experience that extends to tire selection. The RX, ES, NX, GX, and IS all benefit from high-quality tires that maintain the whisper-quiet ride, precise handling, and refined comfort that define the Lexus brand.",
    tireGuide:
      "Lexus vehicles are tuned for quiet, comfortable cruising, making tire noise especially important. For the RX and NX, premium all-season crossover tires provide a luxury ride with confident traction. The ES pairs well with touring tires for maximum comfort. The GX, often used for overlanding, benefits from all-terrain tires that don't compromise on-road refinement.",
    popularBrands: ["Michelin", "Continental", "Bridgestone", "Pirelli", "Yokohama", "Dunlop"],
    faqs: [
      {
        q: "What tires are quietest for my Lexus RX?",
        a: "The Michelin Primacy MXM4, Continental CrossContact LX25, and Bridgestone Alenza AS Ultra are among the quietest tires available for the Lexus RX, maintaining the cabin silence Lexus owners expect.",
      },
    ],
  },
  {
    slug: "audi",
    name: "Audi",
    intro:
      "Audi's Quattro all-wheel drive system and precision engineering demand tires that deliver confident grip, responsive handling, and refined comfort. From the A4 and A6 sedans to the Q5 and Q7 SUVs, every Audi benefits from matched, quality tires.",
    tireGuide:
      "Like Subaru, Audi's Quattro AWD system performs best with matched tires across all four corners. For the A4 and A6, performance all-season tires maintain the car's handling precision year-round. The Q5 and Q7 benefit from premium all-season SUV tires. S-line and RS models require ultra-high-performance tires rated for their power output.",
    popularBrands: ["Continental", "Michelin", "Pirelli", "Bridgestone", "Dunlop"],
    faqs: [
      {
        q: "Do all four Audi tires need to match?",
        a: "Yes. Audi's Quattro system, like Subaru's AWD, requires all four tires to be the same size, model, and within close tread depth to prevent drivetrain damage and ensure optimal traction.",
      },
    ],
  },
  {
    slug: "volvo",
    name: "Volvo",
    intro:
      "Volvo's commitment to safety extends to tire selection. The XC90, XC60, XC40, and S60 all benefit from tires that deliver maximum grip, short stopping distances, and confident all-weather traction to complement Volvo's advanced safety systems.",
    tireGuide:
      "Volvo vehicles are designed for Scandinavian winters, making tire choice critical for safety. For the XC90 and XC60, premium all-season tires provide year-round comfort and traction. In cold climates, dedicated winter tires significantly enhance braking and cornering grip. For the S60, performance all-season tires maintain engaging handling characteristics.",
    popularBrands: ["Michelin", "Continental", "Nokian", "Pirelli", "Bridgestone"],
    faqs: [
      {
        q: "Should I get winter tires for my Volvo?",
        a: "Volvo strongly recommends winter tires in cold climates. Tires like the Nokian Hakkapeliitta R5, Michelin X-Ice Snow, or Bridgestone Blizzak WS90 dramatically improve braking and handling in temperatures below 45\u00b0F, complementing Volvo's safety-focused engineering.",
      },
    ],
  },
  {
    slug: "acura",
    name: "Acura",
    intro:
      "Acura blends Honda reliability with premium performance and luxury. The MDX, RDX, TLX, and Integra deliver sporty handling that responds exceptionally well to quality tires matched to their performance-oriented chassis tuning.",
    tireGuide:
      "Acura vehicles are sportier than typical luxury cars, making tire selection important for maintaining their driving dynamics. The MDX and RDX pair well with performance-oriented all-season tires. The TLX benefits from performance tires that match its precision handling. The Integra, true to its sporty heritage, performs best with sport-tuned all-season or summer tires.",
    popularBrands: ["Michelin", "Continental", "Bridgestone", "Pirelli", "Yokohama", "Falken"],
    faqs: [
      {
        q: "What tires are best for my Acura MDX?",
        a: "The MDX pairs well with premium all-season tires like the Michelin CrossClimate2 or Continental CrossContact LX25. For the Type S, performance all-season tires maintain its sporty handling character.",
      },
    ],
  },
  {
    slug: "porsche",
    name: "Porsche",
    intro:
      "Porsche engineering demands tires that deliver at the highest level of performance. From the iconic 911 and mid-engine 718 Boxster and Cayman to the Cayenne and Macan SUVs, the Panamera grand tourer, and the electric Taycan, every Porsche is tuned to work with specific tire characteristics.",
    overview:
      "Porsche AG, founded in 1931 in Stuttgart, Germany, is one of the world's most respected sports car manufacturers. The current Porsche lineup includes the legendary rear-engine 911 (Carrera, Turbo, GT3, GT3 RS), the mid-engine 718 Boxster roadster and 718 Cayman coupe, the Cayenne and Cayenne Coupe performance SUVs, the compact Macan SUV, the Panamera luxury sport sedan and Sport Turismo wagon, and the all-electric Taycan and Taycan Cross Turismo. Every Porsche model is engineered with a focus on driving dynamics that's unmatched in its class.\n\nCommon tire sizes for Porsche vehicles include 245/35R20 and 305/30R20 for the 911, 235/45R18 and 265/45R18 for the 718 Boxster and Cayman, 255/55R18 and 285/40R21 for the Cayenne, 235/60R18 and 265/40R21 for the Macan, 265/45R19 and 295/35R21 for the Panamera, and 225/55R19 and 265/45R20 for the Taycan. Porsche-recommended tire brands include Michelin, Pirelli, Continental, and Goodyear — shop all of them and ship free at Ship.Tires. Porsche designates N-rated tires (N0, N1, N2, etc.) that have been specifically tested and approved for each model.\n\nPorsche's advanced chassis systems — PASM (Porsche Active Suspension Management), PDCC (Porsche Dynamic Chassis Control), and rear-axle steering — are precisely calibrated to work with specific tire specifications. The 911's rear-engine layout is particularly sensitive to tire characteristics, as the rear tires handle the majority of driving forces. Whether you track your GT3, commute in a Macan, or maximize range in a Taycan, properly matched tires ensure your Porsche delivers the dynamic excellence its engineers intended.",
    tireGuide:
      "Porsche recommends N-rated tires specifically tuned for each model's suspension and handling characteristics. For the 911 and 718, ultra-high-performance summer tires provide the grip needed for their sports car dynamics. The Cayenne and Macan benefit from sport-oriented all-season or summer tires that maintain agile handling despite their SUV size. The Panamera pairs well with performance all-season tires for grand touring comfort. The Taycan benefits from EV-optimized tires that handle its weight and instant torque while maximizing range.",
    popularBrands: ["Michelin", "Pirelli", "Continental", "Goodyear", "Bridgestone", "Dunlop"],
    faqs: [
      {
        q: "Do I need N-rated tires for my Porsche?",
        a: "While not mandatory, N-rated tires (N0, N1, N2, etc.) are specifically tuned and tested by Porsche for each model. They're optimized for handling, noise, and wear characteristics. Using N-rated tires maintains the intended driving experience and may be required for warranty coverage on certain components.",
      },
      {
        q: "What tires are best for the Porsche Cayenne?",
        a: "The Cayenne performs well with sport-oriented all-season tires like the Michelin Latitude Sport 3 or Continental SportContact 6 SUV. For the Cayenne Turbo GT, ultra-high-performance summer tires unlock its full potential.",
      },
      {
        q: "What tires should I get for my Porsche Taycan?",
        a: "The Taycan benefits from EV-optimized tires like the Michelin Pilot Sport EV or Pirelli P Zero E. These handle the Taycan's instant torque and battery weight while providing low rolling resistance for maximum range.",
      },
    ],
  },
  {
    slug: "land-rover",
    name: "Land Rover",
    intro:
      "Land Rover vehicles are built for luxury on every terrain. The Range Rover, Range Rover Sport, Defender, and Discovery combine premium comfort with legendary off-road capability, requiring tires that perform from city streets to mountain trails.",
    tireGuide:
      "Land Rover tire selection depends on your driving split between pavement and off-road. For the Range Rover and Range Rover Sport used primarily on-road, premium all-season tires provide luxury comfort. The Defender, built for adventure, benefits from all-terrain tires that maintain capability on dirt, mud, and rocks. The Discovery balances both worlds with versatile all-terrain options.",
    popularBrands: ["Continental", "Pirelli", "Michelin", "Goodyear", "BFGoodrich", "Bridgestone"],
    faqs: [
      {
        q: "What tires are best for the Land Rover Defender?",
        a: "For mixed on/off-road use, all-terrain tires like the BFGoodrich KO2 or Continental TerrainContact A/T provide excellent capability without sacrificing highway comfort. For serious off-roading, the Goodyear Wrangler DuraTrac offers aggressive traction.",
      },
    ],
  },
  {
    slug: "infiniti",
    name: "Infiniti",
    intro:
      "Infiniti combines Japanese reliability with luxury performance. The QX60, Q50, and QX80 deliver a refined driving experience that's enhanced by quality tires matched to their performance-luxury character.",
    tireGuide:
      "Infiniti vehicles lean toward sporty luxury, so tire selection can meaningfully impact driving enjoyment. The Q50 benefits from performance all-season tires that match its sport sedan character. The QX60 pairs well with touring SUV tires for family comfort. The QX80, as a full-size luxury SUV, needs highway tires with load capacity for its size and weight.",
    popularBrands: ["Michelin", "Bridgestone", "Continental", "Yokohama", "Falken"],
    faqs: [],
  },
  {
    slug: "buick",
    name: "Buick",
    intro:
      "Buick delivers premium comfort and quiet refinement in every vehicle. The Enclave, Encore, and Envision prioritize a smooth, whisper-quiet ride — and the right tires are essential for maintaining that luxury experience.",
    tireGuide:
      "Buick vehicles are tuned for comfort above all, making tire noise and ride quality the top priorities. For the Enclave, touring SUV tires with low noise ratings provide the quietest ride. The Encore and Envision benefit from comfort-oriented all-season tires with long tread warranties.",
    popularBrands: ["Michelin", "Continental", "Bridgestone", "Goodyear", "Cooper"],
    faqs: [],
  },
  {
    slug: "cadillac",
    name: "Cadillac",
    intro:
      "Cadillac represents the pinnacle of American luxury, with vehicles like the Escalade, XT5, and CT5 delivering bold style and premium performance. The right tires complement Cadillac's refined ride quality and commanding presence.",
    tireGuide:
      "Cadillac vehicles demand premium tires that match their luxury positioning. The Escalade needs highway tires with high load capacity and a smooth, quiet ride. The CT5 benefits from performance-oriented tires, especially in V-Series form. The XT5 pairs well with touring all-season tires for everyday luxury comfort.",
    popularBrands: ["Michelin", "Continental", "Pirelli", "Bridgestone", "Goodyear", "Dunlop"],
    faqs: [],
  },
  {
    slug: "lincoln",
    name: "Lincoln",
    intro:
      "Lincoln delivers serene luxury and effortless comfort. The Navigator, Aviator, and Corsair are designed for whisper-quiet cruising, and the right tires are critical for maintaining Lincoln's signature smooth, isolated ride quality.",
    tireGuide:
      "Lincoln vehicles are tuned for maximum comfort and noise isolation, making tire choice particularly important. The Navigator needs premium highway tires with high load ratings for its full-size platform. The Aviator benefits from touring tires that complement its air suspension. The Corsair pairs well with comfort-focused all-season tires.",
    popularBrands: ["Michelin", "Continental", "Bridgestone", "Pirelli", "Goodyear"],
    faqs: [],
  },
  {
    slug: "genesis",
    name: "Genesis",
    intro:
      "Genesis brings Korean luxury engineering to the premium segment with exceptional value. The G70, G80, GV70, and GV80 combine stunning design with dynamic performance, requiring tires that complement their luxury-sport character.",
    tireGuide:
      "Genesis vehicles offer a sportier driving experience than many luxury competitors, making tire selection impactful. The G70 benefits from performance all-season or summer tires that match its sport sedan dynamics. The GV70 and GV80 pair well with premium all-season crossover tires that maintain ride quality and handling balance.",
    popularBrands: ["Michelin", "Continental", "Pirelli", "Bridgestone", "Yokohama"],
    faqs: [],
  },
  {
    slug: "mitsubishi",
    name: "Mitsubishi",
    intro:
      "Mitsubishi offers practical, value-oriented vehicles with capable all-wheel drive options. The Outlander, Eclipse Cross, and Mirage provide reliable transportation that benefits from well-chosen tires for safety, comfort, and fuel efficiency.",
    tireGuide:
      "For the Outlander and Eclipse Cross, all-season crossover tires provide the best balance of traction and fuel economy. The Mirage benefits from fuel-efficient touring tires that maximize its already impressive gas mileage.",
    popularBrands: ["Michelin", "Kumho", "Yokohama", "Falken", "Continental"],
    faqs: [],
  },
  {
    slug: "mini",
    name: "MINI",
    intro:
      "MINI vehicles are all about driving fun and go-kart-like handling. From the Hardtop and Convertible to the Countryman, every MINI benefits from tires that maintain its legendary nimble, responsive character.",
    tireGuide:
      "MINI's signature handling makes tire choice critical. For the Hardtop and Convertible, performance all-season or summer tires maintain the car's playful dynamics. The John Cooper Works variants deserve ultra-high-performance tires. The Countryman, as a small crossover, benefits from all-season tires that don't dull its sporty handling.",
    popularBrands: ["Continental", "Michelin", "Pirelli", "Bridgestone", "Dunlop"],
    faqs: [],
  },
  {
    slug: "alfa-romeo",
    name: "Alfa Romeo",
    intro:
      "Alfa Romeo builds cars for passionate drivers who prioritize emotion and engagement behind the wheel. The Giulia and Stelvio deliver Italian performance that demands equally capable tires for maximum driving enjoyment.",
    tireGuide:
      "Alfa Romeo vehicles are tuned for driver engagement, making tire selection especially important. The Giulia pairs well with performance all-season or summer tires that maintain its razor-sharp handling. Quadrifoglio variants need ultra-high-performance tires. The Stelvio benefits from sport-oriented all-season tires for year-round capability.",
    popularBrands: ["Pirelli", "Michelin", "Continental", "Bridgestone", "Dunlop", "Yokohama"],
    faqs: [],
  },
  {
    slug: "chrysler",
    name: "Chrysler",
    intro:
      "Chrysler focuses on family-friendly comfort with the Pacifica minivan and the returning sedan lineup. The right tires enhance the Pacifica's smooth ride and cargo-hauling capability for families on the go.",
    tireGuide:
      "The Chrysler Pacifica benefits from touring all-season tires that provide a quiet, comfortable ride with long tread life. For the Pacifica Hybrid, low rolling resistance tires help maximize electric range during city driving.",
    popularBrands: ["Michelin", "Continental", "Bridgestone", "Goodyear", "Cooper"],
    faqs: [],
  },
  {
    slug: "jaguar",
    name: "Jaguar",
    intro:
      "Jaguar combines British luxury with sporting dynamics across its sedan, SUV, and sports car range. From the athletic F-TYPE to the versatile F-PACE and all-electric I-PACE, the right tires preserve Jaguar's signature blend of performance and refinement.",
    tireGuide:
      "Jaguar vehicles are engineered for a balance of agile handling and ride comfort. The F-PACE and E-PACE benefit from premium all-season tires. The F-TYPE demands high-performance summer or all-season tires for spirited driving. The I-PACE performs best with EV-optimized low rolling resistance tires to maximize range while maintaining grip.",
    popularBrands: ["Pirelli", "Continental", "Michelin", "Goodyear", "Bridgestone", "Dunlop"],
    faqs: [
      {
        q: "What tires are best for my Jaguar F-PACE?",
        a: "The Jaguar F-PACE pairs well with premium all-season tires like the Continental CrossContact LX25 or Pirelli Scorpion Verde, offering a smooth ride with confident all-weather traction.",
      },
      {
        q: "Does the Jaguar I-PACE need special tires?",
        a: "The I-PACE benefits from EV-optimized tires with low rolling resistance and reinforced sidewalls to handle the vehicle's weight. Pirelli Elect and Michelin e.Primacy are strong options.",
      },
    ],
  },
  {
    slug: "bentley",
    name: "Bentley",
    intro:
      "Bentley represents the pinnacle of luxury grand touring, combining handcrafted interiors with powerful performance. Whether you drive a Continental GT, Bentayga SUV, or Flying Spur sedan, ultra-premium tires are essential to preserve the ride quality and handling Bentley owners expect.",
    tireGuide:
      "Bentley vehicles require tires rated for high speeds and heavy luxury car weight. The Continental GT needs high-performance grand touring tires. The Bentayga benefits from premium SUV tires that balance ride comfort with the vehicle's substantial curb weight. Always match the factory-specified load index and speed rating for safety.",
    popularBrands: ["Pirelli", "Continental", "Michelin", "Dunlop", "Bridgestone", "Goodyear"],
    faqs: [
      {
        q: "What tires does a Bentley Continental GT use?",
        a: "The Continental GT typically uses 275/35R21 or 275/40R20 tires. Pirelli P Zero and Continental SportContact are among the most common OE fitments.",
      },
      {
        q: "Are Bentley tires expensive?",
        a: "Bentley tires range from $250 to $600+ per tire depending on size and brand. The large rim sizes (20-22 inch) and high speed ratings contribute to the premium pricing.",
      },
    ],
  },
  {
    slug: "maserati",
    name: "Maserati",
    intro:
      "Maserati blends Italian passion with luxury grand touring performance. The Ghibli and Quattroporte sedans, Levante and Grecale SUVs, and MC20 supercar each demand tires that deliver on Maserati's promise of exhilarating driving dynamics paired with refined comfort.",
    tireGuide:
      "Maserati vehicles are tuned for spirited driving, so tire choice significantly impacts the experience. The Ghibli and Quattroporte benefit from performance all-season or summer tires. The Levante and Grecale need SUV tires rated for higher speeds. The MC20 requires ultra-high-performance summer tires for maximum grip.",
    popularBrands: ["Pirelli", "Continental", "Michelin", "Bridgestone", "Goodyear", "Yokohama"],
    faqs: [
      {
        q: "What tires are best for a Maserati Ghibli?",
        a: "The Ghibli performs best with high-performance all-season tires like the Pirelli P Zero All Season Plus or Continental ExtremeContact DWS06 Plus for year-round capability, or Pirelli P Zero for summer-only performance.",
      },
    ],
  },
  {
    slug: "rolls-royce",
    name: "Rolls-Royce",
    intro:
      "Rolls-Royce is the ultimate expression of automotive luxury, with vehicles like the Phantom, Ghost, Cullinan, and all-electric Spectre offering unmatched refinement. The right tires are critical to maintaining the near-silent, magic-carpet ride quality that defines every Rolls-Royce.",
    tireGuide:
      "Rolls-Royce vehicles are among the heaviest luxury cars on the road, requiring tires with high load ratings and reinforced construction. Ride comfort and noise isolation are paramount. The Cullinan needs SUV tires rated for its 6,000+ pound curb weight. The Spectre benefits from EV-optimized tires that reduce road noise while supporting its electric drivetrain.",
    popularBrands: ["Pirelli", "Continental", "Michelin", "Goodyear", "Dunlop", "Bridgestone"],
    faqs: [
      {
        q: "How much do Rolls-Royce tires cost?",
        a: "Rolls-Royce tires typically range from $350 to $700+ per tire due to the large rim sizes (20-23 inch) and specialized construction. Always use tires that meet the factory load and speed specifications.",
      },
    ],
  },
  {
    slug: "ferrari",
    name: "Ferrari",
    intro:
      "Ferrari is synonymous with racing heritage and automotive excellence. From the Roma grand tourer to the SF90 hybrid supercar and the Purosangue SUV, Ferrari vehicles demand the highest-performing tires to deliver their extraordinary speed, cornering, and braking capabilities.",
    tireGuide:
      "Ferrari vehicles require ultra-high-performance tires engineered for extreme speeds and lateral grip. Most Ferraris use staggered tire setups (wider rear tires). Pirelli is the primary OE supplier, but Continental and Michelin also offer compatible options. The Purosangue SUV uses performance SUV tires rated for its V12 power.",
    popularBrands: ["Pirelli", "Michelin", "Continental", "Bridgestone", "Goodyear", "Yokohama"],
    faqs: [
      {
        q: "What tires come on a Ferrari?",
        a: "Most Ferraris come equipped with Pirelli P Zero tires, often with Ferrari-specific markings. Michelin Pilot Sport 4S and Continental SportContact 6 are also popular aftermarket choices.",
      },
      {
        q: "How much do Ferrari tires cost?",
        a: "Ferrari tires range from $300 to $800+ per tire depending on size and compound. The staggered sizing means rear tires (305-355mm width) cost more than fronts.",
      },
    ],
  },
  {
    slug: "lamborghini",
    name: "Lamborghini",
    intro:
      "Lamborghini delivers extreme performance and unmistakable design with the Huracan, Aventador successor Revuelto, and the Urus super-SUV. These vehicles push tire technology to its limits, requiring the most advanced rubber compounds and construction available.",
    tireGuide:
      "Lamborghini sports cars use ultra-high-performance tires with extreme grip levels. The Urus requires performance SUV tires capable of handling its 641 hp and 5,400+ lb curb weight. Staggered tire setups are standard on Lamborghini supercars, with significantly wider rear tires for traction.",
    popularBrands: ["Pirelli", "Michelin", "Continental", "Bridgestone", "Yokohama", "Goodyear"],
    faqs: [
      {
        q: "What tires does a Lamborghini Urus use?",
        a: "The Urus uses 255/50R20 or 285/35R23 tires depending on the wheel package. Pirelli P Zero and Continental SportContact are common choices for this super-SUV.",
      },
    ],
  },
  {
    slug: "mclaren",
    name: "McLaren",
    intro:
      "McLaren applies Formula 1 engineering to every road car it builds. The 720S, GT, and Artura hybrid deliver extraordinary performance that demands tires engineered for extreme cornering forces, precise steering response, and confidence-inspiring braking.",
    tireGuide:
      "McLaren vehicles require ultra-high-performance tires with maximum grip and precise feedback. Most McLarens use staggered setups with wider rear tires. Pirelli P Zero Corsa and Trofeo R are popular for track use, while Pirelli P Zero and Michelin Pilot Sport 4S are ideal for street driving.",
    popularBrands: ["Pirelli", "Michelin", "Continental", "Bridgestone", "Goodyear", "Yokohama"],
    faqs: [
      {
        q: "What tires come on a McLaren?",
        a: "McLaren typically equips its cars with Pirelli P Zero or P Zero Corsa tires. Michelin Pilot Sport Cup 2 and Continental SportContact 6 are also excellent aftermarket options.",
      },
    ],
  },
  {
    slug: "aston-martin",
    name: "Aston Martin",
    intro:
      "Aston Martin represents British grand touring at its finest, from the elegant DB12 and Vantage sports car to the DBX luxury SUV. The right tires preserve Aston Martin's balance of effortless power, precise handling, and long-distance touring comfort.",
    tireGuide:
      "Aston Martin grand tourers need tires that handle high speeds while delivering a refined ride. The DBX SUV requires performance tires rated for its 542+ hp while maintaining comfort. Summer performance tires are ideal for spirited driving, while performance all-season tires work well for year-round GT use.",
    popularBrands: ["Pirelli", "Michelin", "Continental", "Bridgestone", "Dunlop", "Goodyear"],
    faqs: [
      {
        q: "What tires fit an Aston Martin DBX?",
        a: "The DBX uses 255/50R21 or 285/40R22 tires. Pirelli P Zero and Continental CrossContact are popular choices that balance performance with the comfort expected from a luxury SUV.",
      },
    ],
  },
  {
    slug: "lotus",
    name: "Lotus",
    intro:
      "Lotus is renowned for lightweight, driver-focused sports cars and has expanded into electric SUVs with the Eletre. Whether you own the mid-engine Emira or the electric Eletre hyper-SUV, precision tires unlock the full potential of Lotus engineering.",
    tireGuide:
      "The Lotus Emira benefits from ultra-high-performance tires that complement its lightweight chassis and mid-engine balance. The Eletre requires performance SUV tires with reinforced construction for its EV weight. Michelin Pilot Sport and Pirelli P Zero are top picks for Lotus vehicles.",
    popularBrands: ["Michelin", "Pirelli", "Continental", "Goodyear", "Bridgestone", "Yokohama"],
    faqs: [
      {
        q: "What tires are best for a Lotus Emira?",
        a: "The Emira excels with Michelin Pilot Sport 4S or Pirelli P Zero tires, providing the maximum grip and feedback that complement Lotus's lightweight engineering philosophy.",
      },
    ],
  },
  {
    slug: "fiat",
    name: "Fiat",
    intro:
      "Fiat brings Italian charm to compact and city cars, with the iconic 500 and its electric 500e variant offering fun, efficient urban transportation. The right tires maximize your Fiat's nimble handling, fuel efficiency, and ride comfort in city driving.",
    tireGuide:
      "Fiat's compact vehicles use smaller tire sizes that offer a wide range of affordable options. Touring all-season tires are ideal for daily driving, while performance tires suit the sportier 500 Abarth. The 500e benefits from low rolling resistance tires to maximize electric range.",
    popularBrands: ["Michelin", "Continental", "Pirelli", "Yokohama", "Kumho"],
    faqs: [
      {
        q: "What size tires does a Fiat 500 use?",
        a: "The standard Fiat 500 uses 175/65R14 or 185/55R15 tires, while the sportier Abarth trim uses 195/45R16. These smaller sizes offer a wide selection of affordable tire options.",
      },
    ],
  },
  {
    slug: "rivian",
    name: "Rivian",
    intro:
      "Rivian is redefining electric adventure vehicles with the R1T pickup truck and R1S SUV, combining zero-emission driving with genuine off-road capability. The right tires balance off-road traction, highway range, and the unique demands of heavy electric vehicles.",
    tireGuide:
      "Rivian vehicles are heavy EVs designed for both on- and off-road use. All-terrain tires are popular for their versatility, while highway tires maximize electric range. EV-specific tires with reinforced sidewalls and low rolling resistance are ideal for Rivian owners who prioritize range without sacrificing capability.",
    popularBrands: ["Pirelli", "Continental", "Michelin", "BFGoodrich", "Goodyear", "Yokohama"],
    faqs: [
      {
        q: "What tires are best for a Rivian R1T?",
        a: "For mixed on/off-road use, the Pirelli Scorpion All Terrain Plus or BFGoodrich KO2 are excellent choices. For maximum highway range, Continental CrossContact LX25 or Michelin Defender LTX offer lower rolling resistance.",
      },
      {
        q: "Do Rivian tires wear out faster?",
        a: "EVs like the Rivian can cause faster tire wear due to instant torque and higher vehicle weight. Choosing tires designed for EVs and rotating them regularly helps extend tread life.",
      },
    ],
  },
  {
    slug: "lucid",
    name: "Lucid",
    intro:
      "Lucid Motors builds some of the most advanced electric vehicles on the market. The Lucid Air luxury sedan offers industry-leading range and performance, while the Gravity SUV brings that technology to a family-friendly format. EV-optimized tires are essential to maximizing range and performance.",
    tireGuide:
      "Lucid vehicles require EV-specific tires designed for low rolling resistance and high load capacity. The Air's aerodynamic efficiency is best preserved with properly specified tires. Low-noise tires with foam inserts are recommended to maintain the cabin's near-silent experience.",
    popularBrands: ["Pirelli", "Continental", "Michelin", "Bridgestone", "Goodyear"],
    faqs: [
      {
        q: "What tires does the Lucid Air use?",
        a: "The Lucid Air uses 245/45R19 for standard models or 245/35R21 and 265/35R21 for performance trims. Pirelli P Zero Elect and Continental EcoContact 6 are popular EV-optimized choices.",
      },
    ],
  },
  {
    slug: "polestar",
    name: "Polestar",
    intro:
      "Polestar combines Scandinavian design with electric performance, producing vehicles like the Polestar 2 fastback, Polestar 3 SUV, and Polestar 4 coupe-SUV. The right tires complement Polestar's focus on sustainable, high-performance electric driving.",
    tireGuide:
      "Polestar vehicles benefit from EV-optimized tires with low rolling resistance to maximize range. The Polestar 2 works well with all-season or performance all-season tires. The Polestar 3 and 4 require SUV-rated tires designed for heavier electric vehicles.",
    popularBrands: ["Continental", "Pirelli", "Michelin", "Bridgestone", "Goodyear"],
    faqs: [
      {
        q: "What tires are recommended for Polestar 2?",
        a: "The Polestar 2 performs well with Continental EcoContact 6 or Michelin e.Primacy for maximum range, or Pirelli P Zero Elect for a sportier feel with EV-optimized rolling resistance.",
      },
    ],
  },
  {
    slug: "smart",
    name: "Smart",
    intro:
      "Smart specializes in ultra-compact vehicles designed for city living. The Smart Fortwo and its electric EQ variant are among the smallest cars on American roads, and their unique tire sizes require careful selection to maintain handling stability and ride quality.",
    tireGuide:
      "Smart vehicles use small tire sizes that may have fewer available options than standard cars. Touring all-season tires provide the best all-around performance. For the EQ Fortwo, low rolling resistance tires help maximize electric range in urban driving.",
    popularBrands: ["Continental", "Michelin", "Pirelli", "Kumho", "Yokohama"],
    faqs: [
      {
        q: "What size tires does a Smart Fortwo use?",
        a: "The Smart Fortwo uses 155/60R15 front and 175/55R15 rear tires in a staggered setup. Some models use 185/50R16 rear tires.",
      },
    ],
  },
  {
    slug: "scion",
    name: "Scion",
    intro:
      "Though Scion was discontinued in 2016, hundreds of thousands of Scion vehicles remain on American roads. The FR-S sports car, tC coupe, xB hatchback, and iM compact still need quality replacement tires for safe, reliable performance.",
    tireGuide:
      "Scion vehicles use common tire sizes that are widely available. The FR-S (now Toyota 86) benefits from performance tires, while the tC and xB work well with all-season touring tires. Most Scion tire sizes are affordable and available from many brands.",
    popularBrands: ["Michelin", "Continental", "Bridgestone", "Yokohama", "Falken"],
    faqs: [
      {
        q: "Can I still find tires for my Scion?",
        a: "Yes — all Scion tire sizes remain widely available since they share sizes with other Toyota and mainstream vehicles. The FR-S uses the same tires as the Subaru BRZ and Toyota 86.",
      },
    ],
  },
  {
    slug: "pontiac",
    name: "Pontiac",
    intro:
      "Pontiac was discontinued in 2010, but many Pontiac vehicles including the G6, GTO, Grand Prix, and Firebird remain in active service. Finding quality replacement tires for these vehicles is straightforward since they share sizes with other GM models.",
    tireGuide:
      "Pontiac vehicles use common tire sizes shared across the GM platform family. The GTO and Firebird benefit from performance tires, while the G6 and Grand Prix work well with all-season touring tires. Most Pontiac tire sizes are affordable and widely stocked.",
    popularBrands: ["Goodyear", "Michelin", "Bridgestone", "Cooper", "Firestone"],
    faqs: [
      {
        q: "Can I still buy tires for my Pontiac?",
        a: "Pontiac tire sizes remain widely available since they share platforms and sizes with other GM vehicles like the Chevrolet Camaro, Malibu, and others.",
      },
    ],
  },
  {
    slug: "saturn",
    name: "Saturn",
    intro:
      "Saturn was discontinued in 2010, but many Saturn vehicles remain on the road. The Vue, Outlook, Aura, and Ion use common tire sizes shared with other GM vehicles, making replacement tires easy to find at competitive prices.",
    tireGuide:
      "Saturn vehicles share platforms with other GM brands, so tire options are plentiful. The Vue and Outlook use common crossover sizes. The Aura and Ion use popular sedan sizes. All-season touring tires provide the best value and all-weather performance.",
    popularBrands: ["Goodyear", "Cooper", "Michelin", "Bridgestone", "Firestone"],
    faqs: [
      {
        q: "Where can I find Saturn tires?",
        a: "Saturn tire sizes are standard automotive sizes available from all major tire brands. The Vue uses the same sizes as the Chevrolet Equinox, and the Outlook shares sizes with the GMC Acadia.",
      },
    ],
  },
  {
    slug: "suzuki",
    name: "Suzuki",
    intro:
      "Suzuki exited the US automotive market in 2012, but vehicles like the Grand Vitara, SX4, and Kizashi remain on the road. These vehicles use standard tire sizes that are readily available from major tire manufacturers.",
    tireGuide:
      "Suzuki vehicles use common tire sizes found on many compact cars and SUVs. The Grand Vitara benefits from all-terrain or highway tires. The SX4 and Kizashi work well with all-season touring tires. All sizes remain widely stocked and affordable.",
    popularBrands: ["Yokohama", "Bridgestone", "Michelin", "Continental", "Falken"],
    faqs: [
      {
        q: "Are Suzuki tires still available?",
        a: "Yes — all Suzuki tire sizes are standard sizes used across many vehicle brands. You will have no trouble finding replacement tires from any major manufacturer.",
      },
    ],
  },
  {
    slug: "saab",
    name: "Saab",
    intro:
      "Saab production ended in 2012, but the 9-3 and 9-5 remain popular among enthusiasts for their turbocharged performance and unique Swedish design. Standard European tire sizes make finding replacements straightforward.",
    tireGuide:
      "Saab vehicles use common European sedan tire sizes. Performance all-season tires work well for year-round driving, while summer performance tires suit enthusiasts who want maximum grip. Winter tires are recommended for Saab owners in cold climates.",
    popularBrands: ["Continental", "Michelin", "Pirelli", "Nokian", "Bridgestone"],
    faqs: [
      {
        q: "What tires fit a Saab 9-3?",
        a: "The Saab 9-3 uses 215/55R16, 225/45R17, or 235/40R18 tires depending on the trim. These are standard European sizes with wide availability from all major brands.",
      },
    ],
  },
  {
    slug: "isuzu",
    name: "Isuzu",
    intro:
      "Isuzu is known globally for rugged trucks and SUVs. The D-Max pickup and MU-X SUV are built for durability and off-road capability. All-terrain and highway tires complement Isuzu's reputation for tough, work-ready vehicles.",
    tireGuide:
      "Isuzu trucks and SUVs benefit from all-terrain tires that handle both paved roads and rough terrain. Highway tires provide a quieter, more fuel-efficient option for primarily on-road use. Choose load-rated tires appropriate for towing and hauling.",
    popularBrands: ["BFGoodrich", "Falken", "Bridgestone", "Yokohama", "Cooper", "Toyo"],
    faqs: [
      {
        q: "What tires are best for the Isuzu D-Max?",
        a: "The D-Max performs well with all-terrain tires like the BFGoodrich KO2 or Falken Wildpeak AT3W for mixed use, or highway tires like the Bridgestone Dueler for mostly on-road driving.",
      },
    ],
  },
  {
    slug: "mercury",
    name: "Mercury",
    intro:
      "Mercury was discontinued by Ford in 2011, but many Mercury vehicles including the Grand Marquis, Mariner, and Milan remain in daily use. These vehicles share platforms with Ford models, ensuring wide tire availability.",
    tireGuide:
      "Mercury vehicles share platforms with Ford counterparts — the Grand Marquis with the Crown Victoria, the Mariner with the Escape, and the Milan with the Fusion. Tire options are plentiful and affordable. Touring all-season tires are the best choice for everyday driving.",
    popularBrands: ["Goodyear", "Michelin", "Cooper", "Bridgestone", "Firestone"],
    faqs: [
      {
        q: "Can I still get tires for my Mercury?",
        a: "Yes — Mercury vehicles use the same tire sizes as their Ford platform-mates. The Grand Marquis shares sizes with the Crown Victoria, the Mariner with the Escape, and the Milan with the Fusion.",
      },
    ],
  },
  {
    slug: "hummer",
    name: "Hummer",
    intro:
      "The original Hummer H2 and H3 remain popular among off-road enthusiasts. These vehicles use large, aggressive tire sizes designed for serious off-road capability. The GMC Hummer EV is covered under the GMC brand.",
    tireGuide:
      "Hummer vehicles need tires built for heavy-duty use and off-road conditions. The H2 uses very large sizes like 315/70R17 that support its weight and off-road demands. The H3 uses more standard truck sizes. All-terrain and mud-terrain tires are the most popular choices.",
    popularBrands: ["BFGoodrich", "Nitto", "Toyo", "Goodyear", "Mickey Thompson", "Falken"],
    faqs: [
      {
        q: "What size tires does a Hummer H2 use?",
        a: "The Hummer H2 uses 315/70R17 stock tires or 305/40R22 with upgraded wheels. These are large, heavy-duty sizes available from BFGoodrich, Nitto, and Toyo.",
      },
    ],
  },
  {
    slug: "fisker",
    name: "Fisker",
    intro:
      "Fisker brought modern EV design to the market with the Ocean electric SUV. While the company faced challenges, Ocean SUVs on the road still need quality replacement tires designed for electric vehicle weight and efficiency.",
    tireGuide:
      "The Fisker Ocean uses standard EV-compatible tire sizes. Low rolling resistance tires maximize electric range, while performance all-season tires provide better grip. Choose tires with reinforced sidewalls to handle the extra weight of the battery pack.",
    popularBrands: ["Continental", "Michelin", "Pirelli", "Bridgestone", "Goodyear"],
    faqs: [
      {
        q: "What tires does the Fisker Ocean use?",
        a: "The Fisker Ocean uses 255/50R20 or 255/45R22 tires depending on the wheel package. EV-optimized tires like Continental EcoContact or Pirelli Elect are recommended.",
      },
    ],
  },
  {
    slug: "vinfast",
    name: "VinFast",
    intro:
      "VinFast is a Vietnamese automaker bringing affordable electric vehicles to the American market with the VF8 midsize SUV and VF9 full-size SUV. EV-optimized tires help maximize range and complement VinFast's electric performance.",
    tireGuide:
      "VinFast EVs benefit from tires designed for electric vehicles — low rolling resistance to maximize range, reinforced sidewalls for battery weight, and optimized tread patterns for quiet highway driving. All-season tires provide the best year-round versatility.",
    popularBrands: ["Continental", "Michelin", "Pirelli", "Bridgestone", "Kumho"],
    faqs: [
      {
        q: "What tires work for the VinFast VF8?",
        a: "The VF8 uses 245/50R19 or 255/45R20 tires. Continental EcoContact 6 and Michelin e.Primacy are EV-optimized options that maximize range.",
      },
    ],
  },
  {
    slug: "scout",
    name: "Scout",
    intro:
      "Scout Motors is reviving the iconic brand with rugged, all-electric trucks and SUVs. The Scout Terra pickup and Traveler SUV are designed for adventure and off-road capability with zero emissions. The right tires balance off-road traction with EV range efficiency.",
    tireGuide:
      "Scout vehicles are designed for off-road capability, so all-terrain tires are a natural fit. For maximum range on the highway, consider all-season SUV tires with lower rolling resistance. Load-rated tires are recommended to handle the heavy battery weight.",
    popularBrands: ["BFGoodrich", "Falken", "Continental", "Michelin", "Goodyear", "Pirelli"],
    faqs: [
      {
        q: "What tires will the Scout Terra use?",
        a: "The Scout Terra is expected to use 265/70R18 tires. All-terrain options like the BFGoodrich KO2 or Falken Wildpeak AT3W are ideal for Scout's adventure-focused mission.",
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Model-level content for popular models
// ---------------------------------------------------------------------------

export const vehicleModelContent: Record<string, VehicleModelContent> = {
  "honda|civic": {
    slug: "civic",
    name: "Civic",
    intro: "The Honda Civic is one of America's most popular compact cars, balancing efficiency, reliability, and fun-to-drive dynamics. From the fuel-efficient LX to the turbocharged Si and Type R, the right tires enhance your Civic's handling, comfort, and safety in all conditions.",
    vehicleClass: "sedan",
  },
  "honda|accord": {
    slug: "accord",
    name: "Accord",
    intro: "The Honda Accord stands as one of America's most trusted sedans, offering an ideal balance of comfort, efficiency, and reliability for daily commuting and weekend getaways. Whether you drive the practical LX, premium Touring, or efficient Hybrid, the right tires complement the Accord's balanced character.",
    vehicleClass: "sedan",
  },
  "honda|cr-v": {
    slug: "cr-v",
    name: "CR-V",
    intro: "The Honda CR-V is one of the best-selling compact SUVs in America, known for its spacious interior, fuel efficiency, and all-weather capability. The right tires ensure your CR-V delivers confident traction and a comfortable ride year-round.",
    vehicleClass: "suv",
  },
  "honda|pilot": {
    slug: "pilot",
    name: "Pilot",
    intro: "The Honda Pilot is a family-ready three-row SUV that combines space, comfort, and Honda reliability. With available AWD and the TrailSport trim, the right tires help the Pilot handle everything from school runs to weekend adventures.",
    vehicleClass: "suv",
  },
  "honda|odyssey": {
    slug: "odyssey",
    name: "Odyssey",
    intro: "The Honda Odyssey sets the benchmark for minivan comfort and family utility. With a focus on smooth highway cruising and quiet cabin experience, touring tires help the Odyssey deliver the refined ride families expect.",
    vehicleClass: "minivan",
  },
  "toyota|camry": {
    slug: "camry",
    name: "Camry",
    intro: "The Toyota Camry is America's best-selling sedan, offering proven reliability and comfort for millions of drivers. From the efficient LE to the sporty TRD, the right tires maximize your Camry's ride comfort, fuel economy, and safety.",
    vehicleClass: "sedan",
  },
  "toyota|rav4": {
    slug: "rav4",
    name: "RAV4",
    intro: "The Toyota RAV4 is the best-selling SUV in America, known for its versatility and reliability. Whether you own the gas, hybrid, or plug-in Prime version, the right tires ensure confident traction in rain, snow, and dry conditions.",
    vehicleClass: "suv",
  },
  "toyota|tacoma": {
    slug: "tacoma",
    name: "Tacoma",
    intro: "The Toyota Tacoma is the go-to midsize truck for adventure and capability. With TRD Off-Road and TRD Pro trims built for trail duty, the right tires are essential for unleashing the Tacoma's full off-road potential.",
    vehicleClass: "truck",
  },
  "toyota|4runner": {
    slug: "4runner",
    name: "4Runner",
    intro: "The Toyota 4Runner is a body-on-frame SUV built for serious off-road capability. With a reputation for going anywhere, the right tires — from all-terrain to mud-terrain — transform the 4Runner's trail performance.",
    vehicleClass: "suv",
  },
  "ford|f-150": {
    slug: "f-150",
    name: "F-150",
    intro: "The Ford F-150 is America's best-selling vehicle, serving as a daily driver, work truck, and adventure rig for millions. From highway cruising to off-road trails, the right tires ensure your F-150 delivers maximum capability.",
    vehicleClass: "truck",
  },
  "ford|bronco": {
    slug: "bronco",
    name: "Bronco",
    intro: "The Ford Bronco is built for off-road adventure, competing directly with the Jeep Wrangler. With removable doors and roof, trail-ready suspension, and serious off-road hardware, the right tires are essential for conquering every trail.",
    vehicleClass: "suv",
  },
  "ford|mustang": {
    slug: "mustang",
    name: "Mustang",
    intro: "The Ford Mustang is an American icon, delivering thrilling performance from the turbocharged EcoBoost to the legendary Shelby GT500. The right performance tires unlock the Mustang's full handling and braking potential.",
    vehicleClass: "sports",
  },
  "ford|explorer": {
    slug: "explorer",
    name: "Explorer",
    intro: "The Ford Explorer is a versatile three-row SUV built for families who need space and capability. With available AWD and the rugged Timberline trim, the right tires help the Explorer handle every season and road condition.",
    vehicleClass: "suv",
  },
  "chevrolet|silverado": {
    slug: "silverado",
    name: "Silverado",
    intro: "The Chevy Silverado 1500 is a full-size truck built for work, play, and everything in between. From the practical Work Truck to the premium High Country and off-road ZR2, the right tires ensure your Silverado delivers in every situation.",
    vehicleClass: "truck",
  },
  "chevrolet|tahoe": {
    slug: "tahoe",
    name: "Tahoe",
    intro: "The Chevy Tahoe is a full-size SUV that combines commanding presence with family-friendly space. The right tires ensure the Tahoe delivers smooth highway cruising, confident towing, and reliable all-weather traction.",
    vehicleClass: "suv",
  },
  "chevrolet|camaro": {
    slug: "camaro",
    name: "Camaro",
    intro: "The Chevy Camaro is a performance icon, delivering raw driving excitement from the turbocharged 1LT to the supercharged ZL1. Performance tires are essential for extracting the Camaro's full cornering and braking capability.",
    vehicleClass: "sports",
  },
  "jeep|wrangler": {
    slug: "wrangler",
    name: "Wrangler",
    intro: "The Jeep Wrangler is the ultimate off-road vehicle, capable of tackling the toughest trails in the world. Tire selection is the single most impactful upgrade you can make to improve your Wrangler's off-road performance.",
    vehicleClass: "suv",
  },
  "jeep|grand-cherokee": {
    slug: "grand-cherokee",
    name: "Grand Cherokee",
    intro: "The Jeep Grand Cherokee combines luxury, technology, and off-road capability in a premium package. The right tires balance the Grand Cherokee's on-road refinement with its legendary trail capability.",
    vehicleClass: "suv",
  },
  "tesla|model-3": {
    slug: "model-3",
    name: "Model 3",
    intro: "The Tesla Model 3 is the world's most popular electric sedan, delivering instant torque and cutting-edge technology. EV-optimized tires handle the Model 3's weight and power while maximizing your driving range.",
    vehicleClass: "electric",
  },
  "tesla|model-y": {
    slug: "model-y",
    name: "Model Y",
    intro: "The Tesla Model Y is the best-selling vehicle in the world, combining SUV practicality with electric performance. The right tires maximize range, handle instant torque, and provide the grip needed for the Model Y's impressive acceleration.",
    vehicleClass: "electric",
  },
  "subaru|outback": {
    slug: "outback",
    name: "Outback",
    intro: "The Subaru Outback combines wagon versatility with standard AWD and impressive ground clearance. The right tires — matched across all four corners — ensure the Outback's symmetrical AWD system delivers maximum traction in every condition.",
    vehicleClass: "suv",
  },
  "subaru|wrx": {
    slug: "wrx",
    name: "WRX",
    intro: "The Subaru WRX is a rally-bred performance sedan with standard AWD. Performance tires transform the WRX's handling, with matched sets essential for the symmetrical AWD system to function properly.",
    vehicleClass: "sports",
  },
  "ram|1500": {
    slug: "1500",
    name: "1500",
    intro: "The Ram 1500 leads the full-size truck segment with its smooth ride, premium interior, and capable towing. The right tires ensure your Ram delivers confident traction for hauling, towing, and daily driving.",
    vehicleClass: "truck",
  },
  "bmw|3-series": {
    slug: "3-series",
    name: "3 Series",
    intro: "The BMW 3 Series is the benchmark for sport sedans, delivering precision handling and engaging driving dynamics. The right tires are essential for maintaining the 3 Series' legendary cornering and steering feel.",
    vehicleClass: "sedan",
  },
  "mercedes-benz|c-class": {
    slug: "c-class",
    name: "C-Class",
    intro: "The Mercedes-Benz C-Class combines luxury refinement with capable performance. Premium tires maintain the C-Class' smooth, quiet ride while providing the grip needed for its turbocharged powertrain.",
    vehicleClass: "luxury",
  },
  "mercedes-benz|e-class": {
    slug: "e-class",
    name: "E-Class",
    intro: "The Mercedes-Benz E-Class is the benchmark executive sedan, balancing comfort, technology, and performance. The right tires preserve its refined ride quality and confident handling in all conditions.",
    vehicleClass: "luxury",
  },
  "mercedes-benz|s-class": {
    slug: "s-class",
    name: "S-Class",
    intro: "The Mercedes-Benz S-Class is the flagship luxury sedan, setting the standard for comfort, technology, and prestige. Premium tires are essential for maintaining its whisper-quiet, limousine-smooth ride.",
    vehicleClass: "luxury",
  },
  "mercedes-benz|gle": {
    slug: "gle",
    name: "GLE",
    intro: "The Mercedes-Benz GLE is a midsize luxury SUV offering a refined ride, advanced technology, and available off-road capability. The right tires ensure confident traction while preserving its comfortable demeanor.",
    vehicleClass: "suv",
  },
  "mercedes-benz|glc": {
    slug: "glc",
    name: "GLC",
    intro: "The Mercedes-Benz GLC is one of the most popular compact luxury SUVs, blending comfort with agile handling. Quality tires complement its balanced performance for daily driving and weekend adventures.",
    vehicleClass: "suv",
  },
  "mercedes-benz|gla": {
    slug: "gla",
    name: "GLA",
    intro: "The Mercedes-Benz GLA is a compact luxury SUV offering premium features in a city-friendly size. The right tires maximize its urban agility while providing highway comfort.",
    vehicleClass: "suv",
  },
  "mercedes-benz|glb": {
    slug: "glb",
    name: "GLB",
    intro: "The Mercedes-Benz GLB is a versatile compact SUV with available third-row seating. Quality all-season tires ensure year-round traction for families who need luxury in a practical package.",
    vehicleClass: "suv",
  },
  "mercedes-benz|gls": {
    slug: "gls",
    name: "GLS",
    intro: "The Mercedes-Benz GLS is the S-Class of SUVs — a full-size three-row luxury flagship. Premium tires are critical for maintaining its smooth, commanding ride and confident handling.",
    vehicleClass: "luxury",
  },
  "mercedes-benz|g-class": {
    slug: "g-class",
    name: "G-Class",
    intro: "The Mercedes-Benz G-Class combines iconic military-inspired design with luxurious appointments. Whether tackling trails or city streets, the right tires unlock the G-Wagen's legendary capability.",
    vehicleClass: "suv",
  },
  "mercedes-benz|cla": {
    slug: "cla",
    name: "CLA",
    intro: "The Mercedes-Benz CLA is a stylish compact four-door coupe offering luxury features at an accessible price. Performance tires complement its sporty character and turbocharged powertrain.",
    vehicleClass: "sedan",
  },
  "mercedes-benz|eqs": {
    slug: "eqs",
    name: "EQS",
    intro: "The Mercedes-Benz EQS is the electric flagship sedan, offering over 350 miles of range with S-Class luxury. EV-optimized tires maximize range while handling the EQS's substantial battery weight.",
    vehicleClass: "electric",
  },
  "mercedes-benz|amg gt": {
    slug: "amg-gt",
    name: "AMG GT",
    intro: "The Mercedes-AMG GT is a high-performance sports car demanding ultra-high-performance tires. Proper tire selection is critical for accessing the AMG GT's remarkable cornering and braking capabilities.",
    vehicleClass: "sports",
  },
  "porsche|911": {
    slug: "911",
    name: "911",
    intro: "The Porsche 911 is the definitive sports car, with over 60 years of rear-engine heritage. From the Carrera to the GT3 RS, the right tires are essential for accessing the 911's legendary handling and braking performance.",
    vehicleClass: "sports",
  },
  "porsche|cayenne": {
    slug: "cayenne",
    name: "Cayenne",
    intro: "The Porsche Cayenne is a performance SUV that drives like a sports car. From the base V6 to the Turbo GT, the right tires balance daily comfort with the handling precision Porsche is famous for.",
    vehicleClass: "suv",
  },
  "porsche|macan": {
    slug: "macan",
    name: "Macan",
    intro: "The Porsche Macan is the most agile compact luxury SUV, delivering genuine sports car dynamics in an SUV package. Sport-oriented tires complement its precise steering and cornering ability.",
    vehicleClass: "suv",
  },
  "porsche|panamera": {
    slug: "panamera",
    name: "Panamera",
    intro: "The Porsche Panamera combines luxury grand touring comfort with genuine sports car performance. Premium tires are essential for balancing its high-speed stability with everyday refinement.",
    vehicleClass: "luxury",
  },
  "porsche|taycan": {
    slug: "taycan",
    name: "Taycan",
    intro: "The Porsche Taycan is an all-electric sports sedan delivering instant torque and track-capable handling. EV-optimized tires handle its weight and power while maximizing driving range.",
    vehicleClass: "electric",
  },
  "porsche|718 boxster": {
    slug: "718-boxster",
    name: "718 Boxster",
    intro: "The Porsche 718 Boxster is a mid-engine roadster offering pure driving thrills. Performance tires are critical for accessing its balanced handling and maximizing open-air driving enjoyment.",
    vehicleClass: "sports",
  },
  "porsche|718 cayman": {
    slug: "718-cayman",
    name: "718 Cayman",
    intro: "The Porsche 718 Cayman is a mid-engine coupe renowned for its perfect weight balance and sharp handling. Ultra-high-performance tires unlock its full cornering potential on road and track.",
    vehicleClass: "sports",
  },
  "hyundai|tucson": {
    slug: "tucson",
    name: "Tucson",
    intro: "The Hyundai Tucson has become one of the most popular compact SUVs in America with its bold design and excellent value. The right tires enhance the Tucson's ride comfort, all-weather traction, and fuel efficiency.",
    vehicleClass: "suv",
  },
  "kia|telluride": {
    slug: "telluride",
    name: "Telluride",
    intro: "The Kia Telluride is a three-row SUV that punches above its weight class in luxury and capability. The right tires complement the Telluride's premium ride quality while providing confident traction for family adventures.",
    vehicleClass: "suv",
  },
};

// ---------------------------------------------------------------------------
// Helper: get models for a make from tire-sizes database
// ---------------------------------------------------------------------------

export function getModelsForMake(makeSlug: string): { model: string; modelSlug: string; sizes: string[] }[] {
  // Import done at module level would create circular dependency, so we define the mapping inline
  const tireSizeDatabase: Record<string, string[]> = {
    // Honda
    "honda|civic": ["215/55R16", "235/40R18", "215/50R17"],
    "honda|accord": ["225/50R17", "235/45R18", "235/40R19"],
    "honda|cr-v": ["225/65R17", "235/60R18"],
    "honda|pilot": ["245/60R18", "255/50R20"],
    "honda|odyssey": ["235/60R18", "235/55R19"],
    "honda|hr-v": ["215/60R17", "215/55R18"],
    "honda|ridgeline": ["245/60R18", "265/45R20"],
    "honda|passport": ["245/60R18", "265/45R20"],
    "honda|fit": ["185/65R15", "185/55R16"],
    "honda|prologue": ["255/50R19", "255/45R20"],
    // Toyota
    "toyota|camry": ["215/55R17", "235/45R18"],
    "toyota|corolla": ["205/55R16", "225/40R18"],
    "toyota|corolla cross": ["215/60R17", "225/50R18"],
    "toyota|rav4": ["225/65R17", "225/60R18"],
    "toyota|highlander": ["235/65R18", "235/55R20"],
    "toyota|grand highlander": ["235/60R20", "245/50R21"],
    "toyota|tacoma": ["245/75R16", "265/70R16", "265/65R17"],
    "toyota|tundra": ["275/65R18", "275/55R20"],
    "toyota|4runner": ["265/70R17", "275/65R18"],
    "toyota|prius": ["195/65R15", "215/45R17"],
    "toyota|sienna": ["235/60R18", "235/50R19"],
    "toyota|supra": ["255/35R19", "275/35R19"],
    "toyota|venza": ["225/60R18", "225/55R19"],
    "toyota|gr86": ["215/40R18", "225/40R18"],
    "toyota|crown": ["225/55R19", "235/45R20"],
    "toyota|bz4x": ["235/60R18", "235/50R20"],
    "toyota|sequoia": ["275/65R18", "275/50R22"],
    "toyota|land cruiser": ["275/65R18", "285/50R20"],
    "toyota|c-hr": ["215/60R17", "225/50R18"],
    // Ford
    "ford|f-150": ["265/70R17", "275/65R18", "275/55R20", "275/45R22"],
    "ford|f-250": ["275/70R18", "275/65R20"],
    "ford|f-350": ["275/70R18", "275/65R20"],
    "ford|escape": ["225/65R17", "225/60R18"],
    "ford|explorer": ["255/65R18", "255/55R20"],
    "ford|mustang": ["235/55R17", "255/40R19", "275/40R19"],
    "ford|mustang mach-e": ["225/60R18", "225/55R19"],
    "ford|bronco": ["255/75R17", "265/70R17", "285/70R17"],
    "ford|bronco sport": ["225/65R17", "225/60R18"],
    "ford|ranger": ["245/70R17", "265/65R17"],
    "ford|expedition": ["275/65R18", "275/55R20"],
    "ford|maverick": ["225/65R17", "225/60R18"],
    "ford|edge": ["235/60R18", "245/50R20"],
    "ford|fusion": ["225/50R17", "235/45R18"],
    // Chevrolet
    "chevrolet|silverado": ["265/70R17", "275/65R18", "275/55R20"],
    "chevrolet|equinox": ["225/65R17", "225/55R19"],
    "chevrolet|tahoe": ["275/65R18", "275/55R20", "285/45R22"],
    "chevrolet|suburban": ["275/65R18", "275/55R20", "285/45R22"],
    "chevrolet|traverse": ["245/60R18", "255/55R20"],
    "chevrolet|camaro": ["245/50R18", "245/40R20", "275/35R20"],
    "chevrolet|corvette": ["245/35R19", "305/30R20"],
    "chevrolet|colorado": ["255/70R17", "265/65R17"],
    "chevrolet|malibu": ["225/55R17", "245/45R18"],
    "chevrolet|blazer": ["235/65R17", "255/55R20"],
    "chevrolet|trailblazer": ["215/60R17", "215/55R18"],
    "chevrolet|trax": ["205/65R16", "215/55R18"],
    "chevrolet|bolt ev": ["215/50R17"],
    "chevrolet|equinox ev": ["255/50R19", "255/45R20"],
    // Nissan
    "nissan|altima": ["215/55R17", "235/45R18"],
    "nissan|rogue": ["225/65R17", "225/55R19"],
    "nissan|sentra": ["205/55R16", "215/50R17"],
    "nissan|pathfinder": ["255/60R18", "255/55R20"],
    "nissan|frontier": ["255/70R17", "265/65R18"],
    "nissan|titan": ["275/65R18", "275/55R20"],
    "nissan|murano": ["235/65R18", "235/55R20"],
    "nissan|kicks": ["205/55R17", "215/50R18"],
    "nissan|versa": ["185/65R15", "195/55R16"],
    "nissan|armada": ["275/60R18", "275/55R20"],
    "nissan|maxima": ["245/45R18", "245/40R19"],
    "nissan|leaf": ["205/55R16", "215/50R17"],
    "nissan|ariya": ["235/55R19", "255/45R20"],
    // Hyundai
    "hyundai|tucson": ["225/60R17", "235/55R19"],
    "hyundai|elantra": ["205/55R16", "225/45R17", "225/40R18"],
    "hyundai|sonata": ["215/55R17", "235/45R18"],
    "hyundai|santa fe": ["235/65R17", "235/60R18", "255/45R20"],
    "hyundai|palisade": ["245/60R18", "245/50R20"],
    "hyundai|ioniq 5": ["235/55R19", "255/45R20"],
    "hyundai|ioniq 6": ["245/45R19", "255/40R20"],
    "hyundai|kona": ["215/55R17", "235/45R18"],
    "hyundai|santa cruz": ["235/65R17", "245/50R20"],
    "hyundai|venue": ["205/60R16", "215/55R17"],
    // Kia
    "kia|telluride": ["245/60R18", "255/50R20"],
    "kia|sportage": ["225/60R17", "235/55R19"],
    "kia|sorento": ["235/65R17", "235/55R19"],
    "kia|forte": ["205/55R16", "225/45R17", "225/40R18"],
    "kia|k5": ["215/55R17", "235/45R18"],
    "kia|ev6": ["235/55R19", "255/45R20"],
    "kia|soul": ["205/60R16", "235/45R18"],
    "kia|seltos": ["215/60R17", "235/45R18"],
    "kia|carnival": ["235/60R18", "235/55R19"],
    "kia|niro": ["205/60R16", "225/45R18"],
    "kia|ev9": ["255/55R19", "285/45R21"],
    "kia|stinger": ["225/45R18", "255/35R19"],
    // Subaru
    "subaru|outback": ["225/65R17", "225/60R18"],
    "subaru|forester": ["225/60R17", "225/55R18"],
    "subaru|crosstrek": ["225/60R17", "225/55R18"],
    "subaru|wrx": ["235/45R17", "245/40R18", "245/35R19"],
    "subaru|ascent": ["245/65R17", "245/50R20"],
    "subaru|impreza": ["205/55R16", "225/40R18"],
    "subaru|legacy": ["225/55R17", "225/50R18"],
    "subaru|brz": ["215/40R18", "225/40R18"],
    "subaru|solterra": ["235/60R18", "235/50R20"],
    // BMW
    "bmw|3 series": ["225/45R18", "255/35R19", "225/40R19"],
    "bmw|5 series": ["245/45R18", "245/40R19", "275/35R19"],
    "bmw|7 series": ["245/50R18", "275/35R20"],
    "bmw|x1": ["225/55R17", "225/50R18"],
    "bmw|x2": ["225/55R17", "225/50R18"],
    "bmw|x3": ["225/60R18", "245/50R19"],
    "bmw|x4": ["245/50R19", "245/45R20"],
    "bmw|x5": ["255/55R18", "275/45R20", "275/40R21"],
    "bmw|x6": ["275/45R20", "275/40R21"],
    "bmw|x7": ["275/50R20", "285/40R22"],
    "bmw|2 series": ["225/45R17", "225/40R18"],
    "bmw|4 series": ["225/45R18", "255/35R19"],
    "bmw|m3": ["275/35R19", "285/30R20"],
    "bmw|m4": ["275/35R19", "285/30R20"],
    "bmw|i4": ["225/45R18", "245/35R20"],
    "bmw|ix": ["255/50R20", "275/40R22"],
    // Mercedes-Benz
    "mercedes-benz|a-class": ["225/45R18", "235/35R19"],
    "mercedes-benz|c-class": ["225/45R18", "225/40R19", "255/35R19"],
    "mercedes-benz|cla": ["225/45R18", "225/40R19", "235/35R19"],
    "mercedes-benz|cle": ["225/45R18", "255/40R19", "255/35R20"],
    "mercedes-benz|cls": ["255/40R19", "255/35R20"],
    "mercedes-benz|e-class": ["245/45R18", "245/40R19", "275/35R19"],
    "mercedes-benz|s-class": ["255/45R19", "255/40R20", "275/35R21"],
    "mercedes-benz|eqe": ["255/45R19", "255/40R20"],
    "mercedes-benz|eqs": ["265/40R21", "265/35R22"],
    "mercedes-benz|eqb": ["235/55R18", "235/50R19"],
    "mercedes-benz|eqs suv": ["275/45R21", "285/40R22"],
    "mercedes-benz|gla": ["235/55R18", "235/50R19"],
    "mercedes-benz|glb": ["235/55R18", "235/50R19"],
    "mercedes-benz|glc": ["235/60R18", "255/45R20"],
    "mercedes-benz|glc coupe": ["235/55R19", "255/45R20"],
    "mercedes-benz|gle": ["255/55R19", "275/45R20", "285/40R21"],
    "mercedes-benz|gle coupe": ["275/45R20", "315/40R21"],
    "mercedes-benz|gls": ["275/50R20", "285/40R22"],
    "mercedes-benz|g-class": ["275/55R19", "275/50R20"],
    "mercedes-benz|amg gt": ["255/35R19", "295/30R20", "295/35R20"],
    "mercedes-benz|sl": ["255/40R19", "295/35R20"],
    // Audi
    "audi|a3": ["225/45R17", "225/40R18"],
    "audi|a4": ["225/50R17", "245/40R18", "255/35R19"],
    "audi|a5": ["245/40R18", "255/35R19"],
    "audi|a6": ["225/55R18", "255/40R19"],
    "audi|a7": ["245/45R19", "255/40R20"],
    "audi|a8": ["255/45R19", "265/40R20"],
    "audi|q3": ["215/65R17", "235/55R18"],
    "audi|q5": ["235/60R18", "255/45R20"],
    "audi|q7": ["255/55R19", "285/40R21"],
    "audi|q8": ["265/50R19", "285/40R21"],
    "audi|e-tron": ["255/55R19", "265/45R21"],
    "audi|q4 e-tron": ["235/55R19", "255/45R20"],
    "audi|tt": ["225/50R17", "245/35R19"],
    // Jeep
    "jeep|wrangler": ["255/75R17", "285/70R17", "315/70R17"],
    "jeep|grand cherokee": ["265/60R18", "265/50R20"],
    "jeep|grand cherokee l": ["265/60R18", "265/50R20"],
    "jeep|gladiator": ["255/75R17", "285/70R17"],
    "jeep|cherokee": ["225/60R17", "225/55R18"],
    "jeep|compass": ["215/65R17", "225/55R18"],
    "jeep|renegade": ["215/60R17", "225/55R18"],
    "jeep|wagoneer": ["275/55R20", "285/45R22"],
    "jeep|grand wagoneer": ["275/50R20", "285/45R22"],
    // Ram
    "ram|1500": ["275/65R18", "275/55R20", "275/50R22"],
    "ram|2500": ["275/70R18", "285/60R20"],
    "ram|3500": ["275/70R18", "285/60R20"],
    // GMC
    "gmc|sierra": ["265/70R17", "275/65R18", "275/55R20"],
    "gmc|yukon": ["275/65R18", "275/55R20", "285/45R22"],
    "gmc|terrain": ["225/65R17", "235/55R19"],
    "gmc|acadia": ["235/65R17", "255/55R20"],
    "gmc|canyon": ["255/70R17", "265/65R17"],
    "gmc|hummer ev": ["305/70R18"],
    // Volkswagen
    "volkswagen|jetta": ["205/55R16", "225/45R17", "225/40R18"],
    "volkswagen|tiguan": ["215/65R17", "235/55R18"],
    "volkswagen|atlas": ["245/60R18", "255/50R20"],
    "volkswagen|atlas cross sport": ["245/60R18", "255/50R20"],
    "volkswagen|gti": ["225/45R17", "225/40R18", "235/35R19"],
    "volkswagen|golf r": ["235/35R19"],
    "volkswagen|taos": ["215/55R18", "225/45R19"],
    "volkswagen|id.4": ["235/55R19", "255/45R20"],
    "volkswagen|passat": ["215/55R17", "235/45R18"],
    // Mazda
    "mazda|cx-5": ["225/65R17", "225/55R19"],
    "mazda|mazda3": ["205/60R16", "215/45R18"],
    "mazda|cx-50": ["225/60R18", "225/55R19"],
    "mazda|mx-5 miata": ["195/50R16", "205/45R17"],
    "mazda|cx-9": ["255/60R18", "255/50R20"],
    "mazda|cx-90": ["255/55R19", "275/40R21"],
    "mazda|cx-30": ["215/55R18", "215/45R18"],
    "mazda|mazda6": ["225/55R17", "225/45R19"],
    // Tesla
    "tesla|model 3": ["235/45R18", "235/40R19", "255/35R19"],
    "tesla|model y": ["255/45R19", "255/35R21"],
    "tesla|model s": ["245/45R19", "265/35R21"],
    "tesla|model x": ["255/45R20", "265/35R22"],
    "tesla|cybertruck": ["285/65R20"],
    // Dodge
    "dodge|charger": ["215/65R17", "235/55R18", "245/45R20"],
    "dodge|challenger": ["215/65R17", "245/45R20", "275/40R20"],
    "dodge|durango": ["265/60R18", "265/50R20"],
    "dodge|hornet": ["225/55R18", "235/45R20"],
    // Lexus
    "lexus|rx": ["235/65R18", "235/55R20"],
    "lexus|es": ["215/55R17", "235/45R18"],
    "lexus|nx": ["225/60R18", "235/50R20"],
    "lexus|gx": ["265/60R18", "265/55R19"],
    "lexus|is": ["225/40R18", "255/35R19"],
    "lexus|ux": ["215/60R17", "225/50R18"],
    "lexus|tx": ["235/60R20", "265/45R22"],
    "lexus|lx": ["275/50R22"],
    "lexus|rc": ["225/45R17", "255/35R19"],
    "lexus|lc": ["245/45R20", "275/35R20"],
    "lexus|rz": ["235/60R18", "235/50R20"],
    // Acura
    "acura|mdx": ["245/60R18", "255/50R20"],
    "acura|rdx": ["235/60R18", "255/45R20"],
    "acura|tlx": ["225/50R18", "245/40R19"],
    "acura|integra": ["215/50R17", "235/40R19"],
    "acura|zdx": ["255/50R19", "265/40R21"],
    // Volvo
    "volvo|xc90": ["235/60R18", "275/40R21"],
    "volvo|xc60": ["235/60R18", "255/45R20"],
    "volvo|xc40": ["215/55R18", "235/50R19"],
    "volvo|s60": ["225/50R17", "235/40R19"],
    "volvo|s90": ["245/45R19", "255/35R20"],
    "volvo|v60 cross country": ["225/55R18", "235/50R19"],
    "volvo|c40 recharge": ["235/50R19", "245/40R20"],
    "volvo|ex30": ["225/50R18", "245/40R19"],
    "volvo|ex90": ["265/45R21", "275/40R22"],
    // Porsche
    "porsche|911": ["245/35R20", "305/30R20", "245/30R21", "305/30R21"],
    "porsche|718 boxster": ["235/45R18", "265/45R18", "235/40R19", "265/35R19"],
    "porsche|718 cayman": ["235/45R18", "265/45R18", "235/40R19", "265/35R19"],
    "porsche|cayenne": ["255/55R18", "255/50R19", "285/40R21", "285/35R22"],
    "porsche|cayenne coupe": ["285/40R21", "285/35R22", "315/35R22"],
    "porsche|macan": ["235/60R18", "235/55R19", "255/45R20", "265/40R21"],
    "porsche|panamera": ["265/45R19", "275/40R20", "295/35R21"],
    "porsche|taycan": ["225/55R19", "265/45R20", "305/30R21"],
    "porsche|taycan cross turismo": ["225/55R19", "265/45R20"],
    // Land Rover
    "land rover|range rover": ["255/55R20", "275/45R21"],
    "land rover|range rover sport": ["255/55R19", "275/40R22"],
    "land rover|range rover velar": ["255/55R19", "255/50R20"],
    "land rover|range rover evoque": ["235/60R18", "245/45R20"],
    "land rover|defender": ["255/65R19", "275/55R20"],
    "land rover|discovery": ["255/55R19", "275/45R21"],
    "land rover|discovery sport": ["225/65R17", "235/55R19"],
    // Infiniti
    "infiniti|qx60": ["235/65R18", "255/50R20"],
    "infiniti|q50": ["225/50R17", "245/40R19"],
    "infiniti|qx80": ["275/60R18", "275/50R22"],
    "infiniti|qx50": ["235/55R19", "255/45R20"],
    "infiniti|q60": ["225/50R18", "255/35R19"],
    // Buick
    "buick|enclave": ["235/65R18", "255/55R20"],
    "buick|envision": ["225/60R18", "235/50R20"],
    "buick|encore": ["215/55R18", "225/45R19"],
    "buick|encore gx": ["215/55R18", "225/45R19"],
    // Cadillac
    "cadillac|escalade": ["275/55R20", "285/45R22"],
    "cadillac|xt5": ["235/65R18", "235/55R20"],
    "cadillac|xt4": ["225/60R18", "235/50R20"],
    "cadillac|xt6": ["235/65R18", "255/55R20"],
    "cadillac|ct5": ["225/50R17", "245/40R19"],
    "cadillac|ct4": ["225/45R17", "235/40R18"],
    "cadillac|lyriq": ["255/50R20", "275/40R22"],
    // Lincoln
    "lincoln|navigator": ["275/55R20", "285/45R22"],
    "lincoln|aviator": ["255/55R20", "275/40R22"],
    "lincoln|corsair": ["225/60R18", "245/45R20"],
    "lincoln|nautilus": ["235/55R19", "245/45R20"],
    // Genesis
    "genesis|g70": ["225/45R18", "255/35R19"],
    "genesis|g80": ["245/45R19", "275/35R20"],
    "genesis|g90": ["245/50R19", "275/35R21"],
    "genesis|gv70": ["235/55R19", "255/45R20"],
    "genesis|gv80": ["255/50R20", "275/40R22"],
    "genesis|gv60": ["235/50R20", "255/40R21"],
    // Mitsubishi
    "mitsubishi|outlander": ["225/60R18", "255/45R20"],
    "mitsubishi|eclipse cross": ["215/60R18", "225/55R18"],
    "mitsubishi|outlander sport": ["215/60R17", "225/55R18"],
    // Chrysler
    "chrysler|pacifica": ["235/60R18", "235/55R19"],
    "chrysler|300": ["225/60R18", "245/45R20"],
    // Alfa Romeo
    "alfa romeo|giulia": ["225/45R18", "225/40R19", "255/35R19"],
    "alfa romeo|stelvio": ["235/60R18", "255/45R20"],
  };

  const makeLower = makeSlug.toLowerCase().replace(/-/g, " ");
  // Also handle slugs like "land-rover" → "land rover"
  const makeVariant = makeSlug.toLowerCase();

  const models: { model: string; modelSlug: string; sizes: string[] }[] = [];

  for (const [key, sizes] of Object.entries(tireSizeDatabase)) {
    const [dbMake, dbModel] = key.split("|");
    if (dbMake === makeLower || dbMake === makeVariant) {
      const modelSlug = dbModel.replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      const modelName = dbModel.replace(/\b\w/g, (c) => c.toUpperCase());
      models.push({ model: modelName, modelSlug, sizes });
    }
  }

  return models.sort((a, b) => a.model.localeCompare(b.model));
}

// Get make content by slug
export function getMakeContent(slug: string): VehicleMakeContent | null {
  return vehicleMakes.find((m) => m.slug === slug) ?? null;
}

// Get model content
export function getModelContent(makeSlug: string, modelSlug: string): VehicleModelContent | null {
  // Try different key formats
  const makeName = makeSlug.replace(/-/g, " ");
  const modelName = modelSlug.replace(/-/g, " ");
  return vehicleModelContent[`${makeName}|${modelName}`] ?? vehicleModelContent[`${makeName}|${modelSlug}`] ?? null;
}
