"use client";

import React from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { TimelineItem } from "@/types";
import { TimelineCard } from "./TimelineCard";
import { Category3DIcon } from "./Category3DIcon";
import { Plus, ChevronDown } from "lucide-react";

interface TimelineDayColumnProps {
  dayId: string;
  dayNumber: number;
  dateStr: string;
  city: string;
  isPool?: boolean;
  items: TimelineItem[];
  currentUserId?: string;
  currentUserName?: string;
  userCheckins?: Record<string, string>;
  isCollapsed?: boolean;
  isEditMode?: boolean;
  expandedItemId?: string | null;
  onToggleCollapse?: (dayId: string) => void;
  onToggleExpand?: (itemId: string) => void;
  onAddItem: (dayId: string, city: string) => void;
  onEdit?: (item: TimelineItem) => void;
  onDeleteItem: (itemId: string) => void;
  onVoteItem?: (itemId: string, voteType: "up" | "down") => void;
  onProposeTime?: (itemId: string, proposedTime: string) => void;
  onVoteTimeProposal?: (itemId: string, proposalId: string) => void;
  onApplyTime?: (itemId: string, newTime: string) => void;
  onCheckIn?: (itemId: string, itemTitle: string, itemType: string, city: string) => void;
}

/**
 * Compact, collapsible day section ("Agenda" style, mobile-first).
 * The whole section is a droppable target – even when collapsed.
 */
