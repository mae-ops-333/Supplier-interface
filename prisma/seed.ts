// Seeds the local dev database from the same mock OnlinePlanService dataset
// the mock API client serves, plus a sample advertiser account so the
// dashboard has something to show immediately after `npm run db:seed`.
import { PrismaClient } from "@prisma/client";
import {
  MOCK_PLAN_ROOMS,
  MOCK_SPECIALTIES,
  MOCK_SPEC_SECTIONS,
  MOCK_ZONES,
} from "../src/lib/ops/mock-data";

const prisma = new PrismaClient();

async function main() {
  const zoneIdByOpsId = new Map<string, string>();
  for (const zone of MOCK_ZONES) {
    const record = await prisma.zone.upsert({
      where: { opsZoneId: zone.opsZoneId },
      update: { code: zone.code, name: zone.name, region: zone.region },
      create: {
        opsZoneId: zone.opsZoneId,
        code: zone.code,
        name: zone.name,
        region: zone.region,
      },
    });
    zoneIdByOpsId.set(zone.opsZoneId, record.id);
  }

  for (const planRoom of MOCK_PLAN_ROOMS) {
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

  for (const specialty of MOCK_SPECIALTIES) {
    await prisma.specialty.upsert({
      where: { code: specialty.code },
      update: { name: specialty.name },
      create: { code: specialty.code, name: specialty.name },
    });
  }

  for (const section of MOCK_SPEC_SECTIONS) {
    await prisma.specSection.upsert({
      where: { csiCode: section.csiCode },
      update: {
        divisionCode: section.divisionCode,
        divisionName: section.divisionName,
        title: section.title,
      },
      create: {
        csiCode: section.csiCode,
        divisionCode: section.divisionCode,
        divisionName: section.divisionName,
        title: section.title,
      },
    });
  }

  await prisma.advertiser.upsert({
    where: { email: "demo@acmebuildingproducts.com" },
    update: {},
    create: {
      email: "demo@acmebuildingproducts.com",
      companyName: "Acme Building Products",
      contactName: "Jordan Rivera",
    },
  });

  console.log(
    `Seeded ${MOCK_ZONES.length} zones, ${MOCK_PLAN_ROOMS.length} plan rooms, ${MOCK_SPECIALTIES.length} specialties, ${MOCK_SPEC_SECTIONS.length} spec sections.`,
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
