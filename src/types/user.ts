import { Timestamp } from "firebase/firestore";

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string | null;
  createdAt: Timestamp | string;
  lastActiveAt?: Timestamp | string;
}

export interface PublicUserProfile {
  uid: string;
  displayName: string;
  photoURL?: string | null;
}
