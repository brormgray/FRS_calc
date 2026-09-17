import React from "react";
import { PiggyBank } from "lucide-react";

export default function DropSection({ formData, calculations, onInputChange }) {
  return (
    <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
      <div className="flex items-center gap-2 mb-4 text-purple-900 font-semibold border-b pb-2">
        <PiggyBank size={20} />
        <h2>D.R.O.P. Compound Growth</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase">
              Duration (Months)
            </label>
            <input
              type="range"
              min="0"
              max="96"
              name="dropMonths"
              value={formData.dropMonths === "" ? 0 : formData.dropMonths}
              onChange={onInputChange}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
            />
            <div className="flex justify-between text-xs text-slate-400 font-medium">
              <span>0</span>
              <span className="text-purple-600 font-bold">
                {formData.dropMonths || 0} Months
              </span>
              <span>96</span>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase">
              Interest Rate (Annual %)
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.1"
                name="dropInterestRate"
                value={formData.dropInterestRate}
                onChange={onInputChange}
                placeholder="e.g. 4.0"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none placeholder:text-slate-300"
              />
              <span className="absolute right-3 top-2 text-slate-400">%</span>
            </div>
          </div>
        </div>

        <div className="bg-purple-50 p-6 rounded-2xl flex flex-col justify-center border border-purple-100 relative overflow-hidden">
          <p className="text-xs text-purple-600 font-bold uppercase text-center mb-1">
            Projected Lump Sum
          </p>
          <p className="text-4xl font-black text-purple-900 text-center tracking-tight z-10">
            $
            {calculations.dropLumpSum.toLocaleString(undefined, {
              maximumFractionDigits: 0,
            })}
          </p>
          <p className="text-[10px] text-purple-500 text-center mt-2 uppercase font-medium z-10">
            Monthly compounding interest
          </p>
          {calculations.isPre2011Plan && formData.dropMonths > 11 && (
            <p className="text-[10px] text-purple-700/70 text-center mt-0.5 italic font-bold z-10">
              + 3% Annual Tier 1 COLA
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
