"use client";

import { useMemo, useState } from "react";
import type { ReferenceData, WizardState } from "@/lib/client-types";
import { EMPTY_WIZARD_STATE } from "@/lib/client-types";
import { Button } from "@/components/ui";
import { ScopeStep, isScopeStepValid } from "./steps/ScopeStep";
import { ZonesStep, isZonesStepValid } from "./steps/ZonesStep";
import { TimelineStep, isTimelineStepValid } from "./steps/TimelineStep";
import { SpecialtiesStep, isSpecialtiesStepValid } from "./steps/SpecialtiesStep";
import { TargetingStep, isTargetingStepValid } from "./steps/TargetingStep";
import { CreativeStep, isCreativeStepValid } from "./steps/CreativeStep";
import { ReviewStep } from "./steps/ReviewStep";

type StepId = "scope" | "zones" | "timeline" | "specialties" | "targeting" | "creative" | "review";

export function CampaignWizard({ reference }: { reference: ReferenceData }) {
  const [state, setState] = useState<WizardState>(EMPTY_WIZARD_STATE);
  const [stepIndex, setStepIndex] = useState(0);

  function update(patch: Partial<WizardState>) {
    setState((prev) => ({ ...prev, ...patch }));
  }

  const steps = useMemo(() => {
    const all: { id: StepId; label: string; valid: boolean; render: () => React.ReactNode }[] = [
      { id: "scope", label: "Coverage", valid: isScopeStepValid(state), render: () => <ScopeStep state={state} update={update} /> },
      { id: "zones", label: "Plan rooms", valid: isZonesStepValid(state), render: () => <ZonesStep state={state} update={update} reference={reference} /> },
      { id: "timeline", label: "Timeline", valid: isTimelineStepValid(state), render: () => <TimelineStep state={state} update={update} /> },
      { id: "specialties", label: "Specialties", valid: isSpecialtiesStepValid(state), render: () => <SpecialtiesStep state={state} update={update} reference={reference} /> },
      { id: "targeting", label: "Targeting", valid: isTargetingStepValid(state), render: () => <TargetingStep state={state} update={update} reference={reference} /> },
      { id: "creative", label: "Creative", valid: isCreativeStepValid(state), render: () => <CreativeStep state={state} update={update} /> },
      { id: "review", label: "Review & pay", valid: true, render: () => <ReviewStep state={state} reference={reference} /> },
    ];
    return state.scope === "NATIONWIDE" ? all.filter((s) => s.id !== "zones") : all;
  }, [state, reference]);

  const current = steps[stepIndex];
  const canGoNext = current.valid && stepIndex < steps.length - 1;
  const canGoBack = stepIndex > 0;

  return (
    <div>
      <ol className="mb-8 flex flex-wrap gap-x-2 gap-y-2 text-sm">
        {steps.map((step, i) => (
          <li key={step.id} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => i < stepIndex && setStepIndex(i)}
              disabled={i > stepIndex}
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                i === stepIndex
                  ? "bg-blue-600 text-white"
                  : i < stepIndex
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                    : "bg-zinc-100 text-zinc-400 dark:bg-zinc-800"
              }`}
            >
              {i + 1}
            </button>
            <span className={i === stepIndex ? "font-medium text-zinc-900 dark:text-zinc-50" : "text-zinc-500"}>
              {step.label}
            </span>
            {i < steps.length - 1 && <span className="mx-1 text-zinc-300">/</span>}
          </li>
        ))}
      </ol>

      <div className="mb-8">{current.render()}</div>

      {current.id !== "review" && (
        <div className="flex items-center justify-between border-t border-zinc-200 pt-6 dark:border-zinc-800">
          <Button variant="secondary" onClick={() => setStepIndex((i) => i - 1)} disabled={!canGoBack}>
            Back
          </Button>
          <Button onClick={() => setStepIndex((i) => i + 1)} disabled={!canGoNext}>
            Continue
          </Button>
        </div>
      )}
      {current.id === "review" && stepIndex > 0 && (
        <div className="mt-6 border-t border-zinc-200 pt-6 dark:border-zinc-800">
          <Button variant="secondary" onClick={() => setStepIndex((i) => i - 1)}>
            Back
          </Button>
        </div>
      )}
    </div>
  );
}
