import type { WizardState } from "@/lib/client-types";
import { Field, Input, SelectableCard } from "@/components/ui";
import { formatCents, NATIONWIDE_MONTHLY_RATE_CENTS, PLAN_ROOM_MONTHLY_RATE_CENTS } from "@/lib/pricing";

export function ScopeStep({
  state,
  update,
}: {
  state: WizardState;
  update: (patch: Partial<WizardState>) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Campaign name">
          <Input
            value={state.name}
            onChange={(e) => update({ name: e.target.value })}
            placeholder="Q1 Waterproofing Push"
          />
        </Field>
        <Field label="Work email">
          <Input
            type="email"
            value={state.advertiser.email}
            onChange={(e) => update({ advertiser: { ...state.advertiser, email: e.target.value } })}
            placeholder="you@company.com"
          />
        </Field>
        <Field label="Company name">
          <Input
            value={state.advertiser.companyName}
            onChange={(e) => update({ advertiser: { ...state.advertiser, companyName: e.target.value } })}
            placeholder="Acme Building Products"
          />
        </Field>
        <Field label="Your name">
          <Input
            value={state.advertiser.contactName}
            onChange={(e) => update({ advertiser: { ...state.advertiser, contactName: e.target.value } })}
            placeholder="Jordan Rivera"
          />
        </Field>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-medium text-zinc-800 dark:text-zinc-100">Coverage</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <SelectableCard
            selected={state.scope === "SELECTED_PLAN_ROOMS"}
            onClick={() => update({ scope: "SELECTED_PLAN_ROOMS" })}
          >
            <div className="font-semibold text-zinc-900 dark:text-zinc-50">Individual plan rooms</div>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Pick exactly which plan rooms show your placement.
            </p>
            <p className="mt-2 text-sm font-medium text-zinc-800 dark:text-zinc-200">
              {formatCents(PLAN_ROOM_MONTHLY_RATE_CENTS)} / plan room / month
            </p>
          </SelectableCard>
          <SelectableCard
            selected={state.scope === "NATIONWIDE"}
            onClick={() => update({ scope: "NATIONWIDE", zoneIds: [], planRoomIds: [] })}
          >
            <div className="font-semibold text-zinc-900 dark:text-zinc-50">Nationwide</div>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Run in every OnlinePlanService plan room, everywhere.
            </p>
            <p className="mt-2 text-sm font-medium text-zinc-800 dark:text-zinc-200">
              {formatCents(NATIONWIDE_MONTHLY_RATE_CENTS)} / month flat
            </p>
          </SelectableCard>
        </div>
      </div>
    </div>
  );
}

export function isScopeStepValid(state: WizardState): boolean {
  return (
    state.name.trim().length > 0 &&
    /.+@.+\..+/.test(state.advertiser.email) &&
    state.advertiser.companyName.trim().length > 0 &&
    state.advertiser.contactName.trim().length > 0
  );
}
