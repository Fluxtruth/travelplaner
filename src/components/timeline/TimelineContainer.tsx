"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates, arrayMove } from "@dnd-kit/sortable";
import { TimelineItem, DayColumnData, Trip, ActivityType } from "@/types";
import { TimelineDayColumn } from "./TimelineDayColumn";
import { TimelineCard, isDraftItem } from "./TimelineCard";
import { AddActivityModal } from "./AddActivityModal";
import { EditActivityModal } from "./EditActivityModal";
import { QuickCategoryBar, CategoryTemplateDef } from "./QuickCategoryBar";
import { Category3DIcon } from "./Category3DIcon";
import { DayRail } from "./DayRail";
import {
  updateTimelineItemPosition,
  deleteTimelineItem,
  voteTimelineItem,
  proposeTimelineItemTime,
  voteTimelineItemTime,
  applyProposedTime,
  addTimelineItem,
} from "@/lib/firebase/firestore";
import { PASSPORT_STAMPS } from "@/lib/gamification/catalog";
import { useGamification } from "@/context/GamificationContext";
import {
  Sparkles,
  Plus,
  Pencil,
  X,
  Check,
  Trophy,
  ChevronsDownUp,
  ChevronsUpDown,
} from "lucide-react";

// Small round icon button used in the slim toolbar
function ToolbarButton({
  id,
  label,
  active = false,
  badge,
  onClick,
  children,
}: {
  id: string;
  label: string;
  active?: boolean;
  badge?: React.ReactNode;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      id={id}
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      title={label}
      className={`relative w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center transition-all active:scale-90 shrink-0 ${
        active
          ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/30"
          : "bg-white dark:bg-neutral-900 text-slate-600 dark:text-neutral-300 ring-1 ring-slate-200 dark:ring-neutral-800 hover:text-slate-900 dark:hover:text-white"
      }`}
    >
      {children}
      {badge !== undefined && (
        <span className="absolute -top-1 -right-1 min-w-3.5 h-3.5 sm:min-w-4 sm:h-4 px-1 rounded-full bg-amber-400 text-amber-950 text-[9px] font-black flex items-center justify-center ring-2 ring-slate-50 dark:ring-zinc-950">
          {badge}
        </span>
      )}
    </button>
  );
}

interface TimelineContainerProps {
  trip: Trip;
  items: TimelineItem[];
  currentUserId?: string;
  currentUserName?: string;
  userCheckins?: Record<string, string>;
  onCheckIn?: (itemId: string, itemTitle: string, itemType: string, city: string) => void;
}

