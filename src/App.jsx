import React, { useState, useMemo, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { INITIAL_FORM_STATE, PENSION_OPTIONS } from './constants/pension.js';
import { calculateFRSBenefits } from './utils/calculations.js';
import { db, migrateFromLocalStorage, requestPersistentStorage } from './db/index.js';

import Header from './components/Header.jsx';
import EmployeeProfile from './components/EmployeeProfile.jsx';
import PensionCalculation from './components/PensionCalculation.jsx';
import DropSection from './components/DropSection.jsx';
import ShortfallSection from './components/ShortfallSection.jsx';
import BuyoutSection from './components/BuyoutSection.jsx';
import ResetModal from './components/ResetModal.jsx';
import ReportModal from './components/ReportModal.jsx';
import SavedConsultationsModal from './components/SavedConsultationsModal.jsx';
import Footer from './components/Footer.jsx';

export { PENSION_OPTIONS };

export default function App() {
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [showOptionModal, setShowOptionModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showSavedModal, setShowSavedModal] = useState(false);
  const [showIvrDetails, setShowIvrDetails] = useState(false);

  // Live count of saved consultations from DexieDB
  const savedCount = useLiveQuery(() => db.consultations.count(), []) || 0;

  // Initialize persistence and migrate legacy data on mount
  useEffect(() => {
    migrateFromLocalStorage();
    requestPersistentStorage();
  }, []);

  // Actuarial calculation engine
  const calculations = useMemo(() => {
    return calculateFRSBenefits(formData);
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

  const handleClassChange = (jobClass) => {
    setFormData((prev) => ({ ...prev, jobClass }));
  };

  const handleTimingChange = (retireTiming) => {
    setFormData((prev) => ({ ...prev, retireTiming }));
  };

  const handleBoundaryChange = (hiredBeforeJuly2011) => {
    setFormData((prev) => ({ ...prev, hiredBeforeJuly2011 }));
  };

  const handleSelectOption = (selectedOption) => {
    setFormData((prev) => ({ ...prev, selectedOption }));
  };

  const handleReset = () => {
    setFormData(INITIAL_FORM_STATE);
    setShowOptionModal(false);
    setShowIvrDetails(false);
    setShowResetModal(false);
  };

  const handleLoadConsultation = (savedRecord) => {
    if (savedRecord && savedRecord.formData) {
      setFormData(savedRecord.formData);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-4 md:p-8 font-sans">
      {/* Reset Confirmation Modal */}
      <ResetModal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        onConfirm={handleReset}
      />

      {/* 1-Page Executive Report & Delivery Modal */}
      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        formData={formData}
        calculations={calculations}
        onUpdateFormData={setFormData}
      />

      {/* Saved Consultations & Local Database Modal */}
      <SavedConsultationsModal
        isOpen={showSavedModal}
        onClose={() => setShowSavedModal(false)}
        onLoadConsultation={handleLoadConsultation}
      />

      <div className="max-w-5xl mx-auto space-y-6">
        {/* App Header */}
        <Header
          hasServiceData={calculations.hasServiceData}
          isPre2011Plan={calculations.isPre2011Plan}
          onOpenReport={() => setShowReportModal(true)}
          onOpenSaved={() => setShowSavedModal(true)}
          savedCount={savedCount}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Employee Profile Section */}
            <EmployeeProfile
              formData={formData}
              calculations={calculations}
              onInputChange={handleInputChange}
              onClassChange={handleClassChange}
              onTimingChange={handleTimingChange}
              onBoundaryChange={handleBoundaryChange}
            />

            {/* Pension Calculation Section */}
            <PensionCalculation
              formData={formData}
              calculations={calculations}
              showOptionModal={showOptionModal}
              onToggleOptionModal={() => setShowOptionModal((prev) => !prev)}
              onSelectOption={handleSelectOption}
              onInputChange={handleInputChange}
            />

            {/* D.R.O.P. Compound Growth Section */}
            <DropSection
              formData={formData}
              calculations={calculations}
              onInputChange={handleInputChange}
            />
          </div>

          {/* Right Column: Shortfall & Buyout */}
          <div className="space-y-6">
            {/* Shortfall Analysis Section */}
            <ShortfallSection
              formData={formData}
              calculations={calculations}
              onInputChange={handleInputChange}
            />

            {/* Pension Account Buyout Section */}
            <BuyoutSection
              calculations={calculations}
              showIvrDetails={showIvrDetails}
              onToggleIvrDetails={() => setShowIvrDetails((prev) => !prev)}
            />
          </div>
        </div>

        {/* Footer */}
        <Footer onOpenResetModal={() => setShowResetModal(true)} />
      </div>
    </div>
  );
}
