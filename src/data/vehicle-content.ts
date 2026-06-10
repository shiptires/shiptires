/**
 * Vehicle-specific SEO content for make and model pages.
 * Structured to mirror TireRack-style landing pages.
 */

export interface VehicleMakeContent {
  slug: string;
  name: string;
  intro: string;
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
    tireGuide:
      "For Nissan sedans like the Altima and Sentra, touring all-season tires provide the best balance of ride comfort and tread life. The Rogue and Murano benefit from crossover-specific all-season tires. For the Frontier and Titan trucks, all-terrain tires deliver on-road comfort with off-road capability.",
    popularBrands: ["Michelin", "Continental", "Bridgestone", "Falken", "Yokohama", "Hankook"],
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
      "Mercedes-Benz vehicles combine luxury, comfort, and performance. From the C-Class and E-Class sedans to the GLE and GLC SUVs, choosing the right tires ensures your Mercedes delivers the refined driving experience it was designed for.",
    tireGuide:
      "Mercedes vehicles are tuned for a balance of comfort and sportiness. For sedans like the C-Class and E-Class, premium touring or performance tires maintain ride quality and handling precision. SUVs like the GLE and GLC benefit from all-season tires that handle varied road conditions while preserving interior quietness.",
    popularBrands: ["Continental", "Michelin", "Pirelli", "Bridgestone", "Goodyear", "Hankook"],
    faqs: [
      {
        q: "Do Mercedes-Benz vehicles require special tires?",
        a: "While not strictly required, Mercedes recommends tires that meet their MOE (Mercedes Original Equipment) specifications. These tires are optimized for ride comfort, noise levels, and handling characteristics specific to each Mercedes model.",
      },
    ],
  },
  {
    slug: "hyundai",
    name: "Hyundai",
    intro:
      "Hyundai has rapidly become one of America's most popular brands, with vehicles like the Tucson, Elantra, Sonata, Santa Fe, and Palisade offering exceptional value and modern features. The right tires maximize your Hyundai's comfort, efficiency, and safety.",
    tireGuide:
      "For Hyundai sedans like the Elantra and Sonata, touring all-season tires deliver long tread life and a comfortable ride. The Tucson and Santa Fe perform well with crossover all-season tires. The Palisade benefits from premium touring tires that provide a quiet, luxury-like ride. For the Ioniq 5, low rolling resistance tires maximize electric range.",
    popularBrands: ["Michelin", "Continental", "Hankook", "Kumho", "Bridgestone", "Yokohama"],
    faqs: [
      {
        q: "What tires should I get for my Hyundai Tucson?",
        a: "The Hyundai Tucson works well with all-season crossover tires like the Michelin CrossClimate2 or Hankook Kinergy PT. These provide reliable all-weather traction and a comfortable ride for daily driving.",
      },
    ],
  },
  {
    slug: "kia",
    name: "Kia",
    intro:
      "Kia has earned a reputation for exceptional value, bold design, and impressive warranties. From the family-friendly Telluride to the practical Sportage, sporty K5, and efficient Forte, Kia vehicles deserve tires that complement their quality and performance.",
    tireGuide:
      "Kia vehicles span multiple segments, each with different tire needs. For the Telluride and Sorento, all-season SUV tires provide the traction and comfort families need. The K5 and Forte perform best with touring all-season tires for daily commuting. The EV6 benefits from EV-specific tires designed for instant torque and range efficiency.",
    popularBrands: ["Hankook", "Kumho", "Michelin", "Continental", "Bridgestone", "Falken"],
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
    popularBrands: ["Continental", "Michelin", "Pirelli", "Bridgestone", "Hankook", "Yokohama"],
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
    tireGuide:
      "Tesla's instant torque and heavy batteries accelerate tire wear compared to gas vehicles. EV-specific tires have reinforced sidewalls for extra load capacity and low rolling resistance for maximum range. For the Model 3 and Model Y, all-season EV tires like the Michelin e.Primacy or Continental EcoContact provide the best balance of range and grip. Performance variants benefit from summer performance tires.",
    popularBrands: ["Michelin", "Continental", "Pirelli", "Bridgestone", "Hankook", "Goodyear"],
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
    popularBrands: ["Continental", "Michelin", "Pirelli", "Bridgestone", "Dunlop", "Hankook"],
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
    popularBrands: ["Michelin", "Continental", "Nokian", "Pirelli", "Bridgestone", "Hankook"],
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
      "Porsche engineering demands tires that deliver at the highest level of performance. Every 911, Cayenne, and Macan is tuned to work with specific tire characteristics, making proper tire selection essential for maintaining the driving experience Porsche is famous for.",
    tireGuide:
      "Porsche recommends N-rated tires specifically tuned for each model's suspension and handling characteristics. For the 911, ultra-high-performance summer tires provide the grip needed for its rear-engine dynamics. The Cayenne and Macan benefit from sport-oriented all-season or summer tires that maintain their agile handling despite their SUV size.",
    popularBrands: ["Michelin", "Pirelli", "Continental", "Goodyear", "Bridgestone", "Dunlop"],
    faqs: [
      {
        q: "Do I need N-rated tires for my Porsche?",
        a: "While not mandatory, N-rated tires (N0, N1, N2, etc.) are specifically tuned and tested by Porsche for each model. They're optimized for handling, noise, and wear characteristics. Using N-rated tires maintains the intended driving experience.",
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
    popularBrands: ["Michelin", "Bridgestone", "Continental", "Yokohama", "Falken", "Hankook"],
    faqs: [],
  },
  {
    slug: "buick",
    name: "Buick",
    intro:
      "Buick delivers premium comfort and quiet refinement in every vehicle. The Enclave, Encore, and Envision prioritize a smooth, whisper-quiet ride — and the right tires are essential for maintaining that luxury experience.",
    tireGuide:
      "Buick vehicles are tuned for comfort above all, making tire noise and ride quality the top priorities. For the Enclave, touring SUV tires with low noise ratings provide the quietest ride. The Encore and Envision benefit from comfort-oriented all-season tires with long tread warranties.",
    popularBrands: ["Michelin", "Continental", "Bridgestone", "Goodyear", "Hankook", "Cooper"],
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
    popularBrands: ["Michelin", "Continental", "Bridgestone", "Pirelli", "Goodyear", "Hankook"],
    faqs: [],
  },
  {
    slug: "genesis",
    name: "Genesis",
    intro:
      "Genesis brings Korean luxury engineering to the premium segment with exceptional value. The G70, G80, GV70, and GV80 combine stunning design with dynamic performance, requiring tires that complement their luxury-sport character.",
    tireGuide:
      "Genesis vehicles offer a sportier driving experience than many luxury competitors, making tire selection impactful. The G70 benefits from performance all-season or summer tires that match its sport sedan dynamics. The GV70 and GV80 pair well with premium all-season crossover tires that maintain ride quality and handling balance.",
    popularBrands: ["Michelin", "Continental", "Hankook", "Pirelli", "Bridgestone", "Yokohama"],
    faqs: [],
  },
  {
    slug: "mitsubishi",
    name: "Mitsubishi",
    intro:
      "Mitsubishi offers practical, value-oriented vehicles with capable all-wheel drive options. The Outlander, Eclipse Cross, and Mirage provide reliable transportation that benefits from well-chosen tires for safety, comfort, and fuel efficiency.",
    tireGuide:
      "For the Outlander and Eclipse Cross, all-season crossover tires provide the best balance of traction and fuel economy. The Mirage benefits from fuel-efficient touring tires that maximize its already impressive gas mileage.",
    popularBrands: ["Michelin", "Hankook", "Kumho", "Yokohama", "Falken", "Continental"],
    faqs: [],
  },
  {
    slug: "mini",
    name: "MINI",
    intro:
      "MINI vehicles are all about driving fun and go-kart-like handling. From the Hardtop and Convertible to the Countryman, every MINI benefits from tires that maintain its legendary nimble, responsive character.",
    tireGuide:
      "MINI's signature handling makes tire choice critical. For the Hardtop and Convertible, performance all-season or summer tires maintain the car's playful dynamics. The John Cooper Works variants deserve ultra-high-performance tires. The Countryman, as a small crossover, benefits from all-season tires that don't dull its sporty handling.",
    popularBrands: ["Continental", "Michelin", "Pirelli", "Bridgestone", "Dunlop", "Hankook"],
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
    popularBrands: ["Michelin", "Continental", "Bridgestone", "Goodyear", "Cooper", "Hankook"],
    faqs: [],
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
    "honda|civic": ["215/55R16", "235/40R18", "215/50R17"],
    "honda|accord": ["225/50R17", "235/45R18", "235/40R19"],
    "honda|cr-v": ["225/65R17", "235/60R18"],
    "honda|pilot": ["245/60R18", "255/50R20"],
    "honda|odyssey": ["235/60R18", "235/55R19"],
    "honda|hr-v": ["215/60R17", "215/55R18"],
    "honda|ridgeline": ["245/60R18", "265/45R20"],
    "honda|passport": ["245/60R18", "265/45R20"],
    "toyota|camry": ["215/55R17", "235/45R18"],
    "toyota|corolla": ["205/55R16", "225/40R18"],
    "toyota|rav4": ["225/65R17", "225/60R18"],
    "toyota|highlander": ["235/65R18", "235/55R20"],
    "toyota|tacoma": ["245/75R16", "265/70R16", "265/65R17"],
    "toyota|tundra": ["275/65R18", "275/55R20"],
    "toyota|4runner": ["265/70R17", "275/65R18"],
    "toyota|prius": ["195/65R15", "215/45R17"],
    "toyota|sienna": ["235/60R18", "235/50R19"],
    "toyota|supra": ["255/35R19", "275/35R19"],
    "ford|f-150": ["265/70R17", "275/65R18", "275/55R20", "275/45R22"],
    "ford|escape": ["225/65R17", "225/60R18"],
    "ford|explorer": ["255/65R18", "255/55R20"],
    "ford|mustang": ["235/55R17", "255/40R19", "275/40R19"],
    "ford|bronco": ["255/75R17", "265/70R17", "285/70R17"],
    "ford|ranger": ["245/70R17", "265/65R17"],
    "ford|expedition": ["275/65R18", "275/55R20"],
    "ford|maverick": ["225/65R17", "225/60R18"],
    "chevrolet|silverado": ["265/70R17", "275/65R18", "275/55R20"],
    "chevrolet|equinox": ["225/65R17", "225/55R19"],
    "chevrolet|tahoe": ["275/65R18", "275/55R20", "285/45R22"],
    "chevrolet|traverse": ["245/60R18", "255/55R20"],
    "chevrolet|camaro": ["245/50R18", "245/40R20", "275/35R20"],
    "chevrolet|corvette": ["245/35R19", "305/30R20"],
    "chevrolet|colorado": ["255/70R17", "265/65R17"],
    "nissan|altima": ["215/55R17", "235/45R18"],
    "nissan|rogue": ["225/65R17", "225/55R19"],
    "nissan|sentra": ["205/55R16", "215/50R17"],
    "nissan|pathfinder": ["255/60R18", "255/55R20"],
    "nissan|frontier": ["255/70R17", "265/65R18"],
    "nissan|titan": ["275/65R18", "275/55R20"],
    "hyundai|tucson": ["225/60R17", "235/55R19"],
    "hyundai|elantra": ["205/55R16", "225/45R17", "225/40R18"],
    "hyundai|sonata": ["215/55R17", "235/45R18"],
    "hyundai|santa fe": ["235/65R17", "235/60R18", "255/45R20"],
    "hyundai|palisade": ["245/60R18", "245/50R20"],
    "hyundai|ioniq 5": ["235/55R19", "255/45R20"],
    "kia|telluride": ["245/60R18", "255/50R20"],
    "kia|sportage": ["225/60R17", "235/55R19"],
    "kia|sorento": ["235/65R17", "235/55R19"],
    "kia|forte": ["205/55R16", "225/45R17", "225/40R18"],
    "kia|k5": ["215/55R17", "235/45R18"],
    "kia|ev6": ["235/55R19", "255/45R20"],
    "subaru|outback": ["225/65R17", "225/60R18"],
    "subaru|forester": ["225/60R17", "225/55R18"],
    "subaru|crosstrek": ["225/60R17", "225/55R18"],
    "subaru|wrx": ["235/45R17", "245/40R18", "245/35R19"],
    "subaru|ascent": ["245/65R17", "245/50R20"],
    "bmw|3 series": ["225/45R18", "255/35R19", "225/40R19"],
    "bmw|5 series": ["245/45R18", "245/40R19", "275/35R19"],
    "bmw|x3": ["225/60R18", "245/50R19"],
    "bmw|x5": ["255/55R18", "275/45R20", "275/40R21"],
    "bmw|m3": ["275/35R19", "285/30R20"],
    "mercedes-benz|c-class": ["225/45R18", "225/40R19", "255/35R19"],
    "mercedes-benz|e-class": ["245/45R18", "245/40R19"],
    "mercedes-benz|gle": ["255/55R19", "275/45R20", "285/40R21"],
    "mercedes-benz|glc": ["235/60R18", "255/45R20"],
    "audi|a4": ["225/50R17", "245/40R18", "255/35R19"],
    "audi|q5": ["235/60R18", "255/45R20"],
    "audi|q7": ["255/55R19", "285/40R21"],
    "jeep|wrangler": ["255/75R17", "285/70R17", "315/70R17"],
    "jeep|grand cherokee": ["265/60R18", "265/50R20"],
    "jeep|gladiator": ["255/75R17", "285/70R17"],
    "ram|1500": ["275/65R18", "275/55R20", "275/50R22"],
    "ram|2500": ["275/70R18", "285/60R20"],
    "gmc|sierra": ["265/70R17", "275/65R18", "275/55R20"],
    "gmc|yukon": ["275/65R18", "275/55R20", "285/45R22"],
    "volkswagen|jetta": ["205/55R16", "225/45R17", "225/40R18"],
    "volkswagen|tiguan": ["215/65R17", "235/55R18"],
    "volkswagen|atlas": ["245/60R18", "255/50R20"],
    "volkswagen|gti": ["225/45R17", "225/40R18", "235/35R19"],
    "mazda|cx-5": ["225/65R17", "225/55R19"],
    "mazda|mazda3": ["205/60R16", "215/45R18"],
    "mazda|cx-50": ["225/60R18", "225/55R19"],
    "mazda|mx-5 miata": ["195/50R16", "205/45R17"],
    "tesla|model 3": ["235/45R18", "235/40R19", "255/35R19"],
    "tesla|model y": ["255/45R19", "255/35R21"],
    "tesla|model s": ["245/45R19", "265/35R21"],
    "tesla|model x": ["255/45R20", "265/35R22"],
    "tesla|cybertruck": ["285/65R20"],
    "dodge|charger": ["215/65R17", "235/55R18", "245/45R20"],
    "dodge|challenger": ["215/65R17", "245/45R20", "275/40R20"],
    "dodge|durango": ["265/60R18", "265/50R20"],
    "lexus|rx": ["235/65R18", "235/55R20"],
    "lexus|es": ["215/55R17", "235/45R18"],
    "lexus|nx": ["225/60R18", "235/50R20"],
    "lexus|gx": ["265/60R18", "265/55R19"],
    "lexus|is": ["225/40R18", "255/35R19"],
    "acura|mdx": ["245/60R18", "255/50R20"],
    "acura|rdx": ["235/60R18", "255/45R20"],
    "acura|tlx": ["225/50R18", "245/40R19"],
    "volvo|xc90": ["235/60R18", "275/40R21"],
    "volvo|xc60": ["235/60R18", "255/45R20"],
    "volvo|xc40": ["215/55R18", "235/50R19"],
    "volvo|s60": ["225/50R17", "235/40R19"],
    "porsche|cayenne": ["255/55R18", "285/40R21"],
    "porsche|macan": ["235/60R18", "265/40R21"],
    "porsche|911": ["245/35R20", "305/30R21"],
    "land rover|range rover": ["255/55R20", "275/45R21"],
    "land rover|defender": ["255/65R19", "275/55R20"],
    "infiniti|qx60": ["235/65R18", "255/50R20"],
    "infiniti|q50": ["225/50R17", "245/40R19"],
    "buick|enclave": ["235/65R18", "255/55R20"],
    "buick|envision": ["225/60R18", "235/50R20"],
    "cadillac|escalade": ["275/55R20", "285/45R22"],
    "cadillac|xt5": ["235/65R18", "235/55R20"],
    "lincoln|navigator": ["275/55R20", "285/45R22"],
    "lincoln|aviator": ["255/55R20", "275/40R22"],
    "genesis|g70": ["225/45R18", "255/35R19"],
    "genesis|gv70": ["235/55R19", "255/45R20"],
    "genesis|gv80": ["255/50R20", "275/40R22"],
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