export function TimelineContainer({
  trip,
  items,
  currentUserId = "guest-user",
  currentUserName = "Traveler",
  userCheckins = {},
  onCheckIn,
}: TimelineContainerProps) {
  const { profile: userProfile } = useGamification();

  // Local optimistic state for instant zero-latency feedback during drag & votes
  const [localItems, setLocalItems] = useState<TimelineItem[]>(items);
  const [prevPropsItems, setPrevPropsItems] = useState<TimelineItem[]>(items);

  if (prevPropsItems !== items) {
    setPrevPropsItems(items);
    setLocalItems(items);
  }

  const [activeItem, setActiveItem] = useState<TimelineItem | null>(null);
  const [activeTemplate, setActiveTemplate] = useState<{
    category: ActivityType;
    label: string;
    defaultTitle: string;
  } | null>(null);

  // Stempelpass filters & view states
  const [filterStampedOnly, setFilterStampedOnly] = useState(false);
  const [showPassportOverview, setShowPassportOverview] = useState(false);

  const totalStampedCount = useMemo(() => {
    return Object.keys(userCheckins).length;
  }, [userCheckins]);

  const earnedStampsCount = (userProfile.stamps || []).length;

  // Compact UI states: view vs. planning (edit) mode, collapsed days, expanded card
  const [isEditMode, setIsEditMode] = useState(false);
  const [collapsedDays, setCollapsedDays] = useState<Set<string>>(new Set());
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [activeDayId, setActiveDayId] = useState<string>("pool");
  const ignoreObserverUntil = useRef(0);

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<TimelineItem | null>(null);
  const [toastNotice, setToastNotice] = useState<{ message: string; item?: TimelineItem } | null>(null);
  const [selectedDayForAdd, setSelectedDayForAdd] = useState<{ dayId: string; city: string }>({
    dayId: "pool",
    city: "Bausteine-Pool",
  });

  // Auto-dismiss toast notice after 5 seconds
  React.useEffect(() => {
    if (!toastNotice) return;
    const timer = setTimeout(() => {
      setToastNotice(null);
    }, 5000);
    return () => clearTimeout(timer);
  }, [toastNotice]);

  // Sensors: mouse drags after 5px, touch requires a short long-press so vertical scrolling stays smooth
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 180,
        tolerance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Calendar columns definition including the dedicated Bausteine-Pool
  const columns: DayColumnData[] = useMemo(() => {
    const dayDefinitions = [
      { id: "pool", dayNumber: 0, dateStr: "Ideen-Vorrat", city: "Bausteine-Pool", isPool: true },
      { id: "day-1", dayNumber: 1, dateStr: "Fr., 10. Juli", city: "Berlin", isPool: false },
      { id: "day-2", dayNumber: 2, dateStr: "Sa., 11. Juli", city: "Berlin → Prag", isPool: false },
      { id: "day-3", dayNumber: 3, dateStr: "So., 12. Juli", city: "Prag", isPool: false },
      { id: "day-4", dayNumber: 4, dateStr: "Mo., 13. Juli", city: "Prag → Wien", isPool: false },
      { id: "day-5", dayNumber: 5, dateStr: "Di., 14. Juli", city: "Wien", isPool: false },
      { id: "day-6", dayNumber: 6, dateStr: "Mi., 15. Juli", city: "Wien → Neustadt (Dosse)", isPool: false },
      { id: "day-7", dayNumber: 7, dateStr: "Do., 16. Juli", city: "Neustadt (Dosse)", isPool: false },
      { id: "day-8", dayNumber: 8, dateStr: "Fr., 17. Juli", city: "Neustadt (Dosse) → Berlin", isPool: false },
    ];

    return dayDefinitions.map((def) => {
      let dayItems = localItems
        .filter((item) => (def.isPool ? item.dayId === "pool" || !item.dayId : item.dayId === def.id))
        .sort((a, b) => a.order - b.order);

      if (filterStampedOnly) {
        dayItems = dayItems.filter((item) => Boolean(userCheckins[item.id]));
      }

      return {
        ...def,
        items: dayItems,
      };
    });
  }, [localItems, filterStampedOnly, userCheckins]);

  const availableDays = useMemo(() => {
    return [
      { id: "pool", label: "🧩 Bausteine-Pool (Ideen & Vorrat)" },
      { id: "day-1", label: "Tag 1: Fr., 10. Juli (Berlin)" },
      { id: "day-2", label: "Tag 2: Sa., 11. Juli (Berlin → Prag)" },
      { id: "day-3", label: "Tag 3: So., 12. Juli (Prag)" },
      { id: "day-4", label: "Tag 4: Mo., 13. Juli (Prag → Wien)" },
      { id: "day-5", label: "Tag 5: Di., 14. Juli (Wien)" },
      { id: "day-6", label: "Tag 6: Mi., 15. Juli (Wien → Neustadt (Dosse))" },
      { id: "day-7", label: "Tag 7: Do., 16. Juli (Neustadt (Dosse))" },
      { id: "day-8", label: "Tag 8: Fr., 17. Juli (Neustadt (Dosse) → Berlin)" },
    ];
  }, []);

  // Drag and drop event handlers
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    if (active.data.current?.type === "CategoryTemplate") {
      setActiveTemplate({
        category: active.data.current.category,
        label: active.data.current.label,
        defaultTitle: active.data.current.defaultTitle,
      });
      return;
    }

    const foundItem = localItems.find((item) => item.id === active.id);
    if (foundItem) {
      setActiveItem(foundItem);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    // While dragging a category template, no item reordering is needed
    if (active.data.current?.type === "CategoryTemplate") {
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;

    if (activeId === overId) return;

    const isActiveAnItem = active.data.current?.type === "Item";
    const isOverAnItem = over.data.current?.type === "Item";
    const isOverAColumn = over.data.current?.type === "Column";

    if (!isActiveAnItem) return;

    // Moving item over another item
    if (isOverAnItem) {
      setLocalItems((currentItems) => {
        const activeIndex = currentItems.findIndex((i) => i.id === activeId);
        const overIndex = currentItems.findIndex((i) => i.id === overId);

        if (activeIndex === -1 || overIndex === -1) return currentItems;

        const activeCurrentItem = currentItems[activeIndex];
        const overCurrentItem = currentItems[overIndex];

        if (activeCurrentItem.dayId !== overCurrentItem.dayId) {
          activeCurrentItem.dayId = overCurrentItem.dayId;
          activeCurrentItem.stopCity = overCurrentItem.stopCity;
          return arrayMove(currentItems, activeIndex, overIndex - 1 < 0 ? 0 : overIndex);
        }

        return arrayMove(currentItems, activeIndex, overIndex);
      });
    }

    // Moving item over an empty column (rail chips are handled on drop only)
    if (isOverAColumn && !over.data.current?.isRail) {
      setLocalItems((currentItems) => {
        const activeIndex = currentItems.findIndex((i) => i.id === activeId);
        if (activeIndex === -1) return currentItems;

        const colCity = over.data.current?.city as string | undefined;
        currentItems[activeIndex].dayId = (over.data.current?.dayId as string) || overId;
        if (colCity) {
          currentItems[activeIndex].stopCity = colCity;
        }

        return arrayMove(currentItems, activeIndex, activeIndex);
      });
    }
  };

  const defaultCategoryImages: Record<ActivityType, string> = {
    restaurant: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&auto=format&fit=crop&q=80",
    bar: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=600&auto=format&fit=crop&q=80",
    activity: "https://images.unsplash.com/photo-1533105079780-92b9be482077?w=600&auto=format&fit=crop&q=80",
    culture: "https://images.unsplash.com/photo-1513805959324-96eb66ca8713?w=600&auto=format&fit=crop&q=80",
    accommodation: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&auto=format&fit=crop&q=80",
    transport: "https://images.unsplash.com/photo-1474487548417-781cb71495f3?w=600&auto=format&fit=crop&q=80",
    timeslot: "https://images.unsplash.com/photo-1508962914676-134849a727f0?w=600&auto=format&fit=crop&q=80",
    food: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&auto=format&fit=crop&q=80",
    custom: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=600&auto=format&fit=crop&q=80",
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    const isTemplate = active.data.current?.type === "CategoryTemplate";
    const templateData = isTemplate ? active.data.current : null;

    setActiveItem(null);
    setActiveTemplate(null);

    if (!over) return;

    const overId = over.id as string;
    const isOverAColumn = over.data.current?.type === "Column";
    const isOverAnItem = over.data.current?.type === "Item";

    let targetDayId = "pool";
    let targetCity = "Bausteine-Pool";

    const isRailDrop = Boolean(over.data.current?.isRail);

    if (isOverAColumn) {
      targetDayId = (over.data.current?.dayId as string) || overId;
      targetCity =
        (over.data.current?.city as string) || (targetDayId === "pool" ? "Bausteine-Pool" : "Reisestopp");
    } else if (isOverAnItem) {
      const overItem = localItems.find((i) => i.id === overId);
      if (overItem) {
        targetDayId = overItem.dayId;
        targetCity = overItem.stopCity || "Reisestopp";
      }
    }

    // 1. DROPPED A 3D CATEGORY TEMPLATE ONTO A BUCKET/DAY
    if (isTemplate && templateData) {
      const category = templateData.category as ActivityType;
      const defaultTitle = templateData.defaultTitle as string;

      const tempId = "tpl-" + Date.now();
      const newItem: TimelineItem = {
        id: tempId,
        tripId: trip.id,
        dayId: targetDayId,
        stopCity: targetCity,
        title: defaultTitle,
        type: category,
        order: Date.now(),
        createdBy: currentUserId,
        createdByName: currentUserName,
        imageUrl: defaultCategoryImages[category] || defaultCategoryImages.activity,
        votes: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Optimistic state
      setLocalItems((prev) => [...prev, newItem]);

      const colTitle = columns.find((c) => c.id === targetDayId)?.dateStr || targetCity;
      setToastNotice({
        message: `✨ Vorlage "${templateData.label}" in [${colTitle}] platziert!`,
        item: newItem,
      });

      // Save to Firestore in background
      try {
        const firestoreId = await addTimelineItem(trip.id, {
          dayId: targetDayId,
          stopCity: targetCity,
          title: defaultTitle,
          type: category,
          order: Date.now(),
          createdBy: currentUserId,
          createdByName: currentUserName,
          imageUrl: defaultCategoryImages[category] || defaultCategoryImages.activity,
        });

        const persistedItem = { ...newItem, id: firestoreId };
        setLocalItems((prev) =>
          prev.map((it) => (it.id === tempId ? persistedItem : it))
        );
        setToastNotice({
          message: `✨ Vorlage "${templateData.label}" in [${colTitle}] platziert!`,
          item: persistedItem,
        });
      } catch (err) {
        console.warn("Failed to save template item to Firestore:", err);
      }
      return;
    }

    // 2. REORDERING / MOVING AN EXISTING TIMELINE ITEM
    const activeId = active.id as string;
    const currentItem = localItems.find((i) => i.id === activeId);
    if (!currentItem) return;

    // 2a. Dropped onto a day chip in the rail -> append to the end of that day
    if (isRailDrop) {
      const newOrder = Date.now();
      setLocalItems((prev) =>
        prev.map((i) =>
          i.id === activeId ? { ...i, dayId: targetDayId, stopCity: targetCity, order: newOrder } : i
        )
      );
      const colTitle = targetDayId === "pool" ? "Ideen-Pool" : columns.find((c) => c.id === targetDayId)?.city;
      setToastNotice({ message: `↪ „${currentItem.title}“ → ${colTitle || targetCity}` });
      try {
        await updateTimelineItemPosition(trip.id, activeId, targetDayId, newOrder, targetCity);
      } catch (err) {
        console.warn("Failed to persist timeline position to Firestore:", err);
      }
      return;
    }

    const columnItems = localItems.filter((i) => i.dayId === targetDayId);
    const itemIndex = columnItems.findIndex((i) => i.id === activeId);
    const finalOrder = itemIndex >= 0 ? itemIndex : columnItems.length;

    try {
      await updateTimelineItemPosition(trip.id, activeId, targetDayId, finalOrder, targetCity);
    } catch (err) {
      console.warn("Failed to persist timeline position to Firestore:", err);
    }
  };

  const handleQuickAddTemplate = async (tpl: CategoryTemplateDef) => {
    const tempId = "tpl-" + Date.now();
    const newItem: TimelineItem = {
      id: tempId,
      tripId: trip.id,
      dayId: "pool",
      stopCity: "Bausteine-Pool",
      title: tpl.defaultTitle,
      type: tpl.id,
      order: Date.now(),
      createdBy: currentUserId,
      createdByName: currentUserName,
      imageUrl: defaultCategoryImages[tpl.id] || defaultCategoryImages.activity,
      votes: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setLocalItems((prev) => [...prev, newItem]);
    setEditingItem(newItem);

    try {
      const realId = await addTimelineItem(trip.id, {
        dayId: "pool",
        stopCity: "Bausteine-Pool",
        title: tpl.defaultTitle,
        type: tpl.id,
        order: Date.now(),
        createdBy: currentUserId,
        createdByName: currentUserName,
        imageUrl: defaultCategoryImages[tpl.id] || defaultCategoryImages.activity,
      });

      const persisted = { ...newItem, id: realId };
      setLocalItems((prev) => prev.map((it) => (it.id === tempId ? persisted : it)));
      setEditingItem(persisted);
    } catch (err) {
      console.warn("Error quick adding template:", err);
    }
  };

  const handleOpenAddModal = (dayId: string, city: string) => {
    setSelectedDayForAdd({ dayId, city });
    setIsAddModalOpen(true);
  };

  const handleDeleteItem = async (itemId: string) => {
    setLocalItems((prev) => prev.filter((i) => i.id !== itemId));
    try {
      await deleteTimelineItem(trip.id, itemId);
    } catch (err) {
      console.warn("Failed to delete timeline item from Firestore:", err);
    }
  };

  // Upvote / Downvote on a Baustein
  const handleVoteItem = async (itemId: string, voteType: "up" | "down") => {
    setLocalItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        const currentVotes = { ...(item.votes || {}) };
        if (currentVotes[currentUserId] === voteType) {
          delete currentVotes[currentUserId];
        } else {
          currentVotes[currentUserId] = voteType;
        }
        return { ...item, votes: currentVotes };
      })
    );

    try {
      await voteTimelineItem(trip.id, itemId, currentUserId, voteType);
    } catch (err) {
      console.warn("Failed to record vote on timeline item:", err);
    }
  };

  // Propose alternative time
  const handleProposeTime = async (itemId: string, proposedTime: string) => {
    const newProposal = {
      id: "prop-" + Date.now(),
      time: proposedTime,
      proposedBy: currentUserId,
      proposerName: currentUserName,
      votes: [currentUserId],
      createdAt: new Date().toISOString(),
    };

    setLocalItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        const existing = item.timeProposals || [];
        return { ...item, timeProposals: [...existing, newProposal] };
      })
    );

    try {
      await proposeTimelineItemTime(trip.id, itemId, currentUserId, currentUserName, proposedTime);
    } catch (err) {
      console.warn("Failed to submit time proposal:", err);
    }
  };

  // Vote for a time proposal
  const handleVoteTimeProposal = async (itemId: string, proposalId: string) => {
    setLocalItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        const updated = (item.timeProposals || []).map((prop) => {
          if (prop.id !== proposalId) return prop;
          const hasVoted = prop.votes.includes(currentUserId);
          const newVotes = hasVoted
            ? prop.votes.filter((id) => id !== currentUserId)
            : [...prop.votes, currentUserId];
          return { ...prop, votes: newVotes };
        });
        return { ...item, timeProposals: updated };
      })
    );

    try {
      await voteTimelineItemTime(trip.id, itemId, proposalId, currentUserId);
    } catch (err) {
      console.warn("Failed to vote for time proposal:", err);
    }
  };

  // Apply a time proposal as official time
  const handleApplyTime = async (itemId: string, newTime: string) => {
    setLocalItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, time: newTime } : item))
    );

    try {
      await applyProposedTime(trip.id, itemId, newTime);
    } catch (err) {
      console.warn("Failed to apply official time:", err);
    }
  };

  // ------------------------------------------------------------------
  // Compact UI helpers
  // ------------------------------------------------------------------
  const poolCount = columns.find((c) => c.isPool)?.items.length || 0;
  const plannedCount = localItems.filter((i) => i.dayId && i.dayId !== "pool").length;
  const draftCount = localItems.filter(isDraftItem).length;
  const allCollapsed = collapsedDays.size === columns.length;

  const toggleCollapse = (dayId: string) => {
    setCollapsedDays((prev) => {
      const next = new Set(prev);
      if (next.has(dayId)) next.delete(dayId);
      else next.add(dayId);
      return next;
    });
  };

  const toggleAllCollapsed = () => {
    setCollapsedDays(allCollapsed ? new Set() : new Set(columns.map((c) => c.id)));
  };

  const toggleExpandItem = (itemId: string) => {
    setExpandedItemId((prev) => (prev === itemId ? null : itemId));
  };

  const handleSelectDay = (dayId: string) => {
    setActiveDayId(dayId);
    ignoreObserverUntil.current = Date.now() + 900;
    setCollapsedDays((prev) => {
      if (!prev.has(dayId)) return prev;
      const next = new Set(prev);
      next.delete(dayId);
      return next;
    });
    requestAnimationFrame(() => {
      document.getElementById(`plan-day-${dayId}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  // Highlight the day currently in view inside the sticky rail
  useEffect(() => {
    if (typeof window === "undefined" || !("IntersectionObserver" in window)) return;
    const order = columns.map((c) => c.id);
    const visible = new Set<string>();
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const id = (entry.target as HTMLElement).id.replace("plan-day-", "");
          if (entry.isIntersecting) visible.add(id);
          else visible.delete(id);
        });
        if (Date.now() < ignoreObserverUntil.current) return;
        const first = order.find((id) => visible.has(id));
        if (first) setActiveDayId(first);
      },
      { rootMargin: "-120px 0px -55% 0px" }
    );
    order.forEach((id) => {
      const el = document.getElementById(`plan-day-${id}`);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
    // Day definitions are static – observe once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeColumn = columns.find((c) => c.id === activeDayId) || columns[0];

  return (
    <div className="w-full flex flex-col gap-2">
      {/* ================= SLIM TOOLBAR ================= */}
      <div className="flex items-center justify-between gap-1.5 sm:gap-2">
        <div className="flex-1 min-w-0">
          <h2 className="text-sm sm:text-base font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
            <span>Reiseplan</span>
            <span className="relative flex w-2 h-2" title="Live-Sync aktiv">
              <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
              <span className="relative inline-flex w-2 h-2 rounded-full bg-emerald-500" />
            </span>
          </h2>
          <p className="text-[11px] text-slate-500 dark:text-neutral-400 truncate">
            {plannedCount} eingeplant · {poolCount} Pool
            {draftCount > 0 && <span className="text-amber-600 dark:text-amber-400"> · {draftCount} offen</span>}
          </p>
        </div>

        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          <ToolbarButton
            id="plan-filter-stamped"
            label="Nur gestempelte Stopps"
            active={filterStampedOnly}
            badge={totalStampedCount > 0 ? totalStampedCount : undefined}
            onClick={() => setFilterStampedOnly((v) => !v)}
          >
            <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4" strokeWidth={2.5} />
          </ToolbarButton>

          <button
            type="button"
            id="plan-toggle-passport"
            onClick={() => setShowPassportOverview((v) => !v)}
            aria-pressed={showPassportOverview}
            title="Stempelpass"
            className={`h-8 sm:h-9 px-2 sm:px-2.5 rounded-xl flex items-center gap-1 text-[11px] font-bold transition-all active:scale-95 ${
              showPassportOverview
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/30"
                : "bg-white dark:bg-neutral-900 text-slate-700 dark:text-neutral-200 ring-1 ring-slate-200 dark:ring-neutral-800"
            }`}
          >
            <span className="text-xs sm:text-sm leading-none">🛂</span>
            <span className="font-mono text-[10px] sm:text-[11px]">
              {earnedStampsCount}/{PASSPORT_STAMPS.length}
            </span>
          </button>

          <ToolbarButton
            id="plan-open-leaderboard"
            label="Crew-Rangliste"
            onClick={() => window.dispatchEvent(new CustomEvent("boystrip:navigate-tab", { detail: "passport" }))}
          >
            <Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500" />
          </ToolbarButton>

          <ToolbarButton
            id="plan-toggle-collapse"
            label={allCollapsed ? "Alle Tage aufklappen" : "Alle Tage zuklappen"}
            onClick={toggleAllCollapsed}
          >
            {allCollapsed ? <ChevronsUpDown className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <ChevronsDownUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
          </ToolbarButton>
        </div>
      </div>

      {/* ================= COMPACT STAMP STRIP ================= */}
      {showPassportOverview && (
        <div className="plan-reveal rounded-2xl bg-gradient-to-r from-indigo-50 to-purple-50/60 dark:from-indigo-950/40 dark:to-purple-950/20 ring-1 ring-indigo-200/70 dark:ring-indigo-900/50 p-2">
          <div className="flex items-center justify-between px-1 mb-1.5">
            <span className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Route-Stempel
            </span>
            <span className="text-[10px] text-slate-500 dark:text-neutral-400">Stopp öffnen → 🛂 tippen</span>
          </div>
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
            {PASSPORT_STAMPS.map((stamp) => {
              const isEarned = (userProfile.stamps || []).includes(stamp.code);
              return (
                <div
                  key={stamp.id}
                  title={`${stamp.title} (${stamp.city}) – ${stamp.description}`}
                  className={`shrink-0 w-16 rounded-xl p-1.5 flex flex-col items-center gap-0.5 ${
                    isEarned
                      ? "bg-white dark:bg-neutral-900 ring-1 ring-indigo-300 dark:ring-indigo-700 shadow-sm"
                      : "bg-white/50 dark:bg-neutral-900/40 opacity-50 grayscale"
                  }`}
                >
                  <span className="text-xl leading-none">{stamp.icon}</span>
                  <span className="text-[9px] font-mono font-bold text-slate-700 dark:text-neutral-300 truncate max-w-full">
                    {stamp.code}
                  </span>
                  <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400">
                    {isEarned ? "✓" : `+${stamp.points}`}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Drag & Drop Context (Day rail + template strip + agenda days) */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        {/* ================= STICKY DAY RAIL ================= */}
        <DayRail
          columns={columns}
          activeDayId={activeDayId}
          onSelect={handleSelectDay}
          trailing={
            <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 pl-1 border-l border-slate-200 dark:border-neutral-800">
              <button
                type="button"
                id="plan-toggle-edit"
                onClick={() => {
                  setIsEditMode((v) => !v);
                  setExpandedItemId(null);
                }}
                aria-pressed={isEditMode}
                className={`h-8 sm:h-9 px-2.5 sm:px-3 rounded-xl sm:rounded-full flex items-center gap-1 sm:gap-1.5 text-[11px] font-bold transition-all active:scale-95 shrink-0 ${
                  isEditMode
                    ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/30"
                    : "bg-white dark:bg-neutral-900 text-slate-700 dark:text-neutral-200 ring-1 ring-slate-200 dark:ring-neutral-800"
                }`}
                title={isEditMode ? "Planungsmodus beenden" : "Planungsmodus (Bausteine verschieben & Vorlagen)"}
              >
                {isEditMode ? <Check className="w-3.5 h-3.5" strokeWidth={3} /> : <Pencil className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{isEditMode ? "Fertig" : "Planen"}</span>
              </button>
              <button
                type="button"
                id="plan-add-item"
                onClick={() => handleOpenAddModal(activeColumn.id, activeColumn.city)}
                aria-label={`Baustein zu ${activeColumn.isPool ? "Ideen-Pool" : `Tag ${activeColumn.dayNumber}`} hinzufügen`}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl sm:rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/30 active:scale-90 transition-transform shrink-0"
                title="Neuer Baustein"
              >
                <Plus className="w-4 h-4" strokeWidth={2.5} />
              </button>
            </div>
          }
        />

        {/* ================= TEMPLATE ICON STRIP (edit mode) ================= */}
        {isEditMode && <QuickCategoryBar onQuickAdd={handleQuickAddTemplate} />}

        {/* ================= AGENDA DAYS ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-2 items-start pb-6">
          {columns.map((col) => (
            <TimelineDayColumn
              key={col.id}
              dayId={col.id}
              dayNumber={col.dayNumber}
              dateStr={col.dateStr}
              city={col.city}
              isPool={col.isPool}
              items={col.items}
              currentUserId={currentUserId}
              currentUserName={currentUserName}
              isCollapsed={collapsedDays.has(col.id)}
              isEditMode={isEditMode}
              expandedItemId={expandedItemId}
              onToggleCollapse={toggleCollapse}
              onToggleExpand={toggleExpandItem}
              onAddItem={handleOpenAddModal}
              onEdit={(item) => setEditingItem(item)}
              onDeleteItem={handleDeleteItem}
              onVoteItem={handleVoteItem}
              onProposeTime={handleProposeTime}
              onVoteTimeProposal={handleVoteTimeProposal}
              onApplyTime={handleApplyTime}
              userCheckins={userCheckins}
              onCheckIn={onCheckIn}
            />
          ))}
        </div>

        {/* Drag Overlay for smooth representation while dragging */}
        <DragOverlay dropAnimation={null}>
          {activeTemplate ? (
            <div className="flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-2xl bg-white dark:bg-neutral-900 ring-2 ring-indigo-500 shadow-2xl shadow-indigo-500/30 scale-105">
              <Category3DIcon type={activeTemplate.category} size={32} animateOnHover={false} />
              <span className="text-xs font-bold text-slate-900 dark:text-white">{activeTemplate.label}</span>
            </div>
          ) : activeItem ? (
            <TimelineCard item={activeItem} currentUserId={currentUserId} isOverlay />
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Floating Toast Notification */}
      {toastNotice && (
        <div className="plan-reveal fixed bottom-4 inset-x-4 sm:inset-x-auto sm:right-6 sm:bottom-6 z-50 flex items-center gap-2 pl-3.5 pr-1.5 py-1.5 rounded-2xl bg-slate-900/95 dark:bg-neutral-800/95 text-white shadow-2xl ring-1 ring-white/10 backdrop-blur-xl">
          <span className="text-xs font-medium flex-1 min-w-0 truncate">{toastNotice.message}</span>
          {toastNotice.item && (
            <button
              type="button"
              onClick={() => {
                setEditingItem(toastNotice.item!);
                setToastNotice(null);
              }}
              className="h-8 px-3 rounded-xl bg-amber-400 text-amber-950 text-[11px] font-bold flex items-center gap-1 active:scale-95 shrink-0"
            >
              <Pencil className="w-3 h-3" />
              Befüllen
            </button>
          )}
          <button
            type="button"
            onClick={() => setToastNotice(null)}
            aria-label="Hinweis schließen"
            className="w-8 h-8 rounded-xl text-slate-400 hover:text-white flex items-center justify-center shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Add Baustein Modal */}
      {isAddModalOpen && (
        <AddActivityModal
          tripId={trip.id}
          dayId={selectedDayForAdd.dayId}
          city={selectedDayForAdd.city}
          currentUserId={currentUserId}
          currentUserName={currentUserName}
          availableDays={availableDays}
          onClose={() => setIsAddModalOpen(false)}
        />
      )}

      {/* Edit / Fill Baustein Modal */}
      {editingItem && (
        <EditActivityModal
          tripId={trip.id}
          item={editingItem}
          availableDays={availableDays}
          onClose={() => setEditingItem(null)}
          onSave={(updated) => {
            setLocalItems((prev) => prev.map((it) => (it.id === updated.id ? updated : it)));
            setEditingItem(null);
          }}
        />
      )}
    </div>
  );
}


