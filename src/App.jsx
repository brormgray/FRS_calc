import React, { useState, useMemo } from 'react';
import {
  Calculator,
  ChevronDown,
  ChevronUp,
  FileText,
  Info,
  PiggyBank,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  TrendingDown,
  User,
} from 'lucide-react';

export const PENSION_OPTIONS = {
  1: {
    name: "Maximum Single Life",
    description:
      "Provides the absolute maximum monthly benefit paid for your lifetime only. Payments cease entirely upon your death. There is zero beneficiary coverage.",
    strategy:
      "Best if you have no dependents, or if you hold a separate life insurance policy that already provides adequate beneficiary protection.",
  },
  2: {
    name: "10-Year Guarantee",
    description:
      "Benefit is reduced (usually ~10%). Guarantees exactly 120 monthly payments. If you pass away within 10 years of retiring, your beneficiary receives the remaining payments of that 120-month block. If you live beyond 10 years, you continue receiving payments for life, but no beneficiary payout occurs upon death.",
    strategy:
      "Provides a short-term safety net for dependents immediately following retirement without severely reducing your lifetime monthly income.",
  },
  3: {
    name: "100% Joint & Survivor",
    description:
      "Benefit is reduced based on the age difference between you and your joint annuitant (beneficiary). Guarantees that upon your death, your beneficiary will continue to receive the exact same monthly amount for the rest of their life.",
    strategy:
      "Maximum security for a surviving spouse, ensuring their income does not drop when you pass away.",
  },
  4: {
    name: "66 2/3% Joint & Survivor",
    description:
      "Benefit is reduced based on ages. Upon the death of EITHER you or your joint annuitant, the monthly payment drops. The survivor receives 66.67% (two-thirds) of the original monthly benefit for the remainder of their life.",
    strategy:
      "A middle-ground option. Yields a higher initial monthly payment than Option 3, but shifts the financial risk to the surviving individual.",
  },
};

const INITIAL_FORM_STATE = {
  name: "",
  hiredBeforeJuly2011: true,
  jobClass: "Regular",
  retireTiming: "Normal",
  currentAge: "",
  yearsEmployed: "",
  annualSalary: "",
  dropMonths: "",
  dropInterestRate: 4,
  mortalityAge: 85,
  selectedOption: 1,
  spouseAgeDiff: 0,
};

