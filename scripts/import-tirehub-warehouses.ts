/**
 * One-time script to import TireHub's 82 warehouse (TLC/RDC) locations.
 *
 * Usage:
 *   npx tsx scripts/import-tirehub-warehouses.ts
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars.
 *
 * Data sourced from TireHub TLC List. Update the LOCATIONS array below
 * if the list changes.
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

interface TireHubLocation {
  location_code: string;
  location_name: string;
  street1: string;
  city: string;
  state: string;
  postal_code: string;
}

// TireHub TLC/RDC warehouse locations (82 locations)
// Update this array from TireHub's TLC List spreadsheet
const LOCATIONS: TireHubLocation[] = [
  { location_code: "100", location_name: "TLC 100 - Atlanta", street1: "1935 Vaughn Rd NW", city: "Kennesaw", state: "GA", postal_code: "30144" },
  { location_code: "101", location_name: "TLC 101 - Charlotte", street1: "4600 Chesapeake Dr", city: "Charlotte", state: "NC", postal_code: "28216" },
  { location_code: "102", location_name: "TLC 102 - Nashville", street1: "620 Myatt Dr", city: "Madison", state: "TN", postal_code: "37115" },
  { location_code: "103", location_name: "TLC 103 - Jacksonville", street1: "6250 Philips Hwy", city: "Jacksonville", state: "FL", postal_code: "32216" },
  { location_code: "104", location_name: "TLC 104 - Tampa", street1: "4501 Oak Fair Blvd", city: "Tampa", state: "FL", postal_code: "33610" },
  { location_code: "105", location_name: "TLC 105 - Orlando", street1: "1120 Bennett Dr", city: "Longwood", state: "FL", postal_code: "32750" },
  { location_code: "106", location_name: "TLC 106 - Miami", street1: "7600 NW 25th St", city: "Doral", state: "FL", postal_code: "33122" },
  { location_code: "107", location_name: "TLC 107 - Birmingham", street1: "2801 5th Ave S", city: "Birmingham", state: "AL", postal_code: "35233" },
  { location_code: "108", location_name: "TLC 108 - Raleigh", street1: "6001 Chapel Hill Rd", city: "Raleigh", state: "NC", postal_code: "27607" },
  { location_code: "109", location_name: "TLC 109 - Richmond", street1: "4000 Deepwater Terminal Rd", city: "Richmond", state: "VA", postal_code: "23234" },
  { location_code: "110", location_name: "TLC 110 - Greensboro", street1: "2000 Patterson St", city: "Greensboro", state: "NC", postal_code: "27407" },
  { location_code: "111", location_name: "TLC 111 - Columbia", street1: "100 Platt Springs Rd", city: "West Columbia", state: "SC", postal_code: "29169" },
  { location_code: "112", location_name: "TLC 112 - Greenville", street1: "500 Mauldin Rd", city: "Greenville", state: "SC", postal_code: "29607" },
  { location_code: "113", location_name: "TLC 113 - Memphis", street1: "3050 Millbranch Rd", city: "Memphis", state: "TN", postal_code: "38116" },
  { location_code: "114", location_name: "TLC 114 - Norfolk", street1: "1900 E Indian River Rd", city: "Norfolk", state: "VA", postal_code: "23523" },
  { location_code: "115", location_name: "TLC 115 - Savannah", street1: "125 Gulfstream Rd", city: "Savannah", state: "GA", postal_code: "31408" },
  { location_code: "116", location_name: "TLC 116 - Pensacola", street1: "6335 Pensacola Blvd", city: "Pensacola", state: "FL", postal_code: "32505" },
  { location_code: "117", location_name: "TLC 117 - Knoxville", street1: "2317 Byington Solway Rd", city: "Knoxville", state: "TN", postal_code: "37931" },
  { location_code: "118", location_name: "TLC 118 - Shreveport", street1: "3820 Hearne Ave", city: "Shreveport", state: "LA", postal_code: "71103" },
  { location_code: "119", location_name: "TLC 119 - New Orleans", street1: "1300 Edwards Ave", city: "Harahan", state: "LA", postal_code: "70123" },
  { location_code: "120", location_name: "TLC 120 - Little Rock", street1: "3501 E Roosevelt Rd", city: "Little Rock", state: "AR", postal_code: "72206" },
  { location_code: "200", location_name: "TLC 200 - Houston", street1: "9111 Eastex Fwy", city: "Houston", state: "TX", postal_code: "77029" },
  { location_code: "201", location_name: "TLC 201 - Dallas", street1: "1301 Capital Ave", city: "Plano", state: "TX", postal_code: "75074" },
  { location_code: "202", location_name: "TLC 202 - San Antonio", street1: "1827 Grandstand Dr", city: "San Antonio", state: "TX", postal_code: "78238" },
  { location_code: "203", location_name: "TLC 203 - Austin", street1: "1530 Grand Ave Pkwy", city: "Pflugerville", state: "TX", postal_code: "78660" },
  { location_code: "204", location_name: "TLC 204 - El Paso", street1: "12200 Rojas Dr", city: "El Paso", state: "TX", postal_code: "79936" },
  { location_code: "205", location_name: "TLC 205 - Oklahoma City", street1: "3900 S Council Rd", city: "Oklahoma City", state: "OK", postal_code: "73179" },
  { location_code: "206", location_name: "TLC 206 - Tulsa", street1: "1547 N 105th E Ave", city: "Tulsa", state: "OK", postal_code: "74116" },
  { location_code: "207", location_name: "TLC 207 - Ft Worth", street1: "2250 Handley Ederville Rd", city: "Fort Worth", state: "TX", postal_code: "76118" },
  { location_code: "208", location_name: "TLC 208 - Lubbock", street1: "408 N Ash Ave", city: "Lubbock", state: "TX", postal_code: "79403" },
  { location_code: "209", location_name: "TLC 209 - McAllen", street1: "1001 N 23rd St", city: "McAllen", state: "TX", postal_code: "78501" },
  { location_code: "210", location_name: "TLC 210 - Waco", street1: "1900 Franklin Ave", city: "Waco", state: "TX", postal_code: "76701" },
  { location_code: "300", location_name: "TLC 300 - Los Angeles", street1: "13201 S Main St", city: "Los Angeles", state: "CA", postal_code: "90061" },
  { location_code: "301", location_name: "TLC 301 - San Diego", street1: "8440 Aero Dr", city: "San Diego", state: "CA", postal_code: "92123" },
  { location_code: "302", location_name: "TLC 302 - Phoenix", street1: "3002 E Mohawk Ln", city: "Phoenix", state: "AZ", postal_code: "85050" },
  { location_code: "303", location_name: "TLC 303 - Sacramento", street1: "2401 Evergreen St", city: "Sacramento", state: "CA", postal_code: "95815" },
  { location_code: "304", location_name: "TLC 304 - Las Vegas", street1: "4685 Statz St", city: "North Las Vegas", state: "NV", postal_code: "89081" },
  { location_code: "305", location_name: "TLC 305 - San Francisco", street1: "2101 Williams St", city: "San Leandro", state: "CA", postal_code: "94577" },
  { location_code: "306", location_name: "TLC 306 - Denver", street1: "1600 W Evans Ave", city: "Denver", state: "CO", postal_code: "80223" },
  { location_code: "307", location_name: "TLC 307 - Tucson", street1: "3810 E 44th St", city: "Tucson", state: "AZ", postal_code: "85713" },
  { location_code: "308", location_name: "TLC 308 - Fresno", street1: "4571 E Florence Ave", city: "Fresno", state: "CA", postal_code: "93725" },
  { location_code: "309", location_name: "TLC 309 - Portland", street1: "14555 NW Science Park Dr", city: "Portland", state: "OR", postal_code: "97229" },
  { location_code: "310", location_name: "TLC 310 - Seattle", street1: "1900 W Valley Hwy S", city: "Auburn", state: "WA", postal_code: "98001" },
  { location_code: "311", location_name: "TLC 311 - Salt Lake City", street1: "1740 S 300 W", city: "Salt Lake City", state: "UT", postal_code: "84115" },
  { location_code: "312", location_name: "TLC 312 - Albuquerque", street1: "5901 Fireweed Ct NW", city: "Albuquerque", state: "NM", postal_code: "87120" },
  { location_code: "313", location_name: "TLC 313 - Bakersfield", street1: "3601 Gilmore Ave", city: "Bakersfield", state: "CA", postal_code: "93308" },
  { location_code: "314", location_name: "TLC 314 - Riverside", street1: "3500 Market St", city: "Riverside", state: "CA", postal_code: "92501" },
  { location_code: "315", location_name: "TLC 315 - Honolulu", street1: "91-320 Kauhi St", city: "Kapolei", state: "HI", postal_code: "96707" },
  { location_code: "400", location_name: "TLC 400 - Chicago", street1: "4500 W Division St", city: "Chicago", state: "IL", postal_code: "60651" },
  { location_code: "401", location_name: "TLC 401 - Detroit", street1: "28300 Gloede Dr", city: "Warren", state: "MI", postal_code: "48088" },
  { location_code: "402", location_name: "TLC 402 - Indianapolis", street1: "3901 W Morris St", city: "Indianapolis", state: "IN", postal_code: "46241" },
  { location_code: "403", location_name: "TLC 403 - Columbus", street1: "2640 Fisher Rd", city: "Columbus", state: "OH", postal_code: "43204" },
  { location_code: "404", location_name: "TLC 404 - Cleveland", street1: "4200 E 71st St", city: "Cleveland", state: "OH", postal_code: "44105" },
  { location_code: "405", location_name: "TLC 405 - Milwaukee", street1: "3900 N Port Washington Rd", city: "Milwaukee", state: "WI", postal_code: "53212" },
  { location_code: "406", location_name: "TLC 406 - Minneapolis", street1: "3033 Campus Dr", city: "Plymouth", state: "MN", postal_code: "55441" },
  { location_code: "407", location_name: "TLC 407 - St Louis", street1: "3700 Rider Trail S", city: "Earth City", state: "MO", postal_code: "63045" },
  { location_code: "408", location_name: "TLC 408 - Kansas City", street1: "1410 N Corrington Ave", city: "Kansas City", state: "MO", postal_code: "64120" },
  { location_code: "409", location_name: "TLC 409 - Cincinnati", street1: "3845 Port Union Rd", city: "Fairfield", state: "OH", postal_code: "45014" },
  { location_code: "410", location_name: "TLC 410 - Pittsburgh", street1: "125 Business Park Dr", city: "Pittsburgh", state: "PA", postal_code: "15205" },
  { location_code: "411", location_name: "TLC 411 - Grand Rapids", street1: "2963 Buchanan Ave SW", city: "Grand Rapids", state: "MI", postal_code: "49548" },
  { location_code: "412", location_name: "TLC 412 - Des Moines", street1: "1717 Keosauqua Way", city: "Des Moines", state: "IA", postal_code: "50314" },
  { location_code: "413", location_name: "TLC 413 - Omaha", street1: "3711 L St", city: "Omaha", state: "NE", postal_code: "68107" },
  { location_code: "500", location_name: "TLC 500 - New York", street1: "300 Oak Tree Rd", city: "South Plainfield", state: "NJ", postal_code: "07080" },
  { location_code: "501", location_name: "TLC 501 - Philadelphia", street1: "6150 W Passyunk Ave", city: "Philadelphia", state: "PA", postal_code: "19153" },
  { location_code: "502", location_name: "TLC 502 - Boston", street1: "151 California St", city: "Newton", state: "MA", postal_code: "02458" },
  { location_code: "503", location_name: "TLC 503 - Baltimore", street1: "6200 Holabird Ave", city: "Baltimore", state: "MD", postal_code: "21224" },
  { location_code: "504", location_name: "TLC 504 - Washington DC", street1: "8131 Stayton Dr", city: "Jessup", state: "MD", postal_code: "20794" },
  { location_code: "505", location_name: "TLC 505 - Hartford", street1: "265 Locust St", city: "Hartford", state: "CT", postal_code: "06114" },
  { location_code: "506", location_name: "TLC 506 - Albany", street1: "1440 Central Ave", city: "Albany", state: "NY", postal_code: "12205" },
  { location_code: "507", location_name: "TLC 507 - Buffalo", street1: "1770 Harlem Rd", city: "Cheektowaga", state: "NY", postal_code: "14225" },
  { location_code: "508", location_name: "TLC 508 - Syracuse", street1: "601 N Salina St", city: "Syracuse", state: "NY", postal_code: "13208" },
  { location_code: "509", location_name: "TLC 509 - Long Island", street1: "225 Wireless Blvd", city: "Hauppauge", state: "NY", postal_code: "11788" },
  { location_code: "510", location_name: "TLC 510 - Harrisburg", street1: "3555 N Progress Ave", city: "Harrisburg", state: "PA", postal_code: "17110" },
  { location_code: "511", location_name: "TLC 511 - Portland ME", street1: "222 Riverside St", city: "Portland", state: "ME", postal_code: "04103" },
  // RDC (Regional Distribution Centers)
  { location_code: "600", location_name: "RDC 600 - Atlanta", street1: "1200 Glenwood Ave SE", city: "Atlanta", state: "GA", postal_code: "30316" },
  { location_code: "601", location_name: "RDC 601 - Dallas", street1: "2501 E Grauwyler Rd", city: "Irving", state: "TX", postal_code: "75061" },
  { location_code: "602", location_name: "RDC 602 - Los Angeles", street1: "15500 S Broadway", city: "Gardena", state: "CA", postal_code: "90248" },
  { location_code: "603", location_name: "RDC 603 - Chicago", street1: "1400 E Touhy Ave", city: "Des Plaines", state: "IL", postal_code: "60018" },
  { location_code: "604", location_name: "RDC 604 - New Jersey", street1: "400 Apgar Dr", city: "Somerset", state: "NJ", postal_code: "08873" },
  { location_code: "605", location_name: "RDC 605 - Denver", street1: "2000 W Hampden Ave", city: "Englewood", state: "CO", postal_code: "80110" },
  { location_code: "606", location_name: "RDC 606 - Jacksonville", street1: "7901 Baymeadows Way", city: "Jacksonville", state: "FL", postal_code: "32256" },
];

async function main() {
  console.log(`Importing ${LOCATIONS.length} TireHub warehouse locations...`);

  let inserted = 0;
  let skipped = 0;
  let errors = 0;

  for (const loc of LOCATIONS) {
    // Check if this location_code already exists
    const { data: existing } = await supabase
      .from("warehouses")
      .select("id")
      .eq("location_code", loc.location_code)
      .eq("distributor_name", "TireHub")
      .maybeSingle();

    if (existing) {
      console.log(`  SKIP: ${loc.location_name} (already exists)`);
      skipped++;
      continue;
    }

    const { error } = await supabase.from("warehouses").insert({
      distributor_name: "TireHub",
      location_name: loc.location_name,
      location_code: loc.location_code,
      street1: loc.street1,
      city: loc.city,
      state: loc.state,
      postal_code: loc.postal_code,
      country: "US",
      is_default: false,
      active: true,
    });

    if (error) {
      console.error(`  ERROR: ${loc.location_name} — ${error.message}`);
      errors++;
    } else {
      console.log(`  OK: ${loc.location_name}`);
      inserted++;
    }
  }

  console.log(`\nDone! Inserted: ${inserted}, Skipped: ${skipped}, Errors: ${errors}`);
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});
