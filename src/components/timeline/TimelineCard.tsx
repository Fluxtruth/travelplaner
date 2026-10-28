"use client";

import React, { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { TimelineItem } from "@/types";
import { getBausteinImage, getLinkMetadata } from "@/lib/linkPreview";
import { findMatchingStamp } from "@/lib/gamification/catalog";
import {
  GripVertical,
  Clock,
  MapPin,
  Trash2,
  ExternalLink,
  ThumbsUp,
  ThumbsDown,
  Plus,
  Check,
  ChevronDown,
  Pencil,
  X,
  MessageSquare,
} from "lucide-react";
import { Category3DIcon } from "./Category3DIcon";
import { TimelineItemComments, ParticipantInfo } from "./TimelineItemComments";
import { TimelineCommentReplyTo } from "@/types";

// ---------------------------------------------------------------------------
// Shared category look & feel (used by cards, day headers & quick-add strip)
// ---------------------------------------------------------------------------
export interface CategoryMeta {
  label: string;
  tile: string; // soft tinted background for the icon tile
  dot: string; // solid accent color (dots, indicators)
}

export const CATEGORY_META: Record<string, CategoryMeta> = {
  restaurant: { label: "Essen", tile: "bg-amber-100/80 dark:bg-amber-500/15", dot: "bg-amber-500" },
  food: { label: "Essen", tile: "bg-amber-100/80 dark:bg-amber-500/15", dot: "bg-amber-500" },
  bar: { label: "Bar", tile: "bg-pink-100/80 dark:bg-pink-500/15", dot: "bg-pink-500" },
  activity: { label: "Action", tile: "bg-blue-100/80 dark:bg-blue-500/15", dot: "bg-blue-500" },
  culture: { label: "Kultur", tile: "bg-emerald-100/80 dark:bg-emerald-500/15", dot: "bg-emerald-500" },
  accommodation: { label: "Schlafen", tile: "bg-purple-100/80 dark:bg-purple-500/15", dot: "bg-purple-500" },
  transport: { label: "Fahrt", tile: "bg-cyan-100/80 dark:bg-cyan-500/15", dot: "bg-cyan-500" },
  timeslot: { label: "Zeitslot", tile: "bg-sky-100/80 dark:bg-sky-500/15", dot: "bg-sky-500" },
  custom: { label: "Sonstiges", tile: "bg-slate-100 dark:bg-neutral-800", dot: "bg-slate-400" },
};

export function getCategoryMeta(type: string): CategoryMeta {
  return CATEGORY_META[type] || CATEGORY_META.custom;
}

export function isDraftItem(item: TimelineItem): boolean {
  return /^Neue[sr]?\s/.test(item.title) || (!item.location && !item.url && !item.time);
}

// ---------------------------------------------------------------------------

interface TimelineCardProps {
  item: TimelineItem;
  currentUserId?: string;
  currentUserName?: string;
  currentUserPhoto?: string | null;
  participants?: ParticipantInfo[];
  isOverlay?: boolean;
  isExpanded?: boolean;
  isEditMode?: boolean;
  onToggleExpand?: (itemId: string) => void;
  onEdit?: (item: TimelineItem) => void;
  onDelete?: (itemId: string) => void;
  onVoteItem?: (itemId: string, voteType: "up" | "down") => void;
  onProposeTime?: (itemId: string, proposedTime: string) => void;
  onVoteTimeProposal?: (itemId: string, proposalId: string) => void;
  onApplyTime?: (itemId: string, newTime: string) => void;
  onAddComment?: (
    itemId: string,
    commentData: {
      userId: string;
      userName: string;
      userPhoto?: string;
      text: string;
      mentions?: string[];
      replyTo?: TimelineCommentReplyTo;
    }
  ) => Promise<void> | void;
  onDeleteComment?: (itemId: string, commentId: string) => Promise<void> | void;
}

export function TimelineCard({
  item,
  currentUserId = "guest-user",
  currentUserName,
  currentUserPhoto,
  participants = [],
  isOverlay = false,
  isExpanded = false,
  isEditMode = false,
  onToggleExpand,
  onEdit,
  onDelete,
  onVoteItem,
  onProposeTime,
  onVoteTimeProposal,
  onApplyTime,
  onAddComment,
  onDeleteComment,
}: TimelineCardProps) {
  const [showTimeVoting, setShowTimeVoting] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [newTimeInput, setNewTimeInput] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const sortableData = React.useMemo(() => ({ type: "Item", item }), [item]);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    data: sortableData,
    disabled: isOverlay,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const meta = getCategoryMeta(item.type);
  const isDraft = isDraftItem(item);

  // Passport stamp info
  const matchingStamp = findMatchingStamp(item.title, item.type, item.stopCity || "");
  const stampPoints = matchingStamp?.points || 50;

  const previewImage = getBausteinImage(item.imageUrl, item.url, item.type);
  const linkMeta = item.url ? getLinkMetadata(item.url, item.type) : null;

  // Votes
  const votes = item.votes || {};
  const upVotesCount = Object.values(votes).filter((v) => v === "up").length;
  const downVotesCount = Object.values(votes).filter((v) => v === "down").length;
  const userVote = currentUserId ? votes[currentUserId] : undefined;
  const netScore = upVotesCount - downVotesCount;
  const hasVotes = upVotesCount > 0 || downVotesCount > 0;

  // Time proposals
  const timeProposals = item.timeProposals || [];
  const proposalsCount = timeProposals.length;

  const handleProposeTimeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTimeInput.trim() || !onProposeTime) return;
    onProposeTime(item.id, newTimeInput.trim());
    setNewTimeInput("");
  };

  const iconBtn =
    "h-8 min-w-8 px-2 inline-flex items-center justify-center gap-1 rounded-lg text-[11px] font-semibold transition-all active:scale-95";
  const iconBtnIdle =
    "bg-slate-100/80 dark:bg-neutral-800/80 text-slate-600 dark:text-neutral-300 hover:bg-slate-200 dark:hover:bg-neutral-700";

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative ${isDragging ? "opacity-30" : ""}`}
    >
      <div
        className={`rounded-2xl border transition-all duration-200 ${
          isOverlay
            ? "bg-white dark:bg-neutral-900 border-indigo-400 shadow-2xl shadow-indigo-500/25 ring-2 ring-indigo-500/30 scale-[1.03]"
            : isExpanded
            ? "bg-white dark:bg-neutral-900 border-indigo-300/80 dark:border-indigo-500/40 shadow-lg shadow-indigo-500/5"
            : "bg-white/90 dark:bg-neutral-900/70 border-slate-200/80 dark:border-neutral-800 hover:border-slate-300 dark:hover:border-neutral-700"
        }`}
      >
        {/* ================= COMPACT ROW ================= */}
        <div className="flex items-center gap-1.5 sm:gap-2 p-1.5 sm:p-2 pr-2.5 w-full min-w-0">
          {!isOverlay && (
            <div
              {...attributes}
              {...listeners}
              aria-label="Baustein verschieben"
              title="Gedrückt halten & ziehen zum Verschieben"
              className="touch-none self-stretch flex items-center px-1 text-slate-400 hover:text-indigo-600 dark:text-neutral-500 dark:hover:text-indigo-400 cursor-grab active:cursor-grabbing shrink-0 transition-colors select-none"
            >
              <GripVertical className="w-4 h-4" />
            </div>
          )}

          <button
            type="button"
            id={`plan-item-${item.id}`}
            onClick={() => onToggleExpand?.(item.id)}
            aria-expanded={isExpanded}
            className="flex items-center gap-2 sm:gap-2.5 flex-1 min-w-0 text-left rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50"
          >
            {/* Category icon tile */}
            <span className={`relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 ${meta.tile}`}>
              <Category3DIcon type={item.type} size={24} animateOnHover={false} />
              {isDraft && (
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-amber-400 ring-2 ring-white dark:ring-neutral-900" />
              )}
            </span>

            {/* Title + meta line */}
            <span className="min-w-0 flex-1">
              <span className="block text-xs sm:text-[13px] font-semibold leading-tight text-slate-900 dark:text-neutral-100 truncate">
                {item.title}
              </span>
              <span className="mt-0.5 flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-[11px] text-slate-500 dark:text-neutral-400 min-w-0 truncate">
                {item.time && (
                  <span className="inline-flex items-center gap-0.5 font-mono font-medium text-slate-700 dark:text-neutral-300 shrink-0">
                    <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                    {item.time}
                  </span>
                )}
                {item.location ? (
                  <span className="inline-flex items-center gap-0.5 min-w-0 truncate">
                    <MapPin className="w-2.5 h-2.5 sm:w-3 sm:h-3 shrink-0 text-slate-400" />
                    <span className="truncate">{item.location}</span>
                  </span>
                ) : isDraft ? (
                  <span className="text-amber-600 dark:text-amber-400 font-medium truncate">Tippen zum Befüllen</span>
                ) : (
                  <span className="truncate">{meta.label}</span>
                )}
              </span>
            </span>
          </button>

          {/* Right side: tiny status indicators */}
          <div className="flex items-center gap-1 shrink-0 ml-1">
            {proposalsCount > 0 && (
              <span className="inline-flex items-center gap-0.5 h-5 px-1.5 rounded-md bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 text-[10px] font-bold">
                <Clock className="w-2.5 h-2.5" />
                {proposalsCount}
              </span>
            )}
            {hasVotes && (
              netScore > 0 ? (
                <span
                  title={`${upVotesCount} Dafür, ${downVotesCount} Dagegen (Gesamtstand: +${netScore})`}
                  className={`inline-flex items-center gap-0.5 h-5 px-1.5 rounded-md text-[10px] font-bold ${
                    userVote === "up"
                      ? "bg-emerald-500 text-white shadow-xs"
                      : "bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30"
                  }`}
                >
                  <ThumbsUp className="w-2.5 h-2.5" />
                  <span>+{netScore}</span>
                </span>
              ) : netScore < 0 ? (
                <span
                  title={`${upVotesCount} Dafür, ${downVotesCount} Dagegen (Gesamtstand: ${netScore})`}
                  className={`inline-flex items-center gap-0.5 h-5 px-1.5 rounded-md text-[10px] font-bold ${
                    userVote === "down"
                      ? "bg-rose-500 text-white shadow-xs"
                      : "bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30"
                  }`}
                >
                  <ThumbsDown className="w-2.5 h-2.5" />
                  <span>{netScore}</span>
                </span>
              ) : (
                <span
                  title={`${upVotesCount} Dafür, ${downVotesCount} Dagegen (Ausgeglichen: 0)`}
                  className="inline-flex items-center gap-1 h-5 px-1.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-400 border border-slate-200 dark:border-neutral-700"
                >
                  <span className="flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400">
                    <ThumbsUp className="w-2 h-2" />
                    {upVotesCount}
                  </span>
                  <span className="text-slate-300 dark:text-neutral-600">/</span>
                  <span className="flex items-center gap-0.5 text-rose-600 dark:text-rose-400">
                    <ThumbsDown className="w-2 h-2" />
                    {downVotesCount}
                  </span>
                </span>
              )
            )}
            {/* Comment Count Badge (Header) */}
            {(item.comments?.length || 0) > 0 && (
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isExpanded) onToggleExpand?.(item.id);
                  setShowComments(true);
                }}
                className="inline-flex items-center gap-1 h-5 px-1.5 rounded-md text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60 cursor-pointer hover:bg-indigo-100 dark:hover:bg-indigo-900/50"
                title={`${item.comments?.length} ${item.comments?.length === 1 ? "Kommentar" : "Kommentare"}`}
              >
                <MessageSquare className="w-2.5 h-2.5" />
                <span>{item.comments?.length}</span>
              </span>
            )}
            {!isOverlay && (
              <ChevronDown
                className={`w-4 h-4 text-slate-300 dark:text-neutral-600 transition-transform duration-200 ${
                  isExpanded ? "rotate-180 text-indigo-500" : ""
                }`}
              />
            )}
          </div>
        </div>

        {/* ================= EXPANDED DETAIL ================= */}
        {isExpanded && !isOverlay && (
          <div className="plan-reveal px-2 pb-2 space-y-2">
            {(previewImage || item.notes) && (
              <div className="flex gap-2">
                {previewImage && (
                  <div className="relative w-24 h-16 rounded-xl overflow-hidden shrink-0 bg-slate-100 dark:bg-neutral-950">
                    <img src={previewImage} alt={item.title} className="w-full h-full object-cover" />
                  </div>
                )}
                {item.notes && (
                  <p className="flex-1 text-[11px] leading-snug text-slate-600 dark:text-neutral-400 bg-slate-50 dark:bg-neutral-950/60 rounded-xl px-2.5 py-1.5 line-clamp-4">
                    {item.notes}
                  </p>
                )}
              </div>
            )}

            {/* Icon action bar */}
            <div className="flex items-center justify-between gap-1.5 flex-wrap pt-2 border-t border-slate-100 dark:border-neutral-800/70">
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => onVoteItem?.(item.id, "up")}
                  aria-label="Dafür stimmen"
                  className={`${iconBtn} ${
                    userVote === "up" ? "bg-emerald-500 text-white shadow-sm shadow-emerald-500/30" : iconBtnIdle
                  }`}
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                  {upVotesCount > 0 && <span className="text-[11px] font-bold">{upVotesCount}</span>}
                </button>
                <button
                  type="button"
                  onClick={() => onVoteItem?.(item.id, "down")}
                  aria-label="Dagegen stimmen"
                  className={`${iconBtn} ${
                    userVote === "down" ? "bg-rose-500 text-white shadow-sm shadow-rose-500/30" : iconBtnIdle
                  }`}
                >
                  <ThumbsDown className="w-3.5 h-3.5" />
                  {downVotesCount > 0 && <span className="text-[11px] font-bold">{downVotesCount}</span>}
                </button>
                <button
                  type="button"
                  onClick={() => setShowTimeVoting((v) => !v)}
                  aria-label="Uhrzeit abstimmen"
                  className={`${iconBtn} ${
                    showTimeVoting ? "bg-sky-500 text-white shadow-sm shadow-sky-500/30" : iconBtnIdle
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  {proposalsCount > 0 && <span className="text-[11px] font-bold">{proposalsCount}</span>}
                </button>
                <button
                  type="button"
                  onClick={() => setShowComments((v) => !v)}
                  aria-label="Kommentare & Diskussion"
                  title="Kommentare & Chatverlauf"
                  className={`${iconBtn} ${
                    showComments
                      ? "bg-indigo-600 text-white shadow-sm shadow-indigo-500/30"
                      : (item.comments?.length || 0) > 0
                      ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60"
                      : iconBtnIdle
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  {(item.comments?.length || 0) > 0 && (
                    <span className="text-[11px] font-bold">{item.comments?.length}</span>
                  )}
                </button>
                {item.url && (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={linkMeta?.badgeLabel || "Link öffnen"}
                    title={linkMeta?.badgeLabel || "Link öffnen"}
                    className={`${iconBtn} ${iconBtnIdle}`}
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>

              <div className="flex items-center gap-1 shrink-0 ml-auto">
                {onEdit && (
                  <button
                    type="button"
                    onClick={() => onEdit(item)}
                    aria-label="Baustein bearbeiten"
                    className={`${iconBtn} ${
                      isDraft ? "bg-amber-400 text-amber-950 shadow-sm shadow-amber-400/30" : iconBtnIdle
                    }`}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    {isDraft && <span className="text-[11px] font-bold">Befüllen</span>}
                  </button>
                )}
                {onDelete &&
                  (confirmDelete ? (
                    <button
                      type="button"
                      onClick={() => onDelete(item.id)}
                      onBlur={() => setConfirmDelete(false)}
                      autoFocus
                      className={`${iconBtn} bg-rose-600 text-white`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span className="text-[11px] font-bold">Löschen?</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(true)}
                      aria-label="Baustein löschen"
                      className={`${iconBtn} ${iconBtnIdle} hover:text-rose-600!`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  ))}
              </div>
            </div>

            {/* Time voting drawer */}
            {showTimeVoting && (
              <div className="plan-reveal rounded-xl bg-slate-50 dark:bg-neutral-950/70 p-1.5 space-y-1">
                {timeProposals.map((prop) => {
                  const hasVoted = prop.votes?.includes(currentUserId);
                  const isOfficialTime = item.time === prop.time;
                  return (
                    <div
                      key={prop.id}
                      className={`flex items-center gap-2 h-8 pl-2.5 pr-1 rounded-lg text-xs ${
                        isOfficialTime
                          ? "bg-emerald-50 dark:bg-emerald-500/10 ring-1 ring-emerald-400/50"
                          : "bg-white dark:bg-neutral-900"
                      }`}
                    >
                      <span className="font-mono font-bold text-slate-900 dark:text-white">{prop.time}</span>
                      <span className="text-[10px] text-slate-400 truncate flex-1">
                        {prop.proposerName || "Freund"}
                      </span>
                      <button
                        type="button"
                        onClick={() => onVoteTimeProposal?.(item.id, prop.id)}
                        className={`h-6 px-2 rounded-md text-[11px] font-bold inline-flex items-center gap-1 ${
                          hasVoted
                            ? "bg-sky-500 text-white"
                            : "bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-300"
                        }`}
                      >
                        <ThumbsUp className="w-3 h-3" />
                        {prop.votes?.length || 0}
                      </button>
                      {isOfficialTime ? (
                        <span className="w-6 h-6 flex items-center justify-center text-emerald-600">
                          <Check className="w-3.5 h-3.5" strokeWidth={3} />
                        </span>
                      ) : (
                        onApplyTime && (
                          <button
                            type="button"
                            onClick={() => onApplyTime(item.id, prop.time)}
                            title="Als offizielle Uhrzeit festlegen"
                            className="w-6 h-6 rounded-md flex items-center justify-center text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        )
                      )}
                    </div>
                  );
                })}

                <form onSubmit={handleProposeTimeSubmit} className="flex gap-1">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={newTimeInput}
                    onChange={(e) => setNewTimeInput(e.target.value)}
                    placeholder={proposalsCount === 0 ? "Uhrzeit vorschlagen, z.B. 19:00" : "Andere Uhrzeit…"}
                    className="flex-1 min-w-0 h-8 px-2.5 rounded-lg bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 text-slate-900 dark:text-white text-xs font-mono focus:outline-none focus:border-sky-500"
                  />
                  <button
                    type="submit"
                    disabled={!newTimeInput.trim()}
                    aria-label="Uhrzeit vorschlagen"
                    className="w-8 h-8 rounded-lg bg-sky-500 hover:bg-sky-400 disabled:opacity-40 text-white flex items-center justify-center"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowTimeVoting(false)}
                    aria-label="Schließen"
                    className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-neutral-200 flex items-center justify-center"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </form>
              </div>
            )}

            {/* Comments Thread & Chatverlauf */}
            {showComments && onAddComment && (
              <div className="plan-reveal mt-2">
                <TimelineItemComments
                  itemId={item.id}
                  itemTitle={item.title}
                  comments={item.comments}
                  currentUserId={currentUserId}
                  currentUserName={currentUserName || "Traveler"}
                  currentUserPhoto={currentUserPhoto}
                  participants={participants}
                  onAddComment={onAddComment}
                  onDeleteComment={onDeleteComment}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
