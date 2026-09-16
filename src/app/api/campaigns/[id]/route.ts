import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fullCampaignInclude } from "@/lib/campaigns";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const campaign = await prisma.campaign.findUnique({
    where: { id },
    include: fullCampaignInclude,
  });

  if (!campaign) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }

  return NextResponse.json({ campaign });
}
