"use client";

import React from "react";
import { useDraggable } from "@dnd-kit/core";
import { ActivityType } from "@/types";
import { Category3DIcon } from "./Category3DIcon";
import { getCategoryMeta } from "./TimelineCard";

export interface CategoryTemplateDef {
  id: ActivityType;
  label: string;
  defaultTitle: string;
  color: string;
  accentClass: string;
  badgeBorder: string;
  description: string;
}

export const CATEGORY_TEMPLATES: CategoryTemplateDef[] = [
  {
    id: "restaurant",
    label: "Restaurant",
    defaultTitle: "Neues Restaurant / Food",
    color: "from-amber-500/15 via-orange-500/10 to-amber-500/5",
    accentClass: "border-amber-400/40 text-amber-700 dark:text-amber-300 hover:border-amber-500 hover:shadow-amber-500/20",
    badgeBorder: "bg-amber-50 dark:bg-amber-500/15 border-amber-300 dark:border-amber-500/30",
    description: "Essen, Brunch, Lunch oder Dinner",
  },
  {
    id: "bar",
    label: "Bar & Drinks",
    defaultTitle: "Neue Bar & Nightlife",
    color: "from-pink-500/15 via-rose-500/10 to-pink-500/5",
    accentClass: "border-pink-400/40 text-pink-700 dark:text-pink-300 hover:border-pink-500 hover:shadow-pink-500/20",
    badgeBorder: "bg-pink-50 dark:bg-pink-500/15 border-pink-300 dark:border-pink-500/30",
    description: "Drinks, Biergarten, Pub oder Club",
  },
  {
    id: "activity",
    label: "Aktivität",
    defaultTitle: "Neue Aktivität / Action",
    color: "from-blue-500/15 via-sky-500/10 to-blue-500/5",
    accentClass: "border-blue-400/40 text-blue-700 dark:text-blue-300 hover:border-blue-500 hover:shadow-blue-500/20",
    badgeBorder: "bg-blue-50 dark:bg-blue-500/15 border-blue-300 dark:border-blue-500/30",
    description: "Action, Tour, Sport oder Abenteuer",
  },
  {
    id: "culture",
    label: "Kultur & Museen",
    defaultTitle: "Neues Sightseeing / Kultur",
    color: "from-emerald-500/15 via-teal-500/10 to-emerald-500/5",
    accentClass: "border-emerald-400/40 text-emerald-700 dark:text-emerald-300 hover:border-emerald-500 hover:shadow-emerald-500/20",
    badgeBorder: "bg-emerald-50 dark:bg-emerald-500/15 border-emerald-300 dark:border-emerald-500/30",
    description: "Museum, Sightseeing, Schloss & Historie",
  },
  {
    id: "accommodation",
    label: "Unterkunft",
    defaultTitle: "Neue Unterkunft / Hotel",
    color: "from-purple-500/15 via-violet-500/10 to-purple-500/5",
    accentClass: "border-purple-400/40 text-purple-700 dark:text-purple-300 hover:border-purple-500 hover:shadow-purple-500/20",
    badgeBorder: "bg-purple-50 dark:bg-purple-500/15 border-purple-300 dark:border-purple-500/30",
    description: "Hotel, Airbnb, Hostel oder Resort",
  },
  {
    id: "transport",
    label: "Transport",
    defaultTitle: "Neuer Transport / Fahrt",
    color: "from-cyan-500/15 via-sky-500/10 to-cyan-500/5",
    accentClass: "border-cyan-400/40 text-cyan-700 dark:text-cyan-300 hover:border-cyan-500 hover:shadow-cyan-500/20",
    badgeBorder: "bg-cyan-50 dark:bg-cyan-500/15 border-cyan-300 dark:border-cyan-500/30",
    description: "Zug, Flixbus, Flug oder Roadtrip",
  },
  {
    id: "timeslot",
    label: "Zeitslot",
    defaultTitle: "Neuer Zeitslot / Treffpunkt",
    color: "from-sky-500/15 via-indigo-500/10 to-sky-500/5",
    accentClass: "border-sky-400/40 text-sky-700 dark:text-sky-300 hover:border-sky-500 hover:shadow-sky-500/20",
    badgeBorder: "bg-sky-50 dark:bg-sky-500/15 border-sky-300 dark:border-sky-500/30",
    description: "Feste Uhrzeit, Meeting & Slot",
  },
];

interface QuickCategoryItemProps {
  template: CategoryTemplateDef;
  onQuickAdd?: (template: CategoryTemplateDef) => void;
}

/** Icon-only template chip: tap = quick add, long-press / drag = drop into a day. */
function QuickDraggableCategoryChip({ template, onQuickAdd }: QuickCategoryItemProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `template-${template.id}`,
    data: {
      type: "CategoryTemplate",
      category: template.id,
      label: template.label,
      defaultTitle: template.defaultTitle,
    },
  });

  const meta = getCategoryMeta(template.id);

  return (
    <button
      type="button"
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      id={`quick-add-${template.id}`}
      onClick={() => onQuickAdd?.(template)}
      title={`${template.label} – tippen zum Hinzufügen, ziehen zum Platzieren`}
      className={`group flex flex-col items-center gap-1 w-14 shrink-0 select-none transition-all ${
        isDragging ? "opacity-30 scale-90" : "active:scale-90"
      }`}
    >
      <span
        className={`w-11 h-11 rounded-2xl flex items-center justify-center ${meta.tile} ring-1 ring-black/5 dark:ring-white/5 group-hover:-translate-y-0.5 group-hover:shadow-md transition-all`}
      >
        <Category3DIcon type={template.id} size={28} animateOnHover={false} />
      </span>
      <span className="text-[10px] font-semibold text-slate-600 dark:text-neutral-400 leading-none truncate max-w-full">
        {meta.label}
      </span>
    </button>
  );
}

interface QuickCategoryBarProps {
  onQuickAdd?: (template: CategoryTemplateDef) => void;
}

export function QuickCategoryBar({ onQuickAdd }: QuickCategoryBarProps) {
  return (
    <div className="plan-reveal rounded-2xl bg-white/80 dark:bg-neutral-900/70 border border-slate-200/80 dark:border-neutral-800 px-2 pt-2 pb-1.5">
      <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
        {CATEGORY_TEMPLATES.map((tpl) => (
          <QuickDraggableCategoryChip key={tpl.id} template={tpl} onQuickAdd={onQuickAdd} />
        ))}
      </div>
      <p className="mt-1 text-center text-[10px] text-slate-400 dark:text-neutral-500">
        Tippen = in den Pool · Gedrückt halten &amp; ziehen = direkt in einen Tag
      </p>
    </div>
  );
}
