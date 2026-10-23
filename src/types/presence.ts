import { Timestamp } from "firebase/firestore";

export type PlanViewType = "overview" | "timeline" | "voting" | "matches" | "passport";

export interface PresenceUser {
  userId: string;
  displayName: string;
  photoURL?: string | null;
  activeView: PlanViewType;
  lastSeen: Timestamp | string | number;
  color?: string; // Presence cursor/avatar border color
}
