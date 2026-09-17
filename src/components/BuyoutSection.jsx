import React from "react";
import { ChevronUp, Info } from "lucide-react";

export default function BuyoutSection({ calculations, showIvrDetails, onToggleIvrDetails }) {
  return (
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
              type="button"
              onClick={onToggleIvrDetails}
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
  );
}
