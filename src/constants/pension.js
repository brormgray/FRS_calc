/**
 * Florida Retirement System (FRS) Pension Constants & Plan Rules
 * Governed by Florida Statutes Chapter 121 (Florida Retirement System Act)
 */

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

export const INITIAL_FORM_STATE = {
  name: "",
  email: "",
  agency: "",
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
  spouseAge: "",
  spouseAgeDiff: 0,
};

export const ADVISOR_STORAGE_KEY = "frs_advisor_profile_v1";

export const DEFAULT_ADVISOR_INFO = {
  name: "",
  email: "",
  phone: "",
  firm: "Florida Retirement Planning",
  title: "FRS Pension Specialist",
};

/**
 * Statutory FRS Thresholds
 * - Tier 1: Enrolled before July 1, 2011 (Vesting: 6 years)
 * - Tier 2: Enrolled on or after July 1, 2011 (Vesting: 8 years)
 */
export const FRS_THRESHOLDS = {
  CUTOFF_YEAR: 2011,
  TIER_1_COLA: 0.03, // 3% annual COLA for pre-July 2011 service
  DEFAULT_BUYOUT_MULTIPLIER: 13.548,
  EARLY_RETIREMENT_PENALTY_PER_YEAR: 0.05, // 5% reduction per year under normal retirement age
  DEFAULT_DROP_INTEREST_RATE: 4.0, // Florida HB 239 (effective July 1, 2023)
  MAX_DROP_MONTHS: 96, // Maximum 96 months (8 years) under current FRS law
  REGULAR: {
    TIER_1: {
      AGE_REQ: 62,
      SERVICE_REQ: 30,
      VESTING_YRS: 6,
      BASE_MULTIPLIER: 0.016,
    },
    TIER_2: {
      AGE_REQ: 65,
      SERVICE_REQ: 33,
      VESTING_YRS: 8,
      BASE_MULTIPLIER: 0.016,
    },
  },
  SPECIAL_RISK: {
    TIER_1: {
      AGE_REQ: 55,
      SERVICE_REQ: 25,
      VESTING_YRS: 6,
      BASE_MULTIPLIER: 0.03,
    },
    TIER_2: {
      AGE_REQ: 60,
      SERVICE_REQ: 30,
      VESTING_YRS: 8,
      BASE_MULTIPLIER: 0.03,
    },
  },
};
