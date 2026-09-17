import { describe, it, expect } from "vitest";
import {
  determinePlanTier,
  calculateEligibility,
  calculateAccrualMultiplier,
  calculateOptionMultiplier,
  calculateDropLumpSum,
  calculateFRSBenefits,
} from "../calculations.js";
import { INITIAL_FORM_STATE, FRS_THRESHOLDS } from "../../constants/pension.js";

describe("FRS Actuarial Calculations Engine", () => {
  describe("determinePlanTier (Florida Statutes Chapter 121)", () => {
    const FIXED_YEAR = 2026;

    it("defaults to Tier 1 when 0 service years are entered", () => {
      const res = determinePlanTier(0, true, FIXED_YEAR);
      expect(res.isPre2011Plan).toBe(true);
      expect(res.hasServiceData).toBe(false);
      expect(res.isBoundaryYear).toBe(false);
    });

    it("identifies Tier 1 (Pre-2011) when hire year is before 2011", () => {
      // 2026 - 20 = 2006 (Pre-2011)
      const res = determinePlanTier(20, false, FIXED_YEAR);
      expect(res.isPre2011Plan).toBe(true);
      expect(res.hasServiceData).toBe(true);
      expect(res.isBoundaryYear).toBe(false);
    });

    it("identifies Tier 2 (Post-2011) when hire year is after 2011", () => {
      // 2026 - 10 = 2016 (Post-2011)
      const res = determinePlanTier(10, true, FIXED_YEAR);
      expect(res.isPre2011Plan).toBe(false);
      expect(res.hasServiceData).toBe(true);
      expect(res.isBoundaryYear).toBe(false);
    });

    it("flags boundary year 2011 and honors hiredBeforeJuly2011 = true", () => {
      // 2026 - 15 = 2011 (Boundary)
      const res = determinePlanTier(15, true, FIXED_YEAR);
      expect(res.isBoundaryYear).toBe(true);
      expect(res.isPre2011Plan).toBe(true);
    });

    it("flags boundary year 2011 and honors hiredBeforeJuly2011 = false", () => {
      // 2026 - 15 = 2011 (Boundary)
      const res = determinePlanTier(15, false, FIXED_YEAR);
      expect(res.isBoundaryYear).toBe(true);
      expect(res.isPre2011Plan).toBe(false);
    });
  });

  describe("calculateEligibility (Normal Retirement Age & Service)", () => {
    it("applies Regular Class Tier 1 requirements: Age 62 or 30 Service Years", () => {
      const res = calculateEligibility(50, 20, "Regular", true);
      expect(res.ageRequirement).toBe(62);
      expect(res.serviceRequirement).toBe(30);
      expect(res.yearsToAge).toBe(12);
      expect(res.yearsToService).toBe(10);
      expect(res.yearsToEligible).toBe(10);
      expect(res.eligibilityReason).toBe("Driven by Service");
    });

    it("applies Regular Class Tier 2 requirements: Age 65 or 33 Service Years", () => {
      const res = calculateEligibility(60, 10, "Regular", false);
      expect(res.ageRequirement).toBe(65);
      expect(res.serviceRequirement).toBe(33);
      expect(res.yearsToAge).toBe(5);
      expect(res.yearsToService).toBe(23);
      expect(res.yearsToEligible).toBe(5);
      expect(res.eligibilityReason).toBe("Driven by Age");
    });

    it("applies Special Risk Tier 1 requirements: Age 55 or 25 Service Years", () => {
      const res = calculateEligibility(40, 10, "Special Risk", true);
      expect(res.ageRequirement).toBe(55);
      expect(res.serviceRequirement).toBe(25);
      expect(res.yearsToAge).toBe(15);
      expect(res.yearsToService).toBe(15);
      expect(res.yearsToEligible).toBe(15);
      expect(res.eligibilityReason).toBe("Age & Service Align");
    });

    it("applies Special Risk Tier 2 requirements: Age 60 or 30 Service Years", () => {
      const res = calculateEligibility(60, 10, "Special Risk", false);
      expect(res.ageRequirement).toBe(60);
      expect(res.serviceRequirement).toBe(30);
      expect(res.yearsToAge).toBe(0);
      expect(res.yearsToEligible).toBe(0);
      expect(res.eligibilityReason).toBe("Eligible Now");
    });
  });

  describe("calculateAccrualMultiplier (Benefit Multiplier Escalation)", () => {
    it("returns 3.0% flat for Special Risk regardless of extra service", () => {
      const mult = calculateAccrualMultiplier("Special Risk", 0, 60, 55, 30, 25);
      expect(mult).toBe(0.03);
    });

    it("returns base 1.60% for Regular Class when not yet eligible", () => {
      const mult = calculateAccrualMultiplier("Regular", 2, 60, 62, 28, 30);
      expect(mult).toBe(0.016);
    });

    it("returns base 1.60% for Regular Class exactly at eligibility milestone", () => {
      const mult = calculateAccrualMultiplier("Regular", 0, 62, 62, 20, 30);
      expect(mult).toBe(0.016);
    });

    it("escalates to 1.63% with +1 year past eligibility (Age 63 or 31 yrs for Tier 1)", () => {
      const mult = calculateAccrualMultiplier("Regular", 0, 63, 62, 20, 30);
      expect(mult).toBe(0.0163);
    });

    it("escalates to 1.65% with +2 years past eligibility (Age 64 or 32 yrs for Tier 1)", () => {
      const mult = calculateAccrualMultiplier("Regular", 0, 64, 62, 20, 30);
      expect(mult).toBe(0.0165);
    });

    it("escalates to 1.68% with +3 or more years past eligibility (Age 65+ or 33+ yrs)", () => {
      const mult = calculateAccrualMultiplier("Regular", 0, 66, 62, 20, 30);
      expect(mult).toBe(0.0168);
    });
  });

  describe("calculateOptionMultiplier (Options 1 - 4)", () => {
    it("returns 1.0 for Option 1 (Maximum Single Life)", () => {
      expect(calculateOptionMultiplier(1)).toBe(1.0);
    });

    it("returns 0.90 for Option 2 (10-Year Guarantee)", () => {
      expect(calculateOptionMultiplier(2)).toBe(0.90);
    });

    it("calculates Option 3 (100% Joint & Survivor) with spouse age differences", () => {
      // Same age
      expect(calculateOptionMultiplier(3, 0)).toBeCloseTo(0.90, 4);
      // Older spouse (+10 years) -> 0.90 + 10 * 0.005 = 0.95
      expect(calculateOptionMultiplier(3, 10)).toBeCloseTo(0.95, 4);
      // Younger spouse (-10 years) -> 0.90 - 10 * 0.005 = 0.85
      expect(calculateOptionMultiplier(3, -10)).toBeCloseTo(0.85, 4);
      // Caps at 0.99
      expect(calculateOptionMultiplier(3, 30)).toBeCloseTo(0.99, 4);
      // Floors at 0.70
      expect(calculateOptionMultiplier(3, -50)).toBeCloseTo(0.70, 4);
    });

    it("calculates Option 4 (66 2/3% Joint & Survivor) with spouse age differences", () => {
      // Same age
      expect(calculateOptionMultiplier(4, 0)).toBeCloseTo(0.95, 4);
      // Older spouse (+10 years) -> 0.95 + 10 * 0.003 = 0.98
      expect(calculateOptionMultiplier(4, 10)).toBeCloseTo(0.98, 4);
      // Younger spouse (-10 years) -> 0.95 - 10 * 0.003 = 0.92
      expect(calculateOptionMultiplier(4, -10)).toBeCloseTo(0.92, 4);
      // Caps at 0.99
      expect(calculateOptionMultiplier(4, 20)).toBeCloseTo(0.99, 4);
      // Floors at 0.75
      expect(calculateOptionMultiplier(4, -80)).toBeCloseTo(0.75, 4);
    });
  });

  describe("calculateDropLumpSum (Compounding & Tier 1 COLA)", () => {
    it("returns 0 when DROP months is 0", () => {
      expect(calculateDropLumpSum(3000, 0, 4, true)).toBe(0);
    });

    it("compounds monthly at 4% annual interest", () => {
      const pension = 2000;
      const rate = 4;
      const sum = calculateDropLumpSum(pension, 12, rate, false); // Tier 2 (no COLA)
      // Deposit at month 1 compounds 11 times, etc.
      expect(sum).toBeGreaterThan(pension * 12);
      expect(sum).toBeCloseTo(24444.93, 1);
    });

    it("applies 3% annual COLA every 12 months for Tier 1", () => {
      const pension = 2000;
      const rate = 4;
      const tier1Sum = calculateDropLumpSum(pension, 24, rate, true);
      const tier2Sum = calculateDropLumpSum(pension, 24, rate, false);
      expect(tier1Sum).toBeGreaterThan(tier2Sum);
    });
  });

  describe("calculateFRSBenefits (End-to-End Comprehensive Orchestrator)", () => {
    it("handles default initial blank state without errors", () => {
      const res = calculateFRSBenefits(INITIAL_FORM_STATE, 2026);
      expect(res.monthlyPensionTaxable).toBe(0);
      expect(res.dropLumpSum).toBe(0);
      expect(res.monthlyShortfall).toBe(0);
      expect(res.totalShortfall).toBe(0);
      expect(res.buyoutAmount).toBe(0);
      expect(res.hasServiceData).toBe(false);
    });

    it("computes standard Tier 1 Regular Class retirement accurately", () => {
      const formData = {
        name: "John Doe",
        hiredBeforeJuly2011: true,
        jobClass: "Regular",
        retireTiming: "Normal",
        currentAge: 52,
        yearsEmployed: 20,
        annualSalary: 60000, // $5,000 / month
        dropMonths: 60, // 5 years DROP
        dropInterestRate: 4,
        mortalityAge: 85,
        selectedOption: 1,
        spouseAgeDiff: 0,
      };

      const res = calculateFRSBenefits(formData, 2026);

      // Hire year: 2026 - 20 = 2006 -> Tier 1
      expect(res.isPre2011Plan).toBe(true);
      expect(res.serviceRequirement).toBe(30);
      expect(res.ageRequirement).toBe(62);
      // Years to age 62: 10 yrs. Years to 30 service: 10 yrs.
      expect(res.yearsToEligible).toBe(10);
      expect(res.calculatedRetirementAge).toBe(62);
      expect(res.projectedYearsOfService).toBe(30);
      expect(res.baseMultiplier).toBe(0.016);
      // Monthly pension = (60000 / 12) * 30 * 0.016 * 1.0 = 5000 * 0.48 = 2400
      expect(res.monthlyPensionTaxable).toBeCloseTo(2400, 2);

      // DROP years: 60 / 12 = 5
      expect(res.dropYears).toBe(5);
      expect(res.actualExitAge).toBe(67);
      expect(res.yearsInRetirement).toBe(18); // 85 - 67

      // Shortfall: 5000 - 2400 = 2600 / mo
      expect(res.monthlyShortfall).toBeCloseTo(2600, 2);
      expect(res.annualShortfall).toBeCloseTo(31200, 2);
      expect(res.totalShortfall).toBeCloseTo(31200 * 18, 2);

      // Buyout: 2400 * 12 * 13.548
      expect(res.buyoutAmount).toBeCloseTo(2400 * 12 * 13.548, 2);
    });

    it("applies 5% per year early retirement penalty correctly", () => {
      const formData = {
        name: "Jane Smith",
        hiredBeforeJuly2011: true,
        jobClass: "Regular",
        retireTiming: "Early",
        currentAge: 58,
        yearsEmployed: 26,
        annualSalary: 60000,
        dropMonths: 0,
        dropInterestRate: 4,
        mortalityAge: 85,
        selectedOption: 1,
        spouseAgeDiff: 0,
      };

      const res = calculateFRSBenefits(formData, 2026);

      // Normal retirement would be age 62 (4 yrs away) or 30 yrs service (4 yrs away).
      // Early penalty: 4 yrs * 5% = 20% penalty.
      expect(res.earlyRetirementPenalty).toBeCloseTo(0.20, 4);
      // Projected service = 26 yrs (no future accrual because retiring early)
      expect(res.projectedYearsOfService).toBe(26);
      // Base monthly: 5000 * 26 * 0.016 * (1 - 0.20) = 5000 * 26 * 0.016 * 0.8 = 1664
      expect(res.monthlyPensionTaxable).toBeCloseTo(1664, 2);
    });
  });
});
