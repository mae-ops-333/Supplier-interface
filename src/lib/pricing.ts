// Pricing engine for OnlinePlanService ad placements ("value-added
// information spaces"). Pure, framework-agnostic functions so they can be
// unit tested and reused from both the wizard's live-price preview
// (POST /api/pricing/calculate) and the server-side checkout flow, which
// recomputes the price rather than trusting a client-submitted number.

export type CoverageScope = "NATIONWIDE" | "SELECTED_PLAN_ROOMS";

export type TargetingMode =
  | "NONE"
  | "PROJECT_SPEC_SECTION"
  | "USER_SPEC_SECTION";

export interface PricingInput {
  scope: CoverageScope;
  /** Number of individually selected plan rooms. Ignored when scope is NATIONWIDE. */
  planRoomCount: number;
  startDate: Date;
  endDate: Date;
  /** Number of trade specialties the placement is targeted to. */
  specialtyCount: number;
  targetingMode: TargetingMode;
  /** Number of CSI spec sections selected. Ignored when targetingMode is NONE. */
  specSectionCount: number;
  /**
   * How full the requested inventory already is, from 0 (wide open) to 1
   * (every slot booked), *before* this campaign. Computed from live bookings
   * by lib/inventory.ts and passed in here so calculatePricing stays a pure,
   * easily-tested function. Defaults to 0 (no surge) when omitted.
   */
  utilization?: number;
}

export interface PricingBreakdown {
  months: number;
  basePriceCents: number;
  specialtySurchargeCents: number;
  durationDiscountCents: number;
  targetingSurchargeCents: number;
  surgeMultiplier: number;
  surgeAdjustmentCents: number;
  minimumSpendAdjustmentCents: number;
  totalCents: number;
  effectiveMonthlyRateCents: number;
  ratePerPlanRoomCents: number | null;
}

// --- Rate card --------------------------------------------------------------

/** Flat monthly rate per individually selected plan room. */
export const PLAN_ROOM_MONTHLY_RATE_CENTS = 45_000; // $450

/** Flat monthly rate for nationwide coverage across every OPS plan room. */
export const NATIONWIDE_MONTHLY_RATE_CENTS = 600_000; // $6,000

/** The first specialty is included in the base rate; each extra one adds reach. */
export const INCLUDED_SPECIALTIES = 1;
export const ADDITIONAL_SPECIALTY_SURCHARGE_RATE = 0.08; // +8% of base per extra specialty
export const MAX_SPECIALTY_SURCHARGE_MULTIPLIER = 0.8; // capped at +80%

// Spec-section targeting narrows inventory, so it's priced per section, per
// month, on top of everything else. User-level targeting (matching the
// actual person's trade/spec responsibility) is materially more precise
// than project-level targeting (matching a project's spec book), so it
// costs more.
export const PROJECT_SPEC_SECTION_SURCHARGE_CENTS = 7_500; // $75/section/month
export const USER_SPEC_SECTION_SURCHARGE_CENTS = 15_000; // $150/section/month

/** Longer commitments earn a discount on the base + specialty spend. */
export const DURATION_DISCOUNT_TIERS: { minMonths: number; rate: number }[] = [
  { minMonths: 12, rate: 0.3 },
  { minMonths: 6, rate: 0.2 },
  { minMonths: 3, rate: 0.1 },
];

/** Floor so a heavily-narrowed, short placement never undercuts operating cost. */
export const MINIMUM_MONTHLY_SPEND_CENTS = 30_000; // $300/month

export const MIN_CAMPAIGN_DAYS = 14;

// --- Demand-based surge pricing ---------------------------------------------
//
// Each plan room only sells a handful of concurrent "value-added" slots
// (see SLOTS_PER_PLAN_ROOM / NATIONWIDE_SLOT_CAPACITY in lib/inventory.ts) —
// unlike a conventional ad network, capacity is deliberately capped so the
// placement stays a premium, non-cluttering feature rather than banner-ad
// clutter. That scarcity is exactly what Google Ads' real-time auction and
// Uber's surge pricing both react to, just through different mechanisms:
//   - Google Ads runs a live per-impression auction where CPC rises with
//     advertiser competition for the same keyword/audience (Ad Rank).
//   - Uber applies a demand/supply multiplier to the base fare when nearby
//     demand outstrips available drivers.
// A live per-impression auction doesn't fit an upfront "buy a placement"
// checkout, so we borrow the Uber shape instead: a stepped multiplier driven
// by how full the requested inventory already is, applied on top of the
// rate-card subtotal. It reacts to demand the same way Google's auction
// does (more competition -> higher price) without requiring a bidding UI.
export const SURGE_TIERS: { minUtilization: number; multiplier: number }[] = [
  { minUtilization: 1, multiplier: 2.25 }, // last available slot
  { minUtilization: 0.9, multiplier: 1.75 }, // high demand
  { minUtilization: 0.75, multiplier: 1.35 }, // elevated demand
  { minUtilization: 0.5, multiplier: 1.15 }, // moderate demand
];