export function TimelineDayColumn({
  dayId,
  dayNumber,
  dateStr,
  city,
  isPool = false,
  items,
  currentUserId,
  currentUserName,
  userCheckins = {},
  isCollapsed = false,
  isEditMode = false,
  expandedItemId = null,
  onToggleCollapse,
  onToggleExpand,
  onAddItem,
  onEdit,
  onDeleteItem,
  onVoteItem,
  onProposeTime,
  onVoteTimeProposal,
  onApplyTime,
  onCheckIn,
}: TimelineDayColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: dayId,
    data: { type: "Column", dayId, city, isPool },
  });

  const stampedCount = items.filter((i) => Boolean(userCheckins[i.id])).length;
  const isTransferDay = city.includes("→");

  return (
    <section
      ref={setNodeRef}
      id={`plan-day-${dayId}`}
      aria-label={isPool ? "Ideen-Pool" : `Tag ${dayNumber}: ${city}`}
      className={`scroll-mt-32 rounded-2xl border transition-all duration-200 ${
        isOver
          ? "border-indigo-400 bg-indigo-50/70 dark:bg-indigo-950/30 ring-2 ring-indigo-500/25"
          : isPool
          ? "border-dashed border-purple-300/70 dark:border-purple-800/50 bg-purple-50/40 dark:bg-purple-950/10"
          : "border-slate-200/80 dark:border-neutral-800/80 bg-slate-50/70 dark:bg-neutral-900/40"
      }`}
    >
      {/* ================= HEADER ================= */}
      <div className="flex items-center gap-2 pl-2 pr-1.5 py-1.5">
        <button
          type="button"
          onClick={() => onToggleCollapse?.(dayId)}
          aria-expanded={!isCollapsed}
          className="flex items-center gap-2.5 flex-1 min-w-0 text-left py-0.5"
        >
          {/* Day badge */}
          <span
            className={`w-8 h-8 rounded-xl flex flex-col items-center justify-center shrink-0 leading-none ${
              isPool
                ? "bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-300"
                : items.length > 0
                ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900"
                : "bg-white dark:bg-neutral-800 text-slate-500 dark:text-neutral-400 ring-1 ring-slate-200 dark:ring-neutral-700"
            }`}
          >
            {isPool ? (
              <span className="text-sm">🧩</span>
            ) : (
              <>
                <span className="text-[8px] font-bold uppercase opacity-60">Tag</span>
                <span className="text-sm font-black font-mono">{dayNumber}</span>
              </>
            )}
          </span>

          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-1.5 text-[13px] font-bold text-slate-900 dark:text-white truncate">
              <span className="truncate">{isPool ? "Ideen-Pool" : city}</span>
              {isTransferDay && (
                <span className="shrink-0 text-[9px] font-bold uppercase tracking-wide px-1.5 py-px rounded bg-cyan-100 dark:bg-cyan-500/15 text-cyan-700 dark:text-cyan-300">
                  Reisetag
                </span>
              )}
            </span>
            <span className="block text-[11px] text-slate-500 dark:text-neutral-400 truncate">
              {isPool ? "Noch nicht eingeplant" : dateStr}
              {items.length === 0 && !isPool && " · frei"}
              {items.length > 0 && (
                <>
                  {" · "}
                  {items.length} {items.length === 1 ? "Stopp" : "Stopps"}
                  {stampedCount > 0 && ` · ${stampedCount} 🛂`}
                </>
              )}
            </span>
          </span>

          {/* Mini icon preview when collapsed */}
          {isCollapsed && items.length > 0 && (
            <span className="flex items-center -space-x-1.5 shrink-0">
              {items.slice(0, 4).map((it) => (
                <span
                  key={it.id}
                  className="w-6 h-6 rounded-full bg-white dark:bg-neutral-900 ring-2 ring-slate-50 dark:ring-neutral-900 flex items-center justify-center"
                >
                  <Category3DIcon type={it.type} size={16} animateOnHover={false} />
                </span>
              ))}
              {items.length > 4 && (
                <span className="w-6 h-6 rounded-full bg-slate-200 dark:bg-neutral-800 ring-2 ring-slate-50 dark:ring-neutral-900 text-[9px] font-bold text-slate-600 dark:text-neutral-300 flex items-center justify-center">
                  +{items.length - 4}
                </span>
              )}
            </span>
          )}

          <ChevronDown
            className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
              isCollapsed ? "-rotate-90" : ""
            }`}
          />
        </button>

        <button
          type="button"
          onClick={() => onAddItem(dayId, city)}
          aria-label={isPool ? "Idee hinzufügen" : `Baustein zu Tag ${dayNumber} hinzufügen`}
          className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all active:scale-90 ${
            isPool
              ? "bg-purple-600 text-white shadow-sm shadow-purple-600/30 hover:bg-purple-500"
              : "text-slate-500 dark:text-neutral-400 hover:bg-white dark:hover:bg-neutral-800 hover:text-indigo-600"
          }`}
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* ================= BODY ================= */}
      {!isCollapsed && (items.length > 0 || isEditMode || isOver || isPool) && (
        <div className="px-1.5 pb-1.5 flex flex-col gap-1.5">
          <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
            {items.map((item) => (
              <TimelineCard
                key={item.id}
                item={item}
                currentUserId={currentUserId}
                currentUserName={currentUserName}
                isCheckedIn={Boolean(userCheckins[item.id])}
                isEditMode={isEditMode}
                isExpanded={expandedItemId === item.id}
                onToggleExpand={onToggleExpand}
                onEdit={onEdit}
                onDelete={onDeleteItem}
                onVoteItem={onVoteItem}
                onProposeTime={onProposeTime}
                onVoteTimeProposal={onVoteTimeProposal}
                onApplyTime={onApplyTime}
                onCheckIn={onCheckIn}
              />
            ))}
          </SortableContext>

          {items.length === 0 && (isEditMode || isOver || isPool) && (
            <button
              type="button"
              onClick={() => onAddItem(dayId, city)}
              className={`h-10 rounded-xl border border-dashed text-[11px] font-medium flex items-center justify-center gap-1.5 transition-colors ${
                isOver
                  ? "border-indigo-400 text-indigo-600 dark:text-indigo-300"
                  : "border-slate-300/80 dark:border-neutral-700 text-slate-400 dark:text-neutral-500 hover:text-slate-700 dark:hover:text-neutral-300 hover:border-slate-400"
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              {isOver ? "Hier loslassen" : isPool ? "Erste Idee sammeln" : "Noch frei – Baustein hinzufügen"}
            </button>
          )}
        </div>
      )}
    </section>
  );
}
