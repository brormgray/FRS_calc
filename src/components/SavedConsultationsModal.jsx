import React, { useState, useEffect, useRef } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import {
  X,
  Users,
  Calendar,
  DollarSign,
  ArrowRightCircle,
  Trash2,
  Download,
  Upload,
  ShieldCheck,
  HardDrive,
  Check,
  AlertCircle,
  Search,
} from "lucide-react";
import {
  db,
  getAllConsultations,
  deleteConsultation,
  exportDatabaseBackup,
  importDatabaseBackup,
  isStoragePersisted,
  requestPersistentStorage,
  getStorageQuota,
} from "../db/index.js";
import { formatCurrency } from "../utils/calculations.js";

export default function SavedConsultationsModal({
  isOpen,
  onClose,
  onLoadConsultation,
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [persisted, setPersisted] = useState(false);
  const [quotaInfo, setQuotaInfo] = useState(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const fileInputRef = useRef(null);

  // Reactive live query to DexieDB
  const consultations = useLiveQuery(
    () => db.consultations.orderBy("createdAt").reverse().toArray(),
    []
  );

  useEffect(() => {
    if (isOpen) {
      checkStorage();
    }
  }, [isOpen]);

  const checkStorage = async () => {
    const isP = await isStoragePersisted();
    setPersisted(isP);
    const q = await getStorageQuota();
    setQuotaInfo(q);
  };

  const handleRequestPersistence = async () => {
    const granted = await requestPersistentStorage();
    setPersisted(granted);
    if (granted) {
      setStatusMessage("High-persistence durable storage activated!");
      setTimeout(() => setStatusMessage(""), 3000);
    } else {
      setErrorMessage("Browser declined or storage already durable.");
      setTimeout(() => setErrorMessage(""), 3000);
    }
  };

  const handleDelete = async (id, name, e) => {
    e.stopPropagation();
    if (window.confirm(`Delete saved consultation for "${name}"?`)) {
      try {
        await deleteConsultation(id);
        setStatusMessage(`Deleted "${name}"`);
        setTimeout(() => setStatusMessage(""), 2500);
      } catch (err) {
        setErrorMessage("Failed to delete record: " + err.message);
        setTimeout(() => setErrorMessage(""), 3000);
      }
    }
  };

  const handleExportBackup = async () => {
    try {
      const json = await exportDatabaseBackup();
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `FRS_Local_Database_Backup_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setStatusMessage("Local database backup exported successfully!");
      setTimeout(() => setStatusMessage(""), 3000);
    } catch (err) {
      setErrorMessage("Backup export error: " + err.message);
      setTimeout(() => setErrorMessage(""), 3000);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const result = await importDatabaseBackup(text);
      setStatusMessage(
        `Restored ${result.restoredConsultations} client estimates! ${
          result.advisorUpdated ? "Advisor profile updated." : ""
        }`
      );
      setTimeout(() => setStatusMessage(""), 3500);
    } catch (err) {
      setErrorMessage("Import failed: " + err.message);
      setTimeout(() => setErrorMessage(""), 4000);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  if (!isOpen) return null;

  const filteredConsultations = (consultations || []).filter((c) => {
    const term = searchTerm.toLowerCase();
    return (
      (c.clientName && c.clientName.toLowerCase().includes(term)) ||
      (c.agency && c.agency.toLowerCase().includes(term)) ||
      (c.clientEmail && c.clientEmail.toLowerCase().includes(term))
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-blue-900 to-indigo-950 text-white flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-800/80 rounded-xl">
              <Users size={22} className="text-blue-300" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight">Saved Client Consultations</h2>
              <p className="text-xs text-blue-200">
                Local-first IndexedDB storage &bull; 100% offline &bull; No remote server
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-blue-200 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Status / Alert Bar */}
        {(statusMessage || errorMessage) && (
          <div
            className={`px-4 py-2 text-xs font-semibold flex items-center gap-2 ${
              errorMessage ? "bg-rose-100 text-rose-800" : "bg-emerald-100 text-emerald-800"
            }`}
          >
            {errorMessage ? <AlertCircle size={15} /> : <Check size={15} />}
            <span>{errorMessage || statusMessage}</span>
          </div>
        )}

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Top Bar: Search & Persistence status */}
          <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
            {/* Search */}
            <div className="relative w-full sm:w-72">
              <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search saved clients..."
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            {/* Storage Health Pill */}
            <div className="flex items-center gap-2 text-xs flex-wrap">
              <div
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full font-medium ${
                  persisted
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-300"
                    : "bg-amber-50 text-amber-800 border border-amber-300"
                }`}
              >
                <ShieldCheck size={14} className={persisted ? "text-emerald-600" : "text-amber-600"} />
                <span>{persisted ? "Storage: High Persistence (Durable)" : "Storage: Standard"}</span>
              </div>
              {!persisted && (
                <button
                  type="button"
                  onClick={handleRequestPersistence}
                  className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-md font-bold text-[11px] transition-colors"
                >
                  Enable Durable Mode
                </button>
              )}
            </div>
          </div>

          {/* List of Consultations */}
          {filteredConsultations.length === 0 ? (
            <div className="text-center py-12 px-4 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
              <Users size={38} className="mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-semibold text-slate-700">No saved consultations found</p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                When working with clients, click <strong>"Save Consultation"</strong> in the top header or
                in the 1-Page Report modal to store records locally on your device.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredConsultations.map((item) => (
                <div
                  key={item.id}
                  className="border border-slate-200 rounded-xl p-4 hover:border-blue-400 hover:shadow-md transition-all bg-white flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex justify-between items-start gap-2 mb-1.5">
                      <h3 className="font-bold text-slate-900 text-sm sm:text-base group-hover:text-blue-700 transition-colors">
                        {item.clientName}
                      </h3>
                      <button
                        type="button"
                        onClick={(e) => handleDelete(item.id, item.clientName, e)}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded transition-colors"
                        title="Delete estimate"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>

                    <div className="text-xs text-slate-500 space-y-0.5 mb-3">
                      {item.agency && <p className="font-medium text-slate-600">{item.agency}</p>}
                      {item.clientEmail && <p>{item.clientEmail}</p>}
                      <p className="flex items-center gap-1 text-slate-400 text-[11px]">
                        <Calendar size={12} />
                        {new Date(item.createdAt || item.updatedAt).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>

                    {/* Benefit summary chip */}
                    <div className="grid grid-cols-2 gap-2 p-2 bg-slate-50 rounded-lg text-xs border border-slate-100 mb-3">
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase font-bold block">
                          Opt {item.selectedOption} Monthly
                        </span>
                        <span className="font-extrabold text-blue-900">
                          {formatCurrency(item.grossMonthlyBenefit || 0)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase font-bold block">
                          DROP Total
                        </span>
                        <span className="font-extrabold text-emerald-700">
                          {formatCurrency(item.dropTotalAccumulation || 0)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      onLoadConsultation(item);
                      onClose();
                    }}
                    className="w-full py-2 bg-blue-50 hover:bg-blue-600 text-blue-800 hover:text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5"
                  >
                    <ArrowRightCircle size={15} />
                    <span>Load Into Calculator</span>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Local Data Integrity & Backup / Restore Section */}
          <div className="border-t border-slate-200 pt-5 mt-6">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <HardDrive size={15} className="text-slate-500" />
              <span>Data Protection &amp; Backup (Zero Remote Server)</span>
            </h4>
            <p className="text-xs text-slate-500 mb-3">
              Because your data is stored 100% locally on this device, you can export a complete JSON
              backup to archive on your computer or import onto another mobile device.
            </p>

            <div className="flex flex-wrap gap-2.5 items-center">
              <button
                type="button"
                onClick={handleExportBackup}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs rounded-lg border border-slate-300 transition-colors flex items-center gap-1.5"
              >
                <Download size={14} />
                <span>Export Local Backup (.json)</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs rounded-lg border border-slate-300 transition-colors flex items-center gap-1.5"
              >
                <Upload size={14} />
                <span>Restore Backup</span>
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 sm:p-4 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs sm:text-sm rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
