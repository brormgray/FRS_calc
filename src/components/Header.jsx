import React from "react";

export default function Header({ hasServiceData, isPre2011Plan }) {
  return (
    <header className="bg-blue-900 text-white p-6 rounded-2xl shadow-xl flex flex-col md:flex-row justify-between items-center gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">F.R.S. RETIREMENT FUNDS</h1>
        <p className="text-blue-200 text-sm">Automated Pension &amp; DROP Estimate Calculator</p>
      </div>
      <div className="flex gap-2 items-center bg-blue-800 p-2 rounded-lg px-4 border border-blue-700">
        <span className="text-blue-200 text-xs font-bold uppercase tracking-wider">
          Detected Plan:
        </span>
        <span
          className={`px-3 py-1 rounded text-sm font-black transition-colors ${
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
    </header>
  );
}
