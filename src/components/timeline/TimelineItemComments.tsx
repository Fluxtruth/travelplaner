"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { TimelineComment, TimelineCommentReplyTo } from "@/types";
import {
  MessageSquare,
  Send,
  AtSign,
  Reply,
  Trash2,
  X,
  Check,
  User as UserIcon,
} from "lucide-react";

export interface ParticipantInfo {
  userId: string;
  displayName: string;
  photoURL?: string | null;
  role?: string;
}

interface TimelineItemCommentsProps {
  itemId: string;
  itemTitle: string;
  comments?: TimelineComment[];
  currentUserId: string;
  currentUserName: string;
  currentUserPhoto?: string | null;
  participants?: ParticipantInfo[];
  onAddComment: (
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

/**
 * Format relative timestamp in German
 */
function formatCommentTime(isoStr: string): string {
  try {
    const date = new Date(isoStr);
    if (isNaN(date.getTime())) return "Gerade eben";

    const now = new Date();
    const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSec < 60) return "Gerade eben";
    if (diffSec < 3600) return `vor ${Math.floor(diffSec / 60)} Min.`;
    if (diffSec < 86400) {
      const hours = Math.floor(diffSec / 3600);
      return `vor ${hours} ${hours === 1 ? "Stunde" : "Stunden"}`;
    }

    return date.toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "Gerade eben";
  }
}

/**
 * Parse comment text to highlight @Mentions
 */
function renderCommentTextWithMentions(text: string) {
  // Regex to match @Word or @"Multiple Words"
  const parts = text.split(/(@[a-zA-Z0-9äöüÄÖÜß_-]+)/g);

  return parts.map((part, index) => {
    if (part.startsWith("@")) {
      return (
        <span
          key={index}
          className="inline-flex items-center font-bold px-1.5 py-0.2 rounded-md bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60 text-[11px] mx-0.5"
        >
          {part}
        </span>
      );
    }
    return <span key={index}>{part}</span>;
  });
}

export function TimelineItemComments({
  itemId,
  itemTitle,
  comments = [],
  currentUserId,
  currentUserName,
  currentUserPhoto,
  participants = [],
  onAddComment,
  onDeleteComment,
}: TimelineItemCommentsProps) {
  const [inputText, setInputText] = useState("");
  const [replyTo, setReplyTo] = useState<TimelineCommentReplyTo | null>(null);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionCursorPos, setMentionCursorPos] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const listEndRef = useRef<HTMLDivElement>(null);

  // Available participants for @mentions (remove duplicates by userId)
  const availableParticipants = useMemo(() => {
    const map = new Map<string, ParticipantInfo>();
    participants.forEach((p) => {
      if (p.displayName && !map.has(p.displayName.toLowerCase())) {
        map.set(p.displayName.toLowerCase(), p);
      }
    });

    // If current user is not in list, add them as option
    if (currentUserName && !map.has(currentUserName.toLowerCase())) {
      map.set(currentUserName.toLowerCase(), {
        userId: currentUserId,
        displayName: currentUserName,
        photoURL: currentUserPhoto,
      });
    }

    return Array.from(map.values());
  }, [participants, currentUserId, currentUserName, currentUserPhoto]);

  // Filtered mentions based on typed @query
  const filteredMentions = useMemo(() => {
    if (mentionQuery === null) return [];
    const q = mentionQuery.toLowerCase().trim();
    if (!q) return availableParticipants.slice(0, 5);
    return availableParticipants
      .filter((p) => p.displayName.toLowerCase().includes(q))
      .slice(0, 5);
  }, [mentionQuery, availableParticipants]);

  // Handle typing to trigger @mention suggestions
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const cursorPos = e.target.selectionStart || 0;
    setInputText(val);

    // Look back from cursor to see if an '@' is active
    const textBeforeCursor = val.slice(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf("@");

    if (lastAtIndex !== -1) {
      const charBeforeAt = lastAtIndex > 0 ? textBeforeCursor[lastAtIndex - 1] : " ";
      if (charBeforeAt === " " || charBeforeAt === "\n" || lastAtIndex === 0) {
        const query = textBeforeCursor.slice(lastAtIndex + 1);
        if (!query.includes(" ")) {
          setMentionQuery(query);
          setMentionCursorPos(lastAtIndex);
          return;
        }
      }
    }

    setMentionQuery(null);
  };

