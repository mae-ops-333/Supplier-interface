import {
  MOCK_PLAN_ROOMS,
  MOCK_SPECIALTIES,
  MOCK_SPEC_SECTIONS,
  MOCK_ZONES,
} from "./mock-data";
import type {
  OnlinePlanServiceClient,
  OpsPlacementPublishRequest,
  OpsPlacementPublishResult,
  OpsPlanRoom,
  OpsSpecSection,
  OpsSpecialty,
  OpsZone,
} from "./types";

/**
 * Standalone stand-in for the real OnlinePlanService API so this app runs
 * end to end without live credentials. Selected via OPS_API_MODE=mock
 * (the default) in src/lib/ops/index.ts.
 */
export class MockOnlinePlanServiceClient implements OnlinePlanServiceClient {
  async getZones(): Promise<OpsZone[]> {
    return MOCK_ZONES;
  }

  async getPlanRooms(opsZoneId?: string): Promise<OpsPlanRoom[]> {
    if (!opsZoneId) return MOCK_PLAN_ROOMS;
    return MOCK_PLAN_ROOMS.filter((pr) => pr.opsZoneId === opsZoneId);
  }

  async getSpecialties(): Promise<OpsSpecialty[]> {
    return MOCK_SPECIALTIES;
  }

  async getSpecSections(): Promise<OpsSpecSection[]> {
    return MOCK_SPEC_SECTIONS;
  }

  async publishPlacement(
    req: OpsPlacementPublishRequest,
  ): Promise<OpsPlacementPublishResult> {
    // A real integration would POST this to OPS and get back a placement id
    // OPS uses to fetch creative from our deliveryUrl. We just log + echo.
    console.info("[mock-ops] publishPlacement", {
      campaignId: req.campaignId,
      scope: req.scope,
      planRooms: req.opsPlanRoomIds.length,
      targetingMode: req.targetingMode,
    });
    return {
      opsPlacementId: `mock-placement-${req.campaignId}`,
      status: "LIVE",
    };
  }

  async pausePlacement(opsPlacementId: string): Promise<void> {
    console.info("[mock-ops] pausePlacement", opsPlacementId);
  }
}
