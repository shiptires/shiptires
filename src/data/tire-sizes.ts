// Common tire sizes by make/model
// Format: { "make|model": ["size1", "size2", ...] }
// This covers the most popular vehicles. For vehicles not in this database,
// we return common sizes for the vehicle class.

const tireSizeDatabase: Record<string, string[]> = {
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
  "toyota|86": ["205/55R16", "215/45R17"],
  "toyota|gr86": ["215/40R18", "225/40R18"],
  "toyota|avalon": ["225/45R18", "235/40R19"],
  "toyota|venza": ["225/60R18", "225/55R19"],
  "toyota|crown": ["225/55R19", "235/45R20"],
  "toyota|bz4x": ["235/60R18", "235/50R20"],
  "toyota|c-hr": ["215/60R17", "225/50R18"],
  "toyota|sequoia": ["275/65R18", "275/50R22"],
  "toyota|land cruiser": ["275/65R18", "285/50R20"],

  // Honda
  "honda|civic": ["215/55R16", "235/40R18", "215/50R17"],
  "honda|accord": ["225/50R17", "235/45R18", "235/40R19"],
  "honda|cr-v": ["225/65R17", "235/60R18"],
  "honda|pilot": ["245/60R18", "255/50R20"],
  "honda|odyssey": ["235/60R18", "235/55R19"],
  "honda|hr-v": ["215/60R17", "215/55R18"],
  "honda|ridgeline": ["245/60R18", "265/45R20"],
  "honda|fit": ["185/65R15", "185/55R16"],
  "honda|passport": ["245/60R18", "265/45R20"],
  "honda|insight": ["215/50R17", "215/45R18"],
  "honda|prologue": ["255/50R19", "255/45R20"],

  // Ford
  "ford|f-150": ["265/70R17", "275/65R18", "275/55R20", "275/45R22"],
  "ford|f-250": ["275/70R18", "275/65R20"],
  "ford|f-350": ["275/70R18", "275/65R20"],
  "ford|escape": ["225/65R17", "225/60R18"],
  "ford|explorer": ["255/65R18", "255/55R20"],
  "ford|edge": ["235/60R18", "245/50R20"],
  "ford|mustang": ["235/55R17", "255/40R19", "275/40R19"],
  "ford|mustang mach-e": ["225/60R18", "225/55R19"],
  "ford|bronco": ["255/75R17", "265/70R17", "285/70R17"],
  "ford|bronco sport": ["225/65R17", "225/60R18"],
  "ford|ranger": ["245/70R17", "265/65R17"],
  "ford|expedition": ["275/65R18", "275/55R20"],
  "ford|focus": ["215/55R16", "215/50R17"],
  "ford|fusion": ["225/50R17", "235/45R18"],
  "ford|maverick": ["225/65R17", "225/60R18"],

  // Chevrolet
  "chevrolet|silverado": ["265/70R17", "275/65R18", "275/55R20"],
  "chevrolet|silverado 1500": ["265/70R17", "275/65R18", "275/55R20", "275/50R22"],
  "chevrolet|equinox": ["225/65R17", "225/55R19"],
  "chevrolet|tahoe": ["275/65R18", "275/55R20", "285/45R22"],
  "chevrolet|suburban": ["275/65R18", "275/55R20", "285/45R22"],
  "chevrolet|traverse": ["245/60R18", "255/55R20"],
  "chevrolet|malibu": ["225/55R17", "245/45R18"],
  "chevrolet|camaro": ["245/50R18", "245/40R20", "275/35R20"],
  "chevrolet|corvette": ["245/35R19", "305/30R20"],
  "chevrolet|colorado": ["255/70R17", "265/65R17"],
  "chevrolet|blazer": ["235/65R17", "255/55R20"],
  "chevrolet|trailblazer": ["215/60R17", "215/55R18"],
  "chevrolet|trax": ["205/65R16", "215/55R18"],
  "chevrolet|bolt ev": ["215/50R17"],
  "chevrolet|equinox ev": ["255/50R19", "255/45R20"],
  "chevrolet|impala": ["235/50R18", "245/45R19"],

  // Nissan
  "nissan|altima": ["215/55R17", "235/45R18"],
  "nissan|rogue": ["225/65R17", "225/55R19"],
  "nissan|sentra": ["205/55R16", "215/50R17"],
  "nissan|pathfinder": ["255/60R18", "255/55R20"],
  "nissan|murano": ["235/65R18", "235/55R20"],
  "nissan|frontier": ["255/70R17", "265/65R18"],
  "nissan|titan": ["275/65R18", "275/55R20"],
  "nissan|maxima": ["245/45R18", "245/40R19"],
  "nissan|kicks": ["205/55R17", "215/50R18"],
  "nissan|versa": ["185/65R15", "195/55R16"],
  "nissan|armada": ["275/60R18", "275/55R20"],
  "nissan|leaf": ["205/55R16", "215/50R17"],
  "nissan|ariya": ["235/55R19", "255/45R20"],
  "nissan|370z": ["225/50R18", "245/45R18"],

  // Hyundai
  "hyundai|tucson": ["225/60R17", "235/55R19"],
  "hyundai|elantra": ["205/55R16", "225/45R17", "225/40R18"],
  "hyundai|sonata": ["215/55R17", "235/45R18"],
  "hyundai|santa fe": ["235/65R17", "235/60R18", "255/45R20"],
  "hyundai|palisade": ["245/60R18", "245/50R20"],
  "hyundai|kona": ["215/55R17", "235/45R18"],
  "hyundai|venue": ["205/60R16", "215/55R17"],
  "hyundai|ioniq 5": ["235/55R19", "255/45R20"],
  "hyundai|ioniq 6": ["245/45R19", "255/40R20"],
  "hyundai|santa cruz": ["235/65R17", "245/50R20"],
  "hyundai|accent": ["185/65R15", "195/55R16"],

  // Kia
  "kia|telluride": ["245/60R18", "255/50R20"],
  "kia|sportage": ["225/60R17", "235/55R19"],
  "kia|sorento": ["235/65R17", "235/55R19"],
  "kia|forte": ["205/55R16", "225/45R17", "225/40R18"],
  "kia|k5": ["215/55R17", "235/45R18"],
  "kia|seltos": ["215/60R17", "235/45R18"],
  "kia|carnival": ["235/60R18", "235/55R19"],
  "kia|soul": ["205/60R16", "235/45R18"],
  "kia|ev6": ["235/55R19", "255/45R20"],
  "kia|niro": ["205/60R16", "225/45R18"],
  "kia|ev9": ["255/55R19", "285/45R21"],
  "kia|stinger": ["225/45R18", "255/35R19"],

  // Subaru
  "subaru|outback": ["225/65R17", "225/60R18"],
  "subaru|forester": ["225/60R17", "225/55R18"],
  "subaru|crosstrek": ["225/60R17", "225/55R18"],
  "subaru|wrx": ["235/45R17", "245/40R18", "245/35R19"],
  "subaru|impreza": ["205/55R16", "225/40R18"],
  "subaru|legacy": ["225/55R17", "225/50R18"],
  "subaru|ascent": ["245/65R17", "245/50R20"],
  "subaru|brz": ["215/40R18", "225/40R18"],
  "subaru|solterra": ["235/60R18", "235/50R20"],

  // BMW
  "bmw|3 series": ["225/45R18", "255/35R19", "225/40R19"],
  "bmw|5 series": ["245/45R18", "245/40R19", "275/35R19"],
  "bmw|x3": ["225/60R18", "245/50R19"],
  "bmw|x5": ["255/55R18", "275/45R20", "275/40R21"],
  "bmw|x1": ["225/55R17", "225/50R18"],
  "bmw|4 series": ["225/45R18", "255/35R19"],
  "bmw|7 series": ["245/50R18", "275/35R20"],
  "bmw|x7": ["275/50R20", "285/40R22"],
  "bmw|m3": ["275/35R19", "285/30R20"],
  "bmw|m4": ["275/35R19", "285/30R20"],
  "bmw|2 series": ["225/45R17", "225/40R18"],
  "bmw|x2": ["225/55R17", "225/50R18"],
  "bmw|x4": ["245/50R19", "245/45R20"],
  "bmw|x6": ["275/45R20", "275/40R21"],
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
  "audi|a4": ["225/50R17", "245/40R18", "255/35R19"],
  "audi|a6": ["225/55R18", "255/40R19"],
  "audi|q5": ["235/60R18", "255/45R20"],
  "audi|q7": ["255/55R19", "285/40R21"],
  "audi|a3": ["225/45R17", "225/40R18"],
  "audi|q3": ["215/65R17", "235/55R18"],
  "audi|a5": ["245/40R18", "255/35R19"],
  "audi|e-tron": ["255/55R19", "265/45R21"],
  "audi|a7": ["245/45R19", "255/40R20"],
  "audi|a8": ["255/45R19", "265/40R20"],
  "audi|q8": ["265/50R19", "285/40R21"],
  "audi|q4 e-tron": ["235/55R19", "255/45R20"],
  "audi|tt": ["225/50R17", "245/35R19"],

  // Jeep
  "jeep|wrangler": ["255/75R17", "285/70R17", "315/70R17"],
  "jeep|grand cherokee": ["265/60R18", "265/50R20"],
  "jeep|cherokee": ["225/60R17", "225/55R18"],
  "jeep|compass": ["215/65R17", "225/55R18"],
  "jeep|gladiator": ["255/75R17", "285/70R17"],
  "jeep|renegade": ["215/60R17", "225/55R18"],
  "jeep|grand cherokee l": ["265/60R18", "265/50R20"],
  "jeep|wagoneer": ["275/55R20", "285/45R22"],
  "jeep|grand wagoneer": ["275/50R20", "285/45R22"],

  // Ram
  "ram|1500": ["275/65R18", "275/55R20", "275/50R22"],
  "ram|2500": ["275/70R18", "285/60R20"],
  "ram|3500": ["275/70R18", "285/60R20"],

  // GMC
  "gmc|sierra": ["265/70R17", "275/65R18", "275/55R20"],
  "gmc|sierra 1500": ["265/70R17", "275/65R18", "275/55R20"],
  "gmc|terrain": ["225/65R17", "235/55R19"],
  "gmc|acadia": ["235/65R17", "255/55R20"],
  "gmc|yukon": ["275/65R18", "275/55R20", "285/45R22"],
  "gmc|canyon": ["255/70R17", "265/65R17"],
  "gmc|hummer ev": ["305/70R18"],

  // Volkswagen
  "volkswagen|jetta": ["205/55R16", "225/45R17", "225/40R18"],
  "volkswagen|tiguan": ["215/65R17", "235/55R18"],
  "volkswagen|atlas": ["245/60R18", "255/50R20"],
  "volkswagen|golf": ["205/55R16", "225/45R17", "225/40R18"],
  "volkswagen|gti": ["225/45R17", "225/40R18", "235/35R19"],
  "volkswagen|id.4": ["235/55R19", "255/45R20"],
  "volkswagen|taos": ["215/55R18", "225/45R19"],
  "volkswagen|atlas cross sport": ["245/60R18", "255/50R20"],
  "volkswagen|golf r": ["235/35R19"],
  "volkswagen|passat": ["215/55R17", "235/45R18"],

  // Mazda
  "mazda|cx-5": ["225/65R17", "225/55R19"],
  "mazda|mazda3": ["205/60R16", "215/45R18"],
  "mazda|cx-9": ["255/60R18", "255/50R20"],
  "mazda|cx-30": ["215/55R18", "215/45R18"],
  "mazda|cx-50": ["225/60R18", "225/55R19"],
  "mazda|cx-90": ["255/55R19", "275/40R21"],
  "mazda|mazda6": ["225/55R17", "225/45R19"],
  "mazda|mx-5 miata": ["195/50R16", "205/45R17"],

  // Tesla
  "tesla|model 3": ["235/45R18", "235/40R19", "255/35R19"],
  "tesla|model y": ["255/45R19", "255/35R21"],
  "tesla|model s": ["245/45R19", "265/35R21"],
  "tesla|model x": ["255/45R20", "265/35R22"],
  "tesla|cybertruck": ["285/65R20"],

  // Dodge
  "dodge|durango": ["265/60R18", "265/50R20"],
  "dodge|charger": ["215/65R17", "235/55R18", "245/45R20"],
  "dodge|challenger": ["215/65R17", "245/45R20", "275/40R20"],
  "dodge|ram 1500": ["275/65R18", "275/55R20"],
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

  // Buick
  "buick|enclave": ["235/65R18", "255/55R20"],
  "buick|encore": ["215/55R18", "225/45R19"],
  "buick|envision": ["225/60R18", "235/50R20"],

  // Cadillac
  "cadillac|escalade": ["275/55R20", "285/45R22"],
  "cadillac|xt5": ["235/65R18", "235/55R20"],
  "cadillac|ct5": ["225/50R17", "245/40R19"],

  // Lincoln
  "lincoln|navigator": ["275/55R20", "285/45R22"],
  "lincoln|aviator": ["255/55R20", "275/40R22"],
  "lincoln|corsair": ["225/60R18", "245/45R20"],

  // Infiniti
  "infiniti|qx60": ["235/65R18", "255/50R20"],
  "infiniti|q50": ["225/50R17", "245/40R19"],
  "infiniti|qx80": ["275/60R18", "275/50R22"],

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
  "land rover|defender": ["255/65R19", "275/55R20"],
  "land rover|discovery": ["255/55R19", "275/45R21"],
  "land rover|range rover velar": ["255/55R19", "255/50R20"],
  "land rover|range rover evoque": ["235/60R18", "245/45R20"],
  "land rover|discovery sport": ["225/65R17", "235/55R19"],

  // Infiniti (additional)
  "infiniti|qx50": ["235/55R19", "255/45R20"],
  "infiniti|q60": ["225/50R18", "255/35R19"],

  // Buick (additional)
  "buick|encore gx": ["215/55R18", "225/45R19"],

  // Cadillac (additional)
  "cadillac|xt4": ["225/60R18", "235/50R20"],
  "cadillac|xt6": ["235/65R18", "255/55R20"],
  "cadillac|ct4": ["225/45R17", "235/40R18"],
  "cadillac|lyriq": ["255/50R20", "275/40R22"],

  // Lincoln (additional)
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

// Vehicle class-based fallback sizes
const classSizes: Record<string, string[]> = {
  sedan: ["205/55R16", "215/55R17", "225/45R18"],
  suv: ["225/65R17", "235/60R18", "255/55R20"],
  truck: ["265/70R17", "275/65R18", "275/55R20"],
  sports: ["225/45R18", "245/40R19", "255/35R19"],
  compact: ["195/65R15", "205/55R16", "215/50R17"],
  minivan: ["225/60R18", "235/55R19"],
  luxury: ["225/50R18", "245/45R18", "255/40R19"],
};

// Map some common models to vehicle classes for fallback
const modelClassMap: Record<string, string> = {
  // Sedans
  camry: "sedan", accord: "sedan", altima: "sedan", sonata: "sedan", civic: "sedan",
  corolla: "sedan", malibu: "sedan", sentra: "sedan", jetta: "sedan", elantra: "sedan",
  k5: "sedan", forte: "sedan", mazda3: "sedan", impreza: "sedan", legacy: "sedan",
  maxima: "sedan", avalon: "sedan", passat: "sedan", a4: "sedan", a6: "sedan",
  "3 series": "sedan", "5 series": "sedan", "c-class": "sedan", "e-class": "sedan",
  "a-class": "sedan", cla: "sedan", cle: "sedan", cls: "sedan", "s-class": "luxury",
  charger: "sedan", is: "sedan", es: "sedan", tlx: "sedan", s60: "sedan",
  ct5: "sedan", ct4: "sedan", q50: "sedan", panamera: "luxury",
  "ioniq 6": "sedan", a7: "luxury", a8: "luxury", mazda6: "sedan",
  "2 series": "sedan", g70: "sports", g80: "luxury", g90: "luxury",
  "300": "sedan", giulia: "sedan", q60: "sports", s90: "luxury",
  stinger: "sports",
  // SUVs
  "rav4": "suv", "cr-v": "suv", rogue: "suv", tucson: "suv", "cx-5": "suv",
  escape: "suv", equinox: "suv", sportage: "suv", forester: "suv", outback: "suv",
  highlander: "suv", pilot: "suv", pathfinder: "suv", "santa fe": "suv",
  explorer: "suv", tahoe: "suv", "grand cherokee": "suv", x5: "suv", gle: "suv",
  "gle coupe": "suv", glc: "suv", "glc coupe": "suv", gla: "suv", glb: "suv",
  "g-class": "suv", "eqs suv": "suv", eqb: "suv",
  macan: "suv", "cayenne coupe": "suv",
  q5: "suv", q7: "suv", q8: "suv", "q4 e-tron": "suv", cayenne: "suv",
  rx: "suv", mdx: "suv", xc90: "suv", zdx: "suv",
  palisade: "suv", telluride: "suv", atlas: "suv", "atlas cross sport": "suv", traverse: "suv",
  "grand cherokee l": "suv", wagoneer: "luxury", x2: "suv", x4: "suv", x6: "suv",
  "cx-90": "suv", tx: "suv", xt4: "suv", xt6: "suv", nautilus: "suv",
  gv70: "suv", gv80: "suv", gv60: "suv", qx50: "suv",
  outlander: "suv", "eclipse cross": "suv", "outlander sport": "suv",
  stelvio: "suv", "encore gx": "compact",
  "range rover velar": "suv", "range rover evoque": "suv", "discovery sport": "suv",
  "v60 cross country": "suv", "santa cruz": "truck",
  lyriq: "luxury", ex90: "luxury",
  // Trucks
  "f-150": "truck", silverado: "truck", "silverado 1500": "truck", "ram 1500": "truck",
  "1500": "truck", tundra: "truck", tacoma: "truck", sierra: "truck", "sierra 1500": "truck",
  frontier: "truck", titan: "truck", colorado: "truck", ranger: "truck", canyon: "truck",
  gladiator: "truck", ridgeline: "truck", "f-250": "truck", "f-350": "truck",
  "2500": "truck", "3500": "truck", cybertruck: "truck",
  // Sports
  mustang: "sports", camaro: "sports", corvette: "sports", supra: "sports", "370z": "sports",
  wrx: "sports", "mx-5 miata": "sports", challenger: "sports", 911: "sports",
  "718 boxster": "sports", "718 cayman": "sports", "amg gt": "sports", sl: "sports",
  m3: "sports", m4: "sports", gti: "sports", "golf r": "sports",
  brz: "sports", tt: "sports", rc: "sports", lc: "luxury",
  // Compact
  fit: "compact", versa: "compact", accent: "compact", venue: "compact", kicks: "compact",
  prius: "compact", bolt: "compact", soul: "compact", "hr-v": "compact",
  niro: "compact", ux: "compact", ex30: "compact",
  eqe: "luxury", eqs: "luxury", taycan: "sports", "taycan cross turismo": "sports",
  i4: "luxury", ix: "suv", solterra: "suv", rz: "suv", "c40 recharge": "suv",
  "hummer ev": "truck", ev9: "suv",
  // Minivan
  odyssey: "minivan", sienna: "minivan", carnival: "minivan", pacifica: "minivan",
  // Luxury SUV
  escalade: "luxury", navigator: "luxury", "grand wagoneer": "luxury",
  "range rover": "luxury", gls: "luxury", x7: "luxury", lx: "luxury", qx80: "luxury",
};

export function lookupTireSizes(make: string, model: string): string[] {
  const key = `${make.toLowerCase()}|${model.toLowerCase()}`;

  // Direct lookup
  if (tireSizeDatabase[key]) {
    return tireSizeDatabase[key];
  }

  // Try partial model match (e.g., "Silverado 1500" → "silverado")
  const modelLower = model.toLowerCase();
  for (const [dbKey, sizes] of Object.entries(tireSizeDatabase)) {
    const [dbMake, dbModel] = dbKey.split("|");
    if (dbMake === make.toLowerCase() && modelLower.includes(dbModel)) {
      return sizes;
    }
    if (dbMake === make.toLowerCase() && dbModel.includes(modelLower)) {
      return sizes;
    }
  }

  // Fallback by vehicle class
  const vehicleClass = modelClassMap[modelLower];
  if (vehicleClass && classSizes[vehicleClass]) {
    return classSizes[vehicleClass];
  }

  // Ultimate fallback - return common all-season sizes
  return ["215/55R17", "225/65R17", "235/60R18"];
}
