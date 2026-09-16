import { getReferenceData } from "@/lib/reference";
import { CampaignWizard } from "./CampaignWizard";

export const metadata = {
  title: "New placement — OnlinePlanService Supplier Interface",
};

// Reference data (zones, plan rooms, specialties, spec sections) can change
// via /api/ops/sync, so this page must not be statically cached at build time.
export const dynamic = "force-dynamic";

export default async function NewCampaignPage() {
  const reference = await getReferenceData();

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Create a plan room placement
        </h1>
        <p className="mt-1 text-zinc-600 dark:text-zinc-400">
          Buy a native, unblockable information space inside OnlinePlanService plan rooms.
        </p>
      </div>
      <CampaignWizard reference={reference} />
    </div>
  );
}
