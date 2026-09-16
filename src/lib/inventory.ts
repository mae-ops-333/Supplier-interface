// Live inventory utilization for demand-based surge pricing (see the surge
// section of lib/pricing.ts for the rationale). This is the DB-aware half:
// it looks at how many campaigns already occupy the requested plan rooms —
// or the nationwide pool — for overlapping dates, and turns that into the
// 0..1 utilization ratio calculatePricing() uses to pick a surge tier.
import type { Prisma, PrismaClient } from "@prisma/client";
import { prisma as defaultPrisma } from "@/lib/prisma";

/** Concurrent sponsor slots sold per individual plan room. Kept small so the
 * placement stays a premium feature rather than banner-ad clutter. */
export const SLOTS_PER_PLAN_ROOM = 3;

/** Concurrent nationwide placements sold at once (scarcer, broader reach). */
export const NATIONWIDE_SLOT_CAPACITY = 5;

// Campaigns in either state occupy a slot: PENDING_PAYMENT holds the slot
// during checkout so two advertisers can't both "win" it, ACTIVE holds it
// once paid and live.
const SLOT_HOLDING_STATUSES: Prisma.CampaignWhereInput["status"] = {
  in: ["PENDING_PAYMENT", "ACTIVE"],
};

export interface UtilizationInput {
  scope: "NATIONWIDE" | "SELECTED_PLAN_ROOMS";
  /** Internal Prisma PlanRoom ids (not OPS ids). Ignored for NATIONWIDE. */
  planRoomIds: string[];
  startDate: Date;
  endDate: Date;
  /** Exclude a campaign (e.g. when repricing a campaign you already booked). */
  excludeCampaignId?: string;
}

export interface UtilizationResult {
  /** Booked slots / capacity for the tightest-constrained requested room, before this campaign. */
  utilization: number;
  soldOut: boolean;
  capacity: number;
  booked: number;
}

function overlapsDateRange(startDate: Date, endDate: Date): Prisma.CampaignWhereInput {
  return { startDate: { lt: endDate }, endDate: { gt: startDate } };
}

/**
 * Nationwide campaigns run in every plan room, so they also occupy a slot
 * in each individual room's capacity — they compete for the same
 * advertiser attention even though they weren't "selected" for that room.
 */
async function countBookingsForPlanRoom(
  db: PrismaClient,
  planRoomId: string,
  startDate: Date,
  endDate: Date,
  excludeCampaignId?: string,
): Promise<number> {
  return db.campaign.count({
    where: {
      status: SLOT_HOLDING_STATUSES,
      ...overlapsDateRange(startDate, endDate),
      ...(excludeCampaignId ? { id: { not: excludeCampaignId } } : {}),
      OR: [
        { scope: "NATIONWIDE" },
        { scope: "SELECTED_PLAN_ROOMS", planRooms: { some: { planRoomId } } },
      ],
    },
  });
}

async function countNationwideBookings(
  db: PrismaClient,
  startDate: Date,
  endDate: Date,
  excludeCampaignId?: string,
): Promise<number> {
  return db.campaign.count({
    where: {
      status: SLOT_HOLDING_STATUSES,
      scope: "NATIONWIDE",
      ...overlapsDateRange(startDate, endDate),
      ...(excludeCampaignId ? { id: { not: excludeCampaignId } } : {}),
    },
  });
}

export async function getUtilization(
  input: UtilizationInput,
  db: PrismaClient = defaultPrisma,
): Promise<UtilizationResult> {
  if (input.scope === "NATIONWIDE") {
    const booked = await countNationwideBookings(
      db,
      input.startDate,
      input.endDate,
      input.excludeCampaignId,
    );
    return {
      utilization: Math.min(booked / NATIONWIDE_SLOT_CAPACITY, 1),
      soldOut: booked >= NATIONWIDE_SLOT_CAPACITY,
      capacity: NATIONWIDE_SLOT_CAPACITY,
      booked,
    };
  }

  if (input.planRoomIds.length === 0) {
    return { utilization: 0, soldOut: false, capacity: 0, booked: 0 };
  }

  const counts = await Promise.all(
    input.planRoomIds.map((planRoomId) =>
      countBookingsForPlanRoom(
        db,
        planRoomId,
        input.startDate,
        input.endDate,
        input.excludeCampaignId,
      ),
    ),
  );

  // The most-booked requested room sets the price, mirroring how a rider's
  // fare reflects the surge zone they're actually requesting a pickup in.
  const maxBooked = Math.max(...counts);

  return {
    utilization: Math.min(maxBooked / SLOTS_PER_PLAN_ROOM, 1),
    soldOut: maxBooked >= SLOTS_PER_PLAN_ROOM,
    capacity: SLOTS_PER_PLAN_ROOM,
    booked: maxBooked,
  };
}