export function surgeMultiplierFor(utilization: number): number {
  const clamped = Math.min(Math.max(utilization, 0), 1);
  for (const tier of SURGE_TIERS) {
    if (clamped >= tier.minUtilization) return tier.multiplier;
  }
  return 1;
}

const MS_PER_DAY = 1000 * 60 * 60 * 24;
const DAYS_PER_MONTH = 30;

export function calculateMonths(startDate: Date, endDate: Date): number {
  const days = (endDate.getTime() - startDate.getTime()) / MS_PER_DAY;
  return Math.max(days, 0) / DAYS_PER_MONTH;
}

function durationDiscountRate(months: number): number {
  for (const tier of DURATION_DISCOUNT_TIERS) {
    if (months >= tier.minMonths) return tier.rate;
  }
  return 0;
}

function targetingSurchargePerSectionCents(mode: TargetingMode): number {
  switch (mode) {
    case "PROJECT_SPEC_SECTION":
      return PROJECT_SPEC_SECTION_SURCHARGE_CENTS;
    case "USER_SPEC_SECTION":
      return USER_SPEC_SECTION_SURCHARGE_CENTS;
    case "NONE":
      return 0;
  }
}

export function validatePricingInput(input: PricingInput): string[] {
  const errors: string[] = [];

  if (input.scope === "SELECTED_PLAN_ROOMS" && input.planRoomCount < 1) {
    errors.push("Select at least one plan room, or switch to nationwide coverage.");
  }
  if (input.specialtyCount < 1) {
    errors.push("Select at least one specialty.");
  }
  if (input.targetingMode !== "NONE" && input.specSectionCount < 1) {
    errors.push("Select at least one spec section for the chosen targeting mode.");
  }
  if (input.targetingMode === "NONE" && input.specSectionCount > 0) {
    errors.push("Spec sections were selected but no targeting mode is set.");
  }
  const days = (input.endDate.getTime() - input.startDate.getTime()) / MS_PER_DAY;
  if (days < MIN_CAMPAIGN_DAYS) {
    errors.push(`Campaigns must run at least ${MIN_CAMPAIGN_DAYS} days.`);
  }

  return errors;
}

export function calculatePricing(input: PricingInput): PricingBreakdown {
  const errors = validatePricingInput(input);
  if (errors.length > 0) {
    throw new Error(`Invalid pricing input: ${errors.join(" ")}`);
  }

  const months = calculateMonths(input.startDate, input.endDate);

  const baseMonthlyCents =
    input.scope === "NATIONWIDE"
      ? NATIONWIDE_MONTHLY_RATE_CENTS
      : PLAN_ROOM_MONTHLY_RATE_CENTS * input.planRoomCount;
  const basePriceCents = Math.round(baseMonthlyCents * months);

  const extraSpecialties = Math.max(input.specialtyCount - INCLUDED_SPECIALTIES, 0);
  const specialtyRate = Math.min(
    extraSpecialties * ADDITIONAL_SPECIALTY_SURCHARGE_RATE,
    MAX_SPECIALTY_SURCHARGE_MULTIPLIER,
  );
  const specialtySurchargeCents = Math.round(basePriceCents * specialtyRate);

  const discountRate = durationDiscountRate(months);
  const durationDiscountCents = Math.round(
    (basePriceCents + specialtySurchargeCents) * discountRate,
  );

  const targetingSurchargeCents = Math.round(
    targetingSurchargePerSectionCents(input.targetingMode) *
      input.specSectionCount *
      months,
  );

  const preSurgeSubtotalCents =
    basePriceCents +
    specialtySurchargeCents -
    durationDiscountCents +
    targetingSurchargeCents;

  const surgeMultiplier = surgeMultiplierFor(input.utilization ?? 0);
  const surgeAdjustmentCents = Math.round(
    preSurgeSubtotalCents * (surgeMultiplier - 1),
  );

  const subtotalCents = preSurgeSubtotalCents + surgeAdjustmentCents;

  const minimumFloorCents = Math.round(MINIMUM_MONTHLY_SPEND_CENTS * months);
  const minimumSpendAdjustmentCents = Math.max(minimumFloorCents - subtotalCents, 0);

  const totalCents = subtotalCents + minimumSpendAdjustmentCents;

  const effectiveMonthlyRateCents =
    months > 0 ? Math.round(totalCents / months) : totalCents;

  const ratePerPlanRoomCents =
    input.scope === "SELECTED_PLAN_ROOMS" && input.planRoomCount > 0
      ? Math.round(totalCents / input.planRoomCount / Math.max(months, 1e-9))
      : null;

  return {
    months: Math.round(months * 100) / 100,
    basePriceCents,
    specialtySurchargeCents,
    durationDiscountCents,
    targetingSurchargeCents,
    surgeMultiplier,
    surgeAdjustmentCents,
    minimumSpendAdjustmentCents,
    totalCents,
    effectiveMonthlyRateCents,
    ratePerPlanRoomCents,
  };
}

export function formatCents(cents: number): string {
  return (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}
