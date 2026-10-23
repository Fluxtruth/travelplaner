import { PassportStamp, BadgeAchievement, UserGamificationProfile } from "@/types/gamification";

/**
 * Official Passport Stamps available for the Boystrip Route
 */
export const PASSPORT_STAMPS: PassportStamp[] = [
  {
    id: "stamp-ber-gate",
    code: "BER-GATE",
    city: "Berlin",
    country: "DE",
    title: "Brandenburger Tor Check-in",
    description: "Startschuss des Boystrips am historischen Wahrzeichen Berlins.",
    icon: "🏛️",
    points: 50,
    category: "culture",
  },
  {
    id: "stamp-prg-brew",
    code: "PRG-BREW",
    city: "Prag",
    country: "CZ",
    title: "Pilsner Urquell Brauereitour",
    description: "Frisch gezapftes tschechisches Bier direkt aus dem Eichenfass.",
    icon: "🍺",
    points: 100,
    category: "activity",
  },
  {
    id: "stamp-prg-castle",
    code: "PRG-CASTLE",
    city: "Prag",
    country: "CZ",
    title: "Prager Burg & Karlsbrücke",
    description: "Gotische Meisterwerke und Sonnenuntergang über der Moldau.",
    icon: "🏰",
    points: 75,
    category: "culture",
  },
  {
    id: "stamp-prg-bar",
    code: "PRG-NIGHT",
    city: "Prag",
    country: "CZ",
    title: "Prager Nightlife Crawl",
    description: "Legendäre Cocktail- und Kneipenkultur in der Altstadt.",
    icon: "🍸",
    points: 75,
    category: "bar",
  },
  {
    id: "stamp-vie-cafe",
    code: "VIE-CAFE",
    city: "Wien",
    country: "AT",
    title: "Wiener Kaffeehaus-Kultur",
    description: "Melange, Sachertorte & klassischer Wiener Schmäh.",
    icon: "☕",
    points: 50,
    category: "restaurant",
  },
  {
    id: "stamp-vie-schnitzel",
    code: "VIE-SCHNITZEL",
    city: "Wien",
    country: "AT",
    title: "Original Wiener Schnitzel",
    description: "Goldbraun paniert und tellerfüllend serviert.",
    icon: "🥩",
    points: 75,
    category: "restaurant",
  },
  {
    id: "stamp-nue-sausage",
    code: "NUE-BRATWURST",
    city: "Nürnberg",
    country: "DE",
    title: "Nürnberger Rostbratwurst",
    description: "Drei im Weggla auf dem historischen Hauptmarkt.",
    icon: "🌭",
    points: 50,
    category: "restaurant",
  },
  {
    id: "stamp-nue-castle",
    code: "NUE-CASTLE",
    city: "Nürnberg",
    country: "DE",
    title: "Kaiserburg Nürnberg",
    description: "Blick über die Dächer der mittelalterlichen Frankenmetropole.",
    icon: "🛡️",
    points: 75,
    category: "culture",
  },
  {
    id: "stamp-neustadt-dosse",
    code: "NEUSTADT-DOSSE",
    city: "Neustadt (Dosse)",
    country: "DE",
    title: "Neustadt (Dosse) Gestüt & Idylle",
    description: "Haupt- und Landgestüt Neustadt (Dosse) im Herzen Brandenburgs.",
    icon: "🐎",
    points: 75,
    category: "culture",
  },
  {
    id: "stamp-route-train",
    code: "ROUTE-RAIL",
    city: "Berlin - Prag",
    country: "EU",
    title: "EuroCity Elbtal-Express",
    description: "Entspannte Bahnfahrt mit Blick auf die Sächsische Schweiz.",
    icon: "🚆",
    points: 50,
    category: "transport",
  },
];

/**
 * Achievements / Badges Catalog
 */
