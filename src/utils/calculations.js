import { FRS_THRESHOLDS } from "../constants/pension.js";

/**
 * Determine FRS Plan Tier (Tier 1 Pre-2011 vs Tier 2 Post-2011)
 *
 * Cutoff: July 1, 2011.
 * - If yearsEmployed === 0 or estimated hire year < 2011 -> Tier 1
 * - If estimated hire year > 2011 -> Tier 2
 * - If estimated hire year === 2011 -> Boundary year, defer to explicit hiredBeforeJuly2011 checkbox
 *
 * @param {number} yearsEmployed
 * @param {boolean} hiredBeforeJuly2011
 * @param {number} [currentYear=new Date().getFullYear()]
 * @returns {{ isPre2011Plan: boolean, isBoundaryYear: boolean, hasServiceData: boolean }}
 */
export function determinePlanTier(yearsEmployed, hiredBeforeJuly2011, currentYear = new Date().getFullYear()) {
  const years = Math.max(0, parseFloat(yearsEmployed) || 0);
  const estimatedHireYear = currentYear - Math.floor(years);
  const hasServiceData = years > 0;
  const isBoundaryYear = hasServiceData && estimatedHireYear === FRS_THRESHOLDS.CUTOFF_YEAR;

  let isPre2011Plan = true;
  if (years === 0 || estimatedHireYear < FRS_THRESHOLDS.CUTOFF_YEAR) {
    isPre2011Plan = true;
  } else if (estimatedHireYear > FRS_THRESHOLDS.CUTOFF_YEAR) {
    isPre2011Plan = false;
  } else {
    isPre2011Plan = Boolean(hiredBeforeJuly2011);
  }

  return { isPre2011Plan, isBoundaryYear, hasServiceData };
}

/**
 * Calculate age & service requirements and dual-path eligibility
 *
 * Regular Class:
 *  - Tier 1: Age 62 OR 30 Years of Service
 *  - Tier 2: Age 65 OR 33 Years of Service
 * Special Risk:
 *  - Tier 1: Age 55 OR 25 Years of Service
 *  - Tier 2: Age 60 OR 30 Years of Service
 *
 * @param {number} currentAge
 * @param {number} yearsEmployed
 * @param {string} jobClass - "Regular" | "Special Risk"
 * @param {boolean} isPre2011Plan
 */
export function calculateEligibility(currentAge, yearsEmployed, jobClass, isPre2011Plan) {
  const age = Math.max(0, parseFloat(currentAge) || 0);
  const service = Math.max(0, parseFloat(yearsEmployed) || 0);
  const isSpecialRisk = jobClass === "Special Risk";

  const config = isSpecialRisk
    ? (isPre2011Plan ? FRS_THRESHOLDS.SPECIAL_RISK.TIER_1 : FRS_THRESHOLDS.SPECIAL_RISK.TIER_2)
    : (isPre2011Plan ? FRS_THRESHOLDS.REGULAR.TIER_1 : FRS_THRESHOLDS.REGULAR.TIER_2);

  const serviceRequirement = config.SERVICE_REQ;
  const ageRequirement = config.AGE_REQ;

  const yearsToAge = Math.max(0, ageRequirement - age);
  const yearsToService = Math.max(0, serviceRequirement - service);
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

  return {
    serviceRequirement,
    ageRequirement,
    yearsToAge,
    yearsToService,
    yearsToEligible,
    eligibilityReason,
    baseRate: config.BASE_MULTIPLIER,
  };
}

/**
 * Calculate base accrual multiplier percentage per year of service
 * Florida Statutes § 121.091(1):
 * - Regular class base is 1.60%.
 * - If eligible, delayed retirement earns:
 *   - Normal + 1 year: 1.63%
 *   - Normal + 2 years: 1.65%
 *   - Normal + 3+ years: 1.68%
 * - Special risk class is flat 3.00%.
 */
