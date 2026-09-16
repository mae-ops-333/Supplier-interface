import type { ReferenceData, WizardState } from "@/lib/client-types";
import { SelectableCard } from "@/components/ui";
import {
  formatCents,
  PROJECT_SPEC_SECTION_SURCHARGE_CENTS,
  USER_SPEC_SECTION_SURCHARGE_CENTS,
} from "@/lib/pricing";
import type { TargetingMode } from "@/lib/pricing";

const MODES: { value: TargetingMode; title: string; description: string; priceNote?: string }[] = [
  {
    value: "NONE",
    title: "No spec-section targeting",
    description: "Show to everyone matching the specialties above, regardless of project spec book.",
  },
  {
    value: "PROJECT_SPEC_SECTION",
    title: "Only projects with this spec section",
    description: "Serve only on projects whose spec book includes the section(s) you pick below.",
    priceNote: `+${formatCents(PROJECT_SPEC_SECTION_SURCHARGE_CENTS)} / section / month`,
  },
  {
    value: "USER_SPEC_SECTION",
    title: "Only users responsible for this spec section",
    description: "Serve only to the specific trade contact tied to the section(s) you pick — the most precise, highest-intent targeting available.",
    priceNote: `+${formatCents(USER_SPEC_SECTION_SURCHARGE_CENTS)} / section / month`,
  },
];

export function TargetingStep({
  state,
  update,
  reference,
}: {
  state: WizardState;
  update: (patch: Partial<WizardState>) => void;
  reference: ReferenceData;
}) {
  const divisions = [...new Set(reference.specSections.map((s) => s.divisionCode))];

  function setMode(mode: TargetingMode) {
    update({ targetingMode: mode, specSectionIds: mode === "NONE" ? [] : state.specSectionIds });
  }

  function toggleSection(id: string) {
    const specSectionIds = state.specSectionIds.includes(id)
      ? state.specSectionIds.filter((s) => s !== id)
      : [...state.specSectionIds, id];
    update({ specSectionIds });
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-3">
        {MODES.map((mode) => (
          <SelectableCard key={mode.value} selected={state.targetingMode === mode.value} onClick={() => setMode(mode.value)}>
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="font-semibold text-zinc-900 dark:text-zinc-50">{mode.title}</div>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{mode.description}</p>
              </div>
              {mode.priceNote && (
                <span className="whitespace-nowrap text-xs font-medium text-amber-700 dark:text-amber-400">
                  {mode.priceNote}
                </span>
              )}
            </div>
          </SelectableCard>
        ))}
      </div>

      {state.targetingMode !== "NONE" && (
        <div>
          <h3 className="mb-3 text-sm font-medium text-zinc-800 dark:text-zinc-100">
            CSI spec sections ({state.specSectionIds.length} selected)
          </h3>
          <div className="space-y-4">
            {divisions.map((divisionCode) => {
              const sections = reference.specSections.filter((s) => s.divisionCode === divisionCode);
              return (
                <div key={divisionCode}>
                  <div className="mb-1.5 text-xs font-medium uppercase tracking-wide text-zinc-500">
                    Division {divisionCode} — {sections[0]?.divisionName}
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {sections.map((section) => {
                      const checked = state.specSectionIds.includes(section.id);
                      return (
                        <label
                          key={section.id}
                          className={`flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm ${
                            checked
                              ? "border-blue-600 bg-blue-50 dark:bg-blue-950/40"
                              : "border-zinc-200 dark:border-zinc-800"
                          }`}
                        >
                          <input type="checkbox" checked={checked} onChange={() => toggleSection(section.id)} className="h-4 w-4" />
                          <span>
                            <span className="font-mono text-xs text-zinc-500">{section.csiCode}</span>{" "}
                            {section.title}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export function isTargetingStepValid(state: WizardState): boolean {
  return state.targetingMode === "NONE" || state.specSectionIds.length > 0;
}
