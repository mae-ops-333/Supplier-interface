import { formatCents, type PricingBreakdown } from "@/lib/pricing";
import { Badge } from "@/components/ui";

interface Inventory {
  utilization: number;
  soldOut: boolean;
}

export function PriceBreakdown({
  breakdown,
  inventory,
}: {
  breakdown: PricingBreakdown;
  inventory?: Inventory;
}) {
  const rows: { label: string; value: number; muted?: boolean }[] = [
    { label: "Base rate", value: breakdown.basePriceCents },
  ];
  if (breakdown.specialtySurchargeCents > 0) {
    rows.push({ label: "Additional specialties", value: breakdown.specialtySurchargeCents });
  }
  if (breakdown.durationDiscountCents > 0) {
    rows.push({ label: "Duration discount", value: -breakdown.durationDiscountCents });
  }
  if (breakdown.targetingSurchargeCents > 0) {
    rows.push({ label: "Spec-section targeting", value: breakdown.targetingSurchargeCents });
  }
  if (breakdown.surgeAdjustmentCents > 0) {
    rows.push({ label: `Demand surge (${breakdown.surgeMultiplier.toFixed(2)}x)`, value: breakdown.surgeAdjustmentCents });
  }
  if (breakdown.minimumSpendAdjustmentCents > 0) {
    rows.push({ label: "Minimum spend adjustment", value: breakdown.minimumSpendAdjustmentCents });
  }

  return (
    <div>
      {inventory && inventory.utilization > 0 && (
        <div className="mb-3">
          {inventory.soldOut ? (
            <Badge tone="bad">Sold out for these dates</Badge>
          ) : breakdown.surgeMultiplier > 1 ? (
            <Badge tone="warn">
              High demand — {Math.round(inventory.utilization * 100)}% of slots booked, {breakdown.surgeMultiplier.toFixed(2)}x surge applied
            </Badge>
          ) : (
            <Badge tone="good">Slots available</Badge>
          )}
        </div>
      )}
      <dl className="space-y-2 text-sm">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between">
            <dt className={row.muted ? "text-zinc-500" : "text-zinc-600 dark:text-zinc-400"}>{row.label}</dt>
            <dd className={row.value < 0 ? "text-emerald-600" : "text-zinc-900 dark:text-zinc-100"}>
              {row.value < 0 ? "-" : ""}
              {formatCents(Math.abs(row.value))}
            </dd>
          </div>
        ))}
      </dl>
      <div className="mt-4 flex items-center justify-between border-t border-zinc-200 pt-4 dark:border-zinc-800">
        <span className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Total</span>
        <span className="text-xl font-bold text-zinc-900 dark:text-zinc-50">{formatCents(breakdown.totalCents)}</span>
      </div>
      <p className="mt-1 text-xs text-zinc-500">
        {breakdown.months.toFixed(2)} month{breakdown.months === 1 ? "" : "s"} · {formatCents(breakdown.effectiveMonthlyRateCents)}/mo effective
        {breakdown.ratePerPlanRoomCents ? ` · ${formatCents(breakdown.ratePerPlanRoomCents)}/plan room/mo` : ""}
      </p>
    </div>
  );
}
