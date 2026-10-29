"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, onAuthStateChanged, getRedirectResult } from "firebase/auth";
import { auth } from "@/lib/firebase/config";
import {
  signInWithGoogle as authSignInWithGoogle,
  signInWithGoogleRedirect as authSignInWithGoogleRedirect,
  signInAsGuest as authSignInAsGuest,
  signOut as authSignOut,
  syncUserProfile,
} from "@/lib/firebase/auth";
import { UserProfile } from "@/types";

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<User>;
  signInWithGoogleRedirect: () => Promise<void>;
  signInAsGuest: (name?: string) => Promise<User>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Process redirect result if coming back from OAuth redirect (iOS/Safari fallback)
    getRedirectResult(auth)
      .then(async (result) => {
        if (result?.user) {
          await syncUserProfile(result.user);
        }
      })
      .catch((err) => {
        console.warn("Redirect sign-in check error:", err);
      });
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setProfile({
          uid: currentUser.uid,
          email: currentUser.email || "",
          displayName: currentUser.displayName || currentUser.email?.split("@")[0] || "Traveler",
          photoURL: currentUser.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${currentUser.uid}`,
          createdAt: new Date().toISOString(),
        });
        // Background sync
        syncUserProfile(currentUser).catch(() => {});
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      return await authSignInWithGoogle();
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignInRedirect = async () => {
    setLoading(true);
    try {
      await authSignInWithGoogleRedirect();
    } finally {
      setLoading(false);
    }
  };

  const handleGuestSignIn = async (name?: string) => {
    setLoading(true);
    try {
      return await authSignInAsGuest(name);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    try {
      await authSignOut();
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        signInWithGoogle: handleGoogleSignIn,
        signInWithGoogleRedirect: handleGoogleSignInRedirect,
        signInAsGuest: handleGuestSignIn,
        signOut: handleSignOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
