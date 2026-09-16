import { prisma } from "@/lib/prisma";
import { calculateMonths, calculatePricing, type PricingBreakdown } from "@/lib/pricing";
import { getUtilization } from "@/lib/inventory";
import { getOpsClient } from "@/lib/ops";
import type { CampaignDraftInput } from "@/lib/validation";
import type { Prisma } from "@prisma/client";

export class SoldOutError extends Error {}

export const fullCampaignInclude = {
  advertiser: true,
  creative: true,
  zones: { include: { zone: true } },
  planRooms: { include: { planRoom: { include: { zone: true } } } },
  specialties: { include: { specialty: true } },
  specSections: { include: { specSection: true } },
  payments: true,
} satisfies Prisma.CampaignInclude;

export type FullCampaign = Prisma.CampaignGetPayload<{
  include: typeof fullCampaignInclude;
}>;

/** Basis-point encoding used to store the surge multiplier without floats. */
const BPS_SCALE = 10_000;

export async function createCampaignDraft(input: CampaignDraftInput) {
  const utilization = await getUtilization({
    scope: input.scope,
    planRoomIds: input.planRoomIds,
    startDate: input.startDate,
    endDate: input.endDate,
  });

  if (utilization.soldOut) {
    throw new SoldOutError(
      "The requested plan room(s) have no open placement slots for these dates. Try different dates, fewer plan rooms, or nationwide coverage.",
    );
  }

  const pricing = calculatePricing({
    scope: input.scope,
    planRoomCount: input.planRoomIds.length,
    startDate: input.startDate,
    endDate: input.endDate,
    specialtyCount: input.specialtyIds.length,
    targetingMode: input.targetingMode,
    specSectionCount: input.specSectionIds.length,
    utilization: utilization.utilization,
  });

  const advertiser = await prisma.advertiser.upsert({
    where: { email: input.advertiser.email },
    update: {
      companyName: input.advertiser.companyName,
      contactName: input.advertiser.contactName,
    },
    create: input.advertiser,
  });

  const campaign = await prisma.campaign.create({
    data: {
      advertiserId: advertiser.id,
      name: input.name,
      status: "PENDING_PAYMENT",
      scope: input.scope,
      startDate: input.startDate,
      endDate: input.endDate,
      targetingMode: input.targetingMode,
      basePriceCents: pricing.basePriceCents,
      durationDiscountCents: pricing.durationDiscountCents,
      specialtySurchargeCents: pricing.specialtySurchargeCents,
      targetingSurchargeCents: pricing.targetingSurchargeCents,
      surgeMultiplierBps: Math.round(pricing.surgeMultiplier * BPS_SCALE),
      surgeAdjustmentCents: pricing.surgeAdjustmentCents,
      totalPriceCents: pricing.totalCents,
      paymentStatus: "UNPAID",
      zones: { create: input.zoneIds.map((zoneId) => ({ zoneId })) },
      planRooms: {
        create: input.planRoomIds.map((planRoomId) => ({ planRoomId })),
      },
      specialties: {
        create: input.specialtyIds.map((specialtyId) => ({ specialtyId })),
      },
      specSections: {
        create: input.specSectionIds.map((specSectionId) => ({ specSectionId })),
      },
      creative: { create: input.creative },
    },
    include: fullCampaignInclude,
  });

  return { campaign, pricing, utilization };
}

/**
 * Marks a campaign paid, moves it to ACTIVE, and hands the placement to
 * OnlinePlanService so their plan rooms start serving it. Idempotent so it's
 * safe to call from both the Stripe webhook (which may retry) and the dev
 * fake-payment fallback.
 */
export async function activateCampaign(
  campaignId: string,
  opts: { stripeCheckoutSessionId?: string; stripePaymentIntentId?: string },
): Promise<FullCampaign> {
  const existing = await prisma.campaign.findUnique({
    where: { id: campaignId },
    include: fullCampaignInclude,
  });
  if (!existing) throw new Error(`Campaign ${campaignId} not found`);
  if (existing.paymentStatus === "PAID") return existing;

  const ops = getOpsClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const publishResult = await ops.publishPlacement({
    campaignId: existing.id,
    scope: existing.scope,
    opsZoneIds: existing.zones.map((z) => z.zone.opsZoneId),
    opsPlanRoomIds: existing.planRooms.map((pr) => pr.planRoom.opsPlanRoomId),
    specialtyCodes: existing.specialties.map((s) => s.specialty.code),
    targetingMode: existing.targetingMode,
    specSectionCsiCodes: existing.specSections.map((s) => s.specSection.csiCode),
    startDate: existing.startDate.toISOString(),
    endDate: existing.endDate.toISOString(),
    creative: {
      headline: existing.creative?.headline ?? "",
      body: existing.creative?.body ?? "",
      imageUrl: existing.creative?.imageUrl,
      ctaLabel: existing.creative?.ctaLabel ?? "",
      ctaUrl: existing.creative?.ctaUrl ?? "",
    },
    deliveryUrl: `${appUrl}/api/placements/serve`,
  });

  const paymentIntentId =
    opts.stripePaymentIntentId ?? `dev_fake_${campaignId}_${Date.now()}`;

  const updated = await prisma.campaign.update({
    where: { id: campaignId },
    data: {
      paymentStatus: "PAID",
      status: "ACTIVE",
      stripeCheckoutSessionId: opts.stripeCheckoutSessionId,
      stripePaymentIntentId: paymentIntentId,
      payments: {
        create: {
          amountCents: existing.totalPriceCents,
          status: "PAID",
          stripePaymentIntentId: paymentIntentId,
        },
      },
    },
    include: fullCampaignInclude,
  });

  console.info("[ops] published placement", publishResult);

  return updated;
}

/** Reconstructs a display-ready PricingBreakdown from a campaign's stored
 * price snapshot, e.g. for the campaign detail page. */
export function toPricingBreakdown(campaign: FullCampaign): PricingBreakdown {
  const months = calculateMonths(campaign.startDate, campaign.endDate);
  const surgeMultiplier = campaign.surgeMultiplierBps / 10_000;
  const planRoomCount = campaign.planRooms.length;

  return {
    months: Math.round(months * 100) / 100,
    basePriceCents: campaign.basePriceCents,
    specialtySurchargeCents: campaign.specialtySurchargeCents,
    durationDiscountCents: campaign.durationDiscountCents,
    targetingSurchargeCents: campaign.targetingSurchargeCents,
    surgeMultiplier,
    surgeAdjustmentCents: campaign.surgeAdjustmentCents,
    minimumSpendAdjustmentCents: 0,
    totalCents: campaign.totalPriceCents,
    effectiveMonthlyRateCents:
      months > 0 ? Math.round(campaign.totalPriceCents / months) : campaign.totalPriceCents,
    ratePerPlanRoomCents:
      campaign.scope === "SELECTED_PLAN_ROOMS" && planRoomCount > 0
        ? Math.round(campaign.totalPriceCents / planRoomCount / Math.max(months, 1e-9))
        : null,
  };
}
