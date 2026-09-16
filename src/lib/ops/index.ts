import { MockOnlinePlanServiceClient } from "./mock-client";
import { OpsHttpClient } from "./real-client";
import type { OnlinePlanServiceClient } from "./types";

export * from "./types";

let cachedClient: OnlinePlanServiceClient | null = null;

export function getOpsClient(): OnlinePlanServiceClient {
  if (cachedClient) return cachedClient;

  const mode = (process.env.OPS_API_MODE ?? "mock").toLowerCase();

  cachedClient =
    mode === "live"
      ? new OpsHttpClient(
          process.env.OPS_API_BASE_URL ?? "",
          process.env.OPS_API_KEY ?? "",
        )
      : new MockOnlinePlanServiceClient();

  return cachedClient;
}
