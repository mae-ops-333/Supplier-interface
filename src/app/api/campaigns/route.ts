import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createCampaignDraft, SoldOutError } from "@/lib/campaigns";
import { campaignDraftSchema } from "@/lib/validation";

// GET /api/campaigns?email=advertiser@example.com — dashboard listing.
export async function GET(req: Request) {
  const email = new URL(req.url).searchParams.get("email");

  const campaigns = await prisma.campaign.findMany({
    where: email ? { advertiser: { email } } : undefined,
    orderBy: { createdAt: "desc" },
    include: {
      creative: true,
      planRooms: { include: { planRoom: true } },
      zones: { include: { zone: true } },
    },
  });

  return NextResponse.json({ campaigns });
}

// POST /api/campaigns — final step of the wizard. Creates the campaign in
// PENDING_PAYMENT status with a server-computed price snapshot (never trust
// a client-submitted price) and holds an inventory slot until checkout
// completes or the draft is abandoned.
export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = campaignDraftSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const { campaign, pricing, utilization } = await createCampaignDraft(
      parsed.data,
    );
    return NextResponse.json({ campaign, pricing, utilization }, { status: 201 });
  } catch (err) {
    if (err instanceof SoldOutError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    console.error("Failed to create campaign", err);
    return NextResponse.json(
      { error: "Failed to create campaign" },
      { status: 500 },
    );
  }
}
