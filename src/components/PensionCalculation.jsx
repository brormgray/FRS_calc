import React from "react";
import { FileText, Info, ChevronUp, ChevronDown, ShieldAlert, ShieldCheck, TrendingDown } from "lucide-react";
import { PENSION_OPTIONS } from "../constants/pension.js";

export default function PensionCalculation({
  formData,
  calculations,
  showOptionModal,
  onToggleOptionModal,
  onSelectOption,
  onInputChange,
}) {
  return (
    <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
      <div className="flex items-center gap-2 mb-4 text-emerald-900 font-semibold border-b pb-2">
        <FileText size={20} />
        <h2>Pension Calculation</h2>
      </div>

      <div className="space-y-4">
        {/* 4 Option Buttons */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {Object.keys(PENSION_OPTIONS).map((key) => {
            const opt = parseInt(key, 10);
            return (
              <button
                type="button"
                key={opt}
                onClick={() => onSelectOption(opt)}
                className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1 ${
                  formData.selectedOption === opt
                    ? "border-emerald-500 bg-emerald-50 text-emerald-700 font-bold shadow-sm ring-1 ring-emerald-500"
                    : "border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300 hover:bg-slate-100"
                }`}
              >
                <div className="text-[10px] uppercase font-bold tracking-wider">
                  Option {opt}
                </div>
                <div className="text-xs leading-tight">
                  {PENSION_OPTIONS[opt].name}
                </div>
              </button>
            );
          })}
        </div>

        {/* Option Explanation Dropdown */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden transition-all text-sm">
          <button
            type="button"
            onClick={onToggleOptionModal}
            className="w-full flex items-center justify-between p-3 text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <span className="font-semibold text-xs uppercase tracking-wider flex items-center gap-2">
              <Info
                size={16}
                className={showOptionModal ? "text-emerald-600" : "text-slate-400"}
              />
              What does Option {formData.selectedOption} mean?
            </span>
            {showOptionModal ? (
              <ChevronUp size={16} className="text-slate-400" />
            ) : (
              <ChevronDown size={16} className="text-slate-400" />
            )}
          </button>

          {showOptionModal && (
            <div className="p-4 pt-1 space-y-3">
              <div className="flex items-start gap-2 pt-3 border-t border-slate-200/60">
                <p className="text-slate-700 leading-snug">
                  <strong>How it works:</strong> {PENSION_OPTIONS[formData.selectedOption].description}
                </p>
              </div>
              <div className="flex items-start gap-2 pt-2 border-t border-slate-200/60">
                {formData.selectedOption === 1 ? (
                  <ShieldAlert className="text-amber-500 shrink-0 mt-0.5" size={16} />
                ) : (
                  <ShieldCheck className="text-emerald-600 shrink-0 mt-0.5" size={16} />
                )}
                <p className="text-slate-600 text-xs italic">
                  <strong>Strategy:</strong> {PENSION_OPTIONS[formData.selectedOption].strategy}
                </p>
              </div>
            </div>
          )}

          {/* Spouse Age Difference for Options 3 & 4 */}
          {(formData.selectedOption === 3 || formData.selectedOption === 4) && (
            <div className="p-4 bg-emerald-100/50 border-t border-emerald-200 flex flex-col md:flex-row items-center gap-4">
              <div className="w-full md:w-1/2 space-y-1">
                <label className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                  Spouse Age Difference
                </label>
                <input
                  type="number"
                  name="spouseAgeDiff"
                  value={formData.spouseAgeDiff}
                  onChange={onInputChange}
                  className="w-full px-3 py-2 bg-white border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none font-mono text-center"
                />
              </div>
              <div className="w-full md:w-1/2 text-sm text-emerald-800 font-medium">
                {formData.spouseAgeDiff === 0 || formData.spouseAgeDiff === ""
                  ? "Spouse is the exact same age"
                  : parseFloat(formData.spouseAgeDiff) > 0
                  ? `Spouse is ${formData.spouseAgeDiff} years older`
                  : `Spouse is ${Math.abs(formData.spouseAgeDiff)} years younger`}
              </div>
            </div>
          )}
        </div>

        {/* Estimated Monthly Pension Banner */}
        <div className="p-4 bg-emerald-600 text-white rounded-xl flex justify-between items-center shadow-md mt-4">
          <div>
            <p className="text-xs opacity-80 uppercase font-bold">Estimated Monthly Pension</p>
            <p className="text-3xl font-black">
              $
              {calculations.monthlyPensionTaxable.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
            {calculations.hasServiceData && (
              <p className="text-[10px] text-emerald-200 mt-1 font-medium tracking-wide">
                Based on {calculations.projectedYearsOfService} yrs at age{" "}
                {calculations.calculatedRetirementAge} (
                {(calculations.baseMultiplier * 100).toFixed(2)}% mult.)
              </p>
            )}
          </div>
          <TrendingDown className="opacity-40" size={40} />
        </div>
      </div>
    </section>
  );
}
