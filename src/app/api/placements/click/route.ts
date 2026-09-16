import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// First-party click redirect: OPS links straight to this same-origin path
// rather than a third-party ad-network click tracker, so it isn't a target
// domain blocklists flag. Records the click, then 302s to the advertiser's
// destination URL.
export async function GET(req: Request) {
  const campaignId = new URL(req.url).searchParams.get("campaignId");
  if (!campaignId) {
    return NextResponse.json({ error: "campaignId is required" }, { status: 400 });
  }

  const campaign = await prisma.campaign
    .update({
      where: { id: campaignId },
      data: { clickCount: { increment: 1 } },
      include: { creative: true },
    })
    .catch(() => null);

  if (!campaign?.creative?.ctaUrl) {
    return NextResponse.json({ error: "Placement not found" }, { status: 404 });
  }

  return NextResponse.redirect(campaign.creative.ctaUrl, 302);
}
