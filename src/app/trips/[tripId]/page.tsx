"use client";

import React, { useEffect, useState, useMemo, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  Trip,
  TripStop,
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
  updateTripName,
} from "@/lib/firebase/firestore";
import { ActiveUsersPresence } from "@/components/presence/ActiveUsersPresence";
import { TimelineContainer } from "@/components/timeline/TimelineContainer";
import { FinalDashboard } from "@/components/voting/FinalDashboard";
import { DigitalPassportView } from "@/components/gamification/DigitalPassportView";
import { ShareTripModal } from "@/components/common/ShareTripModal";
import { ProjectAccessModal } from "@/components/common/ProjectAccessModal";
import { EditRouteModal } from "@/components/trips/EditRouteModal";
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
  Pencil,
  Check,
  X,
  MapPin,
  ArrowRight,
} from "lucide-react";

function TripPlanningContent() {
  const params = useParams();
  const tripId = (params?.tripId as string) || "demo";
  const router = useRouter();
  const { user, signInWithGoogle } = useAuth();
  const { syncFromProfiles, addXp, profile: contextProfile, updateProfile } = useGamification();

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
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");
  const [isSavingTitle, setIsSavingTitle] = useState(false);

  const totalTripCost = useMemo(() => {
    return timelineItems.reduce((acc, it) => {
      if (typeof it.cost === "number" && !isNaN(it.cost) && it.cost > 0) {
        return acc + it.cost;
      }
      return acc;
    }, 0);
  }, [timelineItems]);

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

  // Fallback trip placeholder while loading Firestore
  const fallbackTrip: Trip = {
    id: tripId,
    name: "Reise laden...",
    description: "",
    ownerId: user?.uid || "guest-owner",
    participantIds: [user?.uid || "guest-owner"],
    visibility: "private",
    inviteCode: "TRIP",
    startDate: "",
    endDate: "",
    stops: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // 1. Subscribe to Trip
  useEffect(() => {
    if (!tripId) return;
    const unsubscribe = subscribeToTrip(tripId, (data) => {
      if (data) {
        setTrip(data);
      }
      setLoadingTrip(false);
    });
    return () => unsubscribe();
  }, [tripId]);

  // 2. Subscribe to Options
  useEffect(() => {
    if (!tripId) return;
    const unsubscribe = subscribeToOptions(tripId, (data) => {
      setOptions(data || []);
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
      setTimelineItems(data || []);
    });
    return () => unsubscribe();
  }, [tripId, user]);

  const currentUserId = user?.uid || "guest-user";
  const activeTrip = trip || fallbackTrip;

  const [isRouteModalOpen, setIsRouteModalOpen] = useState(false);

  const routeStops: TripStop[] = useMemo(() => {
    if (!activeTrip.stops || !Array.isArray(activeTrip.stops) || activeTrip.stops.length === 0) {
      return [];
    }
    return activeTrip.stops.map((s, idx) => {
      if (typeof s === "string") {
        return { id: `stop-${idx}`, city: s, order: idx };
      }
      return { ...s, order: s.order ?? idx };
    });
  }, [activeTrip.stops]);

  // 5. Subscribe to Gamification & Challenges
  useEffect(() => {
    if (!tripId) return;
    updateProfile({ tripId });
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
  }, [tripId, currentUserId, syncFromProfiles, updateProfile]);

  const isOwner = user ? activeTrip.ownerId === user.uid : false;
  const isParticipant = user ? activeTrip.participantIds?.includes(user.uid) || isOwner : false;
  const isPublic = activeTrip.visibility === "public";

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

  const handleSaveTitle = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = titleDraft.trim();
    if (!trimmed || trimmed === activeTrip.name) {
      setIsEditingTitle(false);
      return;
    }

    setIsSavingTitle(true);
    try {
      // Optimistic update
      setTrip((prev) => (prev ? { ...prev, name: trimmed } : { ...fallbackTrip, name: trimmed }));
      await updateTripName(tripId, trimmed);
    } catch (err) {
      console.warn("Failed to update trip name:", err);
    } finally {
      setIsSavingTitle(false);
      setIsEditingTitle(false);
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

          {isEditingTitle ? (
            <form
              onSubmit={handleSaveTitle}
              className="flex items-center gap-2 flex-wrap my-1 max-w-2xl w-full"
            >
              <input
                type="text"
                autoFocus
                value={titleDraft}
                onChange={(e) => setTitleDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") setIsEditingTitle(false);
                }}
                disabled={isSavingTitle}
                placeholder="Reisenamen eingeben..."
                className="text-base sm:text-2xl font-extrabold text-slate-900 dark:text-white bg-white dark:bg-neutral-900 border-2 border-blue-500 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 flex-1 min-w-[220px] shadow-sm"
              />
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="submit"
                  disabled={isSavingTitle || !titleDraft.trim()}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-blue-500/20 active:scale-95 transition-all"
                  title="Speichern (Enter)"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{isSavingTitle ? "Speichert..." : "Speichern"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingTitle(false)}
                  disabled={isSavingTitle}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                  title="Abbrechen (Esc)"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </form>
          ) : (
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <div className="flex items-center gap-2 group">
                <h1 className="text-xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  {activeTrip.name}
                </h1>
                {isOwner && (
                  <button
                    onClick={() => {
                      setTitleDraft(activeTrip.name);
                      setIsEditingTitle(true);
                    }}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors"
                    title="Trip umbenennen"
                    aria-label="Trip umbenennen"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                )}
              </div>

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
          )}

          <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1 flex items-center gap-1.5 sm:gap-2 flex-wrap">
            <span>
              📅 {activeTrip.startDate && activeTrip.endDate ? `${activeTrip.startDate} bis ${activeTrip.endDate}` : activeTrip.startDate || "Zeitraum noch offen"}
            </span>
            <span className="text-slate-300 dark:text-neutral-600">•</span>
            <span className="font-mono text-slate-700 dark:text-neutral-300 font-semibold">
              Code: {activeTrip.inviteCode}
            </span>
            {totalTripCost > 0 && (
              <>
                <span className="text-slate-300 dark:text-neutral-600">•</span>
                <span
                  title="Geschätzter Gesamtpreis aller Aktivitäten dieser Reise"
                  className="inline-flex items-center gap-1 font-mono font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-500/20 text-[11px]"
                >
                  <span>💰</span>
                  <span>~{totalTripCost % 1 === 0 ? totalTripCost : totalTripCost.toFixed(2).replace(".", ",")} € geschätzt</span>
                </span>
              </>
            )}
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

      {/* Active Route Bar with Quick Edit */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 sm:px-4 sm:py-2.5 rounded-2xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 shadow-sm transition-colors">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5 min-w-0">
          <span className="text-xs font-bold text-slate-700 dark:text-neutral-300 flex items-center gap-1.5 shrink-0">
            <MapPin className="w-3.5 h-3.5 text-rose-500" />
            <span>Route ({routeStops.length}):</span>
          </span>
          {routeStops.length > 0 ? (
            <div className="flex items-center gap-1.5 flex-nowrap shrink-0">
              {routeStops.map((stop, idx) => (
                <React.Fragment key={stop.id || idx}>
                  <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-neutral-800 text-slate-800 dark:text-neutral-200 text-xs font-bold whitespace-nowrap">
                    {stop.city}
                  </span>
                  {idx < routeStops.length - 1 && (
                    <ArrowRight className="w-3 h-3 text-slate-400 dark:text-neutral-600 shrink-0" />
                  )}
                </React.Fragment>
              ))}
            </div>
          ) : (
            <span className="text-xs text-slate-400 dark:text-neutral-500 italic">
              Noch keine Zwischenstopps festgelegt
            </span>
          )}
        </div>

        {isOwner && (
          <button
            onClick={() => setIsRouteModalOpen(true)}
            className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-slate-700 dark:text-neutral-300 text-xs font-bold border border-slate-200 dark:border-neutral-700 transition-colors shrink-0 cursor-pointer w-full sm:w-auto"
            title="Reiseroute und Zwischenstopps anpassen (Reiseleiter)"
          >
            <Pencil className="w-3 h-3 text-slate-500" />
            <span>Route anpassen</span>
          </button>
        )}
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
          <span className="text-sm">🍺</span>
          <span>Bier-Rangliste <span className="hidden sm:inline">& Badges</span></span>
          <span className="px-1.5 sm:px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 font-mono text-[10px] font-bold border border-amber-500/20">
            {contextProfile.beerCount ?? 0} Biere
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
            currentUserPhoto={user?.photoURL}
            participants={gamificationProfiles.map((p) => ({
              userId: p.userId,
              displayName: p.displayName,
              photoURL: p.photoURL,
              role: p.levelTitle,
            }))}
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
            isOwner={isOwner}
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

      {/* Edit Route Modal (Owner only) */}
      {isRouteModalOpen && isOwner && (
        <EditRouteModal
          tripId={tripId}
          isOpen={isRouteModalOpen}
          isOwner={isOwner}
          onClose={() => setIsRouteModalOpen(false)}
          initialStops={activeTrip.stops}
          initialStartDate={activeTrip.startDate}
          initialEndDate={activeTrip.endDate}
          onStopsUpdated={(newStops, newStartDate, newEndDate) => {
            setTrip((prev) => (prev ? {
              ...prev,
              stops: newStops,
              ...(newStartDate !== undefined ? { startDate: newStartDate } : {}),
              ...(newEndDate !== undefined ? { endDate: newEndDate } : {}),
            } : {
              ...fallbackTrip,
              stops: newStops,
              ...(newStartDate !== undefined ? { startDate: newStartDate } : {}),
              ...(newEndDate !== undefined ? { endDate: newEndDate } : {}),
            }));
          }}
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
