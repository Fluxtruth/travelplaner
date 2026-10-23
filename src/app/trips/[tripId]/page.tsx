"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  Trip,
  TravelOption,
  TimelineItem,
  UserVote,
  PlanViewType,
  UserGamificationProfile,
  ExperienceContestItem,
} from "@/types";
import {
  subscribeToTrip,
  subscribeToOptions,
  subscribeToUserVotes,
  subscribeToTimelineItems,
  joinTripByInviteCode,
  subscribeToGamification,
  subscribeToExperienceContest,
  recordLocationCheckin,
} from "@/lib/firebase/firestore";
import { ActiveUsersPresence } from "@/components/presence/ActiveUsersPresence";
import { TimelineContainer } from "@/components/timeline/TimelineContainer";
import { FinalDashboard } from "@/components/voting/FinalDashboard";
import { DigitalPassportView } from "@/components/gamification/DigitalPassportView";
import { findMatchingStamp, calculateLevel } from "@/lib/gamification/catalog";
import { ShareTripModal } from "@/components/common/ShareTripModal";
import { ProjectAccessModal } from "@/components/common/ProjectAccessModal";
import { AuthModal } from "@/components/auth/AuthModal";
import { useGamification } from "@/context/GamificationContext";
import confetti from "canvas-confetti";
import {
  Calendar,
  Flame,
  Trophy,
  Share2,
  Users,
  Compass,
  ArrowLeft,
  Sparkles,
  Lock,
  Globe,
  Shield,
  UserPlus,
  LogIn,
  Award,
} from "lucide-react";

