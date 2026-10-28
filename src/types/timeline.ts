import { Timestamp } from "firebase/firestore";

export type ActivityType =
  | "timeslot"       // Uhrzeit / Fester Zeitslot / Treffpunkt
  | "transport"      // Transport (Flixbus, Deutsche Bahn, Flug, Auto)
  | "accommodation"  // Unterkunft (Hotel, Airbnb, Hostel)
  | "restaurant"     // Restaurant / Essen & Brunch
  | "bar"            // Bar / Kneipe / Nachtleben / Club
  | "culture"        // Kultur / Museum / Sightseeing / Tour
  | "activity"       // Aktivität / Action / Sport
  | "food"           // Backward compatibility alias for restaurant
  | "custom";

export interface TimeProposal {
  id: string;
  time: string;           // z.B. "15:30" oder "18:00 - 20:30"
  proposedBy: string;     // UID des Vorschlagenden
  proposerName?: string;  // Name des Vorschlagenden
  votes: string[];        // UIDs der Nutzer, die für diese Zeit gestimmt haben
  createdAt: string;
}

export interface TimelineCommentReplyTo {
  id: string;
  userName: string;
  text: string;
}

export interface TimelineComment {
  id: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  text: string;
  createdAt: string; // ISO date string
  mentions?: string[]; // e.g. ["Max", "Felix"]
  replyTo?: TimelineCommentReplyTo;
}

export interface TimelineItem {
  id: string;
  tripId: string;
  dayId: string; // "pool" für Bausteine-Backlog oder "day-1", "day-2", etc.
  stopCity?: string; // z.B. "Berlin", "Prag", "Wien", "Nürnberg"
  title: string;
  type: ActivityType;
  time?: string; // Offizielle/aktuelle Uhrzeit, z.B. "14:00 - 16:30"
  location?: string;
  url?: string; // Externer Link (Website, Maps, Booking, Instagram, etc.)
  imageUrl?: string; // Vorschaubild / Thumbnail
  order: number; // Sortier-Index innerhalb der Spalte
  notes?: string;
  cost?: number;
  optionId?: string; // verknüpft mit Voting-Match
  provider?: string; // "flixbus" | "bahn" | "airbnb" | "booking" | custom
  createdBy: string;
  createdByName?: string;
  votes?: Record<string, "up" | "down">; // Map: userId -> "up" | "down"
  timeProposals?: TimeProposal[];        // Zeit-Vorschläge der Gruppe mit Abstimmung
  comments?: TimelineComment[];          // Kommentare & Chatverlauf an diesem Baustein
  createdAt: Timestamp | string;
  updatedAt: Timestamp | string;
}

export interface DayColumnData {
  id: string; // matches dayId ("pool" oder "day-1", etc.)
  dayNumber: number;
  dateStr: string; // z.B. "Fr., 10. Juli" oder "Ideen & Backlog"
  city: string; // z.B. "Prag" oder "Bausteine-Pool"
  formattedDate?: string; // z.B. "20.10.26"
  isPool?: boolean; // Kennzeichnet den Bausteine-Pool
  items: TimelineItem[];
}