export function calculateAccrualMultiplier(jobClass, yearsToEligible, currentAge, ageRequirement, yearsEmployed, serviceRequirement) {
  if (jobClass === "Special Risk") {
    return 0.03;
  }

  let baseMultiplier = 0.016;

  if (yearsToEligible === 0) {
    const age = Math.max(0, parseFloat(currentAge) || 0);
    const service = Math.max(0, parseFloat(yearsEmployed) || 0);
    const extraAge = Math.max(0, Math.floor(age - ageRequirement));
    const extraService = Math.max(0, Math.floor(service - serviceRequirement));
    const maxExtra = Math.max(extraAge, extraService);

    if (maxExtra === 1) baseMultiplier = 0.0163;
    else if (maxExtra === 2) baseMultiplier = 0.0165;
    else if (maxExtra >= 3) baseMultiplier = 0.0168;
  }

  return baseMultiplier;
}

/**
 * Calculate option reduction multiplier
 * Option 1: 100% (Single Life Maximum)
 * Option 2: 90% (10-Year Guarantee)
 * Option 3: 70% to 99% depending on spouse age difference (100% Joint & Survivor)
 * Option 4: 75% to 99% depending on spouse age difference (66 2/3% Joint & Survivor)
 */
export function calculateOptionMultiplier(selectedOption, spouseAgeDiff = 0) {
  const option = parseInt(selectedOption, 10) || 1;
  const ageDiff = parseFloat(spouseAgeDiff) || 0;

  switch (option) {
    case 1:
      return 1.0;
    case 2:
      return 0.90;
    case 3:
      return Math.min(0.99, Math.max(0.70, 0.90 + ageDiff * 0.005));
    case 4:
      return Math.min(0.99, Math.max(0.75, 0.95 + ageDiff * 0.003));
    default:
      return 1.0;
  }
}

/**
 * Calculate D.R.O.P. lump sum with monthly compounding interest and Tier 1 COLA
 *
 * FV = Sum of monthly deposits compounded monthly.
 * Tier 1 members receive 3% annual COLA escalation every 12 months in DROP.
 *
 * @param {number} monthlyPensionTaxable
 * @param {number} dropMonths
 * @param {number} dropInterestRate - Annual percentage (e.g. 4 for 4%)
 * @param {boolean} isPre2011Plan
 * @returns {number} Projected lump sum
 */
export function calculateDropLumpSum(monthlyPensionTaxable, dropMonths, dropInterestRate, isPre2011Plan) {
  const months = Math.max(0, parseInt(dropMonths, 10) || 0);
  const rate = Math.max(0, parseFloat(dropInterestRate) || 0);
  const initialPension = Math.max(0, parseFloat(monthlyPensionTaxable) || 0);

  if (months === 0 || initialPension === 0) {
    return 0;
  }

  const monthlyRate = rate / 100 / 12;
  let dropLumpSum = 0;
  let currentDeposit = initialPension;

  for (let m = 1; m <= months; m++) {
    dropLumpSum *= 1 + monthlyRate;
    dropLumpSum += currentDeposit;
    if (m % 12 === 0 && isPre2011Plan) {
      currentDeposit *= 1 + FRS_THRESHOLDS.TIER_1_COLA;
    }
  }

  return dropLumpSum;
}

/**
 * Complete FRS benefit calculation engine
 * Processes form state into comprehensive actuarial projections
 *
 * @param {object} formData
 * @param {number} [currentYear]
 * @returns {object} Full calculation results
 */
