import React, { useState } from "react";
import { RotateCcw, RefreshCw, Loader2 } from "lucide-react";

export default function Footer({ onOpenResetModal }) {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleForceUpdate = async () => {
    setIsUpdating(true);
    try {
      // 1. Force update and unregister service workers
      if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const reg of registrations) {
          try {
            await reg.update();
            await reg.unregister();
          } catch {
            // ignore
          }
        }
      }

      // 2. Clear all cache storage caches
      if (typeof window !== "undefined" && "caches" in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map((name) => caches.delete(name)));
      }
    } catch (err) {
      console.warn("Error during cache flush:", err);
    }

    // 3. Force hard reload bypassing cache with timestamp query
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("updated", Date.now().toString());
      window.location.replace(url.toString());
    }
  };

  return (
    <footer className="text-center pb-8 pt-6 space-y-6">
      <div className="flex flex-col items-center gap-2.5">
        <button
          type="button"
          onClick={onOpenResetModal}
          className="flex items-center gap-2 px-6 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-sm uppercase tracking-wider rounded-xl transition-colors active:scale-95 cursor-pointer shadow-sm"
        >
          <RotateCcw size={18} />
          Reset Calculator
        </button>

        <button
          type="button"
          disabled={isUpdating}
          onClick={handleForceUpdate}
          className="inline-flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-slate-100 text-slate-500 hover:text-blue-700 border border-slate-300 hover:border-blue-300 rounded-lg text-xs font-semibold shadow-sm transition-all active:scale-95 disabled:opacity-50"
          title="Flush offline cache and force download latest app update"
        >
          {isUpdating ? (
            <Loader2 size={13} className="animate-spin text-blue-600" />
          ) : (
            <RefreshCw size={13} />
          )}
          <span>{isUpdating ? "Updating App..." : "Check for Updates & Force Refresh"}</span>
        </button>
      </div>

      <p className="text-xs text-slate-400 max-w-2xl mx-auto italic">
        This tool is for estimation purposes only. All calculations are approximations based on the
        provided Florida Retirement System statutory formulas. Official benefits must be verified with the Florida
        Division of Retirement.
      </p>
    </footer>
  );
}