export default function App() {
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [showOptionModal, setShowOptionModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showIvrDetails, setShowIvrDetails] = useState(false);

  const calculations = useMemo(() => {
    const currentAge = parseFloat(formData.currentAge) || 0;
    const yearsEmployed = parseFloat(formData.yearsEmployed) || 0;
    const annualSalary = parseFloat(formData.annualSalary) || 0;
    const dropMonths = parseFloat(formData.dropMonths) || 0;
    const dropInterestRate = parseFloat(formData.dropInterestRate) || 0;
    const mortalityAge = parseFloat(formData.mortalityAge) || 0;
    const spouseAgeDiff = parseFloat(formData.spouseAgeDiff) || 0;

    const estimatedHireYear = new Date().getFullYear() - Math.floor(yearsEmployed);
    const isBoundaryYear = yearsEmployed > 0 && estimatedHireYear === 2011;
    const hasServiceData = yearsEmployed > 0;

    let isPre2011Plan = true;
    if (yearsEmployed === 0 || estimatedHireYear < 2011) {
      isPre2011Plan = true;
    } else if (estimatedHireYear > 2011) {
      isPre2011Plan = false;
    } else {
      isPre2011Plan = formData.hiredBeforeJuly2011;
    }

    let serviceRequirement;
    let ageRequirement;
    let baseMultiplier = formData.jobClass === "Special Risk" ? 0.03 : 0.016;

    if (formData.jobClass === "Special Risk") {
      serviceRequirement = isPre2011Plan ? 25 : 30;
      ageRequirement = isPre2011Plan ? 55 : 60;
    } else {
      serviceRequirement = isPre2011Plan ? 30 : 33;
      ageRequirement = isPre2011Plan ? 62 : 65;
    }

    const yearsToAge = Math.max(0, ageRequirement - currentAge);
    const yearsToService = Math.max(0, serviceRequirement - yearsEmployed);
    const yearsToEligible = Math.min(yearsToAge, yearsToService);

    let eligibilityReason = "";
    if (yearsToEligible === 0) {
      eligibilityReason = "Eligible Now";
    } else if (yearsToAge < yearsToService) {
      eligibilityReason = "Driven by Age";
    } else if (yearsToService < yearsToAge) {
      eligibilityReason = "Driven by Service";
    } else {
      eligibilityReason = "Age & Service Align";
    }

    if (formData.jobClass === "Regular" && yearsToEligible === 0) {
      const extraAge = Math.max(0, Math.floor(currentAge - ageRequirement));
      const extraService = Math.max(0, Math.floor(yearsEmployed - serviceRequirement));
      const maxExtra = Math.max(extraAge, extraService);
      if (maxExtra === 1) baseMultiplier = 0.0163;
      else if (maxExtra === 2) baseMultiplier = 0.0165;
      else if (maxExtra >= 3) baseMultiplier = 0.0168;
    }

    let calculatedRetirementAge = 0;
    let projectedYearsOfService = 0;
    let earlyRetirementPenalty = 0;

    if (formData.retireTiming === "Normal") {
      calculatedRetirementAge = currentAge > 0 ? currentAge + yearsToEligible : 0;
      projectedYearsOfService = yearsEmployed > 0 ? yearsEmployed + yearsToEligible : 0;
    } else {
      calculatedRetirementAge = currentAge;
      projectedYearsOfService = yearsEmployed;
      if (yearsToEligible > 0) {
        earlyRetirementPenalty = Math.min(1, yearsToEligible * 0.05);
      }
    }

    const dropYears = dropMonths / 12;
    const actualExitAge = calculatedRetirementAge > 0 ? calculatedRetirementAge + dropYears : 0;
    const yearsInRetirement = actualExitAge > 0 ? Math.max(0, mortalityAge - actualExitAge) : 0;

    const monthlySalary = annualSalary / 12;
    const penaltyFactor = 1 - earlyRetirementPenalty;
    const baseMonthlyPension = monthlySalary * projectedYearsOfService * baseMultiplier * penaltyFactor;

    let optionMultiplier = 1;
    if (formData.selectedOption === 2) {
      optionMultiplier = 0.90;
    } else if (formData.selectedOption === 3) {
      optionMultiplier = Math.min(0.99, Math.max(0.70, 0.90 + spouseAgeDiff * 0.005));
    } else if (formData.selectedOption === 4) {
      optionMultiplier = Math.min(0.99, Math.max(0.75, 0.95 + spouseAgeDiff * 0.003));
    }

    const monthlyPensionTaxable = baseMonthlyPension * optionMultiplier;

    const monthlyRate = dropInterestRate / 100 / 12;
    let dropLumpSum = 0;
    let currentDeposit = monthlyPensionTaxable;
    for (let m = 1; m <= dropMonths; m++) {
      dropLumpSum *= 1 + monthlyRate;
      dropLumpSum += currentDeposit;
      if (m % 12 === 0 && isPre2011Plan) {
        currentDeposit *= 1.03;
      }
    }

    const monthlyShortfall = Math.max(0, monthlySalary - monthlyPensionTaxable);
    const annualShortfall = monthlyShortfall * 12;
    const totalShortfall = annualShortfall * yearsInRetirement;
    const buyoutAmount = monthlyPensionTaxable * 12 * 13.548;

    return {
      isPre2011Plan,
      isBoundaryYear,
      hasServiceData,
      monthlyPensionTaxable,
      dropLumpSum,
      monthlyShortfall,
      annualShortfall,
      totalShortfall,
      buyoutAmount,
      yearsToEligible,
      serviceRequirement,
      ageRequirement,
      yearsToAge,
      yearsToService,
      calculatedRetirementAge,
      actualExitAge,
      dropYears,
      projectedYearsOfService,
      yearsInRetirement,
      baseMultiplier,
      earlyRetirementPenalty,
      eligibilityReason,
      safeSalary: annualSalary,
    };
  }, [formData]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : type === "number"
          ? value === ""
            ? ""
            : parseFloat(value)
          : value,
    }));
  };

  const handleReset = () => {
    setFormData(INITIAL_FORM_STATE);
    setShowOptionModal(false);
    setShowIvrDetails(false);
    setShowResetModal(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-4 md:p-8 font-sans">
      {/* Clear Confirmation Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 space-y-6 animate-in fade-in zoom-in duration-200">
            <div className="text-center space-y-2">
              <div className="mx-auto bg-red-100 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                <RotateCcw className="text-red-600" size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Clear all data?</h3>
              <p className="text-sm text-slate-500">
                This will reset the calculator to its default blank state. This action cannot be undone.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowResetModal(false)}
                className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReset}
                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-sm rounded-xl transition-colors shadow-sm"
              >
                Clear Data
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto space-y-6">
        {/* App Header */}
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
                calculations.hasServiceData
                  ? "bg-white text-blue-900 shadow-sm"
                  : "bg-blue-800 text-blue-500"
              }`}
            >
              {calculations.hasServiceData
                ? calculations.isPre2011Plan
                  ? "Tier 1 (Pre-2011)"
                  : "Tier 2 (Post-2011)"
                : "---"}
            </span>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Employee Profile Section */}
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
                      onClick={() => setFormData((prev) => ({ ...prev, jobClass: "Regular" }))}
                      className={`flex-1 text-xs py-2 rounded-lg font-bold transition-all duration-200 ${
                        formData.jobClass === "Regular"
                          ? "bg-white text-blue-700 shadow-sm border border-slate-200/60"
                          : "text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      Regular Class
                    </button>
                    <button
                      onClick={() => setFormData((prev) => ({ ...prev, jobClass: "Special Risk" }))}
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
                    onChange={handleInputChange}
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
                      onChange={handleInputChange}
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
                    onChange={handleInputChange}
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
                          onClick={() => setFormData((prev) => ({ ...prev, hiredBeforeJuly2011: true }))}
                          className={`flex-1 text-xs py-1.5 rounded font-medium transition-colors ${
                            formData.hiredBeforeJuly2011
                              ? "bg-blue-600 text-white shadow-sm"
                              : "bg-white text-blue-600 border border-blue-200 hover:bg-blue-100"
                          }`}
                        >
                          Yes
                        </button>
                        <button
                          onClick={() => setFormData((prev) => ({ ...prev, hiredBeforeJuly2011: false }))}
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
                        onClick={() => setFormData((prev) => ({ ...prev, retireTiming: "Normal" }))}
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
                        onClick={() => setFormData((prev) => ({ ...prev, retireTiming: "Early" }))}
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

            {/* Pension Calculation Section */}
            <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <div className="flex items-center gap-2 mb-4 text-emerald-900 font-semibold border-b pb-2">
                <FileText size={20} />
                <h2>Pension Calculation</h2>
              </div>

              <div className="space-y-4">
                {/* 4 Option Buttons */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {Object.keys(PENSION_OPTIONS).map((key) => {
                    const opt = parseInt(key);
                    return (
                      <button
                        key={opt}
                        onClick={() => setFormData((prev) => ({ ...prev, selectedOption: opt }))}
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
                    onClick={() => setShowOptionModal(!showOptionModal)}
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
                          onChange={handleInputChange}
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

            {/* D.R.O.P. Compound Growth Section */}
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
                      onChange={handleInputChange}
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
                        onChange={handleInputChange}
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
          </div>

          {/* Right Column: Shortfall & Buyout */}
          <div className="space-y-6">
            {/* Shortfall Analysis Section */}
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
                    onChange={handleInputChange}
                    placeholder="e.g. 85"
                    className="w-full bg-white border border-amber-200 rounded px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-amber-400 placeholder:text-slate-300"
                  />
                </div>
              </div>
            </section>

            {/* Pension Account Buyout Section */}
            <section className="bg-slate-900 p-6 rounded-2xl text-white shadow-xl">
              <h3 className="text-slate-400 font-bold text-xs uppercase mb-4 tracking-widest">
                Pension Account Buyout
              </h3>
              <p className="text-3xl font-black mb-1">
                $
                {calculations.buyoutAmount.toLocaleString(undefined, {
                  maximumFractionDigits: 0,
                })}
              </p>
              <p className="text-xs text-slate-500 mb-6">
                Estimated Present Value based on 13.548x multiplier
              </p>

              <div className="p-4 bg-slate-800 rounded-xl border border-slate-700">
                <div className="mb-2">
                  <p className="text-[10px] text-slate-400 uppercase">Benefit Support</p>
                  <p className="text-sm font-medium">Division of Retirement</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <a
                      href="tel:8664469377,,3,,2"
                      className="text-sm text-blue-400 hover:text-blue-300 active:text-blue-200 underline underline-offset-2 decoration-blue-500/50 transition-colors cursor-pointer"
                    >
                      866-446-9377
                    </a>
                    <button
                      onClick={() => setShowIvrDetails(!showIvrDetails)}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors flex items-center gap-1 cursor-pointer select-none ${
                        showIvrDetails
                          ? "bg-blue-600 text-white"
                          : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                      }`}
                      title="View routing details"
                    >
                      Opt 3-2
                      {showIvrDetails ? <ChevronUp size={12} /> : <Info size={12} />}
                    </button>
                  </div>
                </div>

                {showIvrDetails && (
                  <div className="mt-3 mb-1 p-3 bg-slate-900/50 rounded-lg text-xs text-slate-300 space-y-2 border border-slate-700/50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <p className="leading-snug">
                      <strong className="text-white">IVR Bypass:</strong> System prompts for SSN,
                      then PIN. If PIN is unknown, press{" "}
                      <strong className="text-blue-400 font-mono bg-blue-900/30 px-1 rounded">
                        0
                      </strong>{" "}
                      or remain silent to force-route to a live agent.
                    </p>
                    <p className="text-[10px] text-slate-500 italic leading-tight border-t border-slate-700/50 pt-2 mt-2">
                      Note: The automated 3-2 routing assumes an active employee. Terminated/DROP
                      members will still reach an agent, but technically fall under a different IVR
                      node.
                    </p>
                  </div>
                )}

                <div className="mt-3 pt-3 border-t border-slate-700">
                  <p className="text-[10px] text-slate-400 uppercase mb-2 font-bold tracking-wider">
                    Required Verification Items:
                  </p>
                  <ul className="text-xs text-slate-300 space-y-1.5 list-disc pl-4 marker:text-slate-500">
                    <li>Pension vs. Investment Plan Status</li>
                    <li>Precise Years of Creditable Service</li>
                    <li>Last Known Salary on Record</li>
                  </ul>
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center pb-8 pt-6 space-y-6">
          <div className="flex justify-center">
            <button
              onClick={() => setShowResetModal(true)}
              className="flex items-center gap-2 px-6 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-sm uppercase tracking-wider rounded-xl transition-colors active:scale-95"
            >
              <RotateCcw size={18} />
              Reset Calculator
            </button>
          </div>
          <p className="text-xs text-slate-400 max-w-2xl mx-auto italic">
            This tool is for estimation purposes only. All calculations are approximations based on the
            provided worksheet formulas. Official benefits must be verified with the Florida
            Retirement System.
          </p>
        </footer>
      </div>
    </div>
  );
}
