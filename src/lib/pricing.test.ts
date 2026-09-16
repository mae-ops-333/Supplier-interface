import { describe, expect, it } from "vitest";
import {
  calculateMonths,
  calculatePricing,
  formatCents,
  MINIMUM_MONTHLY_SPEND_CENTS,
  NATIONWIDE_MONTHLY_RATE_CENTS,
  PLAN_ROOM_MONTHLY_RATE_CENTS,
  surgeMultiplierFor,
  validatePricingInput,
} from "./pricing";

const day = (n: number) => new Date(2026, 0, n);

describe("calculateMonths", () => {
  it("converts a day span into 30-day months", () => {
    expect(calculateMonths(day(1), day(31))).toBeCloseTo(1, 5);
    expect(calculateMonths(day(1), day(1))).toBe(0);
  });
});

describe("validatePricingInput", () => {
  it("requires at least one plan room for selected-plan-room scope", () => {
    const errors = validatePricingInput({
      scope: "SELECTED_PLAN_ROOMS",
      planRoomCount: 0,
      startDate: day(1),
      endDate: day(31),
      specialtyCount: 1,
      targetingMode: "NONE",
      specSectionCount: 0,
    });
    expect(errors.some((e) => e.includes("plan room"))).toBe(true);
  });

  it("requires spec sections when a targeting mode is set", () => {
    const errors = validatePricingInput({
      scope: "NATIONWIDE",
      planRoomCount: 0,
      startDate: day(1),
      endDate: day(31),
      specialtyCount: 1,
      targetingMode: "PROJECT_SPEC_SECTION",
      specSectionCount: 0,
    });
    expect(errors.some((e) => e.includes("targeting mode"))).toBe(true);
  });

  it("rejects campaigns shorter than the minimum window", () => {
    const errors = validatePricingInput({
      scope: "NATIONWIDE",
      planRoomCount: 0,
      startDate: day(1),
      endDate: day(5),
      specialtyCount: 1,
      targetingMode: "NONE",
      specSectionCount: 0,
    });
    expect(errors.some((e) => e.includes("14 days"))).toBe(true);
  });
});

