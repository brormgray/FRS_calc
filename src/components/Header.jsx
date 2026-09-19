import React from "react";
import { Share2, Users, HardDrive, CheckCircle2 } from "lucide-react";

export default function Header({
  hasServiceData,
  isPre2011Plan,
  onOpenReport,
  onOpenSaved,
  savedCount = 0,
}) {
  return (
    <header className="bg-blue-900 text-white p-5 sm:p-6 rounded-2xl shadow-xl flex flex-col md:flex-row justify-between items-center gap-4">
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 text-center sm:text-left">
        <div>
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">F.R.S. RETIREMENT FUNDS</h1>
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30"
              title="100% Offline Capable & Local IndexedDB Persistence"
            >
              <CheckCircle2 size={11} className="text-emerald-400" />
              <span>Offline Ready</span>
            </span>
          </div>
          <p className="text-blue-200 text-xs sm:text-sm">
            Automated Pension &amp; DROP Estimate Calculator &bull; Local-First
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2.5 items-center justify-center">
        <div className="flex gap-2 items-center bg-blue-800/90 p-1.5 sm:p-2 rounded-lg px-3 sm:px-4 border border-blue-700">
          <span className="text-blue-200 text-[11px] sm:text-xs font-bold uppercase tracking-wider">
            Plan:
          </span>
          <span
            className={`px-2.5 py-0.5 rounded text-xs sm:text-sm font-black transition-colors ${
              hasServiceData
                ? "bg-white text-blue-900 shadow-sm"
                : "bg-blue-800 text-blue-500"
            }`}
          >
            {hasServiceData
              ? isPre2011Plan
                ? "Tier 1 (Pre-2011)"
                : "Tier 2 (Post-2011)"
              : "---"}
          </span>
        </div>

        {/* Saved Clients Drawer Button */}
        <button
          type="button"
          onClick={onOpenSaved}
          className="flex items-center gap-1.5 bg-blue-800 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm px-3.5 py-2 sm:py-2.5 rounded-lg shadow-md transition-all active:scale-95 border border-blue-600"
          title="Open Saved Client Consultations & Local Backups"
        >
          <Users size={16} className="text-blue-300" />
          <span>Saved Clients</span>
          {savedCount > 0 && (
            <span className="ml-0.5 px-1.5 py-0.2 bg-blue-500 text-white rounded-full text-[10px] font-extrabold">
              {savedCount}
            </span>
          )}
        </button>

        {/* 1-Page Executive Report Button */}
        <button
          type="button"
          onClick={onOpenReport}
          className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm px-3.5 py-2 sm:py-2.5 rounded-lg shadow-md transition-all active:scale-95 border border-emerald-400/40"
        >
          <Share2 size={16} />
          <span>1-Page Report &amp; Email</span>
        </button>
      </div>
    </header>
  );
}
