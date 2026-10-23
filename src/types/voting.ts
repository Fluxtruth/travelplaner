import { Timestamp } from "firebase/firestore";

export type OptionCategory =
  | "transport"
  | "accommodation"
  | "activity"
  | "food"
  | "nightlife"
  | "culture"
  | "custom";
export type OptionProvider =
  | "flixbus"
  | "bahn"
  | "booking"
  | "airbnb"
  | "google_maps"
  | "tripadvisor"
  | "custom";
export type VoteDecision = "yes" | "no";

export interface TravelOption {
  id: string;
  tripId: string;
  category: OptionCategory;
  provider: OptionProvider;
  title: string;
  description: string;
  priceEstimate: number; // in EUR
  currency: string;      // default "EUR"
  fromLocation?: string;
  toLocation?: string;
  dates?: string;
  imageUrl?: string;
  externalUrl?: string;
  createdBy: string;
  yesVotes: number;
  noVotes: number;
  tags?: string[];
  createdAt: Timestamp | string;
}

export interface UserVote {
  id: string;
  tripId: string;
  optionId: string;
  userId: string;
  decision: VoteDecision;
  createdAt: Timestamp | string;
}

export interface OptionMatch {
  option: TravelOption;
  unanimous: boolean;
  yesCount: number;
  totalVotes: number;
  voterNames: string[];
}
