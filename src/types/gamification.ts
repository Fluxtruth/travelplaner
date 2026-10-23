export interface PassportStamp {
  id: string;
  code: string; // e.g. "PRG-BREW", "VIE-CAFE", "BER-GATE"
  city: string; // "Berlin", "Prag", "Wien", "Nürnberg"
  country: string; // "DE", "CZ", "AT"
  title: string; // "Pilsner Urquell Brauereitour"
  description: string;
  icon: string; // Emoji
  earnedAt?: string; // ISO date when unlocked
  points: number; // XP points granted
  category: "transport" | "accommodation" | "restaurant" | "bar" | "culture" | "activity";
}

export interface BadgeAchievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: "checkin" | "streak" | "social" | "explorer";
  points: number;
  unlockedAt?: string;
  isUnlocked?: boolean;
}

export interface UserGamificationProfile {
  userId: string;
  tripId: string;
  displayName: string;
  photoURL?: string;
  points: number;
  level: number;
  levelTitle: string;
  beerCount: number;
  currentStreak?: number;
  lastActiveDate: string; // YYYY-MM-DD
  stamps: string[]; // List of unlocked stamp codes
  badges: string[]; // List of unlocked badge IDs
  checkins: Record<string, string>; // itemId -> timestamp
}

export interface ExperienceContestItem {
  id: string;
  tripId?: string;
  title: string;
  city: string;
  category: string;
  imageUrl?: string;
  votes: string[]; // List of userIds who voted for this experience
}
