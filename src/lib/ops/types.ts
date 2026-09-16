// Shape of reference data as it comes from OnlinePlanService (OPS), plus the
// contract our app uses to push placement content back to them. These types
// are intentionally decoupled from the Prisma models: OPS is the source of
// truth, we sync a local copy for fast querying (see prisma/seed.ts).

export interface OpsZone {
  opsZoneId: string;
  code: string;
  name: string;
  region: string;
}

export interface OpsPlanRoom {
  opsPlanRoomId: string;
  opsZoneId: string;
  name: string;
  city: string;
  state: string;
  monthlyActiveGCs: number;
}

export interface OpsSpecialty {
  code: string;
  name: string;
}

export interface OpsSpecSection {
  csiCode: string;
  divisionCode: string;
  divisionName: string;
  title: string;
}

export type OpsPlacementScope = "NATIONWIDE" | "SELECTED_PLAN_ROOMS";
export type OpsTargetingMode =
  | "NONE"
  | "PROJECT_SPEC_SECTION"
  | "USER_SPEC_SECTION";

/**
 * What we hand to OnlinePlanService when a paid campaign goes live. OPS's own
 * backend uses this to serve the creative natively within plan room pages —
 * see the ad-delivery contract note in src/app/api/placements/serve/route.ts
 * for why that server-to-server handoff is what makes the placement
 * unblockable by conventional ad blockers.
 */
export interface OpsPlacementPublishRequest {
  campaignId: string;
  scope: OpsPlacementScope;
  opsZoneIds: string[]; // empty when scope is NATIONWIDE
  opsPlanRoomIds: string[]; // empty when scope is NATIONWIDE
  specialtyCodes: string[];
  targetingMode: OpsTargetingMode;
  specSectionCsiCodes: string[];
  startDate: string; // ISO date
  endDate: string; // ISO date
  creative: {
    headline: string;
    body: string;
    imageUrl?: string | null;
    ctaLabel: string;
    ctaUrl: string;
  };
  deliveryUrl: string; // our /api/placements/serve endpoint OPS calls server-side
}

export interface OpsPlacementPublishResult {
  opsPlacementId: string;
  status: "SCHEDULED" | "LIVE" | "REJECTED";
  message?: string;
}

export interface OnlinePlanServiceClient {
  getZones(): Promise<OpsZone[]>;
  getPlanRooms(opsZoneId?: string): Promise<OpsPlanRoom[]>;
  getSpecialties(): Promise<OpsSpecialty[]>;
  getSpecSections(): Promise<OpsSpecSection[]>;
  publishPlacement(
    req: OpsPlacementPublishRequest,
  ): Promise<OpsPlacementPublishResult>;
  pausePlacement(opsPlacementId: string): Promise<void>;
}