describe("calculatePricing", () => {
  it("prices a single plan room, one month, one specialty, no targeting", () => {
    const result = calculatePricing({
      scope: "SELECTED_PLAN_ROOMS",
      planRoomCount: 1,
      startDate: day(1),
      endDate: day(31),
      specialtyCount: 1,
      targetingMode: "NONE",
      specSectionCount: 0,
    });
    expect(result.basePriceCents).toBe(PLAN_ROOM_MONTHLY_RATE_CENTS);
    expect(result.specialtySurchargeCents).toBe(0);
    expect(result.durationDiscountCents).toBe(0);
    expect(result.targetingSurchargeCents).toBe(0);
    expect(result.totalCents).toBe(PLAN_ROOM_MONTHLY_RATE_CENTS);
  });

  it("scales base price linearly with plan room count", () => {
    const result = calculatePricing({
      scope: "SELECTED_PLAN_ROOMS",
      planRoomCount: 5,
      startDate: day(1),
      endDate: day(31),
      specialtyCount: 1,
      targetingMode: "NONE",
      specSectionCount: 0,
    });
    expect(result.basePriceCents).toBe(PLAN_ROOM_MONTHLY_RATE_CENTS * 5);
  });

  it("uses the flat nationwide rate regardless of plan room count", () => {
    const result = calculatePricing({
      scope: "NATIONWIDE",
      planRoomCount: 0,
      startDate: day(1),
      endDate: day(31),
      specialtyCount: 1,
      targetingMode: "NONE",
      specSectionCount: 0,
    });
    expect(result.basePriceCents).toBe(NATIONWIDE_MONTHLY_RATE_CENTS);
  });

  it("adds a capped surcharge for extra specialties", () => {
    const oneSpecialty = calculatePricing({
      scope: "SELECTED_PLAN_ROOMS",
      planRoomCount: 1,
      startDate: day(1),
      endDate: day(31),
      specialtyCount: 1,
      targetingMode: "NONE",
      specSectionCount: 0,
    });
    const fiveSpecialties = calculatePricing({
      scope: "SELECTED_PLAN_ROOMS",
      planRoomCount: 1,
      startDate: day(1),
      endDate: day(31),
      specialtyCount: 5,
      targetingMode: "NONE",
      specSectionCount: 0,
    });
    const manySpecialties = calculatePricing({
      scope: "SELECTED_PLAN_ROOMS",
      planRoomCount: 1,
      startDate: day(1),
      endDate: day(31),
      specialtyCount: 20,
      targetingMode: "NONE",
      specSectionCount: 0,
    });
    expect(fiveSpecialties.specialtySurchargeCents).toBeGreaterThan(
      oneSpecialty.specialtySurchargeCents,
    );
    // capped at +80% of base
    expect(manySpecialties.specialtySurchargeCents).toBe(
      Math.round(PLAN_ROOM_MONTHLY_RATE_CENTS * 0.8),
    );
  });

  it("applies duration discount tiers to longer commitments", () => {
    const oneMonth = calculatePricing({
      scope: "SELECTED_PLAN_ROOMS",
      planRoomCount: 10,
      startDate: day(1),
      endDate: new Date(2026, 1, 1), // ~1 month later
      specialtyCount: 1,
      targetingMode: "NONE",
      specSectionCount: 0,
    });
    const twelveMonths = calculatePricing({
      scope: "SELECTED_PLAN_ROOMS",
      planRoomCount: 10,
      startDate: day(1),
      endDate: new Date(2027, 0, 1),
      specialtyCount: 1,
      targetingMode: "NONE",
      specSectionCount: 0,
    });
    expect(oneMonth.durationDiscountCents).toBe(0);
    expect(twelveMonths.durationDiscountCents).toBeGreaterThan(0);
    // effective monthly rate should be cheaper once discounted
    expect(twelveMonths.effectiveMonthlyRateCents).toBeLessThan(
      oneMonth.effectiveMonthlyRateCents,
    );
  });

  it("charges more for user-level spec-section targeting than project-level", () => {
    const base = {
      scope: "SELECTED_PLAN_ROOMS" as const,
      planRoomCount: 3,
      startDate: day(1),
      endDate: day(31),
      specialtyCount: 1,
      specSectionCount: 2,
    };
    const projectTargeted = calculatePricing({
      ...base,
      targetingMode: "PROJECT_SPEC_SECTION",
    });
    const userTargeted = calculatePricing({
      ...base,
      targetingMode: "USER_SPEC_SECTION",
    });
    expect(userTargeted.targetingSurchargeCents).toBeGreaterThan(
      projectTargeted.targetingSurchargeCents,
    );
  });

  it("never bills below the minimum monthly spend floor", () => {
    const result = calculatePricing({
      scope: "SELECTED_PLAN_ROOMS",
      planRoomCount: 1,
      startDate: day(1),
      endDate: day(15), // half a month, tiny base price
      specialtyCount: 1,
      targetingMode: "NONE",
      specSectionCount: 0,
    });
    const months = calculateMonths(day(1), day(15));
    expect(result.totalCents).toBeGreaterThanOrEqual(
      Math.round(MINIMUM_MONTHLY_SPEND_CENTS * months),
    );
  });

  it("throws for invalid input instead of returning nonsense pricing", () => {
    expect(() =>
      calculatePricing({
        scope: "SELECTED_PLAN_ROOMS",
        planRoomCount: 0,
        startDate: day(1),
        endDate: day(31),
        specialtyCount: 1,
        targetingMode: "NONE",
        specSectionCount: 0,
      }),
    ).toThrow();
  });
});

describe("surgeMultiplierFor", () => {
  it("charges the flat rate when inventory is wide open", () => {
    expect(surgeMultiplierFor(0)).toBe(1);
    expect(surgeMultiplierFor(0.49)).toBe(1);
  });

  it("steps up the multiplier as utilization crosses tiers", () => {
    expect(surgeMultiplierFor(0.5)).toBe(1.15);
    expect(surgeMultiplierFor(0.75)).toBe(1.35);
    expect(surgeMultiplierFor(0.9)).toBe(1.75);
    expect(surgeMultiplierFor(1)).toBe(2.25);
  });

  it("clamps out-of-range utilization instead of extrapolating", () => {
    expect(surgeMultiplierFor(-1)).toBe(1);
    expect(surgeMultiplierFor(5)).toBe(2.25);
  });
});

describe("calculatePricing surge behavior", () => {
  const base = {
    scope: "SELECTED_PLAN_ROOMS" as const,
    planRoomCount: 4,
    startDate: day(1),
    endDate: day(31),
    specialtyCount: 1,
    targetingMode: "NONE" as const,
    specSectionCount: 0,
  };

  it("raises the total price under high demand vs. no demand", () => {
    const quiet = calculatePricing({ ...base, utilization: 0 });
    const busy = calculatePricing({ ...base, utilization: 0.9 });
    expect(busy.surgeMultiplier).toBe(1.75);
    expect(busy.totalCents).toBeGreaterThan(quiet.totalCents);
    expect(busy.totalCents).toBe(
      Math.round(quiet.totalCents * 1.75),
    );
  });

  it("charges the last-slot premium at full utilization", () => {
    const soldOutTier = calculatePricing({ ...base, utilization: 1 });
    expect(soldOutTier.surgeMultiplier).toBe(2.25);
  });
});

describe("formatCents", () => {
  it("formats cents as USD currency", () => {
    expect(formatCents(45_000)).toBe("$450.00");
  });
});
