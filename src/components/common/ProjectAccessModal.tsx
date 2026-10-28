"use client";

import React, { useState } from "react";
import { Trip, TripVisibility } from "@/types";
import {
  updateTripVisibility,
  inviteUserToTripByEmail,
  removeParticipantFromTrip,
  updateTripName,
  deleteTrip,
} from "@/lib/firebase/firestore";
import {
  X,
  Shield,
  Lock,
  Globe,
  UserPlus,
  Mail,
  Copy,
  Check,
  Trash2,
  Users,
  CheckCircle2,
  AlertCircle,
  Pencil,
} from "lucide-react";

interface ProjectAccessModalProps {
  trip: Trip;
  currentUserId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ProjectAccessModal({
  trip,
  currentUserId,
  isOpen,
  onClose,
}: ProjectAccessModalProps) {
  const isOwner = trip.ownerId === currentUserId;
  const [tripName, setTripName] = useState(trip.name);
  const [isUpdatingName, setIsUpdatingName] = useState(false);
  const [visibility, setVisibility] = useState<TripVisibility>(trip.visibility || "private");
  const [inviteEmail, setInviteEmail] = useState("");
  const [isUpdatingVisibility, setIsUpdatingVisibility] = useState(false);
  const [isInvitingEmail, setIsInvitingEmail] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isDeletingTrip, setIsDeletingTrip] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  React.useEffect(() => {
    setTripName(trip.name);
  }, [trip.name]);

  if (!isOpen) return null;

  const handleDeleteTrip = async () => {
    if (!isOwner) return;
    setIsDeletingTrip(true);
    try {
      await deleteTrip(trip.id);
      onClose();
      window.location.href = "/";
    } catch (err) {
      console.error("Failed to delete trip:", err);
      setMessage("Fehler beim Löschen der Reise.");
      setIsDeletingTrip(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = tripName.trim();
    if (!trimmed || trimmed === trip.name) return;

    setIsUpdatingName(true);
    try {
      await updateTripName(trip.id, trimmed);
      setMessage("Reisenamen erfolgreich geändert!");
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      console.warn("Failed to update trip name:", err);
    } finally {
      setIsUpdatingName(false);
    }
  };

  const handleToggleVisibility = async (newVisibility: TripVisibility) => {
    if (!isOwner) return;
    setIsUpdatingVisibility(true);
    try {
      await updateTripVisibility(trip.id, newVisibility);
      setVisibility(newVisibility);
      setMessage(`Projektsichtbarkeit auf ${newVisibility === "public" ? "Öffentlich" : "Privat"} gesetzt.`);
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      console.warn("Failed to update visibility:", err);
    } finally {
      setIsUpdatingVisibility(false);
    }
  };

  const handleInviteEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !inviteEmail.includes("@")) return;

    setIsInvitingEmail(true);
    try {
      await inviteUserToTripByEmail(trip.id, inviteEmail.trim());
      setMessage(`Einladung an ${inviteEmail} vorgemerkt.`);
      setInviteEmail("");
      setTimeout(() => setMessage(null), 3500);
    } catch (err) {
      console.warn("Failed to invite email:", err);
    } finally {
      setIsInvitingEmail(false);
    }
  };

