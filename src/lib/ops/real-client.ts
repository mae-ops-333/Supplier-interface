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
 * Real HTTP client for the OnlinePlanService API. Enabled via
 * OPS_API_MODE=live. The exact paths/payloads below are our best-guess
 * contract based on this app's needs — confirm against OPS's actual API
 * docs and adjust before going live; nothing else in the app depends on
 * these internals, only on the OnlinePlanServiceClient interface.
 */
export class OpsHttpClient implements OnlinePlanServiceClient {
  private baseUrl: string;
  private apiKey: string;

  constructor(baseUrl: string, apiKey: string) {
    if (!apiKey) {
      throw new Error(
        "OPS_API_KEY is required when OPS_API_MODE=live. Set it in your environment.",
      );
    }
    this.baseUrl = baseUrl.replace(/\/+$/, "");
    this.apiKey = apiKey;
  }

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
        ...init?.headers,
      },
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(
        `OnlinePlanService API error ${res.status} ${res.statusText} for ${path}: ${body}`,
      );
    }
    return res.json() as Promise<T>;
  }

  async getZones(): Promise<OpsZone[]> {
    return this.request<OpsZone[]>("/v1/zones");
  }

  async getPlanRooms(opsZoneId?: string): Promise<OpsPlanRoom[]> {
    const qs = opsZoneId ? `?zoneId=${encodeURIComponent(opsZoneId)}` : "";
    return this.request<OpsPlanRoom[]>(`/v1/plan-rooms${qs}`);
  }

  async getSpecialties(): Promise<OpsSpecialty[]> {
    return this.request<OpsSpecialty[]>("/v1/specialties");
  }

  async getSpecSections(): Promise<OpsSpecSection[]> {
    return this.request<OpsSpecSection[]>("/v1/spec-sections");
  }

  async publishPlacement(
    req: OpsPlacementPublishRequest,
  ): Promise<OpsPlacementPublishResult> {
    return this.request<OpsPlacementPublishResult>("/v1/placements", {
      method: "POST",
      body: JSON.stringify(req),
    });
  }

  async pausePlacement(opsPlacementId: string): Promise<void> {
    await this.request<void>(
      `/v1/placements/${encodeURIComponent(opsPlacementId)}/pause`,
      { method: "POST" },
    );
  }
}
