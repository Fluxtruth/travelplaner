import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, Mail, Phone, MapPin } from "lucide-react";

export const metadata: Metadata = {
  title: "Impressum - Boystrip",
  description: "Rechtliche Angaben und Kontaktinformationen gemäß § 5 TMG",
};

export default function ImpressumPage() {
  return (
    <div className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Back button */}
      <div className="mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Zurück zur Übersicht</span>
        </Link>
      </div>

      <div className="rounded-3xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 shadow-xl shadow-slate-200/50 dark:shadow-black/40 p-6 sm:p-10 space-y-8">
        {/* Header */}
        <div className="border-b border-slate-100 dark:border-neutral-800 pb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 text-xs font-bold mb-3">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Rechtliche Informationen</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            Impressum
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-neutral-400">
            Rechtliche Angaben und Kontaktinformationen
          </p>
        </div>

        {/* Angaben gemäß § 5 TMG */}
        <section className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-neutral-500">
            Angaben gemäß § 5 TMG
          </h2>
          <div className="flex items-start gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-neutral-950/60 border border-slate-100 dark:border-neutral-800/80">
            <MapPin className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
            <div className="text-sm leading-relaxed text-slate-800 dark:text-neutral-200">
              <p className="font-bold text-slate-900 dark:text-white">Philipp Tschakert</p>
              <p>c/o IP-Management #6258</p>
              <p>Ludwig-Erhard-Straße 18</p>
              <p>20459 Hamburg</p>
            </div>
          </div>
        </section>

        {/* Kontakt */}
        <section className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-neutral-500">
            Kontakt
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <a
              href="tel:03023597650"
              className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 dark:bg-neutral-950/60 dark:hover:bg-neutral-800/60 border border-slate-100 dark:border-neutral-800/80 transition-colors group"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Phone className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="block text-[11px] font-bold text-slate-400 uppercase">Telefon</span>
                <span className="text-sm font-semibold text-slate-900 dark:text-white truncate block">
                  030 23597650
                </span>
              </div>
            </a>

            <a
              href="mailto:kontakt@philipp-tschakert.de"
              className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 dark:bg-neutral-950/60 dark:hover:bg-neutral-800/60 border border-slate-100 dark:border-neutral-800/80 transition-colors group"
            >
              <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Mail className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="block text-[11px] font-bold text-slate-400 uppercase">E-Mail</span>
                <span className="text-sm font-semibold text-slate-900 dark:text-white truncate block">
                  kontakt@philipp-tschakert.de
                </span>
              </div>
            </a>
          </div>
        </section>

        {/* Umsatzsteuer-ID */}
        <section className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-neutral-500">
            Umsatzsteuer-ID
          </h2>
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-neutral-950/60 border border-slate-100 dark:border-neutral-800/80 text-sm leading-relaxed text-slate-800 dark:text-neutral-200">
            <p className="text-xs text-slate-500 dark:text-neutral-400">
              Umsatzsteuer-Identifikationsnummer gemäß § 27 a Umsatzsteuergesetz:
            </p>
            <p className="mt-1 font-mono font-bold text-base text-slate-900 dark:text-white">
              DE455319628
            </p>
          </div>
        </section>

        {/* Verantwortlich für den Inhalt */}
        <section className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-neutral-500">
            Verantwortlich für den Inhalt
          </h2>
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-neutral-950/60 border border-slate-100 dark:border-neutral-800/80 text-sm leading-relaxed text-slate-800 dark:text-neutral-200">
            <p className="font-bold text-slate-900 dark:text-white">Philipp Tschakert</p>
            <p>Ludwig-Erhard-Straße 18</p>
            <p>20459 Hamburg</p>
          </div>
        </section>
      </div>
    </div>
  );
}
