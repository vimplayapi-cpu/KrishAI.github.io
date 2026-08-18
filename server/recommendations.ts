/**
 * Region & profile-based recommendation engine.
 *
 * Takes a user profile (farmer or student) plus current date and produces
 * personalized suggestions: crop calendar actions, region climate notes,
 * advisory pointers, and for students a learning path.
 */

export type RecommendationItem = {
  kind: "crop_action" | "weather_note" | "market_note" | "learning_path" | "onboarding_nudge";
  title: string;
  detail: string;
  priority: "high" | "medium" | "low";
};

/** Derive simple region/climate tags from state/district free-text. */
export function deriveRegionTags(profile: {
  state?: string | null;
  district?: string | null;
  rainfallType?: string | null;
  soilType?: string | null;
}): string[] {
  const tags: string[] = [];
  const loc = `${profile.state ?? ""} ${profile.district ?? ""}`.toLowerCase();
  if (/rajasthan|gujarat|maharashtra(?! coast)|karnataka(?! coast)/.test(loc) || profile.rainfallType === "rainfed") tags.push("semi_arid");
  if (/kerala|goa|assam|west bengal|odisha|coast/i.test(loc)) tags.push("humid_coastal");
  if (/punjab|haryana|uttar pradesh|bihar/i.test(loc)) tags.push("indo_gangetic");
  if (profile.rainfallType === "irrigated") tags.push("irrigated_zone");
  if (profile.soilType) tags.push(`soil_${profile.soilType.toLowerCase().replace(/\s+/g, "_")}`);
  if (tags.length === 0 && profile.state) tags.push("generic");
  return tags;
}

type ProfileLike = {
  userType?: string | null;
  age?: number | null;
  degreeLevel?: string | null;
  courseName?: string | null;
  researchArea?: string | null;
  rainfallType?: string | null;
  soilType?: string | null;
  growingSeason?: string | null;
  irrigationAccess?: string | null;
  state?: string | null;
  district?: string | null;
  onboardingComplete?: boolean;
};

/**
 * Month-indexed crop calendar: [what to do now] for Indian cropping seasons.
 * month is 0-indexed (0 = January).
 */
const MONTH_ACTIONS: Record<string, string[]> = {
  "0": ["Prepare rabi crop monitoring — wheat, mustard, gram are in vegetative/flowering stages", "Check soil moisture before scheduled irrigation"],
  "1": ["Plan rabi harvesting logistics — arrange storage and transport", "Book mandi slots for mustard and gram harvest"],
  "2": ["Rabi harvest window — harvest wheat before late-season heat stress", "Begin land preparation for early kharif nursery beds"],
  "3": ["Harvest remaining rabi crops; start summer vegetable sowing (okra, bottle gourd)", "Test borewell and pump sets before peak summer demand"],
  "4": ["Sow kharif nursery for paddy in low-lying fields", "Apply pre-monsoon soil and water conservation measures"],
  "5": ["Pre-monsoon land preparation — ploughing, bund strengthening", "Procure certified kharif seeds (paddy, maize, cotton, soybean)"],
  "6": ["Kharif sowing window — sow paddy, maize, cotton with first monsoon rains", "Monitor first-rain soil moisture before sowing"],
  "7": ["Transplant paddy seedlings; complete kharif sowing by mid-month", "Watch for early fungal pressure in humid regions"],
  "8": ["Apply top-dressing fertilizers to standing kharif crops", "Begin pest scouting — stem borer and leaf folder activity rises"],
  "9": ["Kharif crops enter flowering — protect from sudden rain and lodging", "Plan post-monsoon field drainage"],
  "10": ["Harvest kharif crops — paddy, maize, cotton picking", "Dry harvested grain to safe moisture levels before storage"],
  "11": ["Rabi sowing window — sow wheat, mustard, gram, lentil", "Post-kharif residue management — incorporate or remove straw"],
};

/** Climate notes by region tag. */
const CLIMATE_NOTES: Record<string, string> = {
  semi_arid: "Semi-arid region — prioritize drought-tolerant varieties (bajra, jowar, groundnut) and mulching to conserve soil moisture.",
  humid_coastal: "Humid coastal belt — high fungal disease pressure; favor resistant varieties and avoid excessive nitrogen before heavy rains.",
  indo_gangetic: "Indo-Gangetic plains — fertile alluvial soil; strong wheat-rice rotation, but manage stubble and groundwater carefully.",
  irrigated_zone: "Irrigated access confirmed — you can pursue water-intensive crops (paddy, sugarcane) with scheduled irrigation.",
  generic: "Local climate advice is generalized — complete your rainfall and irrigation details for precise recommendations.",
};

export function getRecommendations(profile: ProfileLike, month: number = new Date().getMonth()): RecommendationItem[] {
  const items: RecommendationItem[] = [];
  const onboardingDone = profile.onboardingComplete === true;

  if (!onboardingDone) {
    items.push({
      kind: "onboarding_nudge",
      title: "Complete your profile for personalized advice",
      detail: "Your recommendations are generic until you tell us about your location, climate, and farms (or your academic background as a student).",
      priority: "high",
    });
    return items;
  }

  // Crop calendar (farmer)
  if (profile.userType === "farmer") {
    const actions = MONTH_ACTIONS[String(month)] ?? MONTH_ACTIONS["0"];
    for (let i = 0; i < actions.length; i++) {
      items.push({ kind: "crop_action", title: actions[i]!, detail: "Auto-generated from your region and crop calendar.", priority: i === 0 ? "high" : "medium" });
    }

    // Region climate note
    const tags = deriveRegionTags(profile as any);
    let noteKey = "generic";
    for (const tag of tags) {
      if (tag in CLIMATE_NOTES) { noteKey = tag; break; }
    }
    items.push({ kind: "weather_note", title: "Your region profile", detail: CLIMATE_NOTES[noteKey]!, priority: "medium" });

    if (profile.irrigationAccess === "none" && profile.rainfallType === "rainfed") {
      items.push({
        kind: "weather_note",
        title: "Rainfed farming detected",
        detail: "Synchronize sowing with monsoon onset forecasts and keep moisture-saving practices (mulch, zero tillage) ready.",
        priority: "high",
      });
    }
  }

  // Learning path (student)
  if (profile.userType === "student") {
    const level = (profile.degreeLevel ?? "").toLowerCase();
    const area = profile.researchArea ?? profile.courseName ?? "";
    if (level.includes("phd") || level.includes("m.sc") || level.includes("msc")) {
      items.push({ kind: "learning_path", title: "Deepen research literacy", detail: `For ${area || "your field"} at ${level} level, use the Research Portal to build citations and generate literature reports.`, priority: "high" });
    } else if (level.includes("b.sc") || level.includes("bsc") || level.includes("diploma")) {
      items.push({ kind: "learning_path", title: "Foundations first", detail: `At ${level || "your"} level, explore the Product Database and Advisory feed to connect theory with practical farm inputs.`, priority: "high" });
    } else {
      items.push({ kind: "learning_path", title: "Explore the learning hub", detail: "Browse the Advisory feed, product catalog, and research portal to map agriculture domains to your studies.", priority: "medium" });
    }
    if (profile.age && profile.age < 20) {
      items.push({ kind: "learning_path", title: "Early-career path", detail: "Start with crop science basics and field observation journals — log scans and reports to build a portfolio.", priority: "medium" });
    }
  }

  return items;
}
