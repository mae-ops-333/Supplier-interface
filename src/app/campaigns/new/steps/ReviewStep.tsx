"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { ReferenceData, WizardState } from "@/lib/client-types";
import type { PricingBreakdown } from "@/lib/pricing";
import { Button, Card } from "@/components/ui";
import { PriceBreakdown } from "@/components/PriceBreakdown";

interface PricingResponse {
  breakdown: PricingBreakdown;
  inventory: { utilization: number; soldOut: boolean; capacity: number; booked: number };
}

export function ReviewStep({
  state,
  reference,
}: {
  state: WizardState;
  reference: ReferenceData;
}) {
  const router = useRouter();
  const [pricing, setPricing] = useState<PricingResponse | null>(null);
  const [pricingError, setPricingError] = useState<string | null>(null);
  const [loadingPrice, setLoadingPrice] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!state.startDate || !state.endDate) return;
    const controller = new AbortController();
    setLoadingPrice(true);
    setPricingError(null);

    const timeout = setTimeout(() => {
      fetch("/api/pricing/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          scope: state.scope,
          planRoomIds: state.planRoomIds,
          startDate: state.startDate,
          endDate: state.endDate,
          specialtyIds: state.specialtyIds,
          targetingMode: state.targetingMode,
          specSectionIds: state.specSectionIds,
        }),
      })
        .then(async (res) => {
          const json = await res.json();
          if (!res.ok) throw new Error(typeof json.error === "string" ? json.error : "Could not price this campaign");
          setPricing(json);
        })
        .catch((err) => {
          if (err.name !== "AbortError") setPricingError(err.message);
        })
        .finally(() => setLoadingPrice(false));
    }, 250);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [
    state.scope,
    state.planRoomIds,
    state.startDate,
    state.endDate,
    state.specialtyIds,
    state.targetingMode,
    state.specSectionIds,
  ]);

  const zoneNames = reference.zones
    .filter((z) => state.zoneIds.includes(z.id))
    .map((z) => z.name);
  const planRoomNames = reference.zones
    .flatMap((z) => z.planRooms)
    .filter((pr) => state.planRoomIds.includes(pr.id))
    .map((pr) => pr.name);
  const specialtyNames = reference.specialties
    .filter((s) => state.specialtyIds.includes(s.id))
    .map((s) => s.name);
  const specSectionLabels = reference.specSections
    .filter((s) => state.specSectionIds.includes(s.id))
    .map((s) => `${s.csiCode} ${s.title}`);

  async function handleSubmit() {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const createRes = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(state),
      });
      const createJson = await createRes.json();
      if (!createRes.ok) {
        throw new Error(
          typeof createJson.error === "string"
            ? createJson.error
            : "Could not create the campaign. Check your selections and try again.",
        );
      }

      const checkoutRes = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignId: createJson.campaign.id }),
      });
      const checkoutJson = await checkoutRes.json();
      if (!checkoutRes.ok) {
        throw new Error(typeof checkoutJson.error === "string" ? checkoutJson.error : "Could not start checkout");
      }

      router.push(checkoutJson.url.replace(/^https?:\/\/[^/]+/, ""));
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Something went wrong");
      setSubmitting(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <div className="space-y-4 lg:col-span-3">
        <Card>
          <h3 className="mb-3 font-semibold text-zinc-900 dark:text-zinc-50">{state.name || "Untitled campaign"}</h3>
          <dl className="space-y-2 text-sm">
            <Row label="Coverage" value={state.scope === "NATIONWIDE" ? "Nationwide" : `${planRoomNames.length} plan room(s) across ${zoneNames.length} zone(s)`} />
            {state.scope === "SELECTED_PLAN_ROOMS" && <Row label="Plan rooms" value={planRoomNames.join(", ") || "—"} />}
            <Row label="Timeline" value={`${state.startDate} → ${state.endDate}`} />
            <Row label="Specialties" value={specialtyNames.join(", ") || "—"} />
            <Row
              label="Spec-section targeting"
              value={
                state.targetingMode === "NONE"
                  ? "None"
                  : `${state.targetingMode === "PROJECT_SPEC_SECTION" ? "Project" : "User"}-level: ${specSectionLabels.join(", ")}`
              }
            />
          </dl>
        </Card>
        <Card>
          <h3 className="mb-3 font-semibold text-zinc-900 dark:text-zinc-50">Creative preview</h3>
          <div className="rounded-lg border border-dashed border-zinc-300 p-4 dark:border-zinc-700">
            <span className="mb-2 inline-block rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-zinc-500 dark:bg-zinc-800">
              Sponsored
            </span>
            <div className="font-semibold text-zinc-900 dark:text-zinc-50">{state.creative.headline || "Your headline"}</div>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{state.creative.body || "Your body copy"}</p>
            <span className="mt-2 inline-block text-sm font-medium text-blue-600">{state.creative.ctaLabel || "Call to action"} →</span>
          </div>
          <p className="mt-2 text-xs text-zinc-500">
            Rendered natively inside the plan room page by OnlinePlanService&apos;s own backend — not a third-party
            script — so standard ad blockers have nothing to block.
          </p>
        </Card>
      </div>

      <div className="lg:col-span-2">
        <Card className="sticky top-6">
          <h3 className="mb-4 font-semibold text-zinc-900 dark:text-zinc-50">Price</h3>
          {loadingPrice && !pricing && <p className="text-sm text-zinc-500">Calculating…</p>}
          {pricingError && <p className="text-sm text-red-600">{pricingError}</p>}
          {pricing && (
            <PriceBreakdown breakdown={pricing.breakdown} inventory={pricing.inventory} />
          )}
          {submitError && <p className="mt-3 text-sm text-red-600">{submitError}</p>}
          <Button
            className="mt-5 w-full"
            onClick={handleSubmit}
            disabled={!pricing || pricing.inventory.soldOut || submitting || loadingPrice}
          >
            {submitting ? "Processing…" : "Create campaign & pay"}
          </Button>
        </Card>
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
