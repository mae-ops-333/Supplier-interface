import { NextResponse } from "next/server";
import { getReferenceData } from "@/lib/reference";

// Reference data for the campaign builder wizard: zones (with their plan
// rooms), specialties, and CSI spec sections. Served from our local DB,
// which is synced from OnlinePlanService (see prisma/seed.ts and
// POST /api/ops/sync) rather than calling OPS live on every page load.
export async function GET() {
  const data = await getReferenceData();
  return NextResponse.json(data);
}
