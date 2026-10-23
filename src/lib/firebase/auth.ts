import {
  signInWithPopup,
  signInAnonymously,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, googleProvider, db } from "./config";
import { UserProfile, PublicUserProfile } from "@/types";

/**
 * Sign in using Google Sign-In
 */
export async function signInWithGoogle(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  await syncUserProfile(result.user);
  return result.user;
}

/**
 * Sign in as guest (for quick testing or passwordless demo)
 */
export async function signInAsGuest(customDisplayName?: string): Promise<User> {
  const result = await signInAnonymously(auth);
  await syncUserProfile(result.user, customDisplayName || "Travel Buddy (Guest)");
  return result.user;
}

/**
 * Send passwordless Magic Link via Firebase Auth
 */
export async function sendPasswordlessEmailLink(email: string, redirectUrl?: string): Promise<void> {
  const actionCodeSettings = {
    url: redirectUrl || (typeof window !== "undefined" ? window.location.origin + "/login/verify" : "http://localhost:3000/login/verify"),
    handleCodeInApp: true,
  };
  await sendSignInLinkToEmail(auth, email, actionCodeSettings);
  if (typeof window !== "undefined") {
    window.localStorage.setItem("emailForSignIn", email);
  }
}

/**
 * Complete sign in with passwordless email link
 */
export async function completePasswordlessSignIn(email?: string): Promise<User | null> {
  if (typeof window === "undefined") return null;
  const href = window.location.href;
  if (!isSignInWithEmailLink(auth, href)) return null;

  let emailToUse = email;
  if (!emailToUse) {
    emailToUse = window.localStorage.getItem("emailForSignIn") || "";
  }
  if (!emailToUse) {
    emailToUse = window.prompt("Bitte bestätige deine E-Mail-Adresse für die Anmeldung:") || "";
  }

  const result = await signInWithEmailLink(auth, emailToUse, href);
  window.localStorage.removeItem("emailForSignIn");
  await syncUserProfile(result.user);
  return result.user;
}

/**
 * Sign out current user
 */
export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
}

/**
 * Synchronize user profile into Firestore:
 * - /users/{userId} contains private PII (email)
 * - /users_public/{userId} contains public display name and avatar
 */
export async function syncUserProfile(user: User, fallbackName?: string): Promise<void> {
  if (!user) return;
  const displayName = user.displayName || fallbackName || user.email?.split("@")[0] || "Traveler";
  const photoURL = user.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.uid}`;

  try {
    // 1. Private User Profile (PII safe)
    const userRef = doc(db, "users", user.uid);
    await setDoc(
      userRef,
      {
        uid: user.uid,
        email: user.email || "",
        displayName,
        photoURL,
        lastActiveAt: serverTimestamp(),
      },
      { merge: true }
    );

    // 2. Public User Profile (For collaborative views, timeline, and presence)
    const publicUserRef = doc(db, "users_public", user.uid);
    await setDoc(
      publicUserRef,
      {
        uid: user.uid,
        displayName,
        photoURL,
      },
      { merge: true }
    );
  } catch (err) {
    console.warn("Could not sync user profile to Firestore (may need database creation):", err);
  }
}
