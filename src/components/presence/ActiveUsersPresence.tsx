"use client";

import React, { useEffect, useState } from "react";
import { PresenceUser, PlanViewType } from "@/types";
import { subscribeToPresence, updatePresence } from "@/lib/firebase/firestore";
import { Users, Eye, Sparkles } from "lucide-react";

interface ActiveUsersPresenceProps {
  tripId: string;
  currentUser?: {
    uid: string;
    displayName?: string | null;
    photoURL?: string | null;
  } | null;
  currentView: PlanViewType;
}

export function ActiveUsersPresence({
  tripId,
  currentUser,
  currentView,
}: ActiveUsersPresenceProps) {
  const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([]);

  // 1. Heartbeat to keep current user online in Firestore
  useEffect(() => {
    if (!tripId || !currentUser?.uid) return;

    // Send immediate presence update
    updatePresence(tripId, currentUser, currentView).catch(() => {});

    // Send periodic heartbeat every 20 seconds
    const interval = setInterval(() => {
      updatePresence(tripId, currentUser, currentView).catch(() => {});
    }, 20000);

    return () => clearInterval(interval);
  }, [tripId, currentUser, currentView]);

  // 2. Real-time subscription to online users in this trip
  useEffect(() => {
    if (!tripId) return;
    const unsubscribe = subscribeToPresence(tripId, (users) => {
      setOnlineUsers(users);
    });
    return () => unsubscribe();
  }, [tripId]);

  return (
    <div className="flex items-center">
      {/* Active Avatars Stack */}
      <div className="flex -space-x-1.5 overflow-hidden items-center py-0.5">
        {onlineUsers.map((u) => {
          const isMe = currentUser?.uid === u.userId;
          return (
            <div
              key={u.userId}
              title={`${u.displayName || "Traveler"}${isMe ? " (Du)" : ""} - online`}
              className="relative group transition-transform hover:scale-110 hover:z-20 cursor-pointer"
            >
              <img
                src={u.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${u.userId}`}
                alt={u.displayName}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 border-white dark:border-neutral-900 bg-slate-100 dark:bg-neutral-800 object-cover shadow-xs"
              />
              {/* Online pulse indicator */}
              <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 ring-1.5 ring-white dark:ring-neutral-900" />

              {/* Hover Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:flex flex-col items-center pointer-events-none z-30">
                <div className="px-2 py-0.5 rounded-md bg-neutral-950 border border-neutral-800 text-[10px] text-white whitespace-nowrap shadow-xl">
                  <span className="font-semibold">{u.displayName}</span>
                  {isMe && <span className="text-blue-400 font-normal"> (Du)</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