export const BADGES_CATALOG: BadgeAchievement[] = [
  {
    id: "badge-first-checkin",
    title: "Reise-Pionier",
    description: "Dein allererster Check-in auf dem Boystrip.",
    icon: "🧭",
    category: "checkin",
    points: 50,
  },
  {
    id: "badge-beer-sommelier",
    title: "Bier-Sommelier",
    description: "Erfolgreicher Check-in bei einer lokalen Brauereitour.",
    icon: "🍺",
    category: "explorer",
    points: 100,
  },
  {
    id: "badge-night-owl",
    title: "Nachteule",
    description: "Check-in zu vorgerückter Stunde in einer Bar oder einem Club.",
    icon: "🌙",
    category: "social",
    points: 75,
  },
  {
    id: "badge-culture-vulture",
    title: "Kultur-Kaiser",
    description: "Mindestens zwei historische Kultur- oder Burg-Check-ins absolviert.",
    icon: "👑",
    category: "explorer",
    points: 125,
  },
  {
    id: "badge-streak-3",
    title: "On Fire (3-Tage Streak)",
    description: "3 Tage in Folge aktiv den Trip geplant und genutzt.",
    icon: "🔥",
    category: "streak",
    points: 100,
  },
  {
    id: "badge-gourmet",
    title: "Feinschmecker",
    description: "Check-in in mindestens 2 verschiedenen Restaurants der Route.",
    icon: "🍽️",
    category: "explorer",
    points: 75,
  },
  {
    id: "badge-globetrotter",
    title: "Grenzgänger",
    description: "Stempel aus mindestens 2 verschiedenen Ländern gesammelt.",
    icon: "🌍",
    category: "explorer",
    points: 150,
  },
];

/**
 * Level Calculation
 */
export function calculateLevel(points: number): { level: number; title: string; nextLevelPoints: number; progressPercent: number } {
  if (points < 100) {
    return { level: 1, title: "Reise-Rookie", nextLevelPoints: 100, progressPercent: Math.round((points / 100) * 100) };
  } else if (points < 250) {
    return { level: 2, title: "City-Scout", nextLevelPoints: 250, progressPercent: Math.round(((points - 100) / 150) * 100) };
  } else if (points < 500) {
    return { level: 3, title: "Globetrotter", nextLevelPoints: 500, progressPercent: Math.round(((points - 250) / 250) * 100) };
  } else if (points < 800) {
    return { level: 4, title: "Boystrip-Legende", nextLevelPoints: 800, progressPercent: Math.round(((points - 500) / 300) * 100) };
  } else {
    return { level: 5, title: "VIP Reisemeister", nextLevelPoints: 1200, progressPercent: 100 };
  }
}

/**
 * Helper to match item to a stamp code
 */
export function findMatchingStamp(itemTitle: string, itemType: string, city: string): PassportStamp | null {
  const lowerTitle = itemTitle.toLowerCase();
  const lowerCity = city.toLowerCase();

  if (lowerTitle.includes("brandenburg") || (lowerCity.includes("berlin") && itemType === "culture")) {
    return PASSPORT_STAMPS.find((s) => s.code === "BER-GATE") || null;
  }
  if (lowerTitle.includes("brauerei") || lowerTitle.includes("pilsner") || lowerTitle.includes("urquell")) {
    return PASSPORT_STAMPS.find((s) => s.code === "PRG-BREW") || null;
  }
  if (lowerTitle.includes("burg") || lowerTitle.includes("karlsbrücke") || lowerTitle.includes("hrad")) {
    return PASSPORT_STAMPS.find((s) => s.code === "PRG-CASTLE") || null;
  }
  if (lowerTitle.includes("bar") || lowerTitle.includes("hemingway") || itemType === "bar") {
    return PASSPORT_STAMPS.find((s) => s.code === "PRG-NIGHT") || null;
  }
  if (lowerTitle.includes("schnitzel") || lowerTitle.includes("figlmüller")) {
    return PASSPORT_STAMPS.find((s) => s.code === "VIE-SCHNITZEL") || null;
  }
  if (lowerTitle.includes("kaffee") || lowerTitle.includes("cafe") || lowerCity.includes("wien") && itemType === "restaurant") {
    return PASSPORT_STAMPS.find((s) => s.code === "VIE-CAFE") || null;
  }
  if (lowerTitle.includes("bratwurst") || lowerCity.includes("nürnberg") && itemType === "restaurant") {
    return PASSPORT_STAMPS.find((s) => s.code === "NUE-BRATWURST") || null;
  }
  if (lowerCity.includes("nürnberg") && (itemType === "culture" || lowerTitle.includes("kaiserburg"))) {
    return PASSPORT_STAMPS.find((s) => s.code === "NUE-CASTLE") || null;
  }
  if (lowerCity.includes("neustadt") || lowerTitle.includes("neustadt") || lowerTitle.includes("dosse")) {
    return PASSPORT_STAMPS.find((s) => s.code === "NEUSTADT-DOSSE") || null;
  }
  if (itemType === "transport") {
    return PASSPORT_STAMPS.find((s) => s.code === "ROUTE-RAIL") || null;
  }

  return null;
}
