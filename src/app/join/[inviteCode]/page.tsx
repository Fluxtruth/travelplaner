"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { joinTripByInviteCode } from "@/lib/firebase/firestore";
import { Users, Compass, CheckCircle2 } from "lucide-react";

function JoinTripContent() {
  const params = useParams();
  const inviteCode = (params?.inviteCode as string) || "";
  const router = useRouter();
  const { user, signInWithGoogle, signInAsGuest } = useAuth();

  const [status, setStatus] = useState<"loading" | "prompt-auth" | "joining" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function attemptJoin() {
      if (!inviteCode) return;

      if (!user) {
        setStatus("prompt-auth");
        return;
      }

      setStatus("joining");
      try {
        const tripId = await joinTripByInviteCode(inviteCode, user.uid);
        if (tripId) {
          setStatus("success");
          setTimeout(() => {
            router.push(`/trips/${tripId}`);
          }, 1200);
        } else {
          setStatus("error");
          setErrorMessage("Ungültiger oder abgelaufener Einladungscode.");
        }
      } catch (err) {
        setStatus("error");
        setErrorMessage("Fehler beim Beitreten der Reise.");
      }
    }

    attemptJoin();
  }, [inviteCode, user, router]);

  const handleAuthAndJoin = async (method: "google" | "guest") => {
    try {
      let authedUser = user;
      if (method === "google") {
        authedUser = await signInWithGoogle();
      } else {
        authedUser = await signInAsGuest("Reise-Buddy");
      }

      if (authedUser) {
        setStatus("joining");
        const tripId = await joinTripByInviteCode(inviteCode, authedUser.uid);
        if (tripId) {
          setStatus("success");
          setTimeout(() => {
            router.push(`/trips/${tripId}`);
          }, 1000);
        } else {
          setStatus("error");
          setErrorMessage("Ungültiger oder abgelaufener Einladungscode.");
        }
      }
    } catch (err) {
      console.warn("Auth join error:", err);
    }
  };

  return (
    <div className="w-full max-w-md rounded-3xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/80 backdrop-blur-xl p-8 text-center shadow-2xl transition-colors">
      <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-4 border border-blue-200 dark:border-blue-500/30">
        <Users className="w-7 h-7" />
      </div>

      <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
        Einladung zur Gruppenreise
      </h1>
      <p className="text-xs text-slate-500 dark:text-neutral-400 font-mono tracking-widest mb-6">
        Code: {inviteCode}
      </p>

      {status === "prompt-auth" && (
        <div className="space-y-4">
          <p className="text-xs text-slate-600 dark:text-neutral-300 leading-relaxed">
            Bitte melde dich mit deinem Google-Konto an, um der Reise beizutreten und mit deiner Gruppe abzustimmen:
          </p>
          <div className="flex flex-col gap-2.5">
            <button
              onClick={() => handleAuthAndJoin("google")}
              className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-950 font-bold text-xs shadow-lg active:scale-95 transition-all cursor-pointer"
            >
              Mit Google anmelden
            </button>
          </div>
        </div>
      )}

      {status === "joining" && (
        <div className="py-6">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-600 dark:text-neutral-300">Du wirst der Reise hinzugefügt...</p>
        </div>
      )}

      {status === "success" && (
        <div className="py-6">
          <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-3 border border-emerald-200 dark:border-emerald-500/30">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <p className="text-sm font-bold text-slate-900 dark:text-white mb-1">Erfolgreich beigetreten!</p>
          <p className="text-xs text-slate-500 dark:text-neutral-400">Weiterleitung zur Planungs-Ansicht...</p>
        </div>
      )}

      {status === "error" && (
        <div className="py-4">
          <p className="text-xs text-red-500 dark:text-red-400 mb-4">{errorMessage}</p>
          <button
            onClick={() => router.push("/")}
            className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-slate-700 dark:text-white text-xs font-semibold transition-colors"
          >
            Zur Startseite
          </button>
        </div>
      )}
    </div>
  );
}

export default function JoinTripPage() {
  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <Suspense
        fallback={
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        }
      >
        <JoinTripContent />
      </Suspense>
    </div>
  );
}