function TripPlanningContent() {
  const params = useParams();
  const tripId = (params?.tripId as string) || "demo";
  const router = useRouter();
  const { user, signInWithGoogle } = useAuth();
  const { syncFromProfiles, addXp, profile: contextProfile } = useGamification();

  const [trip, setTrip] = useState<Trip | null>(null);
  const [options, setOptions] = useState<TravelOption[]>([]);
  const [userVotes, setUserVotes] = useState<Record<string, UserVote>>({});
  const [timelineItems, setTimelineItems] = useState<TimelineItem[]>([]);
  const [activeTab, setActiveTab] = useState<PlanViewType>("timeline");
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isAccessModalOpen, setIsAccessModalOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [loadingTrip, setLoadingTrip] = useState(true);
  const [gamificationProfiles, setGamificationProfiles] = useState<UserGamificationProfile[]>([]);
  const [contestCandidates, setContestCandidates] = useState<ExperienceContestItem[]>([]);
  const [localCheckins, setLocalCheckins] = useState<Record<string, string>>({});

  // Listen for tab navigation triggers (e.g. from Header XP Bar popover)
  useEffect(() => {
    const handleTabNav = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        setActiveTab(customEvent.detail as PlanViewType);
      }
    };
    window.addEventListener("boystrip:navigate-tab", handleTabNav);
    return () => window.removeEventListener("boystrip:navigate-tab", handleTabNav);
  }, []);

  // Input for entering invite code if access denied
  const [inputCode, setInputCode] = useState("");
  const [joinStatus, setJoinStatus] = useState<string | null>(null);

  // Fallback demo trip object if offline or waiting for Firestore
  const fallbackTrip: Trip = {
    id: tripId,
    name: "Boys-Trip nach Prag, Wien und Neustadt Dosse",
    description: "Gemeinsamer Sommer-Roadtrip der Boys nach Prag, Wien und Neustadt (Dosse).",
    ownerId: user?.uid || "guest-owner",
    participantIds: [user?.uid || "guest-owner"],
    visibility: "private",
    inviteCode: "BOYS26",
    startDate: "2026-07-10",
    endDate: "2026-07-19",
    stops: [
      { id: "s1", city: "Berlin", country: "Deutschland", order: 0 },
      { id: "s2", city: "Prag", country: "Tschechien", order: 1 },
      { id: "s3", city: "Wien", country: "Österreich", order: 2 },
      { id: "s4", city: "Neustadt (Dosse)", country: "Deutschland", order: 3 },
      { id: "s5", city: "Berlin", country: "Deutschland", order: 4 },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // 1. Subscribe to Trip
  useEffect(() => {
    if (!tripId) return;
    const unsubscribe = subscribeToTrip(tripId, (data) => {
      setTrip(data || fallbackTrip);
      setLoadingTrip(false);
    });
    return () => unsubscribe();
  }, [tripId]);

  // 2. Subscribe to Options
  useEffect(() => {
    if (!tripId) return;
    const unsubscribe = subscribeToOptions(tripId, (data) => {
      if (data && data.length > 0) {
        setOptions(data);
      } else {
        setOptions([
          {
            id: "opt-1",
            tripId,
            category: "transport",
            provider: "flixbus",
            title: "Flixbus: Berlin ZOB -> Prag ÚAN Florenc",
            description: "Direktverbindung ohne Umstieg, WLAN & Steckdose. Spart Reisebudget!",
            priceEstimate: 19.99,
            currency: "EUR",
            fromLocation: "Berlin ZOB",
            toLocation: "Prag Florenc",
            dates: "12. Juli 2026, 08:30 - 13:15",
            imageUrl: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&auto=format&fit=crop&q=80",
            createdBy: user?.uid || "system",
            yesVotes: 2,
            noVotes: 0,
            createdAt: new Date().toISOString(),
          },
          {
            id: "opt-2",
            tripId,
            category: "transport",
            provider: "bahn",
            title: "Deutsche Bahn EC: Berlin Hbf -> Prag hl.n.",
            description: "Entspannte Zugfahrt durchs Elbtal mit Bordbistro und Panorama.",
            priceEstimate: 34.9,
            currency: "EUR",
            fromLocation: "Berlin Hbf",
            toLocation: "Prag hl.n.",
            dates: "12. Juli 2026, 09:16 - 13:35",
            imageUrl: "https://images.unsplash.com/photo-1474487548417-781cb71495f3?w=800&auto=format&fit=crop&q=80",
            createdBy: user?.uid || "system",
            yesVotes: 1,
            noVotes: 0,
            createdAt: new Date().toISOString(),
          },
          {
            id: "opt-3",
            tripId,
            category: "accommodation",
            provider: "airbnb",
            title: "Design Loft Prag Altstadt (Platz für 6)",
            description: "Großes Penthouse mit Dachterrasse nur 300m von der Karlsbrücke.",
            priceEstimate: 65.0,
            currency: "EUR",
            fromLocation: "Prag 1, Altstadt",
            dates: "12. - 14. Juli 2026 (2 Nächte)",
            imageUrl: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&auto=format&fit=crop&q=80",
            createdBy: user?.uid || "system",
            yesVotes: 2,
            noVotes: 0,
            createdAt: new Date().toISOString(),
          },
        ]);
      }
    });
    return () => unsubscribe();
  }, [tripId, user]);

  // 3. Subscribe to User Votes
  useEffect(() => {
    if (!tripId || !user?.uid) return;
    const unsubscribe = subscribeToUserVotes(tripId, user.uid, (data) => {
      setUserVotes(data);
    });
    return () => unsubscribe();
  }, [tripId, user]);

  // 4. Subscribe to Timeline Items
  useEffect(() => {
    if (!tripId) return;
    const unsubscribe = subscribeToTimelineItems(tripId, (data) => {
      if (data && data.length > 0) {
        setTimelineItems(data);
      } else {
        setTimelineItems([
          {
            id: "item-pool-1",
            tripId,
            dayId: "pool",
            stopCity: "Prag",
            title: "Brauereitour & Bierverkostung Pilsner Urquell",
            type: "activity",
            time: "15:30 - 17:30",
            location: "Pilsen / Prag Zentrum",
            url: "https://www.prazdrojvisit.cz/de/",
            imageUrl: "https://images.unsplash.com/photo-1518173946687-a4c8a383392e?w=600&auto=format&fit=crop&q=80",
            order: 0,
            notes: "Tickets müssen vorab online reserviert werden",
            createdBy: user?.uid || "system",
            votes: { [user?.uid || "guest"]: "up" },
            timeProposals: [
              {
                id: "tp-1",
                time: "15:30",
                proposedBy: user?.uid || "system",
                proposerName: "Alex",
                votes: [user?.uid || "guest", "buddy-1"],
                createdAt: new Date().toISOString(),
              },
              {
                id: "tp-2",
                time: "17:00",
                proposedBy: "buddy-2",
                proposerName: "Basti",
                votes: ["buddy-2"],
                createdAt: new Date().toISOString(),
              },
            ],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: "item-pool-2",
            tripId,
            dayId: "pool",
            stopCity: "Prag",
            title: "Hemingway Bar Prag (Cocktails & Rum)",
            type: "bar",
            time: "21:30 - 01:00",
            location: "Karoliny Světlé 26, Prag 1",
            url: "https://www.hemingwaybar.cz",
            imageUrl: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=600&auto=format&fit=crop&q=80",
            order: 1,
            notes: "Legendäre Cocktailbar, Tisch frühzeitig sichern",
            createdBy: user?.uid || "system",
            votes: { [user?.uid || "guest"]: "up" },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: "item-1",
            tripId,
            dayId: "day-1",
            stopCity: "Berlin",
            title: "Treffpunkt am Brandenburger Tor & Pre-Drinks",
            type: "timeslot",
            time: "18:00 - 21:00",
            location: "Pariser Platz, Berlin",
            url: "https://maps.google.com/?q=Brandenburger+Tor+Berlin",
            imageUrl: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600&auto=format&fit=crop&q=80",
            order: 0,
            notes: "Koffer vorher deponieren, Bierchen mitbringen",
            createdBy: user?.uid || "system",
            votes: { [user?.uid || "guest"]: "up" },
            timeProposals: [
              {
                id: "tp-3",
                time: "18:00",
                proposedBy: user?.uid || "system",
                proposerName: "Alex",
                votes: [user?.uid || "guest"],
                createdAt: new Date().toISOString(),
              },
              {
                id: "tp-4",
                time: "19:00",
                proposedBy: "buddy-1",
                proposerName: "Lukas",
                votes: ["buddy-1", "buddy-2"],
                createdAt: new Date().toISOString(),
              },
            ],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: "item-2",
            tripId,
            dayId: "day-2",
            stopCity: "Berlin -> Prag",
            title: "Fahrt nach Prag (DB EC 173)",
            type: "transport",
            time: "09:16 - 13:35",
            location: "Berlin Hbf -> Prag hl.n.",
            url: "https://www.bahn.de",
            imageUrl: "https://images.unsplash.com/photo-1474487548417-781cb71495f3?w=600&auto=format&fit=crop&q=80",
            order: 0,
            provider: "bahn",
            createdBy: user?.uid || "system",
            votes: { [user?.uid || "guest"]: "up" },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: "item-3",
            tripId,
            dayId: "day-2",
            stopCity: "Prag",
            title: "Check-in Airbnb Altstadt Penthouse",
            type: "accommodation",
            time: "14:30 - 15:30",
            location: "Prag 1, Altstadt",
            url: "https://www.airbnb.de/rooms/sample",
            imageUrl: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&auto=format&fit=crop&q=80",
            order: 1,
            provider: "airbnb",
            createdBy: user?.uid || "system",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: "item-4",
            tripId,
            dayId: "day-3",
            stopCity: "Prag",
            title: "Abendessen: Restaurant Lokál Dlouhááá",
            type: "restaurant",
            time: "19:30 - 22:00",
            location: "Dlouhá 33, Prag 1",
            url: "https://maps.google.com/?q=Lokal+Dlouha+Prag",
            imageUrl: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=80",
            order: 0,
            notes: "Frisches Pilsner Urquell & böhmisches Gulasch",
            createdBy: user?.uid || "system",
            votes: { [user?.uid || "guest"]: "up" },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: "item-5",
            tripId,
            dayId: "day-3",
            stopCity: "Prag",
            title: "Prager Burg & Karlsbrücke Sunset Walk",
            type: "culture",
            time: "17:00 - 19:00",
            location: "Hradčany, Prag",
            url: "https://www.hrad.cz/de",
            imageUrl: "https://images.unsplash.com/photo-1513805959324-96eb66ca8713?w=600&auto=format&fit=crop&q=80",
            order: 1,
            notes: "Beste Aussicht auf die Stadt zum Sonnenuntergang",
            createdBy: user?.uid || "system",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ]);
      }
    });
    return () => unsubscribe();
  }, [tripId, user]);

  const currentUserId = user?.uid || "guest-user";
  const activeTrip = trip || fallbackTrip;

  // 5. Subscribe to Gamification & Challenges
  useEffect(() => {
    if (!tripId) return;
    const unsubGamification = subscribeToGamification(tripId, (profiles) => {
      setGamificationProfiles(profiles);
      syncFromProfiles(profiles, currentUserId);
    });
    const unsubContest = subscribeToExperienceContest(tripId, (candidates) => {
      setContestCandidates(candidates);
    });
    return () => {
      unsubGamification();
      unsubContest();
    };
  }, [tripId, currentUserId, syncFromProfiles]);

  const isOwner = user ? activeTrip.ownerId === user.uid : false;
  const isParticipant = user ? activeTrip.participantIds?.includes(user.uid) || isOwner : false;
  const isPublic = activeTrip.visibility === "public";

  const myGamificationProfile = gamificationProfiles.find((p) => p.userId === currentUserId);
  const userCheckins = {
    ...(myGamificationProfile?.checkins || {}),
    ...localCheckins,
  };

  const handleLocationCheckin = async (
    itemId: string,
    itemTitle: string,
    itemType: string,
    city: string
  ) => {
    const nowIso = new Date().toISOString();
    // 1. Optimistic check-in mark
    setLocalCheckins((prev) => ({ ...prev, [itemId]: nowIso }));

    // 2. Optimistic profile update (XP, level, stamp)
    const matchedStamp = findMatchingStamp(itemTitle, itemType, city);
    const earnedPoints = matchedStamp ? matchedStamp.points : 50;

    // Trigger global gamification state & header XP animation
    addXp(earnedPoints, itemTitle);

    setGamificationProfiles((prev) => {
      const existing = prev.find((p) => p.userId === currentUserId);
      const currentStamps = existing?.stamps || ["BER-GATE"];
      const newStamps = matchedStamp && !currentStamps.includes(matchedStamp.code)
        ? [...currentStamps, matchedStamp.code]
        : currentStamps;
      const newPoints = (existing?.points || 150) + earnedPoints;
      const lvl = calculateLevel(newPoints);

      const updatedProfile: UserGamificationProfile = {
        userId: currentUserId,
        tripId,
        displayName: user?.displayName || "Traveler",
        photoURL: user?.photoURL || undefined,
        points: newPoints,
        level: lvl.level,
        levelTitle: lvl.title,
        beerCount: existing?.beerCount || 0,
        currentStreak: (existing?.currentStreak || 1) + 1,
        lastActiveDate: nowIso.split("T")[0],
        stamps: newStamps,
        badges: existing?.badges || ["badge-first-checkin"],
        checkins: { ...(existing?.checkins || {}), [itemId]: nowIso },
      };

      const others = prev.filter((p) => p.userId !== currentUserId);
      return [updatedProfile, ...others];
    });

    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#f59e0b", "#3b82f6", "#10b981", "#8b5cf6"],
    });

    try {
      await recordLocationCheckin(
        tripId,
        currentUserId,
        user?.displayName || "Traveler",
        user?.photoURL || undefined,
        itemId,
        itemTitle,
        itemType,
        city
      );
    } catch (err) {
      console.warn("Firestore check-in sync:", err);
    }
  };

  const handleJoinViaCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCode.trim() || !user) return;

    try {
      const resTripId = await joinTripByInviteCode(inputCode.trim(), user.uid);
      if (resTripId) {
        setJoinStatus("Erfolgreich beigetreten!");
        setTimeout(() => window.location.reload(), 800);
      } else {
        setJoinStatus("Ungültiger Einladungscode.");
      }
    } catch (err) {
      setJoinStatus("Fehler beim Beitreten.");
    }
  };

  const handleJoinPublicTrip = async () => {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }
    try {
      await joinTripByInviteCode(activeTrip.inviteCode, user.uid);
      window.location.reload();
    } catch (err) {
      console.warn("Failed to join public trip:", err);
    }
  };

  // ===============================================================
  // ACCESS RESTRICTION: Private trip & User is not a participant
  // ===============================================================
  if (!loadingTrip && !isParticipant && !isPublic) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-md w-full rounded-3xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-8 text-center shadow-xl">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-4 border border-amber-500/20">
            <Lock className="w-7 h-7" />
          </div>

          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
            Privates Projekt
          </h2>
          <p className="text-xs text-slate-600 dark:text-neutral-400 leading-relaxed mb-6">
            Diese Reise ist auf <strong>Privat</strong> gestellt. Nur eingeladene Freunde haben Zugriff.
            Gib den Einladungscode ein, um beizutreten:
          </p>

          {!user ? (
            <div className="space-y-3">
              <button
                onClick={() => setAuthModalOpen(true)}
                className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
              >
                <LogIn className="w-4 h-4" />
                <span>Zuerst mit Google anmelden</span>
              </button>
              <button
                onClick={() => router.push("/")}
                className="w-full py-2.5 text-xs text-slate-500 hover:text-slate-800 dark:text-neutral-400 transition-colors"
              >
                Zurück zur Startseite
              </button>
            </div>
          ) : (
            <form onSubmit={handleJoinViaCode} className="space-y-4">
              <input
                type="text"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                placeholder="Einladungscode eingeben..."
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 text-center text-sm font-mono tracking-widest text-slate-900 dark:text-white uppercase focus:outline-none focus:border-blue-500"
              />

              {joinStatus && (
                <p className="text-xs font-medium text-blue-600 dark:text-blue-400">{joinStatus}</p>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => router.push("/")}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-slate-700 dark:text-neutral-300 text-xs font-semibold transition-colors"
                >
                  Zurück
                </button>
                <button
                  type="submit"
                  disabled={!inputCode.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition-all"
                >
                  Beitreten
                </button>
              </div>
            </form>
          )}

          <AuthModal
            isOpen={authModalOpen}
            onClose={() => setAuthModalOpen(false)}
          />
        </div>
      </div>
    );
  }

  // ===============================================================
  // FULL COLLABORATIVE VIEW
  // ===============================================================
  return (
    <div className="flex-1 flex flex-col max-w-7xl w-full mx-auto px-2.5 sm:px-6 lg:px-8 py-3 sm:py-6 gap-3 sm:gap-6 min-w-0">
      {/* Public Trip Banner if user is only a spectator */}
      {isPublic && !isParticipant && (
        <div className="p-3 sm:p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-3">
            <Globe className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div>
              <h4 className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                Öffentliche Community-Reise
              </h4>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                Du schaust dir diese Reise aktuell als Gast an. Tritt dem Projekt bei, um mitzustimmen und Programmpunkte zu verschieben.
              </p>
            </div>
          </div>
          <button
            onClick={handleJoinPublicTrip}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2 sm:py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-500/20 whitespace-nowrap active:scale-95 transition-all w-full sm:w-auto"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Jetzt beitreten</span>
          </button>
        </div>
      )}

      {/* Top Trip Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 pb-3 sm:pb-6 border-b border-slate-200 dark:border-neutral-800 transition-colors">
        <div>
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white mb-1.5 transition-colors py-0.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Zurück zu meinen Reisen</span>
          </button>

          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <h1 className="text-xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {activeTrip.name}
            </h1>

            {/* Visibility Badge */}
            <span
              className={`inline-flex items-center gap-1.5 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-bold border ${
                isPublic
                  ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20"
                  : "bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/20"
              }`}
            >
              {isPublic ? <Globe className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
              <span>{isPublic ? "Öffentlich" : "Privat (geschützt)"}</span>
            </span>
          </div>

          <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1 flex items-center gap-1.5 sm:gap-2 flex-wrap">
            <span>📅 {activeTrip.startDate} bis {activeTrip.endDate}</span>
            <span className="text-slate-300 dark:text-neutral-600">•</span>
            <span className="font-mono text-slate-700 dark:text-neutral-300 font-semibold">
              Code: {activeTrip.inviteCode}
            </span>
          </p>
        </div>

        {/* Live Presence, Access Management & Share Action */}
        <div className="flex items-center gap-1.5 sm:gap-3 flex-wrap w-full md:w-auto">
          <ActiveUsersPresence
            tripId={tripId}
            currentUser={user}
            currentView={activeTab}
          />

          {/* Zugriffsverwaltung Button */}
          <button
            onClick={() => setIsAccessModalOpen(true)}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-slate-700 dark:text-neutral-200 text-xs font-semibold border border-slate-200 dark:border-neutral-700 transition-colors whitespace-nowrap"
          >
            <Shield className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
            <span className="hidden xs:inline">Zugriffsverwaltung</span>
            <span className="xs:hidden">Zugriff</span>
          </button>

          <button
            onClick={() => setIsShareModalOpen(true)}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-500/20 active:scale-95 transition-all whitespace-nowrap"
          >
            <Share2 className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden xs:inline">Freunde einladen</span>
            <span className="xs:hidden">Einladen</span>
          </button>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="flex items-center gap-1 p-1 sm:p-1.5 rounded-2xl bg-slate-100 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 w-full sm:w-fit overflow-x-auto no-scrollbar backdrop-blur-md transition-colors min-w-0">
        <button
          onClick={() => setActiveTab("timeline")}
          className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
            activeTab === "timeline"
              ? "bg-white dark:bg-neutral-800 text-indigo-600 dark:text-white shadow-sm"
              : "text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Calendar className="w-4 h-4 text-indigo-500" />
          <span>Timeline <span className="hidden sm:inline">& Stempelpass</span></span>
        </button>

        <button
          onClick={() => setActiveTab("matches")}
          className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
            activeTab === "matches"
              ? "bg-white dark:bg-neutral-800 text-emerald-600 dark:text-emerald-400 shadow-sm"
              : "text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Trophy className="w-4 h-4 text-emerald-500" />
          <span>Voting <span className="hidden sm:inline">& Favoriten</span></span>
          {options.length > 0 && (
            <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-neutral-950 text-[10px] flex items-center justify-center font-mono">
              {options.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("passport")}
          className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
            activeTab === "passport"
              ? "bg-white dark:bg-neutral-800 text-amber-600 dark:text-amber-400 shadow-sm"
              : "text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Award className="w-4 h-4 text-amber-500" />
          <span>Rangliste <span className="hidden sm:inline">& Badges</span></span>
          <span className="px-1.5 sm:px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 font-mono text-[10px] border border-amber-500/20">
            {contextProfile.points} XP
          </span>
        </button>
      </div>

      {/* View Content Panels */}
      <div className="flex-1 w-full pt-2">
        {activeTab === "timeline" && (
          <TimelineContainer
            trip={activeTrip}
            items={timelineItems}
            currentUserId={currentUserId}
            currentUserName={user?.displayName || "Traveler"}
            userCheckins={userCheckins}
            onCheckIn={handleLocationCheckin}
          />
        )}

        {activeTab === "matches" && (
          <FinalDashboard
            trip={activeTrip}
            options={options}
            userVotes={userVotes}
            currentUserId={currentUserId}
            currentUserName={user?.displayName || "Traveler"}
            onGoToTimeline={() => setActiveTab("timeline")}
          />
        )}

        {activeTab === "passport" && (
          <DigitalPassportView
            trip={activeTrip}
            profiles={gamificationProfiles}
            candidates={contestCandidates}
            currentUserId={currentUserId}
            currentUserName={user?.displayName || "Traveler"}
            currentUserPhoto={user?.photoURL}
            onGoToTimeline={() => setActiveTab("timeline")}
          />
        )}
      </div>

      {/* Share / Invite Modal */}
      {isShareModalOpen && (
        <ShareTripModal
          inviteCode={activeTrip.inviteCode}
          tripName={activeTrip.name}
          onClose={() => setIsShareModalOpen(false)}
        />
      )}

      {/* Project Access Management Modal */}
      {isAccessModalOpen && (
        <ProjectAccessModal
          trip={activeTrip}
          currentUserId={currentUserId}
          isOpen={isAccessModalOpen}
          onClose={() => setIsAccessModalOpen(false)}
        />
      )}
    </div>
  );
}

export default function TripPlanningPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center p-12">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <TripPlanningContent />
    </Suspense>
  );
}
