import { ActivityType } from "@/types";

export interface LinkMetadata {
  domain: string;
  favIcon?: string;
  defaultPreviewImage: string;
  displayUrl: string;
  badgeLabel: string;
}

/**
 * Curated high-resolution Unsplash photos for each Baustein category
 */
const CATEGORY_DEFAULT_IMAGES: Record<ActivityType, string[]> = {
  timeslot: [
    "https://images.unsplash.com/photo-1508962914676-134849a727f0?w=600&auto=format&fit=crop&q=80", // Clock tower
    "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600&auto=format&fit=crop&q=80", // Coffee morning
  ],
  transport: [
    "https://images.unsplash.com/photo-1474487548417-781cb71495f3?w=600&auto=format&fit=crop&q=80", // Train tracks
    "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&auto=format&fit=crop&q=80", // Bus
    "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=600&auto=format&fit=crop&q=80", // Flight
  ],
  accommodation: [
    "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&auto=format&fit=crop&q=80", // Loft apartment
    "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&auto=format&fit=crop&q=80", // Hotel resort
    "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=600&auto=format&fit=crop&q=80", // Modern room
  ],
  restaurant: [
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&auto=format&fit=crop&q=80", // Restaurant ambient
    "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=80", // Dining food
    "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&auto=format&fit=crop&q=80", // Culinary feast
  ],
  bar: [
    "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=600&auto=format&fit=crop&q=80", // Pub / Bar counter
    "https://images.unsplash.com/photo-1572116469696-31de0f17cc34?w=600&auto=format&fit=crop&q=80", // Cocktails
    "https://images.unsplash.com/photo-1574096079513-d8259312b785?w=600&auto=format&fit=crop&q=80", // Nightclub lights
  ],
  culture: [
    "https://images.unsplash.com/photo-1513805959324-96eb66ca8713?w=600&auto=format&fit=crop&q=80", // Prague Charles Bridge
    "https://images.unsplash.com/photo-1565008447742-97f6f38c985c?w=600&auto=format&fit=crop&q=80", // Historic architecture
    "https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?w=600&auto=format&fit=crop&q=80", // Museum / Gallery
  ],
  activity: [
    "https://images.unsplash.com/photo-1533105079780-92b9be482077?w=600&auto=format&fit=crop&q=80", // Action / Tour
    "https://images.unsplash.com/photo-1518173946687-a4c8a383392e?w=600&auto=format&fit=crop&q=80", // Beer brewery
    "https://images.unsplash.com/photo-1527631746610-bca00a040d60?w=600&auto=format&fit=crop&q=80", // City exploration
  ],
  food: [
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&auto=format&fit=crop&q=80",
  ],
  custom: [
    "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=600&auto=format&fit=crop&q=80",
  ],
};

/**
 * Normalizes input URL so it always starts with https://
 */
export function normalizeUrl(rawUrl: string): string {
  let trimmed = rawUrl.trim();
  if (!trimmed) return "";
  if (!/^https?:\/\//i.test(trimmed)) {
    trimmed = `https://${trimmed}`;
  }
  return trimmed;
}

/**
 * Extracts domain metadata and smart thumbnail
 */
export function getLinkMetadata(url?: string, type: ActivityType = "activity"): LinkMetadata | null {
  if (!url) return null;

  try {
    const normalized = normalizeUrl(url);
    const parsed = new URL(normalized);
    const hostname = parsed.hostname.replace(/^www\./, "");

    let badgeLabel = hostname;
    if (hostname.includes("google.") && parsed.pathname.includes("maps")) {
      badgeLabel = "Google Maps";
    } else if (hostname.includes("booking.com")) {
      badgeLabel = "Booking.com";
    } else if (hostname.includes("airbnb.")) {
      badgeLabel = "Airbnb";
    } else if (hostname.includes("tripadvisor.")) {
      badgeLabel = "TripAdvisor";
    } else if (hostname.includes("instagram.com")) {
      badgeLabel = "Instagram";
    } else if (hostname.includes("bahn.de")) {
      badgeLabel = "Deutsche Bahn";
    } else if (hostname.includes("flixbus.")) {
      badgeLabel = "Flixbus";
    }

    const categoryImages = CATEGORY_DEFAULT_IMAGES[type] || CATEGORY_DEFAULT_IMAGES.activity;
    const defaultPreviewImage = categoryImages[0];

    return {
      domain: hostname,
      displayUrl: parsed.origin + (parsed.pathname.length > 25 ? parsed.pathname.slice(0, 25) + "..." : parsed.pathname),
      defaultPreviewImage,
      badgeLabel,
    };
  } catch (e) {
    return null;
  }
}

/**
 * Helper to get a representative preview image for a Baustein
 */
export function getBausteinImage(imageUrl?: string, url?: string, type: ActivityType = "activity"): string | null {
  if (imageUrl === "none" || imageUrl === "disabled" || imageUrl === "false") {
    return null;
  }
  if (imageUrl && imageUrl.trim().length > 0) {
    return imageUrl.trim();
  }
  if (url && url.trim().length > 0) {
    const meta = getLinkMetadata(url, type);
    return meta ? meta.defaultPreviewImage : null;
  }
  return null;
}