  // Insert a selected mention into text
  const handleSelectMention = (p: ParticipantInfo) => {
    const beforeAt = inputText.slice(0, mentionCursorPos);
    const afterMention = inputText.slice(mentionCursorPos + (mentionQuery?.length || 0) + 1);
    const mentionTag = `@${p.displayName.replace(/\s+/g, "")} `;

    const nextText = `${beforeAt}${mentionTag}${afterMention}`;
    setInputText(nextText);
    setMentionQuery(null);

    // Refocus input
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        const nextPos = (beforeAt + mentionTag).length;
        inputRef.current.setSelectionRange(nextPos, nextPos);
      }
    }, 50);
  };

  // Quick insert @ button
  const handleQuickAt = () => {
    setInputText((prev) => (prev.endsWith(" ") || prev === "" ? `${prev}@` : `${prev} @`));
    setMentionQuery("");
    setMentionCursorPos(inputText.length + (inputText.endsWith(" ") || inputText === "" ? 0 : 1));
    inputRef.current?.focus();
  };

  // Submit comment
  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      // Extract mentions from text
      const mentionMatches = inputText.match(/@([a-zA-Z0-9äöüÄÖÜß_-]+)/g) || [];
      const mentions = Array.from(new Set(mentionMatches.map((m) => m.slice(1))));

      await onAddComment(itemId, {
        userId: currentUserId,
        userName: currentUserName || "Traveler",
        userPhoto: currentUserPhoto || undefined,
        text: inputText.trim(),
        mentions: mentions.length > 0 ? mentions : undefined,
        replyTo: replyTo || undefined,
      });

      setInputText("");
      setReplyTo(null);
      setMentionQuery(null);

      // Scroll to bottom
      setTimeout(() => {
        listEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } catch (err) {
      console.warn("Failed to submit comment:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full rounded-2xl bg-slate-50 dark:bg-neutral-950/80 border border-slate-200/90 dark:border-neutral-800 p-3 sm:p-4 space-y-3 transition-colors">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-neutral-800/70">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-3.5 h-3.5 text-indigo-500" />
          <h5 className="text-xs font-bold text-slate-800 dark:text-neutral-200">
            Chat & Kommentare
          </h5>
          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
            {comments.length}
          </span>
        </div>
        <span className="text-[10px] text-slate-400 dark:text-neutral-500 font-medium">
          Tippe @ um jemanden zu erwähnen
        </span>
      </div>

      {/* Comments List */}
      <div className="space-y-2.5 max-h-60 overflow-y-auto no-scrollbar pr-1">
        {comments.length === 0 ? (
          <div className="py-4 text-center space-y-1">
            <span className="text-xl">💬</span>
            <p className="text-xs font-medium text-slate-500 dark:text-neutral-400">
              Noch keine Kommentare zu diesem Baustein.
            </p>
            <p className="text-[10px] text-slate-400 dark:text-neutral-500">
              Möchtest du Feedback geben oder eine Frage an die Crew stellen?
            </p>
          </div>
        ) : (
          comments.map((comment) => {
            const isMe = comment.userId === currentUserId;

            return (
              <div
                key={comment.id}
                className={`group flex items-start gap-2.5 p-2 rounded-xl transition-all ${
                  isMe
                    ? "bg-white/80 dark:bg-neutral-900/90 border border-indigo-200/60 dark:border-indigo-900/30 shadow-xs"
                    : "bg-white/60 dark:bg-neutral-900/60 border border-slate-200/60 dark:border-neutral-800/60"
                }`}
              >
                {/* User Avatar */}
                <div className="w-7 h-7 rounded-lg overflow-hidden shrink-0 bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white text-[10px] font-black shadow-xs">
                  {comment.userPhoto ? (
                    <img src={comment.userPhoto} alt={comment.userName} className="w-full h-full object-cover" />
                  ) : (
                    comment.userName.slice(0, 1).toUpperCase()
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                      <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {comment.userName}
                      </span>
                      {isMe && (
                        <span className="text-[9px] font-black px-1 rounded bg-indigo-500 text-white">
                          DU
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 dark:text-neutral-500 shrink-0">
                      {formatCommentTime(comment.createdAt)}
                    </span>
                  </div>

                  {/* Quoted Reply reference if this comment is a reply */}
                  {comment.replyTo && (
                    <div className="mb-1.5 pl-2 border-l-2 border-indigo-400/70 text-[10px] text-slate-500 dark:text-neutral-400 bg-slate-100/60 dark:bg-neutral-950/40 rounded-r-md py-0.5 pr-2 truncate">
                      <span className="font-bold text-indigo-600 dark:text-indigo-400 mr-1">
                        @{comment.replyTo.userName}:
                      </span>
                      <span>"{comment.replyTo.text}"</span>
                    </div>
                  )}

                  {/* Comment Body */}
                  <div className="text-xs text-slate-700 dark:text-neutral-200 leading-relaxed break-words">
                    {renderCommentTextWithMentions(comment.text)}
                  </div>

                  {/* Bottom Actions (Reply & Delete) */}
                  <div className="mt-1.5 flex items-center gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => {
                        setReplyTo({
                          id: comment.id,
                          userName: comment.userName,
                          text: comment.text.slice(0, 40) + (comment.text.length > 40 ? "..." : ""),
                        });
                        inputRef.current?.focus();
                      }}
                      className="text-[10px] font-bold text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Reply className="w-3 h-3" />
                      <span>Antworten</span>
                    </button>

                    {isMe && onDeleteComment && (
                      <button
                        type="button"
                        onClick={() => onDeleteComment(itemId, comment.id)}
                        className="text-[10px] text-slate-400 hover:text-rose-600 transition-colors cursor-pointer ml-auto"
                        title="Kommentar löschen"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={listEndRef} />
      </div>

      {/* ======================================================== */}
      {/* INPUT BAR WITH @MENTION AUTOCOMPLETE                    */}
      {/* ======================================================== */}
      <div className="relative pt-1">
        {/* Active Reply Banner */}
        {replyTo && (
          <div className="flex items-center justify-between gap-2 px-2.5 py-1 mb-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/80 dark:border-indigo-800 text-[11px] text-indigo-800 dark:text-indigo-200">
            <div className="flex items-center gap-1.5 min-w-0">
              <Reply className="w-3 h-3 text-indigo-500 shrink-0" />
              <span className="truncate">
                Antwort an <strong>@{replyTo.userName}</strong>: "{replyTo.text}"
              </span>
            </div>
            <button
              type="button"
              onClick={() => setReplyTo(null)}
              className="p-0.5 text-indigo-500 hover:text-indigo-700 dark:hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Floating @Mention Suggestion Box */}
        {mentionQuery !== null && filteredMentions.length > 0 && (
          <div className="absolute bottom-full left-0 mb-1 w-64 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 rounded-2xl shadow-xl p-1 z-30 animate-in fade-in slide-in-from-bottom-2 duration-150">
            <div className="px-2 py-1 text-[10px] font-bold text-slate-400 dark:text-neutral-500 border-b border-slate-100 dark:border-neutral-800 flex items-center justify-between">
              <span>Mitreisende erwähnen</span>
              <AtSign className="w-3 h-3 text-indigo-500" />
            </div>
            <div className="max-h-36 overflow-y-auto no-scrollbar py-0.5">
              {filteredMentions.map((p) => (
                <button
                  key={p.userId}
                  type="button"
                  onClick={() => handleSelectMention(p)}
                  className="w-full flex items-center gap-2 p-1.5 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-950/60 text-left transition-colors cursor-pointer group"
                >
                  <div className="w-6 h-6 rounded-full overflow-hidden bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white text-[9px] font-bold shrink-0">
                    {p.photoURL ? (
                      <img src={p.photoURL} alt={p.displayName} className="w-full h-full object-cover" />
                    ) : (
                      p.displayName.slice(0, 1).toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-bold text-slate-900 dark:text-white block truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                      @{p.displayName}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Form Input */}
        <form onSubmit={handleSubmit} className="flex items-center gap-1.5">
          {/* Quick @ mention button */}
          <button
            type="button"
            onClick={handleQuickAt}
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-indigo-50 dark:bg-neutral-800 dark:hover:bg-indigo-950/50 text-slate-500 hover:text-indigo-600 dark:text-neutral-400 dark:hover:text-indigo-400 flex items-center justify-center transition-colors shrink-0 cursor-pointer"
            title="Freund mit @ erwähnen"
          >
            <AtSign className="w-3.5 h-3.5" />
          </button>

          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={handleInputChange}
            placeholder={
              replyTo
                ? `Antwort an @${replyTo.userName}...`
                : "Kommentar schreiben (tippe @ für Mentions)..."
            }
            className="flex-1 px-3 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-neutral-500 outline-none focus:ring-2 focus:ring-indigo-500/40"
          />

          <button
            type="submit"
            disabled={!inputText.trim() || isSubmitting}
            className="w-8 h-8 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 disabled:pointer-events-none text-white flex items-center justify-center shadow-sm shadow-indigo-500/20 active:scale-95 transition-all shrink-0 cursor-pointer"
            title="Absenden"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
