import type { ReferenceData, WizardState } from "@/lib/client-types";

export function ZonesStep({
  state,
  update,
  reference,
}: {
  state: WizardState;
  update: (patch: Partial<WizardState>) => void;
  reference: ReferenceData;
}) {
  function togglePlanRoom(planRoomId: string, zoneId: string) {
    const selected = state.planRoomIds.includes(planRoomId);
    const planRoomIds = selected
      ? state.planRoomIds.filter((id) => id !== planRoomId)
      : [...state.planRoomIds, planRoomId];

    const zoneStillHasSelection = reference.zones
      .find((z) => z.id === zoneId)
      ?.planRooms.some((pr) => planRoomIds.includes(pr.id));

    const zoneIds = zoneStillHasSelection
      ? [...new Set([...state.zoneIds, zoneId])]
      : state.zoneIds.filter((id) => id !== zoneId);

    update({ planRoomIds, zoneIds });
  }

  function toggleZone(zoneId: string) {
    const zone = reference.zones.find((z) => z.id === zoneId);
    if (!zone) return;
    const zoneRoomIds = zone.planRooms.map((pr) => pr.id);
    const allSelected = zoneRoomIds.every((id) => state.planRoomIds.includes(id));

    const planRoomIds = allSelected
      ? state.planRoomIds.filter((id) => !zoneRoomIds.includes(id))
      : [...new Set([...state.planRoomIds, ...zoneRoomIds])];

    const zoneIds = allSelected
      ? state.zoneIds.filter((id) => id !== zoneId)
      : [...new Set([...state.zoneIds, zoneId])];

    update({ planRoomIds, zoneIds });
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Select the plan rooms your placement should appear in. Toggle a whole zone at once, or pick rooms individually — reach (monthly active GCs) is shown for each.
      </p>
      {reference.zones.map((zone) => {
        const zoneRoomIds = zone.planRooms.map((pr) => pr.id);
        const allSelected = zoneRoomIds.length > 0 && zoneRoomIds.every((id) => state.planRoomIds.includes(id));
        const someSelected = zoneRoomIds.some((id) => state.planRoomIds.includes(id));
        return (
          <div key={zone.id} className="rounded-lg border border-zinc-200 dark:border-zinc-800">
            <button
              type="button"
              onClick={() => toggleZone(zone.id)}
              className="flex w-full items-center justify-between gap-2 border-b border-zinc-200 bg-zinc-50 px-4 py-2.5 text-left dark:border-zinc-800 dark:bg-zinc-900"
            >
              <span className="font-medium text-zinc-900 dark:text-zinc-50">
                {zone.name} <span className="font-normal text-zinc-500">({zone.region})</span>
              </span>
              <span className="text-xs text-zinc-500">
                {allSelected ? "All selected" : someSelected ? "Some selected" : "Select all"}
              </span>
            </button>
            <div className="grid gap-2 p-3 sm:grid-cols-2">
              {zone.planRooms.map((pr) => {
                const checked = state.planRoomIds.includes(pr.id);
                return (
                  <label
                    key={pr.id}
                    className={`flex cursor-pointer items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm ${
                      checked
                        ? "border-blue-600 bg-blue-50 dark:bg-blue-950/40"
                        : "border-zinc-200 dark:border-zinc-800"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => togglePlanRoom(pr.id, zone.id)}
                        className="h-4 w-4"
                      />
                      <span>
                        {pr.name}
                        <span className="block text-xs text-zinc-500">
                          {pr.city}, {pr.state}
                        </span>
                      </span>
                    </span>
                    <span className="whitespace-nowrap text-xs text-zinc-500">
                      {pr.monthlyActiveGCs.toLocaleString()} GCs/mo
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function isZonesStepValid(state: WizardState): boolean {
  return state.scope === "NATIONWIDE" || state.planRoomIds.length > 0;
}
