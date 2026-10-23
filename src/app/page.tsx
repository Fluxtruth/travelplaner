"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  createTrip,
  joinTripByInviteCode,
  subscribeToUserTrips,
  subscribeToPublicTrips,
} from "@/lib/firebase/firestore";
import { Trip } from "@/types";
import { AuthModal } from "@/components/auth/AuthModal";
import { SettingsModal } from "@/components/common/SettingsModal";
import {
  Compass,
  Sparkles,
  ArrowRight,
  Users,
  Flame,
  Calendar,
  Lock,
  Globe,
  MapPin,
  CheckCircle2,
  LogIn,
  Plus,
  ShieldCheck,
  Share2,
  Settings,
  Beer,
  Award,
  Trophy,
  Check,
} from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const { user, profile, loading, signInWithGoogle } = useAuth();

  const [myTrips, setMyTrips] = useState<Trip[]>([]);
  const [publicTrips, setPublicTrips] = useState<Trip[]>([]);
  const [loadingTrips, setLoadingTrips] = useState(true);

  const [isCreatingDemo, setIsCreatingDemo] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [landingInviteCode, setLandingInviteCode] = useState("");
  const [joinStatus, setJoinStatus] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);

  // Subscribe to Cloud Firestore user trips & public trips when authenticated
  useEffect(() => {
    if (!user) {
      setMyTrips([]);
      setPublicTrips([]);
      setLoadingTrips(false);
      return;
    }

    setLoadingTrips(true);

    // 1. Subscribe to My Trips in Firestore
    const unsubUserTrips = subscribeToUserTrips(user.uid, (trips) => {
      setMyTrips(trips);
      setLoadingTrips(false);
    });

    // 2. Subscribe to Public Trips in Firestore
    const unsubPublicTrips = subscribeToPublicTrips((trips) => {
      // Exclude trips the user is already part of
      const others = trips.filter((t) => !t.participantIds.includes(user.uid));
      setPublicTrips(others);
    });

    return () => {
      unsubUserTrips();
      unsubPublicTrips();
    };
  }, [user]);

  const handleCreateDemoTrip = async () => {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }

    setIsCreatingDemo(true);
    try {
      const tripId = await createTrip(
        user.uid,
        "Boys-Trip nach Prag, Wien und Neustadt Dosse",
        "Gemeinsamer Sommer-Roadtrip nach Prag, Wien und Neustadt (Dosse). Abgestimmt via Voting-Engine.",
        "2026-07-10",
        "2026-07-19",
        "private" // Default: Private access management
      );
      router.push(`/trips/${tripId}`);
    } catch (err) {
      console.warn("Failed to create trip in Firestore:", err);
      setIsCreatingDemo(false);
    }
  };

  const handleQuickJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = landingInviteCode.trim().toUpperCase();
    if (!code) return;

    setIsJoining(true);
    setJoinStatus(null);
    try {
      let activeUser = user;
      if (!activeUser) {
        setAuthModalOpen(true);
        setIsJoining(false);
        return;
      }
      const resTripId = await joinTripByInviteCode(code, activeUser.uid);
      if (resTripId) {
        setJoinStatus("Erfolgreich! Weiterleitung...");
        router.push(`/trips/${resTripId}`);
      } else {
        setJoinStatus("Ungültiger Einladungscode. Bitte prüfen.");
      }
    } catch (err) {
      console.warn("Join failed:", err);
      setJoinStatus("Fehler beim Beitreten.");
    } finally {
      setIsJoining(false);
    }
  };

  // ===============================================================
  // ACCESS GATE: If user is not authenticated, prompt sign-in!
  // ===============================================================
  if (!loading && !user) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center px-4 py-16 sm:py-24 max-w-xl mx-auto w-full text-center">
        {/* 3D App Icon Logo */}
        <div className="relative mb-8 group">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl overflow-hidden shadow-2xl shadow-blue-500/25 border-2 border-slate-200 dark:border-neutral-800 bg-slate-900 mx-auto transition-transform group-hover:scale-105 duration-300">
            <img
              src="/logo-3d.png"
              alt="Phil's Travelplaner 3D Logo"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="absolute -bottom-1.5 -right-1.5 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center border-2 border-white dark:border-neutral-900 shadow-md">
            <Lock className="w-4 h-4" />
          </div>
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
          Phil&apos;s Travelplaner <br />
          <span className="text-blue-600 dark:text-blue-400">
            Zugang nur für angemeldete Nutzer
          </span>
        </h1>

        <p className="mt-4 text-sm sm:text-base text-slate-600 dark:text-neutral-400 max-w-md leading-relaxed mx-auto">
          Um eure gemeinsamen Reisen in Echtzeit zu planen und live zusammenzuarbeiten,
          melde dich bitte mit deinem Google-Konto an.
        </p>

        {/* Auth Button - Only Google Sign-in */}
        <div className="mt-8 w-full max-w-xs mx-auto">
          <button
            onClick={() => signInWithGoogle()}
            className="w-full flex items-center justify-center gap-3 py-3.5 px-6 rounded-2xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-950 font-bold text-sm shadow-xl shadow-slate-900/10 active:scale-95 transition-all cursor-pointer"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.14z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
            <span>Mit Google anmelden</span>
          </button>
        </div>
      </div>
    );
  }

  // ===============================================================
  // AUTHENTICATED DASHBOARD: User is logged in!
  // ===============================================================
  return (
    <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 py-5 sm:py-8 w-full flex flex-col gap-5 sm:gap-8">
      {/* Welcome & Action Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 shadow-sm transition-colors">
        <div className="flex items-center gap-3.5 sm:gap-4">
          <img
            src={profile?.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${user?.uid}`}
            alt={profile?.displayName || "User"}
            className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-neutral-700 bg-slate-100 dark:bg-neutral-800 object-cover shrink-0"
          />
          <div className="min-w-0">
            <h1 className="text-lg sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2 truncate">
              Hallo {profile?.displayName || "Traveler"}! 👋
            </h1>
            <p className="text-xs text-slate-500 dark:text-neutral-400 truncate">
              Angemeldet als <span className="font-semibold text-slate-700 dark:text-neutral-300">{user?.email || "Google Nutzer"}</span>
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
          <Link
            href="/trips/new"
            className="flex items-center justify-center gap-2 px-5 py-3 sm:py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-500/20 active:scale-95 transition-all w-full sm:w-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Neuen Trip anlegen</span>
          </Link>

          <button
            onClick={handleCreateDemoTrip}
            disabled={isCreatingDemo}
            className="flex items-center justify-center gap-2 px-4 py-3 sm:py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-slate-800 dark:text-neutral-200 font-bold text-xs border border-slate-200 dark:border-neutral-700 transition-colors w-full sm:w-auto"
            title="Boys-Trip nach Prag, Wien und Neustadt Dosse"
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>{isCreatingDemo ? "Wird erstellt..." : "Boys-Trip starten"}</span>
          </button>

          <button
            onClick={() => setSettingsModalOpen(true)}
            className="flex items-center justify-center gap-2 px-3.5 py-3 sm:py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-slate-700 dark:text-neutral-300 font-semibold text-xs border border-slate-200 dark:border-neutral-700 transition-colors w-full sm:w-auto"
            title="Einstellungen"
          >
            <Settings className="w-4 h-4 text-slate-500 dark:text-neutral-400" />
            <span>Einstellungen</span>
          </button>
        </div>
      </div>

      {/* Code-Beitritt Bar für angemeldete Nutzer */}
      <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-500/20 shrink-0">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
              Reise per Zugangscode beitreten
            </h3>
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
              Gib den 6-stelligen Einladungscode ein, den du von Freunden erhalten hast:
            </p>
          </div>
        </div>

        <form onSubmit={handleQuickJoin} className="flex items-center gap-2 w-full sm:w-auto">
          <input
            type="text"
            value={landingInviteCode}
            onChange={(e) => setLandingInviteCode(e.target.value.toUpperCase())}
            placeholder="z.B. BOYS26"
            className="px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 font-mono tracking-wider font-bold text-slate-900 dark:text-white uppercase placeholder:font-sans placeholder:normal-case placeholder-slate-400 text-xs focus:outline-none focus:border-blue-500 transition-colors flex-1 sm:w-40"
          />
          <button
            type="submit"
            disabled={isJoining || !landingInviteCode.trim()}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-blue-500/20 active:scale-95 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
          >
            <span>{isJoining ? "..." : "Beitreten"}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
      {joinStatus && (
        <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 -mt-2 px-1">
          {joinStatus}
        </p>
      )}

      {/* SECTION 1: Meine Reisen */}
      <div className="flex flex-col gap-3.5 sm:gap-4">
        <div className="flex items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Compass className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
              <span>Meine Reisen</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
              Deine aktiven und geplanten Gruppenreisen im Überblick.
            </p>
          </div>
          <span className="shrink-0 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-neutral-300 border border-slate-200 dark:border-neutral-700">
            {myTrips.length} {myTrips.length === 1 ? "Trip" : "Trips"}
          </span>
        </div>

        {loadingTrips ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-44 rounded-2xl bg-slate-200 dark:bg-neutral-800/50 animate-pulse" />
            ))}
          </div>
        ) : myTrips.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {myTrips.map((trip) => {
              const isOwner = trip.ownerId === user?.uid;
              const isPublic = trip.visibility === "public";

              return (
                <Link
                  key={trip.id}
                  href={`/trips/${trip.id}`}
                  className="group relative rounded-3xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/90 p-5 shadow-sm hover:shadow-md hover:border-blue-500/50 dark:hover:border-blue-500/50 transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Access & Role Badges */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                            isPublic
                              ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20"
                              : "bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/20"
                          }`}
                        >
                          {isPublic ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                          {isPublic ? "Öffentlich" : "Privat"}
                        </span>

                        {isOwner && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20">
                            Inhaber
                          </span>
                        )}
                      </div>

                      <span className="text-[11px] font-mono text-slate-400 dark:text-neutral-500">
                        Code: {trip.inviteCode}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                      {trip.name}
                    </h3>

                    {trip.description && (
                      <p className="mt-1 text-xs text-slate-500 dark:text-neutral-400 line-clamp-2 leading-relaxed">
                        {trip.description}
                      </p>
                    )}
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-100 dark:border-neutral-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-neutral-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-neutral-500" />
                      {trip.startDate}
                    </span>

                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-slate-400 dark:text-neutral-500" />
                      {trip.participantIds?.length || 1} Mitglieder
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="p-8 rounded-3xl border border-dashed border-slate-300 dark:border-neutral-800 bg-white/50 dark:bg-neutral-900/40 text-center">
            <Compass className="w-10 h-10 text-slate-400 dark:text-neutral-500 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Noch keine Reisen angelegt
            </h3>
            <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1 max-w-sm mx-auto">
              Starte direkt mit dem Boys-Trip nach Prag, Wien und Neustadt Dosse oder erstelle einen neuen Trip.
            </p>
            <div className="mt-4 flex justify-center gap-3">
              <Link
                href="/trips/new"
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-sm transition-all"
              >
                Trip erstellen
              </Link>
              <button
                onClick={handleCreateDemoTrip}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-slate-800 dark:text-neutral-200 font-semibold text-xs border border-slate-200 dark:border-neutral-700 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Boys-Trip starten</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 2: Öffentliche Reisen (Community) */}
      {publicTrips.length > 0 && (
        <div className="flex flex-col gap-4 mt-2">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Globe className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              Öffentliche Reisen der Community
            </h2>
            <p className="text-xs text-slate-500 dark:text-neutral-400">
              Reisen, die für alle registrierten Google-Nutzer freigegeben wurden.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {publicTrips.map((trip) => (
              <Link
                key={trip.id}
                href={`/trips/${trip.id}`}
                className="group relative rounded-3xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/90 p-5 shadow-sm hover:shadow-md hover:border-emerald-500/50 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
                      <Globe className="w-3 h-3" />
                      Öffentlich
                    </span>
                    <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold group-hover:underline">
                      Ansehen →
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-2">
                    {trip.name}
                  </h3>

                  {trip.description && (
                    <p className="mt-1 text-xs text-slate-500 dark:text-neutral-400 line-clamp-2 leading-relaxed">
                      {trip.description}
                    </p>
                  )}
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 dark:border-neutral-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-neutral-400">
                  <span>📅 {trip.startDate}</span>
                  <span>👥 {trip.participantIds?.length || 1} Mitglieder</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <SettingsModal
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
        onOpenAuth={() => setAuthModalOpen(true)}
      />
    </div>
  );
}
