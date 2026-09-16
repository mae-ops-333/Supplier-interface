import type { WizardState } from "@/lib/client-types";
import { Field, Input, SelectableCard } from "@/components/ui";
import { MIN_CAMPAIGN_DAYS } from "@/lib/pricing";

const DURATION_PRESETS = [
  { label: "1 month", days: 30 },
  { label: "3 months", days: 90, badge: "10% off" },
  { label: "6 months", days: 180, badge: "20% off" },
  { label: "12 months", days: 360, badge: "30% off" },
];

function addDays(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function TimelineStep({
  state,
  update,
}: {
  state: WizardState;
  update: (patch: Partial<WizardState>) => void;
}) {
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Start date">
          <Input
            type="date"
            min={today}
            value={state.startDate}
            onChange={(e) => update({ startDate: e.target.value })}
          />
        </Field>
        <Field label="End date" hint={`Minimum ${MIN_CAMPAIGN_DAYS}-day run.`}>
          <Input
            type="date"
            min={state.startDate ? addDays(state.startDate, MIN_CAMPAIGN_DAYS) : today}
            value={state.endDate}
            onChange={(e) => update({ endDate: e.target.value })}
          />
        </Field>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-medium text-zinc-800 dark:text-zinc-100">Or pick a package</h3>
        <div className="grid gap-3 sm:grid-cols-4">
          {DURATION_PRESETS.map((preset) => (
            <SelectableCard
              key={preset.label}
              selected={
                !!state.startDate &&
                !!state.endDate &&
                addDays(state.startDate, preset.days) === state.endDate
              }
              onClick={() => {
                const start = state.startDate || today;
                update({ startDate: start, endDate: addDays(start, preset.days) });
              }}
            >
              <div className="font-semibold text-zinc-900 dark:text-zinc-50">{preset.label}</div>
              {preset.badge && <div className="mt-1 text-xs text-emerald-600">{preset.badge}</div>}
            </SelectableCard>
          ))}
        </div>
      </div>
    </div>
  );
}

export function isTimelineStepValid(state: WizardState): boolean {
  if (!state.startDate || !state.endDate) return false;
  const days = (new Date(state.endDate).getTime() - new Date(state.startDate).getTime()) / 86_400_000;
  return days >= MIN_CAMPAIGN_DAYS;
}
