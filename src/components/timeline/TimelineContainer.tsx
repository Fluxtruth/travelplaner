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
import { TimelineItem, DayColumnData, Trip, TripStop, ActivityType, TimelineComment, TimelineCommentReplyTo } from "@/types";
import { TimelineDayColumn } from "./TimelineDayColumn";
import { TimelineCard, isDraftItem } from "./TimelineCard";
import { AddActivityModal } from "./AddActivityModal";
import { EditActivityModal } from "./EditActivityModal";
import { QuickCategoryBar, CategoryTemplateDef } from "./QuickCategoryBar";
import { Category3DIcon } from "./Category3DIcon";
import { DayRail } from "./DayRail";
import { ParticipantInfo } from "./TimelineItemComments";
import {
  updateTimelineItemPosition,
  deleteTimelineItem,
  voteTimelineItem,
  proposeTimelineItemTime,
  voteTimelineItemTime,
  applyProposedTime,
  addTimelineItem,
  addTimelineItemComment,
  deleteTimelineItemComment,
  updateTripDetails,
} from "@/lib/firebase/firestore";
import { useGamification } from "@/context/GamificationContext";
import {
  Sparkles,
  Plus,
  Pencil,
  X,
  ChevronsDownUp,
  ChevronsUpDown,
  MapPin,
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
  currentUserPhoto?: string | null;
  participants?: ParticipantInfo[];
  onTripUpdated?: (updatedTrip: Trip) => void;
}

