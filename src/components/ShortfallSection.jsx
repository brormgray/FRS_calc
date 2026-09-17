import React from "react";
import { TrendingDown, Calculator } from "lucide-react";

export default function ShortfallSection({ formData, calculations, onInputChange }) {
  return (
    <section className="bg-amber-50 p-6 rounded-2xl border border-amber-200 shadow-sm overflow-hidden relative">
      <div className="absolute top-0 right-0 p-4 opacity-10 rotate-12">
        <Calculator size={80} />
      </div>
      <h3 className="text-amber-900 font-bold mb-4 flex items-center gap-2">
        <TrendingDown size={18} />
        Shortfall Analysis
      </h3>

      <div className="space-y-6 relative z-10">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-amber-700">Monthly Gap</span>
            <span className="font-bold text-amber-900">
              $
              {calculations.monthlyShortfall.toLocaleString(undefined, {
                maximumFractionDigits: 0,
              })}
            </span>
          </div>
          <div className="w-full bg-amber-200 h-1 rounded-full overflow-hidden">
            <div className="bg-amber-600 h-full" style={{ width: "65%" }}></div>
          </div>
        </div>

        <div className="bg-white/50 p-4 rounded-xl border border-amber-100">
          <p className="text-xs font-bold text-amber-600 uppercase mb-2">
            Total Lifecycle Shortfall
          </p>
          <p className="text-2xl font-black text-amber-900">
            $
            {calculations.totalShortfall.toLocaleString(undefined, {
              maximumFractionDigits: 0,
            })}
          </p>

          <div className="text-[10px] text-amber-800 mt-2 space-y-1.5 font-medium bg-amber-100/50 p-2.5 rounded border border-amber-200/50">
            <div className="flex justify-between">
              <span className="text-amber-700">Exit Age (Pension Starts):</span>
              <span>
                {calculations.calculatedRetirementAge > 0
                  ? calculations.calculatedRetirementAge
                  : "---"}
              </span>
            </div>

            {calculations.dropYears > 0 && (
              <div className="flex justify-between text-purple-700">
                <span>+ D.R.O.P. Duration:</span>
                <span>{calculations.dropYears.toFixed(1)} yrs</span>
              </div>
            )}

            <div className="flex justify-between border-t border-amber-200 pt-1.5 font-bold">
              <span>True Retirement Age:</span>
              <span>
                {calculations.actualExitAge > 0
                  ? calculations.actualExitAge.toFixed(1)
                  : "---"}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-amber-700">Mortality Age:</span>
              <span>{formData.mortalityAge || 0}</span>
            </div>

            <div className="flex justify-between border-t border-amber-200 pt-1.5 text-amber-900 font-bold">
              <span>Years in Retirement:</span>
              <span>
                {calculations.yearsInRetirement > 0
                  ? calculations.yearsInRetirement.toFixed(1)
                  : "---"}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-amber-600 uppercase">
            Target Mortality Age
          </label>
          <input
            type="number"
            name="mortalityAge"
            value={formData.mortalityAge}
            onChange={onInputChange}
            placeholder="e.g. 85"
            className="w-full bg-white border border-amber-200 rounded px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-amber-400 placeholder:text-slate-300"
          />
        </div>
      </div>
    </section>
  );
}
