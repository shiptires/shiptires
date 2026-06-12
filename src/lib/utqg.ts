export interface ParsedUTQG {
  raw: string;
  treadwear: number | null;
  traction: string | null;
  temperature: string | null;
}

/**
 * Parses a UTQG string like "500 A A" or "500 AA B" into components.
 * Returns null if the string is empty/invalid.
 */
export function parseUTQG(str: string | undefined | null): ParsedUTQG | null {
  if (!str || !str.trim()) return null;
  const raw = str.trim();
  const match = raw.match(/^(\d+)\s+(AA|A|B|C)\s+(A|B|C)$/i);
  if (!match) return null;
  return {
    raw,
    treadwear: parseInt(match[1], 10),
    traction: match[2].toUpperCase(),
    temperature: match[3].toUpperCase(),
  };
}

/**
 * Returns a human-readable label for a treadwear number.
 */
export function treadwearLabel(num: number): string {
  if (num >= 700) return "Excellent";
  if (num >= 500) return "Very Good";
  if (num >= 300) return "Good";
  if (num >= 200) return "Moderate";
  return "Performance-Focused";
}
