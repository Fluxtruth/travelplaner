"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { UserGamificationProfile, PassportStamp } from "@/types";
import { calculateLevel, findMatchingStamp, PASSPORT_STAMPS, BADGES_CATALOG } from "@/lib/gamification/catalog";
import { updateUserBeerCount } from "@/lib/firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import confetti from "canvas-confetti";

interface GamificationContextType {
  profile: UserGamificationProfile;
  levelInfo: {
    level: number;
    title: string;
    nextLevelPoints: number;
    progressPercent: number;
  };
  totalStampsCount: number;
  totalBadgesCount: number;
  updateProfile: (data: Partial<UserGamificationProfile>) => void;
  syncFromProfiles: (profiles: UserGamificationProfile[], userId?: string) => void;
  addXp: (amount: number, reason?: string) => void;
  updateBeerCount: (delta: number, overrideTripId?: string) => void;
  setBeerCount: (count: number, overrideTripId?: string) => void;
  xpGainAlert: { amount: number; reason?: string } | null;
}

const DEFAULT_PROFILE: UserGamificationProfile = {
  userId: "",
  tripId: "",
  displayName: "Traveler",
  points: 0,
  level: 1,
  levelTitle: "Reise-Rookie",
  beerCount: 0,
  currentStreak: 1,
  lastActiveDate: new Date().toISOString().split("T")[0],
  stamps: [],
  badges: [],
  checkins: {},
};

const GamificationContext = createContext<GamificationContextType | undefined>(undefined);

