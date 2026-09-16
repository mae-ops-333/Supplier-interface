import type { WizardState } from "@/lib/client-types";
import { Field, Input, Textarea } from "@/components/ui";

export function CreativeStep({
  state,
  update,
}: {
  state: WizardState;
  update: (patch: Partial<WizardState>) => void;
}) {
  const creative = state.creative;
  function updateCreative(patch: Partial<WizardState["creative"]>) {
    update({ creative: { ...creative, ...patch } });
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        This is the native, first-party content OnlinePlanService renders inside the plan room page — see the
        review step for how that keeps it out of reach of ad blockers.
      </p>
      <Field label="Headline">
        <Input
          value={creative.headline}
          onChange={(e) => updateCreative({ headline: e.target.value })}
          placeholder="New: Class-A fire-rated wall assemblies"
          maxLength={120}
        />
      </Field>
      <Field label="Body copy">
        <Textarea
          value={creative.body}
          onChange={(e) => updateCreative({ body: e.target.value })}
          rows={4}
          maxLength={600}
          placeholder="Spec our UL-listed assembly on your next fire-rated wall — submittal-ready cut sheets and a rep on call."
        />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Image URL" hint="Optional">
          <Input
            value={creative.imageUrl}
            onChange={(e) => updateCreative({ imageUrl: e.target.value })}
            placeholder="https://…/product-shot.jpg"
          />
        </Field>
        <Field label="Call-to-action label">
          <Input
            value={creative.ctaLabel}
            onChange={(e) => updateCreative({ ctaLabel: e.target.value })}
            placeholder="Request a spec sheet"
            maxLength={40}
          />
        </Field>
      </div>
      <Field label="Call-to-action URL">
        <Input
          value={creative.ctaUrl}
          onChange={(e) => updateCreative({ ctaUrl: e.target.value })}
          placeholder="https://acme.com/fire-rated-walls"
        />
      </Field>
    </div>
  );
}

export function isCreativeStepValid(state: WizardState): boolean {
  const c = state.creative;
  return (
    c.headline.trim().length > 0 &&
    c.body.trim().length > 0 &&
    c.ctaLabel.trim().length > 0 &&
    /^https?:\/\/.+/.test(c.ctaUrl)
  );
}
