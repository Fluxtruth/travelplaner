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
 * Achievements / Badges Catalog (Witzige Boystrip-Erfolge)
 */
export const BADGES_CATALOG: BadgeAchievement[] = [
  {
    id: "badge-hangover-king",
    title: "Kater-König",
    description: "Morgens als Letzter aus den Federn gekrochen und Sonnenbrille zum Frühstück getragen.",
    icon: "🕶️",
    category: "social",
    points: 75,
  },
  {
    id: "badge-beer-slayer",
    title: "Zapfhahn-Vernichter",
    description: "Mindestens 10 Bier auf dem Counter verbucht. Die Leber wächst mit ihren Aufgaben.",
    icon: "🍺",
    category: "explorer",
    points: 150,
  },
  {
    id: "badge-doener-hero",
    title: "Döner um 04:30 Uhr",
    description: "Lebenserhaltende fettige Sofortmaßnahmen nach Mitternacht im Alleingang gemeistert.",
    icon: "🌯",
    category: "social",
    points: 100,
  },
  {
    id: "badge-lost-navigator",
    title: "Der navigatorische Totalausfall",
    description: "Google Maps verkehrt herum gehalten und die gesamte Gruppe zielstrebig in eine Sackgasse geführt.",
    icon: "🧭",
    category: "checkin",
    points: 50,
  },
  {
    id: "badge-snore-terrorist",
    title: "Schnarch-Terrorist",
    description: "Hat das gesamte Airbnb mit ohrenbetäubenden Sägegeräuschen wachgehalten.",
    icon: "💤",
    category: "social",
    points: 75,
  },
  {
    id: "badge-taxi-whisperer",
    title: "Taxifahrer-Flüsterer",
    description: "Hat dem Fahrer auf gebrochenem Englisch seine komplette Lebensgeschichte anvertraut.",
    icon: "🚕",
    category: "social",
    points: 80,
  },
  {
    id: "badge-bratwurst-baron",
    title: "Bratwurst-Baron (Nürnberg)",
    description: "Drei im Weggla auf dem Hauptmarkt Nürnberg in Rekordzeit inhaliert.",
    icon: "🌭",
    category: "explorer",
    points: 100,
  },
  {
    id: "badge-schnitzel-coma",
    title: "Schnitzel-Koma (Wien)",
    description: "Ein Figlmüller-Schnitzel bezwungen, das deutlich größer als der eigene Kopf war.",
    icon: "🥩",
    category: "explorer",
    points: 125,
  },
  {
    id: "badge-bistro-legend",
    title: "Bordbistro-Ehrengast",
    description: "Im EuroCity noch vor der Grenze das gesamte Dosenbier-Sortiment leergetrunken.",
    icon: "🚆",
    category: "checkin",
    points: 100,
  },
  {
    id: "badge-packing-minimalist",
    title: "Koffer-Minimalist",
    description: "10 Tage Boystrip mit nur einem Rucksack – 80% Inhalt: Ladekabel, Deospray & Badehose.",
    icon: "🧳",
    category: "explorer",
    points: 60,
  },
  {
    id: "badge-round-sponsor",
    title: "Runden-Ehrenmann",
    description: "'Die nächste Runde geht auf meinen Nacken!' – Legendäre Ansage des Abends.",
    icon: "💳",
    category: "social",
    points: 120,
  },
  {
    id: "badge-crew-paparazzo",
    title: "Der Paparazzo",
    description: "Besitzt 89 kompromittierende Fotos von den Boys, die niemals auf Social Media landen dürfen.",
    icon: "📸",
    category: "social",
    points: 90,
  },
  {
    id: "badge-sunrise-survivor",
    title: "Vollprofi im Sonnenaufgang",
    description: "Die Bar erst verlassen, als draußen die ersten Tauben gurrten und die Bäcker aufmachten.",
    icon: "🌅",
    category: "social",
    points: 150,
  },
  {
    id: "badge-sacher-gourmet",
    title: "Sachertorten-Feinschmecker",
    description: "Trotz Kater im Wiener Kaffeehaus stilvoll Melange geschlürft.",
    icon: "☕",
    category: "explorer",
    points: 75,
  },
  {
    id: "badge-castle-climber",
    title: "Burg-Bezwinger",
    description: "Die 400 Stufen hochgequält – 'Aussicht war okay, wo gibt's hier das nächste Bier?'",
    icon: "🏰",
    category: "explorer",
    points: 110,
  },
  {
    id: "badge-punctual-pioneer",
    title: "Erster am Treffpunkt",
    description: "Einmal im Leben pünktlich am Abfahrtsbahnhof aufgetaucht – das Wunder von Berlin.",
    icon: "⏱️",
    category: "checkin",
    points: 50,
  },
];

/**
 * Dynamically evaluate unlocked badges based on real stats (stamps, beer count)
 */
export function evaluateBadges(stamps: string[] = [], beerCount: number = 0): string[] {
  const earned: string[] = [];
  if (beerCount >= 1) earned.push("badge-bistro-legend");
  if (beerCount >= 5) earned.push("badge-round-sponsor");
  if (beerCount >= 10) earned.push("badge-beer-slayer");
  if (beerCount >= 15) earned.push("badge-hangover-king");
  if (stamps.includes("BER-GATE")) earned.push("badge-punctual-pioneer");
  if (stamps.includes("PRG-CASTLE") || stamps.includes("NUE-CASTLE")) earned.push("badge-castle-climber");
  if (stamps.includes("VIE-SCHNITZEL")) earned.push("badge-schnitzel-coma");
  if (stamps.includes("NUE-BRATWURST")) earned.push("badge-bratwurst-baron");
  if (stamps.includes("PRG-NIGHT")) earned.push("badge-doener-hero");
  if (stamps.includes("VIE-CAFE")) earned.push("badge-sacher-gourmet");
  if (stamps.includes("ROUTE-RAIL")) earned.push("badge-packing-minimalist");
  return earned;
}

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