export function TimelineContainer({
  trip,
  items,
  currentUserId = "guest-user",
  currentUserName = "Traveler",
  currentUserPhoto,
  participants = [],
  onTripUpdated,
}: TimelineContainerProps) {
  const { profile: userProfile } = useGamification();

  // Local optimistic state for instant zero-latency feedback during drag & votes
  const [localItems, setLocalItems] = useState<TimelineItem[]>(() =>
    [...items].sort((a, b) => a.order - b.order)
  );
  const [prevPropsItems, setPrevPropsItems] = useState<TimelineItem[]>(items);

  if (prevPropsItems !== items) {
    setPrevPropsItems(items);
    setLocalItems([...items].sort((a, b) => a.order - b.order));
  }

  const [activeItem, setActiveItem] = useState<TimelineItem | null>(null);
  const [activeTemplate, setActiveTemplate] = useState<{
    category: ActivityType;
    label: string;
    defaultTitle: string;
  } | null>(null);

  // Compact UI states: collapsed days, expanded card
  const isEditMode = true;
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

  // Calendar columns definition dynamically generated from trip dates and stops
  const columns: DayColumnData[] = useMemo(() => {
    const formatDayShortDate = (d: Date): string => {
      const day = String(d.getDate()).padStart(2, "0");
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const year = String(d.getFullYear()).slice(-2);
      return `${day}.${month}.${year}`;
    };

    const dayDefinitions: Array<{
      id: string;
      dayNumber: number;
      dateStr: string;
      city: string;
      formattedDate?: string;
      isPool: boolean;
    }> = [
      { id: "pool", dayNumber: 0, dateStr: "Ideen-Vorrat", city: "Bausteine-Pool", isPool: true },
    ];

    const normalizedStops: TripStop[] = Array.isArray(trip?.stops)
      ? trip.stops.map((s, idx) =>
          typeof s === "string"
            ? { id: `stop-${idx}`, city: s, order: idx }
            : { ...s, order: s.order ?? idx }
        )
      : [];

    let baseDate: Date;
    if (trip?.startDate) {
      const parsed = new Date(trip.startDate);
      baseDate = !isNaN(parsed.getTime()) ? parsed : new Date();
    } else if (trip?.createdAt) {
      const parsed = new Date(trip.createdAt as string);
      baseDate = !isNaN(parsed.getTime()) ? parsed : new Date();
    } else {
      baseDate = new Date();
    }

    let diffDays = 1;
    if (trip?.startDate && trip?.endDate) {
      const start = new Date(trip.startDate);
      const end = new Date(trip.endDate);
      if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && end >= start) {
        diffDays = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      }
    }

    // Number of days/buckets must at least match the number of stops defined in the route!
    // Every stop in the route MUST have its own bucket!
    const totalDays = Math.min(Math.max(diffDays, normalizedStops.length, 1), 60);

    for (let i = 0; i < totalDays; i++) {
      const d = new Date(baseDate);
      d.setDate(d.getDate() + i);
      const dateStr = d.toLocaleDateString("de-DE", {
        weekday: "short",
        day: "numeric",
        month: "short",
      });
      const formattedDate = formatDayShortDate(d);

      let cityStr = "";
      if (normalizedStops.length > 0) {
        if (i < normalizedStops.length) {
          // Exactly 1 stop per day: 1-to-1 match guaranteed for every stop!
          cityStr = normalizedStops[i]?.city || "";
        } else {
          // Extra days beyond stops: repeat last stop or generic tag
          cityStr = normalizedStops[normalizedStops.length - 1]?.city || `Tag ${i + 1}`;
        }
      }

      dayDefinitions.push({
        id: `day-${i + 1}`,
        dayNumber: i + 1,
        dateStr,
        city: cityStr || `Tag ${i + 1}`,
        formattedDate,
        isPool: false,
      });
    }

    return dayDefinitions.map((def) => {
      const dayItems = localItems.filter((item) =>
        def.isPool ? item.dayId === "pool" || !item.dayId : item.dayId === def.id
      );

      return {
        ...def,
        items: dayItems,
      };
    });
  }, [trip?.startDate, trip?.endDate, trip?.stops, trip?.createdAt, localItems]);

  // ------------------------------------------------------------------
  // Add new travel day ("Neuen Reisetag anlegen") state & handler
  // ------------------------------------------------------------------
  const [isAddingDay, setIsAddingDay] = useState(false);
  const [newDayCity, setNewDayCity] = useState("");
  const [isSubmittingDay, setIsSubmittingDay] = useState(false);
  const newDayInputRef = useRef<HTMLInputElement>(null);

  const nonPoolColumns = useMemo(() => columns.filter((c) => !c.isPool), [columns]);
  const nextDayNumber = nonPoolColumns.length + 1;

  const projectedDate = useMemo(() => {
    let effectiveStartDate = trip?.startDate || "";
    if (!effectiveStartDate && trip?.createdAt) {
      effectiveStartDate = trip.createdAt as string;
    }
    if (!effectiveStartDate) return null;
    const start = new Date(effectiveStartDate);
    if (isNaN(start.getTime())) return null;
    const d = new Date(start);
    d.setDate(d.getDate() + (nextDayNumber - 1));
    return d;
  }, [trip?.startDate, trip?.createdAt, nextDayNumber]);

  const projectedDateStr = useMemo(() => {
    if (!projectedDate) return "";
    const day = String(projectedDate.getDate()).padStart(2, "0");
    const month = String(projectedDate.getMonth() + 1).padStart(2, "0");
    const year = String(projectedDate.getFullYear()).slice(-2);
    return `${day}.${month}.${year}`;
  }, [projectedDate]);

  useEffect(() => {
    if (isAddingDay) {
      newDayInputRef.current?.focus();
    }
  }, [isAddingDay]);

  const handleAddDay = async () => {
    if (isSubmittingDay) return;
    setIsSubmittingDay(true);

    const cityTrimmed = newDayCity.trim();
    const finalCity = cityTrimmed || `Tag ${nextDayNumber}`;

    const currentStops: TripStop[] = Array.isArray(trip?.stops)
      ? trip.stops.map((s, idx) =>
          typeof s === "string"
            ? { id: `stop-${idx}`, city: s, order: idx }
            : { ...s, order: s.order ?? idx }
        )
      : [];

    let targetIsoDate: string | undefined = undefined;
    if (projectedDate) {
      targetIsoDate = projectedDate.toISOString().split("T")[0];
    }

    const newStop: TripStop = {
      id: `stop-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      city: finalCity,
      order: currentStops.length,
      ...(targetIsoDate ? { startDate: targetIsoDate, endDate: targetIsoDate } : {}),
    };

    const updatedStops = [...currentStops, newStop];

    let updatedEndDate = trip?.endDate || "";
    if (targetIsoDate) {
      if (!updatedEndDate || targetIsoDate > updatedEndDate) {
        updatedEndDate = targetIsoDate;
      }
    }

    // Optimistic update to parent
    if (onTripUpdated) {
      onTripUpdated({
        ...trip,
        stops: updatedStops,
        ...(updatedEndDate ? { endDate: updatedEndDate } : {}),
      });
    }

    try {
      await updateTripDetails(trip.id, {
        stops: updatedStops,
        ...(updatedEndDate ? { endDate: updatedEndDate } : {}),
      });

      setToastNotice({
        message: `Tag ${nextDayNumber} (${finalCity}) wurde hinzugefügt!`,
      });

      setNewDayCity("");
      setIsAddingDay(false);

      // Select and scroll to new day
      const newDayId = `day-${nextDayNumber}`;
      setActiveDayId(newDayId);
      requestAnimationFrame(() => {
        document.getElementById(`plan-day-${newDayId}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    } catch (err) {
      console.error("Failed to add trip day:", err);
      setToastNotice({
        message: "Fehler beim Anlegen des Reisetags. Bitte erneut versuchen.",
      });
    } finally {
      setIsSubmittingDay(false);
    }
  };

  const availableDays = useMemo(() => {
    return columns.map((col) => ({
      id: col.id,
      label: col.isPool
        ? "🧩 Bausteine-Pool (Ideen & Vorrat)"
        : `Tag ${col.dayNumber}: ${col.city}${col.formattedDate ? ` - ${col.formattedDate}` : ""}`,
    }));
  }, [columns]);

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

        // Only move between different days during drag-over!
        // Within the same day, SortableContext visually reorders via CSS transforms,
        // and the final order is committed in handleDragEnd without causing infinite update loops.
        if (activeCurrentItem.dayId !== overCurrentItem.dayId) {
          const updatedItem = {
            ...activeCurrentItem,
            dayId: overCurrentItem.dayId,
            stopCity: overCurrentItem.stopCity,
          };
          const next = [...currentItems];
          next[activeIndex] = updatedItem;
          return arrayMove(next, activeIndex, overIndex);
        }

        return currentItems;
      });
      return;
    }

    // Moving item over an empty column (rail chips are handled on drop only)
    if (isOverAColumn && !over.data.current?.isRail) {
      setLocalItems((currentItems) => {
        const activeIndex = currentItems.findIndex((i) => i.id === activeId);
        if (activeIndex === -1) return currentItems;

        const targetDay = (over.data.current?.dayId as string) || overId;
        if (currentItems[activeIndex].dayId === targetDay) return currentItems;

        const colCity = over.data.current?.city as string | undefined;
        const updatedItem = {
          ...currentItems[activeIndex],
          dayId: targetDay,
          stopCity: colCity || currentItems[activeIndex].stopCity,
        };
        const next = [...currentItems];
        next[activeIndex] = updatedItem;
        return next;
      });
    }
  };

  const defaultCategoryImages: Record<ActivityType, string> = {
    restaurant: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&auto=format&fit=crop&q=80",
    cafe: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=600&auto=format&fit=crop&q=80",
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

    const activeId = active.id as string;
    const currentItem = !isTemplate ? localItems.find((i) => i.id === activeId) : null;

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
    } else if (currentItem) {
      targetDayId = currentItem.dayId;
      targetCity = currentItem.stopCity || "Reisestopp";
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

    // 2b. Moving within or across columns
    let updatedItems = [...localItems];
    if (isOverAnItem && activeId !== overId) {
      const activeIdx = updatedItems.findIndex((i) => i.id === activeId);
      const overIdx = updatedItems.findIndex((i) => i.id === overId);
      if (activeIdx !== -1 && overIdx !== -1) {
        updatedItems = arrayMove(updatedItems, activeIdx, overIdx);
      }
    }

    const columnItems = updatedItems.filter((i) => i.dayId === targetDayId);
    const activeIndex = columnItems.findIndex((i) => i.id === activeId);

    // Compute fractional / relative timestamp order so Firestore sort matches exact visual position
    let newOrder = Date.now();
    if (columnItems.length <= 1) {
      newOrder = Date.now();
    } else if (activeIndex === 0) {
      const nextOrder = columnItems[1]?.order || Date.now();
      newOrder = nextOrder - 60000;
    } else if (activeIndex === columnItems.length - 1) {
      const prevOrder = columnItems[activeIndex - 1]?.order || Date.now();
      newOrder = prevOrder + 60000;
    } else if (activeIndex > 0 && activeIndex < columnItems.length - 1) {
      const prevOrder = columnItems[activeIndex - 1]?.order || 0;
      const nextOrder = columnItems[activeIndex + 1]?.order || Date.now();
      newOrder = Math.round((prevOrder + nextOrder) / 2);
    }

    const finalItems = updatedItems.map((i) =>
      i.id === activeId ? { ...i, dayId: targetDayId, stopCity: targetCity, order: newOrder } : i
    );
    setLocalItems(finalItems);

    try {
      await updateTimelineItemPosition(trip.id, activeId, targetDayId, newOrder, targetCity);
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

  // Add a comment to a timeline item
  const handleAddComment = async (
    itemId: string,
    commentData: {
      userId: string;
      userName: string;
      userPhoto?: string;
      text: string;
      mentions?: string[];
      replyTo?: TimelineCommentReplyTo;
    }
  ) => {
    const tempComment: TimelineComment = {
      id: "temp-" + Date.now(),
      ...commentData,
      createdAt: new Date().toISOString(),
    };
    setLocalItems((prev) =>
      prev.map((it) =>
        it.id === itemId
          ? { ...it, comments: [...(it.comments || []), tempComment] }
          : it
      )
    );

    try {
      await addTimelineItemComment(trip.id, itemId, commentData);
    } catch (err) {
      console.warn("Failed to add comment to Firestore:", err);
    }
  };

  // Delete a comment from a timeline item
  const handleDeleteComment = async (itemId: string, commentId: string) => {
    setLocalItems((prev) =>
      prev.map((it) =>
        it.id === itemId
          ? { ...it, comments: (it.comments || []).filter((c) => c.id !== commentId) }
          : it
      )
    );

    try {
      await deleteTimelineItemComment(trip.id, itemId, commentId);
    } catch (err) {
      console.warn("Failed to delete comment from Firestore:", err);
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

  const totalEstimatedCost = useMemo(() => {
    return localItems.reduce((sum, it) => {
      if (typeof it.cost === "number" && !isNaN(it.cost) && it.cost > 0) {
        return sum + it.cost;
      }
      return sum;
    }, 0);
  }, [localItems]);

  const formattedCost = totalEstimatedCost % 1 === 0 ? totalEstimatedCost : totalEstimatedCost.toFixed(2).replace(".", ",");

  return (
    <div className="w-full flex flex-col gap-2">
      {/* ================= SLIM TOOLBAR ================= */}
      <div className="flex items-center justify-between gap-1.5 sm:gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-sm sm:text-base font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>Reiseplan</span>
              <span className="relative flex w-2 h-2" title="Live-Sync aktiv">
                <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
                <span className="relative inline-flex w-2 h-2 rounded-full bg-emerald-500" />
              </span>
            </h2>

            {totalEstimatedCost > 0 && (
              <span
                title="Geschätzter Gesamtpreis aller Aktivitäten dieser Reise"
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 text-[10.5px] sm:text-[11px] font-bold font-mono shadow-xs"
              >
                <span>💰</span>
                <span>~{formattedCost} €</span>
                <span className="text-[9px] font-medium text-emerald-600/80 dark:text-emerald-400/80 hidden xs:inline sm:inline">Gesamt</span>
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-neutral-400 truncate">
            {plannedCount} eingeplant · {poolCount} Pool
            {draftCount > 0 && <span className="text-amber-600 dark:text-amber-400"> · {draftCount} offen</span>}
          </p>
        </div>

        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          <ToolbarButton
            id="plan-toggle-collapse"
            label={allCollapsed ? "Alle Tage aufklappen" : "Alle Tage zuklappen"}
            onClick={toggleAllCollapsed}
          >
            {allCollapsed ? <ChevronsUpDown className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <ChevronsDownUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
          </ToolbarButton>
        </div>
      </div>

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
                id="plan-quick-add-day-btn"
                onClick={() => {
                  setIsAddingDay(true);
                  requestAnimationFrame(() => {
                    newDayInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
                    newDayInputRef.current?.focus();
                  });
                }}
                aria-label={`Tag ${nextDayNumber} hinzufügen`}
                className="h-8 sm:h-9 px-2 sm:px-2.5 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-slate-700 dark:text-neutral-300 text-[11px] font-bold flex items-center gap-1 transition-all active:scale-95 shrink-0 cursor-pointer"
                title={`Tag ${nextDayNumber} hinzufügen`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">Tag +</span>
              </button>
              <button
                type="button"
                id="plan-add-item"
                onClick={() => handleOpenAddModal(activeColumn.id, activeColumn.city)}
                aria-label={`Baustein zu ${activeColumn.isPool ? "Ideen-Pool" : `Tag ${activeColumn.dayNumber}`} hinzufügen`}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl sm:rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/30 active:scale-90 transition-transform shrink-0 cursor-pointer"
                title="Neuer Baustein"
              >
                <Plus className="w-4 h-4" strokeWidth={2.5} />
              </button>
            </div>
          }
        >
          {/* ================= STICKY TEMPLATE ICON STRIP (ALWAYS VISIBLE) ================= */}
          <QuickCategoryBar onQuickAdd={handleQuickAddTemplate} />
        </DayRail>

        {/* ================= AGENDA DAYS ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-2 items-start pb-2">
          {columns.map((col) => (
            <TimelineDayColumn
              key={col.id}
              dayId={col.id}
              dayNumber={col.dayNumber}
              dateStr={col.dateStr}
              city={col.city}
              formattedDate={col.formattedDate}
              isPool={col.isPool}
              items={col.items}
              currentUserId={currentUserId}
              currentUserName={currentUserName}
              currentUserPhoto={currentUserPhoto}
              participants={participants}
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
              onAddComment={handleAddComment}
              onDeleteComment={handleDeleteComment}
            />
          ))}
        </div>

        {/* ================= SUBTLE '+' BUTTON DIRECTLY UNDER THE BUCKETS ================= */}
        <div className="flex flex-col items-center justify-center pt-2 pb-6 w-full">
          {!isAddingDay ? (
            <button
              type="button"
              id="plan-add-bucket-btn"
              onClick={() => setIsAddingDay(true)}
              className="group flex items-center justify-center gap-2 px-4 py-2 rounded-full border border-dashed border-slate-300 dark:border-neutral-700 hover:border-indigo-500 dark:hover:border-indigo-400 bg-white/70 dark:bg-neutral-900/50 hover:bg-indigo-50/60 dark:hover:bg-indigo-950/30 text-slate-600 dark:text-neutral-400 hover:text-indigo-600 dark:hover:text-indigo-400 text-xs font-semibold shadow-xs hover:shadow-md transition-all active:scale-95 cursor-pointer select-none"
              title={`Tag ${nextDayNumber} hinzufügen`}
            >
              <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-neutral-800 group-hover:bg-indigo-600 group-hover:text-white flex items-center justify-center transition-all">
                <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
              </span>
              <span>Neuen Reisetag / Bucket hinzufügen</span>
              {projectedDateStr && (
                <span className="text-[10px] font-mono opacity-60">({projectedDateStr})</span>
              )}
            </button>
          ) : (
            <div className="w-full max-w-md rounded-2xl border border-indigo-400/60 dark:border-indigo-500/50 bg-white dark:bg-neutral-900 shadow-xl shadow-indigo-500/10 p-3 sm:p-4 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between gap-2 mb-2.5">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-xl bg-indigo-600 text-white flex flex-col items-center justify-center text-[10px] font-black font-mono shadow-xs">
                    {nextDayNumber}
                  </span>
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      Tag {nextDayNumber} anlegen
                    </span>
                    {projectedDateStr && (
                      <span className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400 ml-1.5 font-bold">
                        {projectedDateStr}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingDay(false);
                    setNewDayCity("");
                  }}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-neutral-200 hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                  title="Abbrechen"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleAddDay();
                }}
                className="flex flex-col gap-2.5"
              >
                <div className="relative">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    ref={newDayInputRef}
                    value={newDayCity}
                    onChange={(e) => setNewDayCity(e.target.value)}
                    placeholder="Ort oder Station (z. B. Berlin, Prag...)"
                    className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-950 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingDay(false);
                      setNewDayCity("");
                    }}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-neutral-400 hover:bg-slate-100 dark:hover:bg-neutral-800 rounded-xl transition-colors cursor-pointer"
                  >
                    Abbrechen
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingDay}
                    className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-sm shadow-indigo-500/20 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{isSubmittingDay ? "Wird angelegt..." : `Bucket für Tag ${nextDayNumber} anlegen`}</span>
                  </button>
                </div>
              </form>
            </div>
          )}
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


