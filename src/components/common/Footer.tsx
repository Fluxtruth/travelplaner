import React from "react";
import Link from "next/link";
import { Compass } from "lucide-react";

export function Footer() {
  return (
    <footer className="w-full border-t border-slate-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-950/70 backdrop-blur-md py-4 sm:py-6 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-neutral-400">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-lg bg-blue-600/10 dark:bg-blue-400/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Compass className="w-3.5 h-3.5" />
          </div>
          <span className="font-semibold text-slate-700 dark:text-neutral-300">Boystrip</span>
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
