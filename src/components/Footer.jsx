import React from "react";
import { RotateCcw } from "lucide-react";

export default function Footer({ onOpenResetModal }) {
  return (
    <footer className="text-center pb-8 pt-6 space-y-6">
      <div className="flex justify-center">
        <button
          type="button"
          onClick={onOpenResetModal}
          className="flex items-center gap-2 px-6 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-sm uppercase tracking-wider rounded-xl transition-colors active:scale-95 cursor-pointer"
        >
          <RotateCcw size={18} />
          Reset Calculator
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
