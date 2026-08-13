// Rule-based location parsing — comma-split heuristics, not AI. Feed location
// strings are inconsistent across ATSs, so this is intentionally conservative:
// it's fine to leave region/country null rather than guess wrong.

const US_STATE_ABBR = new Set([
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY","DC",
]);

const COUNTRY_ALIASES: Record<string, string> = {
  us: "United States",
  usa: "United States",
  "united states": "United States",
  "united states of america": "United States",
  uk: "United Kingdom",
  "united kingdom": "United Kingdom",
  canada: "Canada",
  germany: "Germany",
  france: "France",
  india: "India",
  "remote": "", // "Remote" alone isn't a country, it's remote_type
};

export interface ParsedLocation {
  city: string | null;
  region: string | null;
  country: string | null;
}

export function parseLocation(raw: string | null | undefined): ParsedLocation {
  if (!raw || !raw.trim()) return { city: null, region: null, country: null };

  const cleaned = raw
    .replace(/^remote\s*[-–—]\s*/i, "")
    .replace(/\(remote\)/i, "")
    .trim();

  if (!cleaned || /^remote$/i.test(cleaned)) {
    return { city: null, region: null, country: null };
  }

  const parts = cleaned.split(",").map((p) => p.trim()).filter(Boolean);

  if (parts.length === 0) return { city: null, region: null, country: null };

  if (parts.length === 1) {
    // Could be just a city, or just a country.
    const alias = COUNTRY_ALIASES[parts[0].toLowerCase()];
    if (alias !== undefined) return { city: null, region: null, country: alias || null };
    return { city: parts[0], region: null, country: null };
  }

  const [city, second, third] = parts;
  const region = US_STATE_ABBR.has(second.toUpperCase()) ? second.toUpperCase() : second;
  const country =
    third ??
    (US_STATE_ABBR.has(second.toUpperCase()) ? "United States" : null);

  return {
    city: city || null,
    region: region || null,
    country:
      (country && (COUNTRY_ALIASES[country.toLowerCase()] ?? country)) || null,
  };
}
