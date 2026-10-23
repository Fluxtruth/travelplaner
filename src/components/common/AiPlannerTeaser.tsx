"use client";

import React from "react";
import { Sparkles, Bot, Lock, ArrowUpRight } from "lucide-react";

export function AiPlannerTeaser() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-dashed border-slate-300 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/40 p-6 backdrop-blur-xl opacity-90 transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-200 dark:border-purple-500/20 shrink-0">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                AI Auto-Planner Agent
                <Sparkles className="w-3.5 h-3.5 text-purple-500 dark:text-purple-400" />
              </h4>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-400 border border-slate-200 dark:border-neutral-700">
                Coming Soon • Backlog
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-neutral-400 leading-relaxed max-w-xl">
              Automatisierte Routen- und Unterkunftsvorschläge basierend auf den Vorlieben eurer Gruppe.
              Die Architektur ist vorbereitet und wird in der nächsten Version freigeschaltet.
            </p>
          </div>
        </div>

        <button
          disabled
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-neutral-800/80 border border-slate-200 dark:border-neutral-700/60 text-slate-400 dark:text-neutral-500 text-xs font-semibold cursor-not-allowed w-fit shrink-0"
        >
          <Lock className="w-3.5 h-3.5" />
          <span>Vorschläge generieren</span>
        </button>
      </div>
    </div>
  );
}
