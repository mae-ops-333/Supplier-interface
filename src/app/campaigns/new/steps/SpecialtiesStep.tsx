import type { ReferenceData, WizardState } from "@/lib/client-types";
import { ADDITIONAL_SPECIALTY_SURCHARGE_RATE, INCLUDED_SPECIALTIES } from "@/lib/pricing";

export function SpecialtiesStep({
  state,
  update,
  reference,
}: {
  state: WizardState;
  update: (patch: Partial<WizardState>) => void;
  reference: ReferenceData;
}) {
  function toggle(id: string) {
    const specialtyIds = state.specialtyIds.includes(id)
      ? state.specialtyIds.filter((s) => s !== id)
      : [...state.specialtyIds, id];
    update({ specialtyIds });
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Which trades should see this placement? The first specialty is included in the base
        rate; each additional one broadens reach and adds {Math.round(ADDITIONAL_SPECIALTY_SURCHARGE_RATE * 100)}% to the price (capped).
      </p>
      <div className="flex flex-wrap gap-2">
        {reference.specialties.map((specialty) => {
          const selected = state.specialtyIds.includes(specialty.id);
          return (
            <button
              key={specialty.id}
              type="button"
              onClick={() => toggle(specialty.id)}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                selected
                  ? "border-blue-600 bg-blue-600 text-white"
                  : "border-zinc-300 text-zinc-700 hover:border-zinc-400 dark:border-zinc-700 dark:text-zinc-300"
              }`}
            >
              {specialty.name}
            </button>
          );
        })}
      </div>
      <p className="text-xs text-zinc-500">
        {state.specialtyIds.length} selected
        {state.specialtyIds.length > INCLUDED_SPECIALTIES
          ? ` (${state.specialtyIds.length - INCLUDED_SPECIALTIES} beyond the included specialty)`
          : ""}
      </p>
    </div>
  );
}

export function isSpecialtiesStepValid(state: WizardState): boolean {
  return state.specialtyIds.length > 0;
}
