import { Timestamp } from "firebase/firestore";

export type TripVisibility = "private" | "public";

export interface TripStop {
  id: string;
  city: string;
  country: string;
  order: number;
  startDate?: string; // YYYY-MM-DD
  endDate?: string;   // YYYY-MM-DD
}

export interface Trip {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  participantIds: string[];
  invitedEmails?: string[];
  visibility: TripVisibility; // "private" (default, invitation required) | "public" (open to registered users)
  inviteCode: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  stops: TripStop[] | string[];
  createdAt: Timestamp | string;
  updatedAt: Timestamp | string;
}

export interface TripParticipant {
  uid: string;
  displayName: string;
  email?: string;
  photoURL?: string | null;
  role: "owner" | "editor" | "viewer";
  isOnline?: boolean;
}
