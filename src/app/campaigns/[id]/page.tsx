import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { fullCampaignInclude, toPricingBreakdown } from "@/lib/campaigns";
import { Card, Badge } from "@/components/ui";
import { PriceBreakdown } from "@/components/PriceBreakdown";
import { CampaignStatusBadge, PaymentStatusBadge } from "@/components/StatusBadge";
import { PayButton } from "./PayButton";

export default async function CampaignDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ paid?: string; canceled?: string }>;
}) {
  const { id } = await params;
  const { paid, canceled } = await searchParams;

  const campaign = await prisma.campaign.findUnique({
    where: { id },
    include: fullCampaignInclude,
  });
  if (!campaign) notFound();

  const breakdown = toPricingBreakdown(campaign);

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      {paid && campaign.paymentStatus === "PAID" && (
        <div className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
          Payment received — your placement is live and OnlinePlanService has been notified.
        </div>
      )}
      {canceled && (
        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
          Checkout was canceled. Your draft is saved — pay whenever you&apos;re ready.
        </div>
      )}

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{campaign.name}</h1>
          <p className="mt-1 text-zinc-600 dark:text-zinc-400">
            {campaign.advertiser.companyName} · {campaign.advertiser.contactName}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <CampaignStatusBadge status={campaign.status} />
          <PaymentStatusBadge status={campaign.paymentStatus} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="space-y-4 lg:col-span-3">
          <Card>
            <h2 className="mb-3 font-semibold text-zinc-900 dark:text-zinc-50">Placement details</h2>
            <dl className="space-y-2 text-sm">
              <Row label="Coverage" value={campaign.scope === "NATIONWIDE" ? "Nationwide" : `${campaign.planRooms.length} plan room(s)`} />
              {campaign.scope === "SELECTED_PLAN_ROOMS" && (
                <Row label="Plan rooms" value={campaign.planRooms.map((pr) => pr.planRoom.name).join(", ") || "—"} />
              )}
              <Row label="Timeline" value={`${campaign.startDate.toISOString().slice(0, 10)} → ${campaign.endDate.toISOString().slice(0, 10)}`} />
              <Row label="Specialties" value={campaign.specialties.map((s) => s.specialty.name).join(", ") || "—"} />
              <Row
                label="Spec-section targeting"
                value={
                  campaign.targetingMode === "NONE"
                    ? "None"
                    : `${campaign.targetingMode === "PROJECT_SPEC_SECTION" ? "Project" : "User"}-level: ${campaign.specSections
                        .map((s) => s.specSection.csiCode)
                        .join(", ")}`
                }
              />
            </dl>
          </Card>

          {campaign.creative && (
            <Card>
              <h2 className="mb-3 font-semibold text-zinc-900 dark:text-zinc-50">Creative</h2>
              <div className="rounded-lg border border-dashed border-zinc-300 p-4 dark:border-zinc-700">
                <span className="mb-2 inline-block rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-zinc-500 dark:bg-zinc-800">
                  Sponsored
                </span>
                <div className="font-semibold text-zinc-900 dark:text-zinc-50">{campaign.creative.headline}</div>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{campaign.creative.body}</p>
                <span className="mt-2 inline-block text-sm font-medium text-blue-600">{campaign.creative.ctaLabel} →</span>
              </div>
            </Card>
          )}

          {campaign.status === "ACTIVE" && (
            <Card>
              <h2 className="mb-3 font-semibold text-zinc-900 dark:text-zinc-50">Delivery</h2>
              <div className="flex gap-6 text-sm">
                <div>
                  <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{campaign.impressionCount}</div>
                  <div className="text-zinc-500">Impressions</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{campaign.clickCount}</div>
                  <div className="text-zinc-500">Clicks</div>
                </div>
              </div>
            </Card>
          )}
        </div>

        <div className="lg:col-span-2">
          <Card className="sticky top-6">
            <h2 className="mb-4 font-semibold text-zinc-900 dark:text-zinc-50">Price</h2>
            <PriceBreakdown breakdown={breakdown} />
            <div className="mt-5">
              {campaign.paymentStatus === "UNPAID" ? (
                <PayButton campaignId={campaign.id} />
              ) : campaign.paymentStatus === "PROCESSING" ? (
                <Badge tone="warn">Payment processing…</Badge>
              ) : (
                <Badge tone="good">Paid</Badge>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="shrink-0 text-zinc-500">{label}</dt>
      <dd className="text-right text-zinc-800 dark:text-zinc-200">{value}</dd>
    </div>
  );
}
