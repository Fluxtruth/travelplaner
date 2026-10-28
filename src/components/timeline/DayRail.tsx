"use client";

import React, { useEffect, useRef } from "react";
import { useDroppable } from "@dnd-kit/core";
import { DayColumnData } from "@/types";

interface DayRailChipProps {
  col: DayColumnData;
  isActive: boolean;
  onSelect: (dayId: string) => void;
}

/** Single day chip – doubles as a drop target so items can be moved to far-away days. */
function DayRailChip({ col, isActive, onSelect }: DayRailChipProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `rail-${col.id}`,
    data: { type: "Column", dayId: col.id, city: col.city, isPool: col.isPool, isRail: true },
  });

  const shortCity = col.isPool
    ? "Pool"
    : col.city.includes("→")
    ? col.city.split("→")[0].trim().slice(0, 3) + "→" + col.city.split("→")[1].trim().slice(0, 3)
    : col.city.split(" ")[0];

  return (
    <button
      ref={setNodeRef}
      type="button"
      id={`rail-chip-${col.id}`}
      data-rail-chip={col.id}
      onClick={() => onSelect(col.id)}
      className={`relative shrink-0 h-8 sm:h-9 pl-1 pr-2 sm:pr-2.5 rounded-full flex items-center gap-1 sm:gap-1.5 text-[11px] font-semibold transition-all duration-200 ${
        isOver
          ? "bg-indigo-600 text-white scale-105 shadow-md shadow-indigo-500/40"
          : isActive
          ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs"
          : "bg-white dark:bg-neutral-900 text-slate-600 dark:text-neutral-300 ring-1 ring-slate-200 dark:ring-neutral-800 hover:ring-slate-300"
      }`}
    >
      <span
        className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center font-mono text-[10px] sm:text-[11px] font-black ${
          isOver
            ? "bg-white/20"
            : isActive
            ? "bg-white/15 dark:bg-slate-900/10"
            : col.isPool
            ? "bg-purple-100 dark:bg-purple-500/20"
            : "bg-slate-100 dark:bg-neutral-800"
        }`}
      >
        {col.isPool ? "🧩" : col.dayNumber}
      </span>
      <span className="whitespace-nowrap flex items-baseline gap-1">
        <span>{shortCity}</span>
        {col.formattedDate && !col.isPool && (
          <span className="text-[9px] font-mono font-bold opacity-75">{col.formattedDate}</span>
        )}
      </span>
      {col.items.length > 0 && (
        <span
          className={`min-w-3.5 h-3.5 sm:min-w-4 sm:h-4 px-1 rounded-full text-[9px] font-bold flex items-center justify-center ${
            isActive || isOver
              ? "bg-indigo-500 text-white"
              : "bg-slate-100 dark:bg-neutral-800 text-slate-500 dark:text-neutral-400"
          }`}
        >
          {col.items.length}
        </span>
      )}
    </button>
  );
}

interface DayRailProps {
  columns: DayColumnData[];
  activeDayId: string;
  onSelect: (dayId: string) => void;
  trailing?: React.ReactNode;
}

/** Sticky horizontal day navigator ("jump & drop" rail). */
export function DayRail({ columns, activeDayId, onSelect, trailing }: DayRailProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Keep the active chip centered in the rail
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    const chip = container.querySelector<HTMLElement>(`[data-rail-chip="${activeDayId}"]`);
    if (!chip) return;
    container.scrollTo({
      left: chip.offsetLeft - container.clientWidth / 2 + chip.clientWidth / 2,
      behavior: "smooth",
    });
  }, [activeDayId]);

  return (
    <div className="sticky top-14 sm:top-16 z-30 py-1.5 sm:py-2 -mx-2.5 sm:-mx-6 lg:-mx-8 px-2.5 sm:px-6 lg:px-8 bg-slate-50/95 dark:bg-neutral-950/95 backdrop-blur-md border-b border-slate-200/80 dark:border-neutral-800/80">
      <div className="flex items-center gap-1.5 sm:gap-2 w-full min-w-0">
        <div
          ref={scrollRef}
          className="relative flex-1 min-w-0 flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 px-0.5"
        >
          {columns.map((col) => (
            <DayRailChip key={col.id} col={col} isActive={col.id === activeDayId} onSelect={onSelect} />
          ))}
        </div>
        {trailing && <div className="shrink-0 flex items-center">{trailing}</div>}
      </div>
    </div>
  );
}
