import React, { useState, useRef, useEffect } from "react";
import { X, Download, Share2, Mail, Printer, UserCheck, ShieldCheck, Check, Loader2, BookmarkCheck } from "lucide-react";
import OnePageReport from "./OnePageReport.jsx";
import { generateReportPdfBlob, shareOrEmailReport, createMailtoUrl } from "../utils/pdfExport.js";
import { DEFAULT_ADVISOR_INFO } from "../constants/pension.js";
import { getAdvisorProfile, saveAdvisorProfile, saveConsultation } from "../db/index.js";

export default function ReportModal({
  isOpen,
  onClose,
  formData,
  calculations,
  onUpdateFormData,
}) {
  const reportRef = useRef(null);
  const [advisorInfo, setAdvisorInfo] = useState(DEFAULT_ADVISOR_INFO);
  const [showAdvisorEdit, setShowAdvisorEdit] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  // Load advisor profile from local DexieDB
  useEffect(() => {
    let mounted = true;
    getAdvisorProfile().then((profile) => {
      if (mounted && profile) {
        setAdvisorInfo(profile);
      }
    });
    return () => {
      mounted = false;
    };
  }, [isOpen]);

  // Save advisor info changes to local DexieDB
  const handleAdvisorChange = (e) => {
    const { name, value } = e.target;
    setAdvisorInfo((prev) => {
      const updated = { ...prev, [name]: value };
      saveAdvisorProfile(updated).catch((err) =>
        console.warn("Failed to save advisor profile:", err)
      );
      return updated;
    });
  };

  // Save consultation to local DexieDB
  const handleSaveConsultation = async () => {
    setIsSaving(true);
    try {
      await saveConsultation({
        clientName: formData.name,
        clientEmail: formData.email,
        agency: formData.agency,
        formData,
        calculations,
      });
      setStatusMessage("Estimate saved to device database!");
      setTimeout(() => setStatusMessage(""), 3000);
    } catch (err) {
      console.error("Failed to save consultation:", err);
      setStatusMessage("Error saving consultation");
      setTimeout(() => setStatusMessage(""), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const getCleanPdfName = () => {
    const nameSlug = (formData.name || "Client")
      .trim()
      .replace(/[^a-zA-Z0-9_-]/g, "_");
    return `FRS_Pension_Analysis_${nameSlug}.pdf`;
  };

  // 1. Share / Email via Mobile PWA Share Sheet (with PDF attached)
  const handleShareOrEmail = async () => {
    if (!reportRef.current) return;
    setIsGenerating(true);
    setStatusMessage("Generating 1-page PDF...");

    try {
      const { file } = await generateReportPdfBlob(reportRef.current, getCleanPdfName());
      setStatusMessage("Opening email / share sheet...");
      await shareOrEmailReport({
        pdfFile: file,
        employeeName: formData.name,
        employeeEmail: formData.email,
        advisorInfo,
        calculations,
        selectedOption: formData.selectedOption,
      });
      setStatusMessage("Done!");
      setTimeout(() => setStatusMessage(""), 2500);
    } catch (err) {
      console.error("Failed to share report:", err);
      setStatusMessage("Error generating report");
      setTimeout(() => setStatusMessage(""), 3000);
    } finally {
      setIsGenerating(false);
    }
  };

  // 2. Direct PDF Download
  const handleDownloadPdf = async () => {
    if (!reportRef.current) return;
    setIsGenerating(true);
    setStatusMessage("Generating high-resolution PDF...");

    try {
      const { file } = await generateReportPdfBlob(reportRef.current, getCleanPdfName());
      const url = URL.createObjectURL(file);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 3000);
      setStatusMessage("PDF downloaded!");
      setTimeout(() => setStatusMessage(""), 2500);
    } catch (err) {
      console.error("Failed to download PDF:", err);
      setStatusMessage("Error creating PDF");
      setTimeout(() => setStatusMessage(""), 3000);
    } finally {
      setIsGenerating(false);
    }
  };

  // 3. Open pre-filled mailto draft
  const handleOpenMailto = () => {
    const cleanName = formData.name?.trim() || "Valued Client";
    const subject = `Your FRS Pension & DROP Analysis - ${cleanName}`;
    const body = `Hi ${cleanName},

Thank you for taking the time to review your Florida Retirement System (FRS) benefits.

Attached is your personalized 1-page FRS Pension & DROP Benefit Analysis.
- Membership Plan: ${calculations.isPre2011Plan ? "Tier 1" : "Tier 2"}
- Normal Retirement: Age ${calculations.calculatedRetirementAge || "—"} (${calculations.projectedYearsOfService || "—"} yrs service)
- Estimated Pension (Option ${formData.selectedOption}): $${(calculations.monthlyPensionTaxable || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / mo
- Projected DROP: $${(calculations.dropLumpSum || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
- Buyout Value: $${(calculations.buyoutAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}

Please let me know if you have any questions.

Best regards,
${advisorInfo.name}
${advisorInfo.firm}
${advisorInfo.phone}`;

    const url = createMailtoUrl({
      to: formData.email,
      cc: advisorInfo.email,
      subject,
      body,
    });
    window.location.href = url;
  };

  // 4. Native Print Preview
  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 print:p-0 print:bg-white">
      <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] border border-slate-200 print:shadow-none print:border-none print:max-h-none print:w-full">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold">
              <Share2 size={18} />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">Export & Deliver 1-Page Proposal</h3>
              <p className="text-xs text-slate-400">
                Formatted strictly for 1 physical page • Optimized for Mobile Email & PWA Share
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Action Toolbar & Configuration Bar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 print:hidden text-xs">
          {/* Quick Client / Advisor Summary */}
          <div className="flex items-center gap-4 flex-wrap">
            <div>
              <span className="text-slate-400 font-bold uppercase text-[9px] block">Client</span>
              <span className="font-semibold text-slate-800">
                {formData.name || "Unnamed"} {formData.email ? `(${formData.email})` : ""}
              </span>
            </div>

            <div className="h-6 w-px bg-slate-200 hidden sm:block" />

            <div>
              <span className="text-slate-400 font-bold uppercase text-[9px] block">Advisor (You)</span>
              <button
                type="button"
                onClick={() => setShowAdvisorEdit(!showAdvisorEdit)}
                className="font-semibold text-emerald-700 hover:underline flex items-center gap-1"
              >
                {advisorInfo.name || "Configure Your Details"}
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {statusMessage && (
              <span className="text-emerald-700 font-semibold text-xs flex items-center gap-1 px-2 py-1 bg-emerald-50 rounded">
                <Check size={14} /> {statusMessage}
              </span>
            )}

            {/* Mobile PWA Primary Action */}
            <button
              type="button"
              disabled={isGenerating}
              onClick={handleShareOrEmail}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-all flex items-center gap-1.5 shadow-sm active:scale-95 disabled:opacity-50"
            >
              {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />}
              <span>Email Proposal</span>
            </button>

            {/* Save to Local DexieDB */}
            <button
              type="button"
              disabled={isSaving}
              onClick={handleSaveConsultation}
              className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-300 font-semibold rounded-lg transition-colors flex items-center gap-1.5 active:scale-95"
              title="Save client calculation to offline database"
            >
              <BookmarkCheck size={15} />
              <span className="hidden sm:inline">Save Record</span>
            </button>

            {/* Direct Download */}
            <button
              type="button"
              disabled={isGenerating}
              onClick={handleDownloadPdf}
              className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-semibold rounded-lg transition-colors flex items-center gap-1.5"
              title="Download 1-Page PDF directly"
            >
              <Download size={15} />
              <span className="hidden sm:inline">Download PDF</span>
            </button>

            {/* Print Preview */}
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-semibold rounded-lg transition-colors flex items-center gap-1.5"
              title="Open browser print dialog"
            >
              <Printer size={15} />
              <span className="hidden sm:inline">Print</span>
            </button>
          </div>
        </div>

        {/* Advisor Details Drawer (Expandable) */}
        {showAdvisorEdit && (
          <div className="p-4 bg-emerald-50/60 border-b border-emerald-200 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs print:hidden animate-in fade-in duration-200">
            <div>
              <label className="text-[10px] font-bold text-emerald-900 uppercase block mb-1">
                Your Full Name
              </label>
              <input
                type="text"
                name="name"
                value={advisorInfo.name}
                onChange={handleAdvisorChange}
                placeholder="e.g. John Doe, CFP"
                className="w-full px-2.5 py-1.5 bg-white border border-emerald-300 rounded focus:ring-1 focus:ring-emerald-500 outline-none text-xs"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-emerald-900 uppercase block mb-1">
                Your Email (for CC)
              </label>
              <input
                type="email"
                name="email"
                value={advisorInfo.email}
                onChange={handleAdvisorChange}
                placeholder="e.g. john@fladvisory.com"
                className="w-full px-2.5 py-1.5 bg-white border border-emerald-300 rounded focus:ring-1 focus:ring-emerald-500 outline-none text-xs"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-emerald-900 uppercase block mb-1">
                Your Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                value={advisorInfo.phone}
                onChange={handleAdvisorChange}
                placeholder="e.g. (305) 555-0192"
                className="w-full px-2.5 py-1.5 bg-white border border-emerald-300 rounded focus:ring-1 focus:ring-emerald-500 outline-none text-xs"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-emerald-900 uppercase block mb-1">
                Firm / Agency Name
              </label>
              <input
                type="text"
                name="firm"
                value={advisorInfo.firm}
                onChange={handleAdvisorChange}
                placeholder="e.g. Florida Retirement Advisory"
                className="w-full px-2.5 py-1.5 bg-white border border-emerald-300 rounded focus:ring-1 focus:ring-emerald-500 outline-none text-xs"
              />
            </div>
          </div>
        )}

        {/* Live 1-Page Report Preview Canvas */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-200/60 flex justify-center print:p-0 print:bg-white print:overflow-visible">
          <div className="shadow-lg border border-slate-300 rounded-sm bg-white print:shadow-none print:border-none">
            <OnePageReport
              reportRef={reportRef}
              formData={formData}
              calculations={calculations}
              advisorInfo={advisorInfo}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