  const handleRemoveParticipant = async (participantId: string) => {
    if (!isOwner || participantId === trip.ownerId) return;
    try {
      await removeParticipantFromTrip(trip.id, participantId);
      setMessage("Teilnehmer entfernt.");
      setTimeout(() => setMessage(null), 2500);
    } catch (err) {
      console.warn("Failed to remove participant:", err);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(trip.inviteCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-7 shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 text-slate-400 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 pb-5 border-b border-slate-200 dark:border-neutral-800">
          <div className="w-11 h-11 rounded-2xl bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-500/20 dark:border-blue-500/30">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Zugangs- & Projektmanagement
            </h3>
            <p className="text-xs text-slate-500 dark:text-neutral-400">
              Steuere, wer diese Reise sehen und bearbeiten darf.
            </p>
          </div>
        </div>

        {message && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{message}</span>
          </div>
        )}

        <div className="mt-5 space-y-6">
          {/* Trip Name Section */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400 mb-2 flex items-center gap-1.5">
              <Pencil className="w-3.5 h-3.5 text-blue-500" />
              Reise-Titel
            </label>
            <form onSubmit={handleUpdateName} className="flex gap-2">
              <input
                type="text"
                value={tripName}
                onChange={(e) => setTripName(e.target.value)}
                placeholder="Reisenamen eingeben..."
                className="flex-1 px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 text-xs font-semibold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
              />
              <button
                type="submit"
                disabled={isUpdatingName || !tripName.trim() || tripName.trim() === trip.name}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5 shrink-0"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{isUpdatingName ? "Speichert..." : "Speichern"}</span>
              </button>
            </form>
          </div>

          {/* Visibility Section */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400 mb-2">
              Projektsichtbarkeit
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleToggleVisibility("private")}
                disabled={!isOwner || isUpdatingVisibility}
                className={`p-3.5 rounded-2xl border text-left transition-all ${
                  visibility === "private"
                    ? "border-blue-600 bg-blue-50 dark:bg-blue-950/30 text-blue-900 dark:text-blue-200 ring-2 ring-blue-500/20"
                    : "border-slate-200 dark:border-neutral-800 bg-slate-50/50 dark:bg-neutral-950/40 text-slate-600 dark:text-neutral-400 hover:border-slate-300 dark:hover:border-neutral-700"
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-xs mb-1">
                  <Lock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>🔒 Privat (Standard)</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-neutral-400 leading-snug">
                  Nur ausdrücklich eingeladene Freunde haben Zugriff.
                </p>
              </button>

              <button
                type="button"
                onClick={() => handleToggleVisibility("public")}
                disabled={!isOwner || isUpdatingVisibility}
                className={`p-3.5 rounded-2xl border text-left transition-all ${
                  visibility === "public"
                    ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 ring-2 ring-emerald-500/20"
                    : "border-slate-200 dark:border-neutral-800 bg-slate-50/50 dark:bg-neutral-950/40 text-slate-600 dark:text-neutral-400 hover:border-slate-300 dark:hover:border-neutral-700"
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-xs mb-1">
                  <Globe className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>🌐 Öffentlich</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-neutral-400 leading-snug">
                  Jeder angemeldete Google-User kann diesen Trip ansehen.
                </p>
              </button>
            </div>
            {!isOwner && (
              <p className="text-[11px] text-slate-400 dark:text-neutral-500 mt-1 italic">
                * Nur der Projekt-Inhaber kann die Sichtbarkeit ändern.
              </p>
            )}
          </div>

          {/* Invite Code Quick Share */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400 mb-2">
              Einladungscode & Sofort-Link
            </label>
            <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-100 dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800">
              <span className="font-mono text-sm font-bold tracking-widest text-blue-600 dark:text-blue-400 px-3">
                {trip.inviteCode}
              </span>
              <button
                onClick={handleCopyCode}
                className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-neutral-800 text-xs font-semibold text-slate-700 dark:text-neutral-200 border border-slate-200 dark:border-neutral-700 shadow-sm hover:bg-slate-50 dark:hover:bg-neutral-700 transition-colors"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode ? "Kopiert" : "Code kopieren"}</span>
              </button>
            </div>
          </div>

          {/* Email Invite Input */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400 mb-2 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5" />
              Nutzer per E-Mail einladen
            </label>
            <form onSubmit={handleInviteEmail} className="flex gap-2">
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="freund@beispiel.de"
                className="flex-1 px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-neutral-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
              <button
                type="submit"
                disabled={isInvitingEmail || !inviteEmail.trim()}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Einladen</span>
              </button>
            </form>
          </div>

          {/* Current Participants List */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                Aktuelle Mitglieder ({trip.participantIds.length})
              </label>
            </div>
            <div className="max-h-36 overflow-y-auto space-y-1.5 p-2 rounded-2xl bg-slate-50 dark:bg-neutral-950/60 border border-slate-200 dark:border-neutral-800">
              {trip.participantIds.map((userId) => {
                const isTripOwner = userId === trip.ownerId;
                const isSelf = userId === currentUserId;

                return (
                  <div
                    key={userId}
                    className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-neutral-900 border border-slate-200/80 dark:border-neutral-800/80 text-xs shadow-sm"
                  >
                    <div className="flex items-center gap-2">
                      <img
                        src={`https://api.dicebear.com/7.x/bottts/svg?seed=${userId}`}
                        alt="Avatar"
                        className="w-6 h-6 rounded-full bg-slate-100 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700"
                      />
                      <span className="font-semibold text-slate-800 dark:text-neutral-200">
                        {isSelf ? "Du" : `User ${userId.slice(0, 6)}...`}
                      </span>
                      {isTripOwner && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-[10px] font-bold">
                          Inhaber
                        </span>
                      )}
                    </div>

                    {isOwner && !isTripOwner && (
                      <button
                        onClick={() => handleRemoveParticipant(userId)}
                        title="Teilnehmer entfernen"
                        className="p-1 text-slate-400 hover:text-red-500 dark:text-neutral-500 dark:hover:text-red-400 rounded transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Gefahrenzone: Reise löschen (Nur Inhaber) */}
          {isOwner && (
            <div className="pt-3 border-t border-red-200/80 dark:border-red-950/80">
              <div className="p-3.5 rounded-2xl bg-red-50/80 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-red-700 dark:text-red-400 flex items-center gap-1.5">
                    <Trash2 className="w-3.5 h-3.5" />
                    Gefahrenzone: Reise löschen
                  </h4>
                  <p className="text-[11px] text-red-600/80 dark:text-red-400/70 mt-0.5 leading-snug">
                    Löscht diese Reise und alle zugehörigen Planungsdaten unwiderruflich.
                  </p>
                </div>

                {showDeleteConfirm ? (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(false)}
                      disabled={isDeletingTrip}
                      className="px-2.5 py-1.5 text-xs font-medium rounded-lg bg-slate-200 dark:bg-neutral-800 text-slate-700 dark:text-neutral-300 hover:bg-slate-300 dark:hover:bg-neutral-700 transition-colors"
                    >
                      Abbrechen
                    </button>
                    <button
                      type="button"
                      onClick={handleDeleteTrip}
                      disabled={isDeletingTrip}
                      className="px-3 py-1.5 text-xs font-bold rounded-lg bg-red-600 hover:bg-red-700 text-white shadow-sm transition-colors flex items-center gap-1.5"
                    >
                      {isDeletingTrip ? "Wird gelöscht..." : "Ja, wirklich löschen"}
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="shrink-0 px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-sm transition-all flex items-center justify-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Reise löschen</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-slate-200 dark:border-neutral-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 dark:bg-neutral-800 hover:bg-slate-800 dark:hover:bg-neutral-700 text-white text-xs font-semibold transition-colors"
          >
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
}
