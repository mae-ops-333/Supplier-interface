// Shapes returned by the JSON API, used by client components. Kept separate
// from the Prisma models (which include Date objects, not JSON-safe).
import type { CoverageScope, TargetingMode } from "@/lib/pricing";

export interface ReferencePlanRoom {
  id: string;
  opsPlanRoomId: string;
  name: string;
  city: string;
  state: string;
  monthlyActiveGCs: number;
  zoneId: string;
}

export interface ReferenceZone {
  id: string;
  opsZoneId: string;
  code: string;
  name: string;
  region: string;
  planRooms: ReferencePlanRoom[];
}

export interface ReferenceSpecialty {
  id: string;
  code: string;
  name: string;
}

export interface ReferenceSpecSection {
  id: string;
  csiCode: string;
  divisionCode: string;
  divisionName: string;
  title: string;
}

export interface ReferenceData {
  zones: ReferenceZone[];
  specialties: ReferenceSpecialty[];
  specSections: ReferenceSpecSection[];
}

export interface WizardCreative {
  headline: string;
  body: string;
  imageUrl: string;
  ctaLabel: string;
  ctaUrl: string;
}

export interface WizardState {
  advertiser: {
    email: string;
    companyName: string;
    contactName: string;
  };
  name: string;
  scope: CoverageScope;
  zoneIds: string[];
  planRoomIds: string[];
  startDate: string;
  endDate: string;
  specialtyIds: string[];
  targetingMode: TargetingMode;
  specSectionIds: string[];
  creative: WizardCreative;
}

export const EMPTY_WIZARD_STATE: WizardState = {
  advertiser: { email: "", companyName: "", contactName: "" },
  name: "",
  scope: "SELECTED_PLAN_ROOMS",
  zoneIds: [],
  planRoomIds: [],
  startDate: "",
  endDate: "",
  specialtyIds: [],
  targetingMode: "NONE",
  specSectionIds: [],
  creative: { headline: "", body: "", imageUrl: "", ctaLabel: "Learn more", ctaUrl: "" },
};
