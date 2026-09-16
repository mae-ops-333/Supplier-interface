import { z } from "zod";

export const coverageScopeSchema = z.enum(["NATIONWIDE", "SELECTED_PLAN_ROOMS"]);
export const targetingModeSchema = z.enum([
  "NONE",
  "PROJECT_SPEC_SECTION",
  "USER_SPEC_SECTION",
]);

export const pricingRequestSchema = z.object({
  scope: coverageScopeSchema,
  planRoomIds: z.array(z.string()).default([]),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  specialtyIds: z.array(z.string()).default([]),
  targetingMode: targetingModeSchema,
  specSectionIds: z.array(z.string()).default([]),
});

export const creativeSchema = z.object({
  headline: z.string().min(1, "Headline is required").max(120),
  body: z.string().min(1, "Body copy is required").max(600),
  imageUrl: z
    .union([z.string().url(), z.literal("")])
    .optional()
    .transform((v) => (v ? v : undefined)),
  ctaLabel: z.string().min(1, "CTA label is required").max(40),
  ctaUrl: z.string().url("CTA URL must be a valid URL"),
});

export const campaignDraftSchema = z
  .object({
    advertiser: z.object({
      email: z.string().email(),
      companyName: z.string().min(1),
      contactName: z.string().min(1),
    }),
    name: z.string().min(1).max(120),
    scope: coverageScopeSchema,
    zoneIds: z.array(z.string()).default([]),
    planRoomIds: z.array(z.string()).default([]),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    specialtyIds: z.array(z.string()).min(1, "Select at least one specialty"),
    targetingMode: targetingModeSchema,
    specSectionIds: z.array(z.string()).default([]),
    creative: creativeSchema,
  })
  .refine((data) => data.scope !== "SELECTED_PLAN_ROOMS" || data.planRoomIds.length > 0, {
    message: "Select at least one plan room, or switch to nationwide coverage.",
    path: ["planRoomIds"],
  })
  .refine((data) => data.targetingMode === "NONE" || data.specSectionIds.length > 0, {
    message: "Select at least one spec section for the chosen targeting mode.",
    path: ["specSectionIds"],
  })
  .refine((data) => data.endDate > data.startDate, {
    message: "End date must be after start date.",
    path: ["endDate"],
  });

export type CampaignDraftInput = z.infer<typeof campaignDraftSchema>;
