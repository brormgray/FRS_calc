import React from "react";
import { PENSION_OPTIONS } from "../constants/pension.js";
import { calculateOptionMultiplier } from "../utils/calculations.js";

/**
 * World-Class 1-Page Executive FRS Retirement Report
 * Formatted strictly for 8.5" x 11" US Letter aspect ratio.
 */
export default function OnePageReport({ formData, calculations, advisorInfo, reportRef }) {
  const currentDate = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const employeeName = formData.name?.trim() || "Prospective FRS Member";
  const employeeEmail = formData.email?.trim() || "—";
  const employeeAgency = formData.agency?.trim() || "Florida Public Employer";

  const advisorName = advisorInfo?.name?.trim() || "FRS Pension Specialist";
  const advisorFirm = advisorInfo?.firm?.trim() || "Florida Retirement Planning";
  const advisorPhone = advisorInfo?.phone?.trim() || "";
  const advisorEmail = advisorInfo?.email?.trim() || "";
  const advisorTitle = advisorInfo?.title?.trim() || "Retirement Planning Specialist";

  const currentAge = parseFloat(formData.currentAge) || 0;
  const yearsEmployed = parseFloat(formData.yearsEmployed) || 0;
  const annualSalary = parseFloat(formData.annualSalary) || 0;
  const monthlySalary = annualSalary / 12;

  // Compute values for all 4 options to show the side-by-side comparison
  const baseMonthly = calculations.baseMonthlyPension || (calculations.monthlyPensionTaxable / (calculations.optionMultiplier || 1));
  const spouseAgeDiff = calculations.spouseAgeDiff || 0;

  const option1Monthly = baseMonthly * 1.0;
  const option2Monthly = baseMonthly * 0.90;
  const option3Mult = calculateOptionMultiplier(3, spouseAgeDiff);
  const option3Monthly = baseMonthly * option3Mult;
  const option4Mult = calculateOptionMultiplier(4, spouseAgeDiff);
  const option4Monthly = baseMonthly * option4Mult;

  const selectedOpt = parseInt(formData.selectedOption, 10) || 1;

  return (
    <div
      ref={reportRef}
      className="one-page-report bg-white text-slate-900 mx-auto p-6 flex flex-col justify-between text-[11px] leading-tight"
      style={{
        width: "816px",
        minHeight: "1056px",
        maxHeight: "1056px",
        boxSizing: "border-box",
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      }}
    >
      {/* 1. Header Banner */}
      <div className="border-b-2 border-emerald-700 pb-3">
        <div className="flex justify-between items-start">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-emerald-700 text-white flex items-center justify-center font-black text-xs">
                FRS
              </div>
              <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-widest">
                State of Florida Retirement System
              </span>
            </div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              Personalized Pension & D.R.O.P. Analysis
            </h1>
            <p className="text-[10px] text-slate-500 font-medium">
              Actuarial Defined Benefit Calculation & Multi-Option Comparative Summary
            </p>
          </div>

          <div className="text-right space-y-0.5 text-[10px]">
            <div className="font-semibold text-slate-700">Date: {currentDate}</div>
            <div className="text-slate-500">Document ID: FRS-{Math.abs(Math.sin(annualSalary + currentAge) * 100000).toFixed(0)}</div>
            <div className="inline-block px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold uppercase text-[9px]">
              {calculations.isPre2011Plan ? "Tier 1 (Pre-July 2011)" : "Tier 2 Plan"}
            </div>
          </div>
        </div>

        {/* Client & Advisor Metadata Ribbon */}
        <div className="mt-3 grid grid-cols-2 gap-4 bg-slate-50 p-2.5 rounded-lg border border-slate-200/80 text-[10px]">
          <div>
            <span className="text-slate-400 font-bold uppercase tracking-wider block text-[8.5px]">
              Prepared Exclusively For
            </span>
            <span className="font-bold text-slate-900 text-xs">{employeeName}</span>
            <div className="text-slate-600 flex gap-2">
              <span>{employeeAgency}</span>
              {employeeEmail !== "—" && <span>• {employeeEmail}</span>}
            </div>
          </div>
          <div className="text-right">
            <span className="text-slate-400 font-bold uppercase tracking-wider block text-[8.5px]">
              Advisory Consultation Provided By
            </span>
            <span className="font-bold text-emerald-800 text-xs">{advisorName}</span>
            <div className="text-slate-600">
              {advisorFirm} {advisorPhone && `• ${advisorPhone}`}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Key Milestones KPI Row */}
      <div className="grid grid-cols-4 gap-2.5 my-2">
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-2">
          <div className="text-[9px] font-bold text-slate-400 uppercase">Membership Class</div>
          <div className="text-sm font-black text-slate-800 mt-0.5">{formData.jobClass} Class</div>
          <div className="text-[9px] text-slate-500">{(calculations.baseMultiplier * 100).toFixed(2)}% per yr accrual</div>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-lg p-2">
          <div className="text-[9px] font-bold text-slate-400 uppercase">Normal Retirement</div>
          <div className="text-sm font-black text-slate-800 mt-0.5">
            Age {calculations.calculatedRetirementAge || "—"}
          </div>
          <div className="text-[9px] text-slate-500">
            {calculations.yearsToEligible > 0 ? `In ${calculations.yearsToEligible} years` : "Currently Eligible"}
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-lg p-2">
          <div className="text-[9px] font-bold text-slate-400 uppercase">Credited Service</div>
          <div className="text-sm font-black text-slate-800 mt-0.5">
            {calculations.projectedYearsOfService || yearsEmployed} Years
          </div>
          <div className="text-[9px] text-slate-500">{yearsEmployed} current credited yrs</div>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-lg p-2">
          <div className="text-[9px] font-bold text-slate-400 uppercase">Monthly AFC Salary</div>
          <div className="text-sm font-black text-slate-800 mt-0.5">
            ${monthlySalary.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
          <div className="text-[9px] text-slate-500">${annualSalary.toLocaleString()} annual AFC</div>
        </div>
      </div>

      {/* 3. Pension Options Comparison Matrix */}
      <div className="border border-slate-200 rounded-lg overflow-hidden my-2 shadow-sm">
        <div className="bg-emerald-800 text-white px-3 py-1.5 flex justify-between items-center">
          <span className="font-bold uppercase tracking-wider text-[9.5px]">
            FRS Defined Benefit Options Comparison Matrix
          </span>
          <span className="text-[9px] text-emerald-200">
            {spouseAgeDiff !== 0 ? `Spouse Age Diff: ${spouseAgeDiff > 0 ? `+${spouseAgeDiff}` : spouseAgeDiff} yrs` : "Spouse Same Age"}
          </span>
        </div>

        <table className="w-full text-left border-collapse text-[10px]">
          <thead>
            <tr className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
              <th className="py-1.5 px-3">Option</th>
              <th className="py-1.5 px-3">Plan Structure</th>
              <th className="py-1.5 px-3 text-right">Benefit Factor</th>
              <th className="py-1.5 px-3 text-right">Member Monthly</th>
              <th className="py-1.5 px-3 text-right">Survivor Monthly</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {/* Option 1 */}
            <tr className={selectedOpt === 1 ? "bg-emerald-50/70 font-semibold" : ""}>
              <td className="py-2 px-3">
                <span className="font-bold text-slate-800">Option 1</span>
                {selectedOpt === 1 && <span className="ml-1.5 text-[8px] bg-emerald-600 text-white px-1.5 py-0.2 rounded font-bold">SELECTED</span>}
              </td>
              <td className="py-2 px-3 text-slate-600">
                Maximum Single Life Benefit (Zero survivor continuation)
              </td>
              <td className="py-2 px-3 text-right font-mono">100.0%</td>
              <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                ${option1Monthly.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
              <td className="py-2 px-3 text-right font-mono text-slate-400">$0.00</td>
            </tr>

            {/* Option 2 */}
            <tr className={selectedOpt === 2 ? "bg-emerald-50/70 font-semibold" : ""}>
              <td className="py-2 px-3">
                <span className="font-bold text-slate-800">Option 2</span>
                {selectedOpt === 2 && <span className="ml-1.5 text-[8px] bg-emerald-600 text-white px-1.5 py-0.2 rounded font-bold">SELECTED</span>}
              </td>
              <td className="py-2 px-3 text-slate-600">
                10-Year Guarantee (120-month beneficiary safety floor)
              </td>
              <td className="py-2 px-3 text-right font-mono">90.0%</td>
              <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                ${option2Monthly.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
              <td className="py-2 px-3 text-right font-mono text-slate-600">Rem. of 120 mos</td>
            </tr>

            {/* Option 3 */}
            <tr className={selectedOpt === 3 ? "bg-emerald-50/70 font-semibold" : ""}>
              <td className="py-2 px-3">
                <span className="font-bold text-slate-800">Option 3</span>
                {selectedOpt === 3 && <span className="ml-1.5 text-[8px] bg-emerald-600 text-white px-1.5 py-0.2 rounded font-bold">SELECTED</span>}
              </td>
              <td className="py-2 px-3 text-slate-600">
                100% Joint & Survivor (Lifetime full survivor continuation)
              </td>
              <td className="py-2 px-3 text-right font-mono">
                {(option3Mult * 100).toFixed(1)}%
              </td>
              <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                ${option3Monthly.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
              <td className="py-2 px-3 text-right font-mono font-bold text-emerald-700">
                ${option3Monthly.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (100%)
              </td>
            </tr>

            {/* Option 4 */}
            <tr className={selectedOpt === 4 ? "bg-emerald-50/70 font-semibold" : ""}>
              <td className="py-2 px-3">
                <span className="font-bold text-slate-800">Option 4</span>
                {selectedOpt === 4 && <span className="ml-1.5 text-[8px] bg-emerald-600 text-white px-1.5 py-0.2 rounded font-bold">SELECTED</span>}
              </td>
              <td className="py-2 px-3 text-slate-600">
                66 2/3% Joint & Survivor (Two-thirds lifetime survivor continuation)
              </td>
              <td className="py-2 px-3 text-right font-mono">
                {(option4Mult * 100).toFixed(1)}%
              </td>
              <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                ${option4Monthly.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
              <td className="py-2 px-3 text-right font-mono font-bold text-emerald-700">
                ${(option4Monthly * (2/3)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (66.7%)
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 4. D.R.O.P. & Shortfall Dual Analysis Grid */}
      <div className="grid grid-cols-2 gap-3 my-2">
        {/* D.R.O.P. Engine Box */}
        <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/50">
          <div className="flex justify-between items-center border-b border-slate-200 pb-1.5 mb-2">
            <span className="font-bold text-emerald-900 uppercase text-[9.5px]">
              D.R.O.P. Wealth Accumulation
            </span>
            <span className="font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded text-[8.5px]">
              {Math.round(calculations.dropYears * 12)} Months @ {formData.dropInterestRate || 4}%
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-slate-600">
              <span>Monthly Deposit in DROP:</span>
              <span className="font-mono font-semibold text-slate-800">
                ${calculations.monthlyPensionTaxable.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Interest Compounding:</span>
              <span className="font-mono text-slate-800 font-semibold">
                {formData.dropInterestRate || 4.0}% Annualized
              </span>
            </div>
            {calculations.isPre2011Plan && (
              <div className="flex justify-between text-emerald-700">
                <span>Tier 1 COLA Escalation:</span>
                <span className="font-semibold">+3.0% Annual Compounding</span>
              </div>
            )}
            <div className="flex justify-between items-center border-t border-slate-200 pt-1.5 mt-1">
              <span className="font-bold text-slate-900">Projected DROP Lump-Sum:</span>
              <span className="text-base font-black text-emerald-700 font-mono">
                ${calculations.dropLumpSum.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* Shortfall & Asset Value Box */}
        <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/50">
          <div className="flex justify-between items-center border-b border-slate-200 pb-1.5 mb-2">
            <span className="font-bold text-slate-900 uppercase text-[9.5px]">
              Income Gap & Capital Replacement
            </span>
            <span className="text-slate-500 text-[8.5px]">Mortality: Age {formData.mortalityAge || 85}</span>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-slate-600">
              <span>Monthly Salary Shortfall:</span>
              <span className="font-mono font-semibold text-amber-700">
                -${calculations.monthlyShortfall.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / mo
              </span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Lifetime Income Shortfall:</span>
              <span className="font-mono font-semibold text-slate-800">
                ${calculations.totalShortfall.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>FRS Buyout Multiple:</span>
              <span className="font-mono text-slate-800 font-semibold">13.548x Annual Pension</span>
            </div>
            <div className="flex justify-between items-center border-t border-slate-200 pt-1.5 mt-1">
              <span className="font-bold text-slate-900">Pension Asset Value:</span>
              <span className="text-base font-black text-blue-900 font-mono">
                ${calculations.buyoutAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Key Recommendation & Next Steps */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2.5 my-1.5 text-[10px]">
        <div className="font-bold text-emerald-900 uppercase tracking-wide text-[9px] mb-1">
          Strategic Actuarial Takeaway
        </div>
        <p className="text-slate-700 leading-relaxed">
          Your projected maximum FRS pension represents an asset equivalent to{" "}
          <strong>${calculations.buyoutAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}</strong>. While Option {selectedOpt} yields{" "}
          <strong>${calculations.monthlyPensionTaxable.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / mo</strong>, 
          managing the <strong>${calculations.monthlyShortfall.toLocaleString(undefined, { maximumFractionDigits: 0 })} / mo</strong> income shortfall and optimizing your{" "}
          <strong>${calculations.dropLumpSum.toLocaleString(undefined, { maximumFractionDigits: 0 })}</strong> DROP rollover is critical to ensuring your retirement longevity.
        </p>
      </div>

      {/* 6. Footer & Legal Disclaimer */}
      <div className="border-t border-slate-200 pt-2 text-[8.5px] text-slate-500 space-y-1">
        <div className="flex justify-between items-center">
          <div>
            <strong>Advisor Contact:</strong> {advisorName} ({advisorTitle}) • {advisorFirm} • {advisorPhone} • {advisorEmail}
          </div>
          <div>Page 1 of 1</div>
        </div>
        <p className="text-slate-400 leading-normal">
          <strong>Important Statutory Disclosure:</strong> This document is an educational estimate prepared for illustrative planning purposes based on statutory Florida Retirement System formulas (Florida Statutes Chapter 121) and member-provided data. It is not an official estimate issued by the Florida Department of Management Services (DMS) Division of Retirement. Actual retirement benefits are determined by the State of Florida at time of retirement.
        </p>
      </div>
    </div>
  );
}
