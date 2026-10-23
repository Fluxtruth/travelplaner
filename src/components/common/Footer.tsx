import React from "react";
import Link from "next/link";
import { Compass } from "lucide-react";

export function Footer() {
  return (
    <footer className="w-full border-t border-slate-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-950/70 backdrop-blur-md py-4 sm:py-6 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-neutral-400">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-lg overflow-hidden border border-slate-200 dark:border-neutral-800 bg-slate-900 shrink-0">
            <img src="/logo-3d.png" alt="Logo" className="w-full h-full object-cover" />
          </div>
          <span className="font-semibold text-slate-700 dark:text-neutral-300">Phil&apos;s Travelplaner</span>
          <span>·</span>
          <span>Kollaborative Reiseplanung</span>
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="/impressum"
            id="footer-impressum-link"
            className="font-medium text-slate-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors py-1 px-2 rounded-lg hover:bg-slate-100 dark:hover:bg-neutral-900"
          >
            Impressum
          </Link>
        </div>
      </div>
    </footer>
  );
}