export function calculateFRSBenefits(formData, currentYear = new Date().getFullYear()) {
  const currentAge = parseFloat(formData.currentAge) || 0;
  const yearsEmployed = parseFloat(formData.yearsEmployed) || 0;
  const annualSalary = parseFloat(formData.annualSalary) || 0;
  const dropMonths = parseFloat(formData.dropMonths) || 0;
  const dropInterestRate = parseFloat(formData.dropInterestRate) || 0;
  const mortalityAge = parseFloat(formData.mortalityAge) || 0;
  
  // Calculate spouse age difference dynamically from spouseAge if provided, otherwise fallback to spouseAgeDiff
  let spouseAgeDiff = 0;
  if (formData.spouseAge !== undefined && formData.spouseAge !== "" && currentAge > 0) {
    spouseAgeDiff = (parseFloat(formData.spouseAge) || 0) - currentAge;
  } else if (formData.spouseAgeDiff !== undefined && formData.spouseAgeDiff !== "") {
    spouseAgeDiff = parseFloat(formData.spouseAgeDiff) || 0;
  }

  // 1. Plan tier & boundary resolution
  const { isPre2011Plan, isBoundaryYear, hasServiceData } = determinePlanTier(
    yearsEmployed,
    formData.hiredBeforeJuly2011,
    currentYear
  );

  // 2. Normal eligibility calculation
  const {
    serviceRequirement,
    ageRequirement,
    yearsToAge,
    yearsToService,
    yearsToEligible,
    eligibilityReason,
  } = calculateEligibility(currentAge, yearsEmployed, formData.jobClass, isPre2011Plan);

  // 3. Multiplier accrual rate
  const baseMultiplier = calculateAccrualMultiplier(
    formData.jobClass,
    yearsToEligible,
    currentAge,
    ageRequirement,
    yearsEmployed,
    serviceRequirement
  );

  // 4. Retirement timing and early retirement penalty (5% per year under normal age)
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
      earlyRetirementPenalty = Math.min(1, yearsToEligible * FRS_THRESHOLDS.EARLY_RETIREMENT_PENALTY_PER_YEAR);
    }
  }

  // 5. Timeline resolution
  const dropYears = dropMonths / 12;
  const actualExitAge = calculatedRetirementAge > 0 ? calculatedRetirementAge + dropYears : 0;
  const yearsInRetirement = actualExitAge > 0 ? Math.max(0, mortalityAge - actualExitAge) : 0;

  // 6. Base monthly pension
  const monthlySalary = annualSalary / 12;
  const penaltyFactor = 1 - earlyRetirementPenalty;
  const baseMonthlyPension = monthlySalary * projectedYearsOfService * baseMultiplier * penaltyFactor;

  // 7. Option adjustments
  const optionMultiplier = calculateOptionMultiplier(formData.selectedOption, spouseAgeDiff);
  const monthlyPensionTaxable = baseMonthlyPension * optionMultiplier;

  // Survivor benefit calculation (Options 3 & 4)
  let survivorMonthlyPension = 0;
  if (parseInt(formData.selectedOption, 10) === 3) {
    survivorMonthlyPension = monthlyPensionTaxable; // 100% Joint & Survivor
  } else if (parseInt(formData.selectedOption, 10) === 4) {
    survivorMonthlyPension = monthlyPensionTaxable * (2 / 3); // 66 2/3% Joint & Survivor
  }

  // 8. D.R.O.P. lump sum
  const dropLumpSum = calculateDropLumpSum(
    monthlyPensionTaxable,
    dropMonths,
    dropInterestRate,
    isPre2011Plan
  );

  // 9. Shortfall & Buyout
  const monthlyShortfall = Math.max(0, monthlySalary - monthlyPensionTaxable);
  const annualShortfall = monthlyShortfall * 12;
  const totalShortfall = annualShortfall * yearsInRetirement;
  const buyoutAmount = monthlyPensionTaxable * 12 * FRS_THRESHOLDS.DEFAULT_BUYOUT_MULTIPLIER;

  return {
    isPre2011Plan,
    isBoundaryYear,
    hasServiceData,
    monthlyPensionTaxable,
    baseMonthlyPension,
    optionMultiplier,
    spouseAgeDiff,
    survivorMonthlyPension,
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
}
