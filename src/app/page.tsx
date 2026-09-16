import Link from "next/link";
import { Button, Card } from "@/components/ui";
import { formatCents, NATIONWIDE_MONTHLY_RATE_CENTS, PLAN_ROOM_MONTHLY_RATE_CENTS } from "@/lib/pricing";

const FEATURES = [
  {
    title: "Native, unblockable placements",
    body: "Creative is fetched server-to-server and rendered as first-party content inside the plan room page — no third-party script for an ad blocker to catch.",
  },
  {
    title: "Zone and plan-room targeting",
    body: "Go nationwide across every OnlinePlanService plan room, or hand-pick the exact plan rooms your buyers use.",
  },
  {
    title: "Spec-section precision",
    body: "Restrict a placement to projects whose spec book includes a CSI section, or to the specific users responsible for it.",
  },
  {
    title: "Demand-based pricing",
    body: "Slots are capped per plan room to stay premium, not cluttered — pricing surges with demand the way Google Ads auctions and Uber fares do.",
  },
];

export default function Home() {
  return (
    <div className="flex-1 bg-zinc-50 dark:bg-black">
      <div className="mx-auto max-w-5xl px-6 py-20">
        <p className="mb-3 text-sm font-medium uppercase tracking-wide text-blue-600">
          OnlinePlanService Supplier Interface
        </p>
        <h1 className="max-w-2xl text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Put your product in front of the trades bidding your next project
        </h1>
        <p className="mt-4 max-w-xl text-lg text-zinc-600 dark:text-zinc-400">
          Buy value-added information spaces inside OnlinePlanService plan rooms — targeted by zone,
          specialty, and spec section, and priced by real demand.
        </p>
        <div className="mt-8 flex gap-3">
          <Link href="/campaigns/new">
            <Button>Create a placement</Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="secondary">View my placements</Button>
          </Link>
        </div>

        <div className="mt-16 grid gap-4 sm:grid-cols-2">
          {FEATURES.map((f) => (
            <Card key={f.title}>
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">{f.title}</h3>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{f.body}</p>
            </Card>
          ))}
        </div>

        <Card className="mt-6">
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">Starting rates</h3>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <div>
              <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                {formatCents(PLAN_ROOM_MONTHLY_RATE_CENTS)}
              </div>
              <div className="text-sm text-zinc-500">per plan room / month</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                {formatCents(NATIONWIDE_MONTHLY_RATE_CENTS)}
              </div>
              <div className="text-sm text-zinc-500">nationwide / month flat</div>
            </div>
          </div>
          <p className="mt-3 text-xs text-zinc-500">
            Final price also reflects specialty reach, optional spec-section targeting, campaign length,
            and current demand — see the live breakdown in the campaign builder.
          </p>
        </Card>
      </div>
    </div>
  );
}
