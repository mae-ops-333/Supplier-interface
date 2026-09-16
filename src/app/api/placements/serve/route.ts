import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

// --- The ad-blocker-resistant delivery contract -----------------------------
//
// Conventional web ads get blocked because the browser loads them from a
// third-party script or iframe domain that blocklists (uBlock, AdGuard, …)
// can recognize and strip client-side. This endpoint is designed to never
// be called by the visitor's browser at all: OnlinePlanService's own
// backend calls it server-to-server while rendering a plan room page, then
// stitches the returned creative into that page's first-party HTML before
// it ever reaches the visitor. From the browser's point of view the
// sponsored content is indistinguishable from OPS's own native content —
// same origin, same markup, no ad-network request for a blocker to catch.
//
// GET /api/placements/serve
//   ?planRoomId=<OPS plan room id>   (omit for a nationwide-only context)
//   &specialty=<specialty code>       (optional trade filter)
//   &projectSpecSections=<csv of CSI codes on the current project's spec book>
//   &userSpecSection=<CSI code the viewing user is responsible for>
export async function GET(req: Request) {
  const url = new URL(req.url);
  const opsPlanRoomId = url.searchParams.get("planRoomId");
  const specialtyCode = url.searchParams.get("specialty");
  const projectSpecSections = (url.searchParams.get("projectSpecSections") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const userSpecSection = url.searchParams.get("userSpecSection");

  const now = new Date();

  const planRoom = opsPlanRoomId
    ? await prisma.planRoom.findUnique({ where: { opsPlanRoomId } })
    : null;

  const scopeFilter: Prisma.CampaignWhereInput[] = [{ scope: "NATIONWIDE" }];
  if (planRoom) {
    scopeFilter.push({
      scope: "SELECTED_PLAN_ROOMS",
      planRooms: { some: { planRoomId: planRoom.id } },
    });
  }

  const candidates = await prisma.campaign.findMany({
    where: {
      status: "ACTIVE",
      paymentStatus: "PAID",
      startDate: { lte: now },
      endDate: { gte: now },
      OR: scopeFilter,
      ...(specialtyCode
        ? { specialties: { some: { specialty: { code: specialtyCode } } } }
        : {}),
    },
    include: {
      creative: true,
      specSections: { include: { specSection: true } },
    },
    // Higher-spend placements win the impression when several qualify —
    // the same "advertiser competition raises priority" idea Google Ads'
    // auction ranks on, just settled at booking time instead of per-impression.
    orderBy: { totalPriceCents: "desc" },
  });

  const winner = candidates.find((campaign) => {
    const sectionCodes = campaign.specSections.map((s) => s.specSection.csiCode);
    switch (campaign.targetingMode) {
      case "NONE":
        return true;
      case "PROJECT_SPEC_SECTION":
        return projectSpecSections.some((code) => sectionCodes.includes(code));
      case "USER_SPEC_SECTION":
        return userSpecSection ? sectionCodes.includes(userSpecSection) : false;
    }
  });

  if (!winner || !winner.creative) {
    return NextResponse.json({ placement: null });
  }

  // Counted here, server-to-server, at the moment OPS actually fetches the
  // creative to render — not via a client-side pixel a blocker could drop.
  await prisma.campaign.update({
    where: { id: winner.id },
    data: { impressionCount: { increment: 1 } },
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  return NextResponse.json({
    placement: {
      campaignId: winner.id,
      headline: winner.creative.headline,
      body: winner.creative.body,
      imageUrl: winner.creative.imageUrl,
      ctaLabel: winner.creative.ctaLabel,
      // OPS renders this as a same-origin link (or proxies/rewrites it under
      // their own domain) so the click stays first-party too.
      clickUrl: `${appUrl}/api/placements/click?campaignId=${winner.id}`,
    },
  });
}
