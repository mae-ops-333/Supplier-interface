import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOpsClient } from "@/lib/ops";

// POST /api/ops/sync — pulls zones, plan rooms, specialties, and spec
// sections from OnlinePlanService (mock or live, per OPS_API_MODE) into our
// local cache. Run this on a schedule in production; prisma/seed.ts does the
// same thing once, directly from the mock dataset, for a fresh local DB.
export async function POST() {
  const ops = getOpsClient();

  const [zones, specialties, specSections] = await Promise.all([
    ops.getZones(),
    ops.getSpecialties(),
    ops.getSpecSections(),
  ]);

  const zoneIdByOpsId = new Map<string, string>();
  for (const zone of zones) {
    const record = await prisma.zone.upsert({
      where: { opsZoneId: zone.opsZoneId },
      update: { code: zone.code, name: zone.name, region: zone.region },
      create: zone,
    });
    zoneIdByOpsId.set(zone.opsZoneId, record.id);
  }

  const planRooms = await ops.getPlanRooms();
  for (const planRoom of planRooms) {
    const zoneId = zoneIdByOpsId.get(planRoom.opsZoneId);
    if (!zoneId) continue;
    await prisma.planRoom.upsert({
      where: { opsPlanRoomId: planRoom.opsPlanRoomId },
      update: {
        name: planRoom.name,
        city: planRoom.city,
        state: planRoom.state,
        monthlyActiveGCs: planRoom.monthlyActiveGCs,
        zoneId,
      },
      create: {
        opsPlanRoomId: planRoom.opsPlanRoomId,
        name: planRoom.name,
        city: planRoom.city,
        state: planRoom.state,
        monthlyActiveGCs: planRoom.monthlyActiveGCs,
        zoneId,
      },
    });
  }

  for (const specialty of specialties) {
    await prisma.specialty.upsert({
      where: { code: specialty.code },
      update: { name: specialty.name },
      create: specialty,
    });
  }

  for (const section of specSections) {
    await prisma.specSection.upsert({
      where: { csiCode: section.csiCode },
      update: {
        divisionCode: section.divisionCode,
        divisionName: section.divisionName,
        title: section.title,
      },
      create: section,
    });
  }

  return NextResponse.json({
    synced: {
      zones: zones.length,
      planRooms: planRooms.length,
      specialties: specialties.length,
      specSections: specSections.length,
    },
  });
}
