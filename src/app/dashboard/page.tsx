import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatCents } from "@/lib/pricing";
import { Button, Card, Input } from "@/components/ui";
import { CampaignStatusBadge, PaymentStatusBadge } from "@/components/StatusBadge";

export const metadata = { title: "Dashboard — OnlinePlanService Supplier Interface" };

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await searchParams;

  const campaigns = email
    ? await prisma.campaign.findMany({
        where: { advertiser: { email } },
        orderBy: { createdAt: "desc" },
        include: {
          creative: true,
          planRooms: { include: { planRoom: true } },
        },
      })
    : [];

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Your placements</h1>
          <p className="mt-1 text-zinc-600 dark:text-zinc-400">Look up campaigns by the email you used at checkout.</p>
        </div>
        <Link href="/campaigns/new">
          <Button>New placement</Button>
        </Link>
      </div>

      <Card className="mb-6">
        <form action="/dashboard" method="GET" className="flex flex-wrap items-end gap-3">
          <div className="min-w-[240px] flex-1">
            <label className="mb-1.5 block text-sm font-medium text-zinc-800 dark:text-zinc-100">
              Work email
            </label>
            <Input type="email" name="email" defaultValue={email ?? ""} placeholder="you@company.com" required />
          </div>
          <Button type="submit" variant="secondary">
            Look up
          </Button>
        </form>
      </Card>

      {email && campaigns.length === 0 && (
        <p className="text-sm text-zinc-500">No campaigns found for {email} yet.</p>
      )}

      <div className="space-y-3">
        {campaigns.map((c) => (
          <Link key={c.id} href={`/campaigns/${c.id}`}>
            <Card className="transition-colors hover:border-blue-400">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="font-semibold text-zinc-900 dark:text-zinc-50">{c.name}</div>
                  <p className="text-sm text-zinc-500">
                    {c.scope === "NATIONWIDE" ? "Nationwide" : `${c.planRooms.length} plan room(s)`} ·{" "}
                    {c.startDate.toISOString().slice(0, 10)} → {c.endDate.toISOString().slice(0, 10)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <CampaignStatusBadge status={c.status} />
                  <PaymentStatusBadge status={c.paymentStatus} />
                  <span className="font-semibold text-zinc-900 dark:text-zinc-50">
                    {formatCents(c.totalPriceCents)}
                  </span>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
