"use client";

import React, { useState } from "react";
import { X, Copy, Check, Share2, QrCode } from "lucide-react";

interface ShareTripModalProps {
  inviteCode: string;
  tripName: string;
  onClose: () => void;
}

export function ShareTripModal({ inviteCode, tripName, onClose }: ShareTripModalProps) {
  const [copied, setCopied] = useState(false);

  const inviteUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/join/${inviteCode}`
      : `http://localhost:3000/join/${inviteCode}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.warn("Failed to copy invite link:", err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-3xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 p-6 shadow-2xl transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-200 dark:border-blue-500/30">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Freunde einladen</h3>
              <p className="text-xs text-slate-500 dark:text-neutral-400">{tripName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:text-neutral-400 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="mt-5 space-y-4">
          <p className="text-xs text-slate-600 dark:text-neutral-300 leading-relaxed">
            Teile diesen Link mit deinen Freunden. Sobald sie den Link öffnen,
            treten sie automatisch dieser Reise bei und können mitabstimmen!
          </p>

          {/* Link Box */}
          <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800">
            <input
              type="text"
              readOnly
              value={inviteUrl}
              className="flex-1 bg-transparent text-xs text-slate-800 dark:text-neutral-200 font-mono px-2 py-1 outline-none select-all"
            />
            <button
              onClick={handleCopy}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                copied
                  ? "bg-emerald-500 text-slate-950 font-bold"
                  : "bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/20"
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  Kopiert!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  Kopieren
                </>
              )}
            </button>
          </div>

          {/* Invite Code directly */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-neutral-950/60 border border-slate-200 dark:border-neutral-800/80 flex items-center justify-between">
            <span className="text-xs text-slate-500 dark:text-neutral-400">Einladungscode:</span>
            <span className="font-mono text-sm font-bold tracking-widest text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-2.5 py-0.5 rounded-md border border-blue-200 dark:border-blue-500/20">
              {inviteCode}
            </span>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-200 dark:border-neutral-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-xs font-semibold text-white transition-colors"
          >
            Fertig
          </button>
        </div>
      </div>
    </div>
  );
}