export function GamificationProvider({ children }: { children: ReactNode }) {
  const { user, profile: authProfile } = useAuth();
  const [profile, setProfile] = useState<UserGamificationProfile>(DEFAULT_PROFILE);
  const [isLoaded, setIsLoaded] = useState(false);
  const [xpGainAlert, setXpGainAlert] = useState<{ amount: number; reason?: string } | null>(null);

  // Hydrate profile from localStorage after initial mount
  useEffect(() => {
    try {
      if (!user) {
        setProfile(DEFAULT_PROFILE);
        return;
      }
      const storageKey = `boystrip_gamification_profile_${user.uid}`;
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        setProfile((prev) => ({
          ...prev,
          ...parsed,
          userId: user.uid,
          displayName: authProfile?.displayName || user.displayName || parsed.displayName || "Traveler",
          photoURL: (authProfile?.photoURL || user.photoURL || parsed.photoURL) ?? undefined,
        }));
      } else {
        setProfile((prev) => ({
          ...DEFAULT_PROFILE,
          userId: user.uid,
          displayName: authProfile?.displayName || user.displayName || "Traveler",
          photoURL: (authProfile?.photoURL || user.photoURL) ?? undefined,
        }));
      }
    } catch (e) {
      // ignore JSON parse error
    } finally {
      setIsLoaded(true);
    }
  }, [user, authProfile]);

  // Sync display name and photo when authProfile changes
  useEffect(() => {
    if (user) {
      setProfile((prev) => ({
        ...prev,
        userId: user.uid,
        displayName: authProfile?.displayName || user.displayName || prev.displayName || "Traveler",
        photoURL: (authProfile?.photoURL || user.photoURL || prev.photoURL) ?? undefined,
      }));
    } else {
      setProfile(DEFAULT_PROFILE);
    }
  }, [user, authProfile]);

  // Persist locally only after client-side hydration is complete
  useEffect(() => {
    if (!isLoaded || !user) return;
    try {
      const storageKey = `boystrip_gamification_profile_${user.uid}`;
      localStorage.setItem(storageKey, JSON.stringify(profile));
    } catch (e) {
      // storage quota or private browsing
    }
  }, [profile, isLoaded, user]);

  const levelInfo = calculateLevel(profile.points);

  const updateProfile = useCallback((data: Partial<UserGamificationProfile>) => {
    setProfile((prev) => {
      const updated = { ...prev, ...data };
      const calc = calculateLevel(updated.points);
      updated.level = calc.level;
      updated.levelTitle = calc.title;
      return updated;
    });
  }, []);

  const syncFromProfiles = useCallback((profiles: UserGamificationProfile[], targetUserId?: string) => {
    const activeUid = targetUserId || user?.uid || "guest-user";
    const found = profiles.find((p) => p.userId === activeUid);
    if (found) {
      setProfile((prev) => {
        // If server profile has points or stamps, keep them in sync
        const nextPoints = Math.max(found.points, prev.points);
        const nextStamps = Array.from(new Set([...(found.stamps || []), ...(prev.stamps || [])]));
        const nextBadges = Array.from(new Set([...(found.badges || []), ...(prev.badges || [])]));
        const nextBeerCount = found.beerCount !== undefined ? found.beerCount : (prev.beerCount ?? 0);
        const calc = calculateLevel(nextPoints);

        return {
          ...prev,
          ...found,
          beerCount: nextBeerCount,
          points: nextPoints,
          stamps: nextStamps,
          badges: nextBadges,
          level: calc.level,
          levelTitle: calc.title,
        };
      });
    }
  }, [user]);

  const addXp = useCallback((amount: number, reason?: string) => {
    setProfile((prev) => {
      const newPoints = prev.points + amount;
      const calc = calculateLevel(newPoints);
      return {
        ...prev,
        points: newPoints,
        level: calc.level,
        levelTitle: calc.title,
      };
    });

    setXpGainAlert({ amount, reason });
    setTimeout(() => {
      setXpGainAlert(null);
    }, 3500);

    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.1, x: 0.8 },
      colors: ["#f59e0b", "#fbbf24", "#6366f1", "#10b981"],
    });
  }, []);

  const updateBeerCount = useCallback((delta: number, overrideTripId?: string) => {
    const tripId = overrideTripId || profile.tripId || "demo";
    setProfile((prev) => {
      const current = prev.beerCount ?? 0;
      const nextCount = Math.max(0, current + delta);
      const earnedXp = delta > 0 ? 10 * delta : 0;
      const nextPoints = prev.points + earnedXp;
      const calc = calculateLevel(nextPoints);

      if (tripId && tripId !== "demo" && prev.userId) {
        updateUserBeerCount(tripId, prev.userId, nextCount, earnedXp).catch((err) => {
          console.warn("Could not sync beer count to Firestore:", err);
        });
      }

      return {
        ...prev,
        beerCount: nextCount,
        points: nextPoints,
        level: calc.level,
        levelTitle: calc.title,
      };
    });

    if (delta > 0) {
      setXpGainAlert({ amount: 10 * delta, reason: `${delta} Bier gezapft 🍺` });
      setTimeout(() => {
        setXpGainAlert(null);
      }, 3000);

      confetti({
        particleCount: 50,
        spread: 70,
        origin: { y: 0.2, x: 0.85 },
        colors: ["#f59e0b", "#fbbf24", "#d97706", "#fef08a"],
      });
    }
  }, [profile.tripId]);

  const setBeerCount = useCallback((count: number, overrideTripId?: string) => {
    const tripId = overrideTripId || profile.tripId || "demo";
    const nextCount = Math.max(0, count);

    setProfile((prev) => {
      const current = prev.beerCount ?? 0;
      const diff = nextCount - current;
      const earnedXp = diff > 0 ? 10 * diff : 0;
      const nextPoints = prev.points + earnedXp;
      const calc = calculateLevel(nextPoints);

      if (tripId && tripId !== "demo" && prev.userId) {
        updateUserBeerCount(tripId, prev.userId, nextCount, earnedXp).catch((err) => {
          console.warn("Could not sync beer count to Firestore:", err);
        });
      }

      return {
        ...prev,
        beerCount: nextCount,
        points: nextPoints,
        level: calc.level,
        levelTitle: calc.title,
      };
    });

    confetti({
      particleCount: 40,
      spread: 60,
      origin: { y: 0.2, x: 0.85 },
      colors: ["#f59e0b", "#fbbf24", "#d97706"],
    });
  }, [profile.tripId]);

  return (
    <GamificationContext.Provider
      value={{
        profile,
        levelInfo,
        totalStampsCount: PASSPORT_STAMPS.length,
        totalBadgesCount: BADGES_CATALOG.length,
        updateProfile,
        syncFromProfiles,
        addXp,
        updateBeerCount,
        setBeerCount,
        xpGainAlert,
      }}
    >
      {children}
    </GamificationContext.Provider>
  );
}

export function useGamification(): GamificationContextType {
  const context = useContext(GamificationContext);
  if (!context) {
    throw new Error("useGamification must be used within a GamificationProvider");
  }
  return context;
}
