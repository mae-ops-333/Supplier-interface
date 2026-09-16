// Canonical reference dataset used by the mock OnlinePlanService client AND
// by prisma/seed.ts, so the local database and the mock API never drift
// apart. Swapping to the live client (OPS_API_MODE=live) replaces this file
// with real network calls — nothing downstream needs to change.
import type { OpsPlanRoom, OpsSpecSection, OpsSpecialty, OpsZone } from "./types";

export const MOCK_ZONES: OpsZone[] = [
  { opsZoneId: "ops-zone-ne", code: "NE", name: "Northeast", region: "Northeast" },
  { opsZoneId: "ops-zone-se", code: "SE", name: "Southeast", region: "Southeast" },
  { opsZoneId: "ops-zone-mw", code: "MW", name: "Midwest", region: "Midwest" },
  { opsZoneId: "ops-zone-sw", code: "SW", name: "Southwest", region: "Southwest" },
  { opsZoneId: "ops-zone-wc", code: "WC", name: "West Coast", region: "West" },
  { opsZoneId: "ops-zone-pnw", code: "PNW", name: "Pacific Northwest", region: "West" },
];

export const MOCK_PLAN_ROOMS: OpsPlanRoom[] = [
  { opsPlanRoomId: "ops-pr-001", opsZoneId: "ops-zone-ne", name: "Boston Metro Plan Room", city: "Boston", state: "MA", monthlyActiveGCs: 1240 },
  { opsPlanRoomId: "ops-pr-002", opsZoneId: "ops-zone-ne", name: "NYC Tri-State Plan Room", city: "New York", state: "NY", monthlyActiveGCs: 3180 },
  { opsPlanRoomId: "ops-pr-003", opsZoneId: "ops-zone-ne", name: "Philadelphia Plan Room", city: "Philadelphia", state: "PA", monthlyActiveGCs: 980 },
  { opsPlanRoomId: "ops-pr-004", opsZoneId: "ops-zone-se", name: "Atlanta Plan Room", city: "Atlanta", state: "GA", monthlyActiveGCs: 1560 },
  { opsPlanRoomId: "ops-pr-005", opsZoneId: "ops-zone-se", name: "Miami-Dade Plan Room", city: "Miami", state: "FL", monthlyActiveGCs: 1420 },
  { opsPlanRoomId: "ops-pr-006", opsZoneId: "ops-zone-se", name: "Charlotte Plan Room", city: "Charlotte", state: "NC", monthlyActiveGCs: 890 },
  { opsPlanRoomId: "ops-pr-007", opsZoneId: "ops-zone-mw", name: "Chicago Plan Room", city: "Chicago", state: "IL", monthlyActiveGCs: 2210 },
  { opsPlanRoomId: "ops-pr-008", opsZoneId: "ops-zone-mw", name: "Detroit Plan Room", city: "Detroit", state: "MI", monthlyActiveGCs: 760 },
  { opsPlanRoomId: "ops-pr-009", opsZoneId: "ops-zone-mw", name: "Minneapolis Plan Room", city: "Minneapolis", state: "MN", monthlyActiveGCs: 640 },
  { opsPlanRoomId: "ops-pr-010", opsZoneId: "ops-zone-sw", name: "Dallas-Fort Worth Plan Room", city: "Dallas", state: "TX", monthlyActiveGCs: 1980 },
  { opsPlanRoomId: "ops-pr-011", opsZoneId: "ops-zone-sw", name: "Phoenix Plan Room", city: "Phoenix", state: "AZ", monthlyActiveGCs: 1050 },
  { opsPlanRoomId: "ops-pr-012", opsZoneId: "ops-zone-sw", name: "Denver Plan Room", city: "Denver", state: "CO", monthlyActiveGCs: 930 },
  { opsPlanRoomId: "ops-pr-013", opsZoneId: "ops-zone-wc", name: "Los Angeles Plan Room", city: "Los Angeles", state: "CA", monthlyActiveGCs: 2640 },
  { opsPlanRoomId: "ops-pr-014", opsZoneId: "ops-zone-wc", name: "Bay Area Plan Room", city: "San Francisco", state: "CA", monthlyActiveGCs: 1870 },
  { opsPlanRoomId: "ops-pr-015", opsZoneId: "ops-zone-wc", name: "San Diego Plan Room", city: "San Diego", state: "CA", monthlyActiveGCs: 810 },
  { opsPlanRoomId: "ops-pr-016", opsZoneId: "ops-zone-pnw", name: "Seattle Plan Room", city: "Seattle", state: "WA", monthlyActiveGCs: 1130 },
  { opsPlanRoomId: "ops-pr-017", opsZoneId: "ops-zone-pnw", name: "Portland Plan Room", city: "Portland", state: "OR", monthlyActiveGCs: 720 },
];

export const MOCK_SPECIALTIES: OpsSpecialty[] = [
  { code: "ELEC", name: "Electrical" },
  { code: "PLUMB", name: "Plumbing" },
  { code: "HVAC", name: "HVAC" },
  { code: "ROOF", name: "Roofing" },
  { code: "CONCRETE", name: "Concrete & Masonry" },
  { code: "STEEL", name: "Structural Steel" },
  { code: "GLAZE", name: "Glazing & Curtain Wall" },
  { code: "PAINT", name: "Painting & Coatings" },
  { code: "FLOOR", name: "Flooring" },
  { code: "SITE", name: "Landscaping & Sitework" },
];

// A representative slice of CSI MasterFormat — enough divisions/sections to
// exercise the targeting UI without vendoring the full spec.
export const MOCK_SPEC_SECTIONS: OpsSpecSection[] = [
  { csiCode: "03 30 00", divisionCode: "03", divisionName: "Concrete", title: "Cast-in-Place Concrete" },
  { csiCode: "03 40 00", divisionCode: "03", divisionName: "Concrete", title: "Precast Concrete" },
  { csiCode: "07 21 00", divisionCode: "07", divisionName: "Thermal and Moisture Protection", title: "Thermal Insulation" },
  { csiCode: "07 54 00", divisionCode: "07", divisionName: "Thermal and Moisture Protection", title: "Thermoplastic Membrane Roofing" },
  { csiCode: "08 41 00", divisionCode: "08", divisionName: "Openings", title: "Entrances and Storefronts" },
  { csiCode: "08 80 00", divisionCode: "08", divisionName: "Openings", title: "Glazing" },
  { csiCode: "09 65 00", divisionCode: "09", divisionName: "Finishes", title: "Resilient Flooring" },
  { csiCode: "09 91 00", divisionCode: "09", divisionName: "Finishes", title: "Painting" },
  { csiCode: "22 10 00", divisionCode: "22", divisionName: "Plumbing", title: "Plumbing Piping" },
  { csiCode: "22 40 00", divisionCode: "22", divisionName: "Plumbing", title: "Plumbing Fixtures" },
  { csiCode: "23 05 00", divisionCode: "23", divisionName: "Heating, Ventilating, and Air Conditioning", title: "Common Work Results for HVAC" },
  { csiCode: "23 81 00", divisionCode: "23", divisionName: "Heating, Ventilating, and Air Conditioning", title: "Decentralized Unitary HVAC Equipment" },
  { csiCode: "26 05 00", divisionCode: "26", divisionName: "Electrical", title: "Common Work Results for Electrical" },
  { csiCode: "26 24 00", divisionCode: "26", divisionName: "Electrical", title: "Switchboards and Panelboards" },
];
