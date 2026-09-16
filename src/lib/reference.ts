import { prisma } from "@/lib/prisma";

export async function getReferenceData() {
  const [zones, specialties, specSections] = await Promise.all([
    prisma.zone.findMany({
      orderBy: { name: "asc" },
      include: { planRooms: { orderBy: { name: "asc" } } },
    }),
    prisma.specialty.findMany({ orderBy: { name: "asc" } }),
    prisma.specSection.findMany({
      orderBy: [{ divisionCode: "asc" }, { csiCode: "asc" }],
    }),
  ]);
  return { zones, specialties, specSections };
}
