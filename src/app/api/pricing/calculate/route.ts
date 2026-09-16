import { NextResponse } from "next/server";
import { calculatePricing } from "@/lib/pricing";
import { getUtilization } from "@/lib/inventory";
import { pricingRequestSchema } from "@/lib/validation";

// Live price preview for the campaign builder wizard. Recomputes utilization
// from current bookings on every call so the surge multiplier the advertiser
// sees reflects real-time demand, not a stale snapshot.
export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = pricingRequestSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const input = parsed.data;

  const inventory = await getUtilization({
    scope: input.scope,
    planRoomIds: input.planRoomIds,
    startDate: input.startDate,
    endDate: input.endDate,
  });

  try {
    const breakdown = calculatePricing({
      scope: input.scope,
      planRoomCount: input.planRoomIds.length,
      startDate: input.startDate,
      endDate: input.endDate,
      specialtyCount: input.specialtyIds.length,
      targetingMode: input.targetingMode,
      specSectionCount: input.specSectionIds.length,
      utilization: inventory.utilization,
    });
    return NextResponse.json({ breakdown, inventory });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Invalid pricing input" },
      { status: 400 },
    );
  }
}
