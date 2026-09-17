import React from "react";
import { User, Info, ShieldCheck } from "lucide-react";

export default function EmployeeProfile({
  formData,
  calculations,
  onInputChange,
  onClassChange,
  onTimingChange,
  onBoundaryChange,
}) {
  return (
    <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
      <div className="flex items-center justify-between mb-4 border-b pb-2">
        <div className="flex items-center gap-2 text-blue-900 font-semibold">
          <User size={20} />
          <h2>Employee Profile</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Membership Class Selector */}
        <div className="space-y-1 md:col-span-3 mb-2">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            FRS Membership Class
          </label>
          <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => onClassChange("Regular")}
              className={`flex-1 text-xs py-2 rounded-lg font-bold transition-all duration-200 ${
                formData.jobClass === "Regular"
                  ? "bg-white text-blue-700 shadow-sm border border-slate-200/60"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Regular Class
            </button>
            <button
              type="button"
              onClick={() => onClassChange("Special Risk")}
              className={`flex-1 text-xs py-2 rounded-lg font-bold transition-all duration-200 ${
                formData.jobClass === "Special Risk"
                  ? "bg-white text-blue-700 shadow-sm border border-slate-200/60"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Special Risk
            </button>
          </div>
        </div>

        {/* Current Age */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-500 uppercase">Current Age</label>
          <input
            type="number"
            name="currentAge"
            value={formData.currentAge}
            onChange={onInputChange}
            placeholder="e.g. 45"
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none placeholder:text-slate-300"
          />
        </div>

        {/* Annual Salary */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-500 uppercase">Annual Salary</label>
          <div className="relative">
            <span className="absolute left-3 top-2 text-slate-400">$</span>
            <input
              type="number"
              name="annualSalary"
              value={formData.annualSalary}
              onChange={onInputChange}
              placeholder="e.g. 60000"
              className="w-full pl-7 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none placeholder:text-slate-300"
            />
          </div>
          <div className="text-right text-[10px] text-slate-400 font-medium pt-0.5">
            ${(calculations.safeSalary / 12).toLocaleString(undefined, { maximumFractionDigits: 0 })} / month
          </div>
        </div>

        {/* Years of Service */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-500 uppercase">Years of Service</label>
          <input
            type="number"
            name="yearsEmployed"
            value={formData.yearsEmployed}
            onChange={onInputChange}
            placeholder="e.g. 15"
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none placeholder:text-slate-300"
          />

          {/* 2011 Boundary Question */}
          {calculations.isBoundaryYear && (
            <div className="bg-blue-50 p-3 rounded-lg mt-2 border border-blue-200">
              <label className="text-[10px] font-bold text-blue-900 uppercase block mb-2">
                Hired before July 1, 2011?
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => onBoundaryChange(true)}
                  className={`flex-1 text-xs py-1.5 rounded font-medium transition-colors ${
                    formData.hiredBeforeJuly2011
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-white text-blue-600 border border-blue-200 hover:bg-blue-100"
                  }`}
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => onBoundaryChange(false)}
                  className={`flex-1 text-xs py-1.5 rounded font-medium transition-colors ${
                    !formData.hiredBeforeJuly2011
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-white text-blue-600 border border-blue-200 hover:bg-blue-100"
                  }`}
                >
                  No
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Eligibility Path Calculations */}
        {calculations.hasServiceData && (
          <div className="md:col-span-3 bg-blue-50/80 p-4 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4 border border-blue-100">
            <div className="flex items-start gap-3 w-full">
              <Info className="text-blue-600 mt-1 shrink-0" size={18} />
              <div className="text-sm text-blue-800 w-full">
                <p className="mb-3">
                  Normal Eligibility requires{" "}
                  <strong>Age {calculations.ageRequirement}</strong> OR{" "}
                  <strong>{calculations.serviceRequirement} Years Service</strong>.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {/* Age Path */}
                  <div
                    className={`p-3 rounded-xl border transition-all ${
                      calculations.yearsToAge <= calculations.yearsToService &&
                      calculations.yearsToEligible > 0
                        ? "bg-blue-100/80 border-blue-400 ring-1 ring-blue-400 shadow-sm"
                        : "bg-white/80 border-blue-200 opacity-75"
                    }`}
                  >
                    <span className="block text-[10px] uppercase text-slate-500 font-bold mb-2 tracking-wider">
                      Age Path Math
                    </span>
                    <div className="text-xs text-slate-700 bg-white/60 p-2 rounded border border-blue-100/50">
                      <div className="font-mono text-[10px] text-slate-500 mb-1">
                        Target Age − Current Age
                      </div>
                      <div className="font-bold text-blue-900 flex items-center flex-wrap gap-1 mt-1">
                        <span className="bg-white px-1.5 py-0.5 rounded border border-slate-200">
                          {calculations.ageRequirement}
                        </span>
                        <span className="text-slate-400">−</span>
                        <span className="bg-white px-1.5 py-0.5 rounded border border-slate-200">
                          {formData.currentAge || 0}
                        </span>
                        <span className="text-slate-400">=</span>
                        <span className="text-sm underline decoration-blue-300 underline-offset-2 ml-0.5">
                          {calculations.yearsToAge} Yrs
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Service Path */}
                  <div
                    className={`p-3 rounded-xl border transition-all ${
                      calculations.yearsToService <= calculations.yearsToAge &&
                      calculations.yearsToEligible > 0
                        ? "bg-blue-100/80 border-blue-400 ring-1 ring-blue-400 shadow-sm"
                        : "bg-white/80 border-blue-200 opacity-75"
                    }`}
                  >
                    <span className="block text-[10px] uppercase text-slate-500 font-bold mb-2 tracking-wider">
                      Service Path Math
                    </span>
                    <div className="text-xs text-slate-700 bg-white/60 p-2 rounded border border-blue-100/50">
                      <div className="font-mono text-[10px] text-slate-500 mb-1">
                        Target Yrs − Current Yrs
                      </div>
                      <div className="font-bold text-blue-900 flex items-center flex-wrap gap-1 mt-1">
                        <span className="bg-white px-1.5 py-0.5 rounded border border-slate-200">
                          {calculations.serviceRequirement}
                        </span>
                        <span className="text-slate-400">−</span>
                        <span className="bg-white px-1.5 py-0.5 rounded border border-slate-200">
                          {formData.yearsEmployed || 0}
                        </span>
                        <span className="text-slate-400">=</span>
                        <span className="text-sm underline decoration-blue-300 underline-offset-2 ml-0.5">
                          {calculations.yearsToService} Yrs
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-right shrink-0 min-w-[110px]">
              <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">
                Time to Normal
              </p>
              <p className="text-3xl font-black text-blue-900 leading-none mt-1">
                {calculations.yearsToEligible}{" "}
                <span className="text-sm font-bold text-blue-700">Yrs</span>
              </p>
              <p className="text-[10px] text-blue-800 font-bold mt-1.5 uppercase tracking-wider bg-blue-200/50 inline-block px-2 py-0.5 rounded border border-blue-200">
                {calculations.eligibilityReason}
              </p>
            </div>
          </div>
        )}

        {/* Retirement Exit Strategy */}
        {calculations.hasServiceData && (
          <div className="md:col-span-3 pt-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">
              Retirement Exit Strategy
            </label>
            <div className="flex flex-col md:flex-row gap-3">
              <button
                type="button"
                onClick={() => onTimingChange("Normal")}
                className={`flex-1 flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                  formData.retireTiming === "Normal"
                    ? "bg-blue-50 border-blue-400 ring-1 ring-blue-400"
                    : "bg-white border-slate-200 hover:border-blue-200"
                }`}
              >
                <div>
                  <p
                    className={`text-sm font-bold ${
                      formData.retireTiming === "Normal" ? "text-blue-900" : "text-slate-700"
                    }`}
                  >
                    Normal Eligibility
                  </p>
                  <p className="text-[10px] text-slate-500">
                    Wait {calculations.yearsToEligible} yrs (Max Pension)
                  </p>
                </div>
                {formData.retireTiming === "Normal" && (
                  <ShieldCheck size={18} className="text-blue-600" />
                )}
              </button>

              <button
                type="button"
                onClick={() => onTimingChange("Early")}
                className={`flex-1 flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                  formData.retireTiming === "Early"
                    ? "bg-amber-50 border-amber-400 ring-1 ring-amber-400"
                    : "bg-white border-slate-200 hover:border-amber-200"
                }`}
              >
                <div>
                  <p
                    className={`text-sm font-bold ${
                      formData.retireTiming === "Early" ? "text-amber-900" : "text-slate-700"
                    }`}
                  >
                    Retire Immediately
                  </p>
                  <p className="text-[10px] text-slate-500">
                    Exit today with current service
                  </p>
                </div>
                {formData.retireTiming === "Early" &&
                  calculations.earlyRetirementPenalty > 0 && (
                    <span className="text-xs font-bold text-amber-700 bg-amber-200 px-2 py-1 rounded">
                      -{(calculations.earlyRetirementPenalty * 100).toFixed(0)}% Penalty
                    </span>
                  )}
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
