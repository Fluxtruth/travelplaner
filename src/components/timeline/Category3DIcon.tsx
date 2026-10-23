"use client";

import React from "react";
import { ActivityType } from "@/types";

interface Category3DIconProps {
  type: ActivityType;
  size?: number;
  className?: string;
  animateOnHover?: boolean;
}

/**
 * High-fidelity 3D Vector Icons (Unicons / 3D Fluent style)
 * Designed with volumetric gradients, specular highlights, and ambient depth.
 */
export function Category3DIcon({
  type,
  size = 40,
  className = "",
  animateOnHover = true,
}: Category3DIconProps) {
  const hoverClass = animateOnHover
    ? "transition-all duration-300 group-hover:scale-110 group-hover:-translate-y-1 drop-shadow-md group-hover:drop-shadow-xl"
    : "";

  switch (type) {
    case "restaurant":
    case "food":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`${hoverClass} ${className}`}
        >
          <defs>
            {/* Ambient Shadow */}
            <radialGradient id="rest-shadow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#1e293b" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#1e293b" stopOpacity="0" />
            </radialGradient>
            {/* Top Bun Gradient */}
            <linearGradient id="rest-bun-top" x1="16" y1="12" x2="48" y2="34" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#fcd34d" />
              <stop offset="25%" stopColor="#f59e0b" />
              <stop offset="85%" stopColor="#d97706" />
              <stop offset="100%" stopColor="#b45309" />
            </linearGradient>
            {/* Bun Specular Light */}
            <linearGradient id="rest-bun-shine" x1="22" y1="14" x2="38" y2="24" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </linearGradient>
            {/* Patty */}
            <linearGradient id="rest-patty" x1="10" y1="38" x2="54" y2="46" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#854d0e" />
              <stop offset="50%" stopColor="#713f12" />
              <stop offset="100%" stopColor="#451a03" />
            </linearGradient>
            {/* Cheese */}
            <linearGradient id="rest-cheese" x1="12" y1="34" x2="52" y2="42" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="40%" stopColor="#facc15" />
              <stop offset="100%" stopColor="#eab308" />
            </linearGradient>
            {/* Lettuce */}
            <linearGradient id="rest-lettuce" x1="12" y1="30" x2="52" y2="36" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#86efac" />
              <stop offset="50%" stopColor="#22c55e" />
              <stop offset="100%" stopColor="#15803d" />
            </linearGradient>
            {/* Bottom Bun */}
            <linearGradient id="rest-bun-bot" x1="16" y1="44" x2="48" y2="54" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#fbbf24" />
              <stop offset="60%" stopColor="#d97706" />
              <stop offset="100%" stopColor="#92400e" />
            </linearGradient>
          </defs>

          {/* Cast Shadow */}
          <ellipse cx="32" cy="56" rx="22" ry="5" fill="url(#rest-shadow)" />

          {/* Bottom Bun */}
          <path
            d="M14 44C14 44 14 53 32 53C50 53 50 44 50 44C50 43 48 42 32 42C16 42 14 43 14 44Z"
            fill="url(#rest-bun-bot)"
          />

          {/* Patty */}
          <rect x="12" y="38" width="40" height="7" rx="3.5" fill="url(#rest-patty)" />

          {/* Melted Cheese Slice */}
          <path
            d="M14 36H50L45 44L36 38L27 45L20 38L14 36Z"
            fill="url(#rest-cheese)"
          />

          {/* Crisp Lettuce Wave */}
          <path
            d="M11 33C14 31 17 35 21 33C25 31 28 35 32 33C36 31 39 35 43 33C47 31 50 35 53 33C53 35 51 37 49 37H15C13 37 11 35 11 33Z"
            fill="url(#rest-lettuce)"
          />

          {/* Top Bun Dome */}
          <path
            d="M12 31C12 18 20 12 32 12C44 12 52 18 52 31C52 32.5 50.5 33 32 33C13.5 33 12 32.5 12 31Z"
            fill="url(#rest-bun-top)"
          />

          {/* Top Bun Specular Highlight */}
          <ellipse cx="28" cy="18" rx="12" ry="4" fill="url(#rest-bun-shine)" transform="rotate(-10 28 18)" />

          {/* White Sesame Seeds */}
          <ellipse cx="24" cy="20" rx="1.6" ry="0.9" fill="#fef9c3" transform="rotate(-15 24 20)" />
          <ellipse cx="34" cy="18" rx="1.6" ry="0.9" fill="#fef9c3" transform="rotate(20 34 18)" />
          <ellipse cx="40" cy="23" rx="1.6" ry="0.9" fill="#fef9c3" transform="rotate(-10 40 23)" />
          <ellipse cx="29" cy="24" rx="1.6" ry="0.9" fill="#fef9c3" transform="rotate(15 29 24)" />
          <ellipse cx="20" cy="25" rx="1.6" ry="0.9" fill="#fef9c3" transform="rotate(-30 20 25)" />
        </svg>
      );

    case "bar":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`${hoverClass} ${className}`}
        >
          <defs>
            <radialGradient id="bar-shadow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#1e293b" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#1e293b" stopOpacity="0" />
            </radialGradient>
            {/* Glass Stem & Rim */}
            <linearGradient id="bar-glass" x1="16" y1="14" x2="48" y2="48" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#e0f2fe" stopOpacity="0.9" />
              <stop offset="50%" stopColor="#bae6fd" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#7dd3fc" stopOpacity="0.8" />
            </linearGradient>
            {/* Neon Drink Gradient */}
            <linearGradient id="bar-drink" x1="20" y1="20" x2="44" y2="38" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#ec4899" />
              <stop offset="50%" stopColor="#f43f5e" />
              <stop offset="100%" stopColor="#f97316" />
            </linearGradient>
            {/* Lime Slice */}
            <linearGradient id="bar-lime" x1="40" y1="10" x2="56" y2="24" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#84cc16" />
              <stop offset="100%" stopColor="#4d7c0f" />
            </linearGradient>
            {/* Straw */}
            <linearGradient id="bar-straw" x1="16" y1="8" x2="38" y2="34" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#06b6d4" />
              <stop offset="100%" stopColor="#0891b2" />
            </linearGradient>
          </defs>

          {/* Cast Shadow */}
          <ellipse cx="32" cy="57" rx="16" ry="4" fill="url(#bar-shadow)" />

          {/* Glass Base */}
          <ellipse cx="32" cy="54" rx="14" ry="3.5" fill="url(#bar-glass)" />

          {/* Glass Stem */}
          <rect x="30" y="38" width="4" height="16" rx="2" fill="url(#bar-glass)" />

          {/* Martini / Cocktail Cone */}
          <path
            d="M14 18L32 40L50 18C51.5 16 50 14 47 14H17C14 14 12.5 16 14 18Z"
            fill="url(#bar-glass)"
            stroke="#e0f2fe"
            strokeWidth="1.5"
          />

          {/* Drink Liquid */}
          <path
            d="M18 22L32 37L46 22H18Z"
            fill="url(#bar-drink)"
          />

          {/* Liquid Top Surface Glow */}
          <ellipse cx="32" cy="22" rx="14" ry="2.5" fill="#f472b6" opacity="0.9" />

          {/* Striped Party Straw */}
          <path
            d="M24 7L33 34"
            stroke="url(#bar-straw)"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path d="M26 12L28 17" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
          <path d="M29 21L31 26" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />

          {/* Lime / Lemon Slice on Glass Rim */}
          <circle cx="47" cy="16" r="8" fill="url(#bar-lime)" />
          <circle cx="47" cy="16" r="6" fill="#bef264" />
          <circle cx="47" cy="16" r="2" fill="#ecfccb" />
          <line x1="47" y1="10" x2="47" y2="22" stroke="#4d7c0f" strokeWidth="0.8" />
          <line x1="41" y1="16" x2="53" y2="16" stroke="#4d7c0f" strokeWidth="0.8" />

          {/* Bubble Sparkles */}
          <circle cx="30" cy="28" r="1.5" fill="#ffffff" opacity="0.8" />
          <circle cx="34" cy="32" r="1" fill="#ffffff" opacity="0.8" />
          <circle cx="27" cy="24" r="1" fill="#ffffff" opacity="0.8" />
        </svg>
      );

    case "activity":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`${hoverClass} ${className}`}
        >
          <defs>
            <radialGradient id="act-shadow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#0f172a" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#0f172a" stopOpacity="0" />
            </radialGradient>
            {/* Brass / Metallic Outer Bezel */}
            <linearGradient id="act-bezel" x1="12" y1="8" x2="52" y2="56" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="35%" stopColor="#0284c7" />
              <stop offset="70%" stopColor="#0369a1" />
              <stop offset="100%" stopColor="#075985" />
            </linearGradient>
            {/* Dial Background */}
            <radialGradient id="act-dial" cx="32" cy="32" r="20">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="75%" stopColor="#f1f5f9" />
              <stop offset="100%" stopColor="#cbd5e1" />
            </radialGradient>
            {/* Needle Red */}
            <linearGradient id="act-needle-n" x1="32" y1="14" x2="32" y2="32" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#ef4444" />
              <stop offset="100%" stopColor="#b91c1c" />
            </linearGradient>
            {/* Needle Blue */}
            <linearGradient id="act-needle-s" x1="32" y1="32" x2="32" y2="50" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#1d4ed8" />
            </linearGradient>
          </defs>

          {/* Cast Shadow */}
          <ellipse cx="32" cy="56" rx="20" ry="5" fill="url(#act-shadow)" />

          {/* Compass Top Hanging Ring */}
          <circle cx="32" cy="10" r="5" stroke="#38bdf8" strokeWidth="3" fill="none" />

          {/* Outer 3D Bezel */}
          <circle cx="32" cy="34" r="22" fill="url(#act-bezel)" />
          <circle cx="32" cy="34" r="19" fill="#0369a1" />

          {/* Inner Compass Face */}
          <circle cx="32" cy="34" r="17" fill="url(#act-dial)" />

          {/* Cardinal Ticks */}
          <line x1="32" y1="19" x2="32" y2="22" stroke="#64748b" strokeWidth="2" strokeLinecap="round" />
          <line x1="32" y1="46" x2="32" y2="49" stroke="#64748b" strokeWidth="2" strokeLinecap="round" />
          <line x1="17" y1="34" x2="20" y2="34" stroke="#64748b" strokeWidth="2" strokeLinecap="round" />
          <line x1="44" y1="34" x2="47" y2="34" stroke="#64748b" strokeWidth="2" strokeLinecap="round" />

          {/* Letter N */}
          <text x="32" y="27" textAnchor="middle" fill="#ef4444" fontSize="6" fontWeight="bold" fontFamily="sans-serif">
            N
          </text>

          {/* 3D Magnetic Compass Needle (tilted 35 deg) */}
          <g transform="rotate(35 32 34)">
            {/* North Point */}
            <polygon points="32,18 36,34 32,32 28,34" fill="url(#act-needle-n)" />
            {/* South Point */}
            <polygon points="32,50 36,34 32,36 28,34" fill="url(#act-needle-s)" />
            {/* Center Pivot Pin */}
            <circle cx="32" cy="34" r="3" fill="#f8fafc" stroke="#334155" strokeWidth="1" />
            <circle cx="32" cy="34" r="1" fill="#0284c7" />
          </g>

          {/* Glass Lens Reflection */}
          <path
            d="M17 28C19 20 27 19 36 20C28 22 22 26 17 28Z"
            fill="#ffffff"
            opacity="0.6"
          />
        </svg>
      );

    case "culture":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`${hoverClass} ${className}`}
        >
          <defs>
            <radialGradient id="cult-shadow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#0f172a" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#0f172a" stopOpacity="0" />
            </radialGradient>
            {/* Golden Roof Pediment */}
            <linearGradient id="cult-roof" x1="12" y1="14" x2="52" y2="28" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#34d399" />
              <stop offset="50%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#047857" />
            </linearGradient>
            {/* Pillar Marble Cylinders */}
            <linearGradient id="cult-pillar" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#f1f5f9" />
              <stop offset="40%" stopColor="#ffffff" />
              <stop offset="85%" stopColor="#cbd5e1" />
              <stop offset="100%" stopColor="#94a3b8" />
            </linearGradient>
            {/* Base Steps */}
            <linearGradient id="cult-base" x1="8" y1="46" x2="56" y2="55" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#e2e8f0" />
              <stop offset="50%" stopColor="#cbd5e1" />
              <stop offset="100%" stopColor="#64748b" />
            </linearGradient>
          </defs>

          {/* Cast Shadow */}
          <ellipse cx="32" cy="57" rx="23" ry="5" fill="url(#cult-shadow)" />

          {/* Bottom Pedestal Steps (3D stepped plinth) */}
          <rect x="10" y="50" width="44" height="4" rx="1.5" fill="url(#cult-base)" />
          <rect x="13" y="47" width="38" height="3" rx="1" fill="#e2e8f0" />
          <rect x="15" y="45" width="34" height="2" fill="#f8fafc" />

          {/* 4 Classical Fluted Columns */}
          <rect x="17" y="27" width="5" height="18" rx="1" fill="url(#cult-pillar)" />
          <rect x="25" y="27" width="5" height="18" rx="1" fill="url(#cult-pillar)" />
          <rect x="34" y="27" width="5" height="18" rx="1" fill="url(#cult-pillar)" />
          <rect x="42" y="27" width="5" height="18" rx="1" fill="url(#cult-pillar)" />

          {/* Entablature Beam above columns */}
          <rect x="14" y="24" width="36" height="4" rx="1" fill="#10b981" />

          {/* Pediment Triangle (Roof) */}
          <polygon points="32,11 12,24 52,24" fill="url(#cult-roof)" />

          {/* Golden Star / Emblem in Pediment Center */}
          <circle cx="32" cy="19" r="2.5" fill="#fef08a" />
          <polygon points="32,16.5 32.8,18.5 35,18.5 33.2,19.8 33.8,21.8 32,20.5 30.2,21.8 30.8,19.8 29,18.5 31.2,18.5" fill="#facc15" />

          {/* Ambient Inner Doorway Glow */}
          <rect x="29" y="35" width="6" height="10" rx="3" fill="#047857" opacity="0.6" />
        </svg>
      );

    case "accommodation":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`${hoverClass} ${className}`}
        >
          <defs>
            <radialGradient id="acc-shadow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#1e1b4b" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#1e1b4b" stopOpacity="0" />
            </radialGradient>
            {/* Building Wall */}
            <linearGradient id="acc-wall" x1="16" y1="14" x2="48" y2="54" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#a855f7" />
              <stop offset="45%" stopColor="#7c3aed" />
              <stop offset="100%" stopColor="#581c87" />
            </linearGradient>
            {/* Glowing Windows */}
            <linearGradient id="acc-window" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="100%" stopColor="#fbbf24" />
            </linearGradient>
            {/* Rooftop Banner */}
            <linearGradient id="acc-roof" x1="14" y1="12" x2="50" y2="18" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#c084fc" />
              <stop offset="100%" stopColor="#9333ea" />
            </linearGradient>
          </defs>

          {/* Cast Shadow */}
          <ellipse cx="32" cy="56" rx="20" ry="5" fill="url(#acc-shadow)" />

          {/* Main Hotel Tower */}
          <rect x="18" y="16" width="28" height="38" rx="3" fill="url(#acc-wall)" />

          {/* Modern Rooftop Terrace / Awning */}
          <rect x="15" y="13" width="34" height="4" rx="2" fill="url(#acc-roof)" />

          {/* Hotel Signboard "H" on Roof */}
          <rect x="28" y="7" width="8" height="7" rx="1.5" fill="#facc15" />
          <text x="32" y="12.5" textAnchor="middle" fill="#581c87" fontSize="5" fontWeight="bold" fontFamily="sans-serif">
            H
          </text>

          {/* Illuminated Windows Matrix */}
          <rect x="22" y="21" width="4" height="5" rx="1" fill="url(#acc-window)" />
          <rect x="28" y="21" width="4" height="5" rx="1" fill="#ede9fe" />
          <rect x="34" y="21" width="4" height="5" rx="1" fill="url(#acc-window)" />
          <rect x="40" y="21" width="4" height="5" rx="1" fill="url(#acc-window)" />

          <rect x="22" y="29" width="4" height="5" rx="1" fill="#ede9fe" />
          <rect x="28" y="29" width="4" height="5" rx="1" fill="url(#acc-window)" />
          <rect x="34" y="29" width="4" height="5" rx="1" fill="#ede9fe" />
          <rect x="40" y="29" width="4" height="5" rx="1" fill="url(#acc-window)" />

          <rect x="22" y="37" width="4" height="5" rx="1" fill="url(#acc-window)" />
          <rect x="28" y="37" width="4" height="5" rx="1" fill="url(#acc-window)" />
          <rect x="34" y="37" width="4" height="5" rx="1" fill="url(#acc-window)" />
          <rect x="40" y="37" width="4" height="5" rx="1" fill="#ede9fe" />

          {/* Hotel Ground Entrance Canopy */}
          <path d="M26 46H38L40 50H24L26 46Z" fill="#e11d48" />
          <rect x="28" y="50" width="8" height="4" fill="#fef08a" />
        </svg>
      );

    case "transport":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`${hoverClass} ${className}`}
        >
          <defs>
            <radialGradient id="trans-shadow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#0e7490" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#0e7490" stopOpacity="0" />
            </radialGradient>
            {/* Sleek Train Body */}
            <linearGradient id="trans-body" x1="16" y1="12" x2="48" y2="52" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="40%" stopColor="#06b6d4" />
              <stop offset="100%" stopColor="#0891b2" />
            </linearGradient>
            {/* Cockpit Windshield */}
            <linearGradient id="trans-glass" x1="20" y1="18" x2="44" y2="28" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#0f172a" />
              <stop offset="100%" stopColor="#1e293b" />
            </linearGradient>
            {/* Speed Stripe */}
            <linearGradient id="trans-stripe" x1="14" y1="36" x2="50" y2="39" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#facc15" />
              <stop offset="100%" stopColor="#f59e0b" />
            </linearGradient>
          </defs>

          {/* Cast Shadow */}
          <ellipse cx="32" cy="56" rx="20" ry="5" fill="url(#trans-shadow)" />

          {/* Train Aerodynamic Nose & Cabin */}
          <path
            d="M19 48L17 26C17 18 23 12 32 12C41 12 47 18 47 26L45 48C45 51 42 53 32 53C22 53 19 51 19 48Z"
            fill="url(#trans-body)"
          />

          {/* Modern Cockpit Windshield */}
          <path
            d="M21 27C21 21 25 17 32 17C39 17 43 21 43 27C43 30 38 31 32 31C26 31 21 30 21 27Z"
            fill="url(#trans-glass)"
          />

          {/* Cockpit Glass Reflection Highlight */}
          <path
            d="M24 21C26 19 29 18 33 18C30 20 28 23 26 26H22C22 24 23 22 24 21Z"
            fill="#38bdf8"
            opacity="0.8"
          />

          {/* Front Speed Racing Stripe */}
          <rect x="17.5" y="35" width="29" height="4" rx="2" fill="url(#trans-stripe)" />

          {/* Headlights (Glowing) */}
          <ellipse cx="23" cy="45" rx="3.5" ry="2.5" fill="#ffffff" />
          <ellipse cx="41" cy="45" rx="3.5" ry="2.5" fill="#ffffff" />
          <ellipse cx="23" cy="45" rx="2" ry="1.5" fill="#fef08a" />
          <ellipse cx="41" cy="45" rx="2" ry="1.5" fill="#fef08a" />

          {/* Center Grille / Coupling Badge */}
          <rect x="29" y="44" width="6" height="5" rx="1.5" fill="#0f172a" />
        </svg>
      );

    case "timeslot":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`${hoverClass} ${className}`}
        >
          <defs>
            <radialGradient id="time-shadow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#0369a1" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#0369a1" stopOpacity="0" />
            </radialGradient>
            {/* Clock Rim */}
            <linearGradient id="time-rim" x1="12" y1="12" x2="52" y2="54" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="50%" stopColor="#0284c7" />
              <stop offset="100%" stopColor="#0369a1" />
            </linearGradient>
            {/* Bells */}
            <linearGradient id="time-bell" x1="10" y1="8" x2="26" y2="20" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#facc15" />
              <stop offset="100%" stopColor="#ca8a04" />
            </linearGradient>
            {/* Clock Face */}
            <radialGradient id="time-face" cx="32" cy="34" r="18">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="70%" stopColor="#f8fafc" />
              <stop offset="100%" stopColor="#e2e8f0" />
            </radialGradient>
          </defs>

          {/* Cast Shadow */}
          <ellipse cx="32" cy="57" rx="18" ry="4.5" fill="url(#time-shadow)" />

          {/* 3D Left and Right Top Bells */}
          <ellipse cx="20" cy="16" rx="7" ry="5" transform="rotate(-30 20 16)" fill="url(#time-bell)" />
          <ellipse cx="44" cy="16" rx="7" ry="5" transform="rotate(30 44 16)" fill="url(#time-bell)" />

          {/* Feet */}
          <rect x="18" y="48" width="4" height="8" rx="2" transform="rotate(25 18 48)" fill="#0284c7" />
          <rect x="42" y="48" width="4" height="8" rx="2" transform="rotate(-25 42 48)" fill="#0284c7" />

          {/* Main Bezel Body */}
          <circle cx="32" cy="34" r="21" fill="url(#time-rim)" />
          <circle cx="32" cy="34" r="18" fill="#0284c7" />

          {/* Clock Dial Face */}
          <circle cx="32" cy="34" r="16" fill="url(#time-face)" />

          {/* 12, 3, 6, 9 Dot Markers */}
          <circle cx="32" cy="21" r="1.5" fill="#64748b" />
          <circle cx="45" cy="34" r="1.5" fill="#64748b" />
          <circle cx="32" cy="47" r="1.5" fill="#64748b" />
          <circle cx="19" cy="34" r="1.5" fill="#64748b" />

          {/* Clock Hands (10:10 classic high-end position) */}
          {/* Hour hand */}
          <line x1="32" y1="34" x2="25" y2="27" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" />
          {/* Minute hand */}
          <line x1="32" y1="34" x2="41" y2="26" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" />
          {/* Second hand (orange) */}
          <line x1="32" y1="34" x2="32" y2="23" stroke="#f97316" strokeWidth="1" strokeLinecap="round" />

          {/* Center Cap */}
          <circle cx="32" cy="34" r="2.5" fill="#f97316" />

          {/* Glass Crystal Reflection Dome */}
          <path
            d="M18 30C20 22 26 19 36 20C27 21 22 25 18 30Z"
            fill="#ffffff"
            opacity="0.65"
          />
        </svg>
      );

    default:
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`${hoverClass} ${className}`}
        >
          <defs>
            <radialGradient id="def-shadow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#1e293b" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#1e293b" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="def-gem" x1="16" y1="14" x2="48" y2="50" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#60a5fa" />
              <stop offset="50%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#1d4ed8" />
            </linearGradient>
          </defs>
          <ellipse cx="32" cy="56" rx="16" ry="4" fill="url(#def-shadow)" />
          <polygon points="32,12 50,26 42,50 22,50 14,26" fill="url(#def-gem)" />
          <polygon points="32,12 40,26 32,36 24,26" fill="#93c5fd" opacity="0.8" />
          <polygon points="32,36 42,50 22,50" fill="#1e40af" />
        </svg>
      );
  }
}
