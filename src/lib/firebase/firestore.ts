import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  arrayUnion,
  increment,
  writeBatch,
} from "firebase/firestore";
import { db } from "./config";
import {
  Trip,
  TravelOption,
  UserVote,
  TimelineItem,
  TimeProposal,
  PresenceUser,
  PlanViewType,
  VoteDecision,
  UserGamificationProfile,
  ExperienceContestItem,
  PassportStamp,
} from "@/types";
import { findMatchingStamp, calculateLevel, PASSPORT_STAMPS, BADGES_CATALOG } from "@/lib/gamification/catalog";
import { generateInviteCode } from "@/lib/utils";

// ===============================================================
// Trips API
// ===============================================================

/**
 * Creates a new trip with default route (Berlin - Prag - Wien - Nürnberg - Berlin)
 */
export async function createTrip(
  ownerId: string,
  name: string,
  description?: string,
  startDate = "2026-07-10",
  endDate = "2026-07-19",
  visibility: "private" | "public" = "private",
  invitedEmails: string[] = []
): Promise<string> {
  const tripRef = doc(collection(db, "trips"));
  const inviteCode = generateInviteCode(6);

  const defaultStops = [
    { id: "stop-1", city: "Berlin", country: "Deutschland", order: 0, startDate: "2026-07-10", endDate: "2026-07-12" },
    { id: "stop-2", city: "Prag", country: "Tschechien", order: 1, startDate: "2026-07-12", endDate: "2026-07-14" },
    { id: "stop-3", city: "Wien", country: "Österreich", order: 2, startDate: "2026-07-14", endDate: "2026-07-17" },
    { id: "stop-4", city: "Neustadt (Dosse)", country: "Deutschland", order: 3, startDate: "2026-07-17", endDate: "2026-07-19" },
    { id: "stop-5", city: "Berlin", country: "Deutschland", order: 4, startDate: "2026-07-19", endDate: "2026-07-19" },
  ];

  const tripData: Omit<Trip, "id"> = {
    name,
    description: description || "Gemeinsame Reiseplanung & Abstimmung",
    ownerId,
    participantIds: [ownerId],
    invitedEmails,
    visibility, // "private" (default, invitation required) or "public"
    inviteCode,
    startDate,
    endDate,
    stops: defaultStops,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await setDoc(tripRef, { ...tripData, id: tripRef.id });

  // Seed initial sample options for voting & timeline demonstration
  await seedInitialTripData(tripRef.id, ownerId);

  return tripRef.id;
}

/**
 * Subscribe to all trips the user is part of (as owner or participant)
 */
export function subscribeToUserTrips(userId: string, onUpdate: (trips: Trip[]) => void) {
  const tripsRef = collection(db, "trips");
  const q = query(tripsRef, where("participantIds", "array-contains", userId));

  return onSnapshot(q, (snapshot) => {
    const trips: Trip[] = [];
    snapshot.forEach((docSnap) => {
      trips.push(docSnap.data() as Trip);
    });
    // Sort newest updated first
    trips.sort((a, b) => new Date(b.updatedAt as string).getTime() - new Date(a.updatedAt as string).getTime());
    onUpdate(trips);
  });
}

/**
 * Subscribe to all public trips in the cloud
 */
export function subscribeToPublicTrips(onUpdate: (trips: Trip[]) => void) {
  const tripsRef = collection(db, "trips");
  const q = query(tripsRef, where("visibility", "==", "public"));

  return onSnapshot(q, (snapshot) => {
    const trips: Trip[] = [];
    snapshot.forEach((docSnap) => {
      trips.push(docSnap.data() as Trip);
    });
    trips.sort((a, b) => new Date(b.updatedAt as string).getTime() - new Date(a.updatedAt as string).getTime());
    onUpdate(trips);
  });
}

/**
 * Update project visibility (private <-> public)
 */
export async function updateTripVisibility(tripId: string, visibility: "private" | "public"): Promise<void> {
  const tripRef = doc(db, "trips", tripId);
  await updateDoc(tripRef, {
    visibility,
    updatedAt: new Date().toISOString(),
  });
}

/**
 * Invite user to trip by email
 */
export async function inviteUserToTripByEmail(tripId: string, email: string): Promise<void> {
  const tripRef = doc(db, "trips", tripId);
  await updateDoc(tripRef, {
    invitedEmails: arrayUnion(email.toLowerCase().trim()),
    updatedAt: new Date().toISOString(),
  });
}

/**
 * Remove participant from trip (Access Management)
 */
export async function removeParticipantFromTrip(tripId: string, participantId: string): Promise<void> {
  const tripRef = doc(db, "trips", tripId);
  const snap = await getDoc(tripRef);
  if (!snap.exists()) return;

  const trip = snap.data() as Trip;
  const updatedParticipants = trip.participantIds.filter((id) => id !== participantId);

  await updateDoc(tripRef, {
    participantIds: updatedParticipants,
    updatedAt: new Date().toISOString(),
  });
}

/**
 * Listen to real-time trip updates
 */
export function subscribeToTrip(tripId: string, onUpdate: (trip: Trip | null) => void) {
  const tripRef = doc(db, "trips", tripId);
  return onSnapshot(tripRef, (snap) => {
    if (snap.exists()) {
      onUpdate(snap.data() as Trip);
    } else {
      onUpdate(null);
    }
  });
}

/**
 * Join trip by invite code
 */
export async function joinTripByInviteCode(inviteCode: string, userId: string): Promise<string | null> {
  const tripsRef = collection(db, "trips");
  const q = query(tripsRef, where("inviteCode", "==", inviteCode.toUpperCase().trim()));
  const snap = await getDocs(q);

  if (snap.empty) {
    return null;
  }

  const tripDoc = snap.docs[0];
  const trip = tripDoc.data() as Trip;

  if (!trip.participantIds.includes(userId)) {
    await updateDoc(tripDoc.ref, {
      participantIds: arrayUnion(userId),
      updatedAt: new Date().toISOString(),
    });
  }

  return tripDoc.id;
}

// ===============================================================
// Live-Presence API
// ===============================================================

/**
 * Update user heartbeat & active view in the trip view
 */
export async function updatePresence(
  tripId: string,
  user: { uid: string; displayName?: string | null; photoURL?: string | null },
  activeView: PlanViewType
): Promise<void> {
  if (!tripId || !user.uid) return;
  const presenceRef = doc(db, "trips", tripId, "presence", user.uid);

  const colors = ["#3B82F6", "#10B981", "#F59E0B", "#EC4899", "#8B5CF6", "#06B6D4"];
  const colorIndex = Math.abs(user.uid.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)) % colors.length;

  await setDoc(
    presenceRef,
    {
      userId: user.uid,
      displayName: user.displayName || "Traveler",
      photoURL: user.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.uid}`,
      activeView,
      lastSeen: Date.now(),
      color: colors[colorIndex],
    },
    { merge: true }
  );
}

/**
 * Subscribe to online users within the trip
 */
export function subscribeToPresence(tripId: string, onUpdate: (users: PresenceUser[]) => void) {
  const presenceRef = collection(db, "trips", tripId, "presence");
  return onSnapshot(presenceRef, (snapshot) => {
    const now = Date.now();
    const activeThreshold = 45 * 1000; // active within last 45 seconds
    const users: PresenceUser[] = [];

    snapshot.forEach((docSnap) => {
      const data = docSnap.data() as PresenceUser;
      const lastSeenNum = typeof data.lastSeen === "number" ? data.lastSeen : now;
      if (now - lastSeenNum < activeThreshold) {
        users.push(data);
      }
    });

    onUpdate(users);
  });
}

// ===============================================================
// Voting Engine & Swiping API
// ===============================================================

/**
 * Subscribe to all travel options for a trip
 */
export function subscribeToOptions(tripId: string, onUpdate: (options: TravelOption[]) => void) {
  const optionsRef = collection(db, "trips", tripId, "options");
  return onSnapshot(optionsRef, (snapshot) => {
    const options: TravelOption[] = [];
    snapshot.forEach((docSnap) => {
      options.push(docSnap.data() as TravelOption);
    });
    onUpdate(options);
  });
}

/**
 * Subscribe to user's swipe votes
 */
export function subscribeToUserVotes(tripId: string, userId: string, onUpdate: (votes: Record<string, UserVote>) => void) {
  const votesRef = collection(db, "trips", tripId, "votes");
  const q = query(votesRef, where("userId", "==", userId));

  return onSnapshot(q, (snapshot) => {
    const votesMap: Record<string, UserVote> = {};
    snapshot.forEach((docSnap) => {
      const vote = docSnap.data() as UserVote;
      votesMap[vote.optionId] = vote;
    });
    onUpdate(votesMap);
  });
}

/**
 * Cast a swipe vote (yes / no)
 */
export async function castVote(
  tripId: string,
  optionId: string,
  userId: string,
  decision: VoteDecision
): Promise<void> {
  const voteDocId = `${userId}_${optionId}`;
  const voteRef = doc(db, "trips", tripId, "votes", voteDocId);
  const optionRef = doc(db, "trips", tripId, "options", optionId);

  const existingVoteSnap = await getDoc(voteRef);

  const batch = writeBatch(db);

  if (existingVoteSnap.exists()) {
    const existing = existingVoteSnap.data() as UserVote;
    if (existing.decision === decision) {
      if (decision === "yes") {
        batch.update(optionRef, { yesVotes: increment(-1) });
      } else {
        batch.update(optionRef, { noVotes: increment(-1) });
      }
      batch.delete(voteRef);
      await batch.commit();
      return;
    }

    // Adjust counts
    if (decision === "yes") {
      batch.update(optionRef, { yesVotes: increment(1), noVotes: increment(-1) });
    } else {
      batch.update(optionRef, { yesVotes: increment(-1), noVotes: increment(1) });
    }
  } else {
    // New vote
    if (decision === "yes") {
      batch.update(optionRef, { yesVotes: increment(1) });
    } else {
      batch.update(optionRef, { noVotes: increment(1) });
    }
  }

  batch.set(voteRef, {
    id: voteDocId,
    tripId,
    optionId,
    userId,
    decision,
    createdAt: new Date().toISOString(),
  });

  await batch.commit();
}

/**
 * Add a new travel option (e.g. custom or from booking/airbnb)
 */
export async function addTravelOption(tripId: string, option: Omit<TravelOption, "id" | "tripId" | "createdAt" | "yesVotes" | "noVotes">): Promise<string> {
  const optionRef = doc(collection(db, "trips", tripId, "options"));
  const newOption: TravelOption = {
    ...option,
    id: optionRef.id,
    tripId,
    yesVotes: 0,
    noVotes: 0,
    createdAt: new Date().toISOString(),
  };

  await setDoc(optionRef, newOption);
  return optionRef.id;
}

// ===============================================================
// Interactive Timeline API (dnd-kit)
// ===============================================================

/**
 * Subscribe to timeline activities
 */
export function subscribeToTimelineItems(tripId: string, onUpdate: (items: TimelineItem[]) => void) {
  const itemsRef = collection(db, "trips", tripId, "timeline_items");
  return onSnapshot(itemsRef, (snapshot) => {
    const items: TimelineItem[] = [];
    snapshot.forEach((docSnap) => {
      items.push(docSnap.data() as TimelineItem);
    });
    // Sort in memory by order
    items.sort((a, b) => a.order - b.order);
    onUpdate(items);
  });
}

/**
 * Add an item to the timeline
 */
export async function addTimelineItem(
  tripId: string,
  item: Omit<TimelineItem, "id" | "tripId" | "createdAt" | "updatedAt">
): Promise<string> {
  const itemRef = doc(collection(db, "trips", tripId, "timeline_items"));
  const newItem: TimelineItem = {
    ...item,
    id: itemRef.id,
    tripId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await setDoc(itemRef, newItem);
  return itemRef.id;
}

/**
 * Reorder/move timeline item across days or order slots (Drag and Drop)
 */
export async function updateTimelineItemPosition(
  tripId: string,
  itemId: string,
  newDayId: string,
  newOrder: number,
  newStopCity?: string
): Promise<void> {
  const itemRef = doc(db, "trips", tripId, "timeline_items", itemId);
  const updatePayload: Record<string, unknown> = {
    dayId: newDayId,
    order: newOrder,
    updatedAt: new Date().toISOString(),
  };
  if (newStopCity) {
    updatePayload.stopCity = newStopCity;
  }
  await updateDoc(itemRef, updatePayload);
}

/**
 * Delete a timeline item
 */
export async function deleteTimelineItem(tripId: string, itemId: string): Promise<void> {
  const itemRef = doc(db, "trips", tripId, "timeline_items", itemId);
  await deleteDoc(itemRef);
}

/**
 * Update timeline item content / fields (Edit Baustein)
 */
export async function updateTimelineItem(
  tripId: string,
  itemId: string,
  updates: Partial<Omit<TimelineItem, "id" | "tripId" | "createdAt">>
): Promise<void> {
  const itemRef = doc(db, "trips", tripId, "timeline_items", itemId);
  await updateDoc(itemRef, {
    ...updates,
    updatedAt: new Date().toISOString(),
  });
}


/**
 * Upvote or downvote a timeline building block (Baustein-Voting)
 */
export async function voteTimelineItem(
  tripId: string,
  itemId: string,
  userId: string,
  voteType: "up" | "down" | "clear"
): Promise<void> {
  const itemRef = doc(db, "trips", tripId, "timeline_items", itemId);
  const snap = await getDoc(itemRef);
  if (!snap.exists()) return;

  const currentVotes = (snap.data().votes as Record<string, "up" | "down">) || {};
  const updatedVotes = { ...currentVotes };

  if (voteType === "clear" || updatedVotes[userId] === voteType) {
    delete updatedVotes[userId];
  } else {
    updatedVotes[userId] = voteType;
  }

  await updateDoc(itemRef, {
    votes: updatedVotes,
    updatedAt: new Date().toISOString(),
  });
}

/**
 * Propose an alternative time for a building block
 */
export async function proposeTimelineItemTime(
  tripId: string,
  itemId: string,
  userId: string,
  proposerName: string,
  proposedTime: string
): Promise<void> {
  const itemRef = doc(db, "trips", tripId, "timeline_items", itemId);
  const snap = await getDoc(itemRef);
  if (!snap.exists()) return;

  const currentProposals = (snap.data().timeProposals as TimeProposal[]) || [];
  const newProposal: TimeProposal = {
    id: "prop-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
    time: proposedTime.trim(),
    proposedBy: userId,
    proposerName: proposerName || "Freund",
    votes: [userId], // Proposer automatically votes for their time
    createdAt: new Date().toISOString(),
  };

  await updateDoc(itemRef, {
    timeProposals: [...currentProposals, newProposal],
    updatedAt: new Date().toISOString(),
  });
}

/**
 * Vote for an existing time proposal on a building block
 */
export async function voteTimelineItemTime(
  tripId: string,
  itemId: string,
  proposalId: string,
  userId: string
): Promise<void> {
  const itemRef = doc(db, "trips", tripId, "timeline_items", itemId);
  const snap = await getDoc(itemRef);
  if (!snap.exists()) return;

  const currentProposals = (snap.data().timeProposals as TimeProposal[]) || [];
  const updatedProposals = currentProposals.map((prop) => {
    if (prop.id === proposalId) {
      const hasVoted = prop.votes.includes(userId);
      const newVotes = hasVoted
        ? prop.votes.filter((id) => id !== userId)
        : [...prop.votes, userId];
      return { ...prop, votes: newVotes };
    }
    return prop;
  });

  await updateDoc(itemRef, {
    timeProposals: updatedProposals,
    updatedAt: new Date().toISOString(),
  });
}

/**
 * Apply a proposed time as the official block time
 */
export async function applyProposedTime(
  tripId: string,
  itemId: string,
  newTime: string
): Promise<void> {
  const itemRef = doc(db, "trips", tripId, "timeline_items", itemId);
  await updateDoc(itemRef, {
    time: newTime,
    updatedAt: new Date().toISOString(),
  });
}

// ===============================================================
// Seed Initial Demo Route & Options (Berlin - Prag - Wien - Nürnberg)
// ===============================================================

async function seedInitialTripData(tripId: string, userId: string) {
  const batch = writeBatch(db);

  // 1. Initial Travel Options for Swiping
  const sampleOptions: Array<Omit<TravelOption, "id" | "tripId" | "createdAt" | "yesVotes" | "noVotes">> = [
    {
      category: "transport",
      provider: "flixbus",
      title: "Flixbus: Berlin ZOB -> Prag ÚAN Florenc",
      description: "Direktverbindung ohne Umstieg, WLAN & Strom an Bord. Spart Reisebudget für coole Aktivitäten in Prag!",
      priceEstimate: 19.99,
      currency: "EUR",
      fromLocation: "Berlin ZOB",
      toLocation: "Prag Florenc",
      dates: "12. Juli 2026, 08:30 - 13:15",
      imageUrl: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&auto=format&fit=crop&q=80",
      createdBy: userId,
      tags: ["Günstig", "Direkt", "Flixbus"],
    },
    {
      category: "transport",
      provider: "bahn",
      title: "Deutsche Bahn EC: Berlin Hbf -> Prag hl.n.",
      description: "Malerische Fahrt durch die Sächsische Schweiz entlang der Elbe mit Bordbistro und Panoramablick.",
      priceEstimate: 34.90,
      currency: "EUR",
      fromLocation: "Berlin Hbf",
      toLocation: "Prag hl.n.",
      dates: "12. Juli 2026, 09:16 - 13:35",
      imageUrl: "https://images.unsplash.com/photo-1474487548417-781cb71495f3?w=800&auto=format&fit=crop&q=80",
      createdBy: userId,
      tags: ["Komfortabel", "Bordbistro", "Aussicht"],
    },
    {
      category: "accommodation",
      provider: "airbnb",
      title: "Design Loft Prag Altstadt (Platz für 6)",
      description: "Riesiges Dachgeschoss-Apartment nur 300m von der Karlsbrücke entfernt. Große Terrasse für gemütliche Abende.",
      priceEstimate: 65.0,
      currency: "EUR",
      fromLocation: "Prag 1, Altstadt",
      dates: "12. - 14. Juli 2026 (2 Nächte)",
      imageUrl: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&auto=format&fit=crop&q=80",
      createdBy: userId,
      tags: ["Terrasse", "Top Lage", "Airbnb"],
    },
    {
      category: "accommodation",
      provider: "booking",
      title: "Boutique Hotel Wien Neubau",
      description: "Stylisches Hotel im Szeneviertel mit Dachterrassen-Bar und hervorragendem Frühstücksbuffet.",
      priceEstimate: 85.0,
      currency: "EUR",
      fromLocation: "Wien, 7. Bezirk",
      dates: "14. - 17. Juli 2026 (3 Nächte)",
      imageUrl: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&auto=format&fit=crop&q=80",
      createdBy: userId,
      tags: ["Rooftop Bar", "Zentral", "Booking.com"],
    },
    {
      category: "transport",
      provider: "bahn",
      title: "ÖBB Railjet: Prag -> Wien Hbf",
      description: "High-Speed Railjet der ÖBB in unter 4 Stunden von Zentrum zu Zentrum.",
      priceEstimate: 29.90,
      currency: "EUR",
      fromLocation: "Prag hl.n.",
      toLocation: "Wien Hbf",
      dates: "14. Juli 2026, 10:44 - 14:49",
      imageUrl: "https://images.unsplash.com/photo-1515165562839-978bbcf18277?w=800&auto=format&fit=crop&q=80",
      createdBy: userId,
      tags: ["Highspeed", "ÖBB", "Entspannt"],
    },
  ];

  sampleOptions.forEach((opt) => {
    const optRef = doc(collection(db, "trips", tripId, "options"));
    batch.set(optRef, {
      ...opt,
      id: optRef.id,
      tripId,
      yesVotes: 1, // seeded initial match preview
      noVotes: 0,
      createdAt: new Date().toISOString(),
    });
  });

  // 2. Initial Timeline Items for Drag and Drop Zeitstrahl
  const sampleItems: Array<Omit<TimelineItem, "id" | "tripId" | "createdAt" | "updatedAt">> = [
    {
      dayId: "day-1",
      stopCity: "Berlin",
      title: "Treffpunkt am Brandenburger Tor & Pre-Drinks",
      type: "activity",
      time: "18:00 - 21:00",
      location: "Pariser Platz, Berlin",
      order: 0,
      notes: "Alle Koffer vorher bei Alex deponieren",
      createdBy: userId,
    },
    {
      dayId: "day-1",
      stopCity: "Berlin",
      title: "Abendessen im Kreuzberger Burger Joint",
      type: "food",
      time: "21:30 - 23:30",
      location: "Kreuzberg, Berlin",
      order: 1,
      createdBy: userId,
    },
    {
      dayId: "day-2",
      stopCity: "Berlin -> Prag",
      title: "Fahrt nach Prag (DB EC 173)",
      type: "transport",
      time: "09:16 - 13:35",
      location: "Berlin Hbf -> Prag hl.n.",
      order: 0,
      notes: "Plätze in Wagen 25 reserviert",
      createdBy: userId,
    },
    {
      dayId: "day-2",
      stopCity: "Prag",
      title: "Check-in Airbnb Altstadt",
      type: "accommodation",
      time: "14:30 - 15:30",
      location: "Staré Město, Prag",
      order: 1,
      createdBy: userId,
    },
    {
      dayId: "day-2",
      stopCity: "Prag",
      title: "Karlsbrücke Spaziergang & Sunset Bier",
      type: "activity",
      time: "17:00 - 20:00",
      location: "Karlsbrücke",
      order: 2,
      createdBy: userId,
    },
    {
      dayId: "day-3",
      stopCity: "Prag -> Wien",
      title: "Railjet nach Wien Hbf",
      type: "transport",
      time: "10:44 - 14:49",
      location: "Prag hl.n. -> Wien Hbf",
      order: 0,
      createdBy: userId,
    },
    {
      dayId: "day-3",
      stopCity: "Wien",
      title: "Original Wiener Schnitzel bei Figlmüller",
      type: "food",
      time: "19:00 - 21:30",
      location: "Wollzeile 5, 1010 Wien",
      order: 1,
      notes: "Tisch für 6 Personen vorbestellt",
      createdBy: userId,
    },
  ];

  sampleItems.forEach((item) => {
    const itemRef = doc(collection(db, "trips", tripId, "timeline_items"));
    batch.set(itemRef, {
      ...item,
      id: itemRef.id,
      tripId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  });

  try {
    await batch.commit();
  } catch (e) {
    console.warn("Seeding initial data error:", e);
  }
}

// ===============================================================
// Gamification, Digital Passport & Streak API
// ===============================================================

/**
 * Subscribe to gamification leaderboards and profiles for a trip
 */
export function subscribeToGamification(
  tripId: string,
  onUpdate: (profiles: UserGamificationProfile[]) => void
) {
  const gamificationRef = collection(db, "trips", tripId, "gamification");
  return onSnapshot(gamificationRef, (snapshot) => {
    const profiles: UserGamificationProfile[] = [];
    snapshot.forEach((docSnap) => {
      // Exclude contest items
      if (docSnap.id !== "experience_contest") {
        profiles.push(docSnap.data() as UserGamificationProfile);
      }
    });
    // Sort primarily by beerCount descending, then by points descending
    profiles.sort((a, b) => ((b.beerCount ?? 0) - (a.beerCount ?? 0)) || (b.points - a.points));
    onUpdate(profiles);
  });
}

/**
 * Record a location checkin on a timeline item or location
 */
export async function recordLocationCheckin(
  tripId: string,
  userId: string,
  userName: string,
  photoURL: string | undefined,
  itemId: string,
  itemTitle: string,
  itemType: string,
  city: string
): Promise<{
  newStamp: PassportStamp | null;
  newBadges: string[];
  earnedPoints: number;
}> {
  const userRef = doc(db, "trips", tripId, "gamification", userId);
  const snap = await getDoc(userRef);

  const todayStr = new Date().toISOString().split("T")[0];
  const currentData: UserGamificationProfile = snap.exists()
    ? (snap.data() as UserGamificationProfile)
    : {
        userId,
        tripId,
        displayName: userName || "Traveler",
        photoURL,
        points: 0,
        level: 1,
        levelTitle: "Reise-Rookie",
        beerCount: 0,
        currentStreak: 1,
        lastActiveDate: todayStr,
        stamps: [],
        badges: [],
        checkins: {},
      };

  // Check if already checked in to this item
  if (currentData.checkins && currentData.checkins[itemId]) {
    return { newStamp: null, newBadges: [], earnedPoints: 0 };
  }

  let earnedPoints = 50; // Base checkin points
  const matchedStamp = findMatchingStamp(itemTitle, itemType, city);
  let newStamp: PassportStamp | null = null;
  const currentStamps = [...(currentData.stamps || [])];

  if (matchedStamp && !currentStamps.includes(matchedStamp.code)) {
    currentStamps.push(matchedStamp.code);
    earnedPoints += matchedStamp.points;
    newStamp = { ...matchedStamp, earnedAt: new Date().toISOString() };
  }

  // Calculate Streak
  let streak = currentData.currentStreak || 1;
  const lastActive = currentData.lastActiveDate;
  if (lastActive && lastActive !== todayStr) {
    const lastDate = new Date(lastActive);
    const todayDate = new Date(todayStr);
    const diffDays = Math.round((todayDate.getTime() - lastDate.getTime()) / (1000 * 3600 * 24));
    if (diffDays === 1) {
      streak += 1;
      earnedPoints += 25 * streak; // Bonus for maintaining streak!
    } else if (diffDays > 1) {
      streak = 1;
    }
  }

  // Evaluate Badges
  const currentBadges = [...(currentData.badges || [])];
  const newBadges: string[] = [];

  // First checkin badge
  if (!currentBadges.includes("badge-first-checkin")) {
    currentBadges.push("badge-first-checkin");
    newBadges.push("badge-first-checkin");
    earnedPoints += 50;
  }

  // Beer sommelier
  if (matchedStamp?.code === "PRG-BREW" && !currentBadges.includes("badge-beer-sommelier")) {
    currentBadges.push("badge-beer-sommelier");
    newBadges.push("badge-beer-sommelier");
    earnedPoints += 100;
  }

  // Night owl (Bar or Checkin after 22:00)
  const hour = new Date().getHours();
  if ((itemType === "bar" || hour >= 22) && !currentBadges.includes("badge-night-owl")) {
    currentBadges.push("badge-night-owl");
    newBadges.push("badge-night-owl");
    earnedPoints += 75;
  }

  // Culture vulture
  const cultureStampsCount = currentStamps.filter((s) => s.includes("GATE") || s.includes("CASTLE")).length;
  if (cultureStampsCount >= 2 && !currentBadges.includes("badge-culture-vulture")) {
    currentBadges.push("badge-culture-vulture");
    newBadges.push("badge-culture-vulture");
    earnedPoints += 125;
  }

  // Streak 3 badge
  if (streak >= 3 && !currentBadges.includes("badge-streak-3")) {
    currentBadges.push("badge-streak-3");
    newBadges.push("badge-streak-3");
    earnedPoints += 100;
  }

  // Total points & Level
  const newTotalPoints = (currentData.points || 0) + earnedPoints;
  const levelInfo = calculateLevel(newTotalPoints);

  const updatedCheckins = {
    ...(currentData.checkins || {}),
    [itemId]: new Date().toISOString(),
  };

  const updatedProfile: UserGamificationProfile = {
    ...currentData,
    displayName: userName || currentData.displayName || "Traveler",
    photoURL: photoURL || currentData.photoURL,
    points: newTotalPoints,
    level: levelInfo.level,
    levelTitle: levelInfo.title,
    beerCount: currentData.beerCount || 0,
    currentStreak: streak,
    lastActiveDate: todayStr,
    stamps: currentStamps,
    badges: currentBadges,
    checkins: updatedCheckins,
  };

  await setDoc(userRef, updatedProfile, { merge: true });

  return {
    newStamp,
    newBadges,
    earnedPoints,
  };
}

/**
 * Update a traveler's beer counter in Firestore
 */
export async function updateUserBeerCount(
  tripId: string,
  userId: string,
  newCount: number,
  earnedXpDelta = 0
): Promise<void> {
  if (!tripId || !userId) return;
  const userRef = doc(db, "trips", tripId, "gamification", userId);
  const snap = await getDoc(userRef);

  if (snap.exists()) {
    const data = snap.data() as UserGamificationProfile;
    const newPoints = Math.max(0, (data.points || 0) + earnedXpDelta);
    const lvl = calculateLevel(newPoints);
    await updateDoc(userRef, {
      beerCount: Math.max(0, newCount),
      points: newPoints,
      level: lvl.level,
      levelTitle: lvl.title,
      lastActiveDate: new Date().toISOString().split("T")[0],
    });
  } else {
    const lvl = calculateLevel(earnedXpDelta);
    await setDoc(
      userRef,
      {
        userId,
        tripId,
        displayName: "Traveler",
        points: earnedXpDelta,
        level: lvl.level,
        levelTitle: lvl.title,
        beerCount: Math.max(0, newCount),
        lastActiveDate: new Date().toISOString().split("T")[0],
        stamps: [],
        badges: [],
        checkins: {},
      },
      { merge: true }
    );
  }
}

/**
 * Subscribe to the Best Local Experience Contest for the group
 */
export function subscribeToExperienceContest(
  tripId: string,
  onUpdate: (candidates: ExperienceContestItem[]) => void
) {
  const contestDocRef = doc(db, "trips", tripId, "gamification", "experience_contest");
  return onSnapshot(contestDocRef, (snap) => {
    if (snap.exists()) {
      const data = snap.data();
      onUpdate(data.candidates || []);
    } else {
      // Default initial candidates from the Boystrip route
      const initialCandidates: ExperienceContestItem[] = [
        {
          id: "exp-1",
          title: "Pilsner Urquell Brauereitour & Bierkeller",
          city: "Prag",
          category: "Aktivität",
          imageUrl: "https://images.unsplash.com/photo-1518173946687-a4c8a383392e?w=600&auto=format&fit=crop&q=80",
          votes: ["sample-user-1"],
        },
        {
          id: "exp-2",
          title: "Karlsbrücke Sunset Walk mit Live-Musik",
          city: "Prag",
          category: "Kultur",
          imageUrl: "https://images.unsplash.com/photo-1513805959324-96eb66ca8713?w=600&auto=format&fit=crop&q=80",
          votes: ["sample-user-2"],
        },
        {
          id: "exp-3",
          title: "Rooftop Cocktails im Hemingway Bar Prag",
          city: "Prag",
          category: "Bar & Nachtleben",
          imageUrl: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=600&auto=format&fit=crop&q=80",
          votes: [],
        },
        {
          id: "exp-4",
          title: "Kaiserburg Panorama & Nürnberger Bratwurst",
          city: "Nürnberg",
          category: "Kultur & Food",
          imageUrl: "https://images.unsplash.com/photo-1565008447742-97f6f38c985c?w=600&auto=format&fit=crop&q=80",
          votes: [],
        },
      ];
      setDoc(contestDocRef, { candidates: initialCandidates }).catch(() => {});
      onUpdate(initialCandidates);
    }
  });
}

/**
 * Vote for an experience in the Best Local Experience Contest
 */
export async function voteForBestExperience(
  tripId: string,
  candidateId: string,
  userId: string
): Promise<void> {
  const contestDocRef = doc(db, "trips", tripId, "gamification", "experience_contest");
  const snap = await getDoc(contestDocRef);
  if (!snap.exists()) return;

  const candidates = (snap.data().candidates as ExperienceContestItem[]) || [];
  const updatedCandidates = candidates.map((cand) => {
    if (cand.id === candidateId) {
      const hasVoted = cand.votes?.includes(userId);
      const newVotes = hasVoted
        ? cand.votes.filter((id) => id !== userId)
        : [...(cand.votes || []), userId];
      return { ...cand, votes: newVotes };
    }
    return cand;
  });

  await updateDoc(contestDocRef, { candidates: updatedCandidates });
}
