# OnlinePlanService Supplier Interface

A supplier/manufacturer-facing marketplace for buying targeted, **unblockable**
ad placements ("value-added information spaces") inside OnlinePlanService
plan rooms.

Advertisers pick a coverage zone (or nationwide), a timeline, target
specialties, and — the intricate part — can restrict a placement to only
projects whose spec book includes a given CSI section, or to only the
users responsible for that section, with the price adjusting live as they
narrow the audience. Checkout runs through a real payment portal (Stripe).

## Stack

- **Next.js 15** (App Router) + TypeScript + Tailwind CSS 4
- **Prisma 6** + Postgres (a free instance from [neon.tech](https://neon.tech)
  works well for both local dev and a small production deployment)
- **Stripe** Checkout for payment
- **Zod** for request validation
- **Vitest** for the pricing engine's unit tests

## Getting started

1. Create a free Postgres database (e.g. at [neon.tech](https://neon.tech))
   and copy its connection string.
2. ```bash
   npm install
   cp .env.example .env
   # paste your connection string into DATABASE_URL in .env
   npm run db:push    # creates the tables
   npm run db:seed    # loads zones, plan rooms, specialties, CSI spec sections
   npm run dev        # http://localhost:3000
   ```

With `DEV_FAKE_PAYMENTS=true` (the `.env.example` default) and no Stripe
keys set, checkout completes instantly without calling Stripe, so the whole
wizard is clickable out of the box. Set `STRIPE_SECRET_KEY` /
`STRIPE_WEBHOOK_SECRET` (test keys from the Stripe dashboard) and flip
`DEV_FAKE_PAYMENTS=false` to exercise real Checkout sessions; point a
`stripe listen --forward-to localhost:3000/api/webhooks/stripe` at it to
receive the webhook locally.

```bash
npm test        # pricing engine unit tests (vitest)
npm run lint
npm run build
```

## How a placement is built (`/campaigns/new`)

1. **Coverage scope** — nationwide (every plan room) or hand-picked
   individual plan rooms, grouped by zone.
2. **Timeline** — start/end date or a duration package (1/3/6/12 months);
   longer commitments get a duration discount.
3. **Specialties** — which trades should see it; the first is included in
   the base rate, extra ones add reach (and cost, capped).
4. **Spec-section targeting** — the advanced part:
   - **None** — no restriction beyond specialty.
   - **Project spec section** — only serve on projects whose spec book
     includes the selected CSI section(s).
   - **User spec section** — only serve to the specific person responsible
     for that CSI section — more precise, and priced higher, than
     project-level targeting.
5. **Creative** — headline, body, image, CTA.
6. **Review & pay** — a live price breakdown (recalculated server-side on
   every change via `POST /api/pricing/calculate`) and a Stripe-backed
   payment portal.

The server never trusts a client-submitted price: `POST /api/campaigns`
recomputes it from the same pricing engine before saving.

## Pricing model (`src/lib/pricing.ts`)

| Component | Rule |
|---|---|
| Base rate | $450 / plan room / month, or $6,000 / month flat nationwide |
| Specialties | First included; each extra adds 8% of base, capped at +80% |
| Duration discount | 10% at 3+ months, 20% at 6+, 30% at 12+ |
| Spec-section targeting | +$75/section/month (project-level) or +$150/section/month (user-level) |
| Minimum spend | Floors the total at $300/month so heavily-narrowed short runs still cover cost |

### Demand-based surge pricing

Each plan room only sells a handful of concurrent placements
(`SLOTS_PER_PLAN_ROOM = 3` in `src/lib/inventory.ts`; nationwide has its own
pool of 5) — capacity is capped on purpose so the feature stays a premium,
non-cluttering placement instead of banner-ad clutter. That scarcity is
what both **Google Ads'** live auction and **Uber's** surge pricing react
to, just through different mechanisms: Google runs a real-time
per-impression auction where cost rises with advertiser competition for
the same audience (Ad Rank), while Uber applies a demand/supply multiplier
to the base fare. A live per-impression auction doesn't fit an upfront
"buy a placement" checkout, so this app borrows Uber's shape instead: a
stepped multiplier driven by how full the requested inventory already is
for the requested dates (`SURGE_TIERS` — 1.15x at 50% booked, 1.35x at
75%, 1.75x at 90%, 2.25x for the last open slot), applied on top of the
rate-card subtotal and shown to the advertiser before they pay. When
several paid placements qualify for the same impression, the
highest-spend one wins (`src/app/api/placements/serve/route.ts`) — the
same "more competition raises priority" idea Google's auction ranks on,
just settled at booking time. Booking is blocked outright once a plan
room's slots are full for the requested dates (`SoldOutError`).

## Why the placement can't be ad-blocked

Conventional web ads get blocked because the browser loads them from a
third-party script or iframe domain that blocklists (uBlock, AdGuard, …)
recognize and strip client-side. `GET /api/placements/serve` is designed
to never be called by a visitor's browser at all: OnlinePlanService's own
backend calls it server-to-server while rendering a plan room page, then
stitches the returned creative into that page's first-party HTML before it
reaches the visitor. The click endpoint (`/api/placements/click`) is a
same-origin (or OPS-proxied) redirect for the same reason. From the
browser's point of view, the sponsored content is indistinguishable from
OPS's own native markup — there's no ad-network request for a blocker to
catch.

## OnlinePlanService integration (`src/lib/ops/`)

`OnlinePlanServiceClient` is the interface the rest of the app talks to.
Two implementations:

- `MockOnlinePlanServiceClient` (default, `OPS_API_MODE=mock`) — serves the
  same seed dataset used by `prisma/seed.ts`, so the app runs standalone
  with no external credentials.
- `OpsHttpClient` (`OPS_API_MODE=live`) — calls the real API at
  `OPS_API_BASE_URL` with `OPS_API_KEY`. The request paths/payloads are a
  best-guess contract based on this app's needs; confirm them against
  OnlinePlanService's actual API docs before flipping the switch — nothing
  else in the app depends on the internals, only on the
  `OnlinePlanServiceClient` interface.

`POST /api/ops/sync` pulls zones/plan rooms/specialties/spec sections from
whichever client is active into the local DB (run on a schedule in
production).

## Data model

See `prisma/schema.prisma`. Reference data (`Zone`, `PlanRoom`,
`Specialty`, `SpecSection`) is synced from OPS. A `Campaign` holds the
wizard's selections, a server-computed price snapshot, payment state, and
join tables for its zones/plan rooms/specialties/spec sections. `Payment`
records each Stripe transaction; `AdCreative` holds the actual ad content.

## Known tooling caveats

- `npm audit` reports a handful of high-severity advisories. All of them
  are in build-time-only tooling — `postcss` bundled inside Next's dev
  server, and `mysql2`/`deepmerge-ts` bundled inside Prisma's CLI for a
  MySQL driver this project doesn't use (it's Postgres-only) — not in code
  that ships or runs in the deployed app.
- Prisma's `latest` npm dist-tag currently points at an 8.0.0 release
  candidate that requires a driver-adapter config rewrite; this project
  pins the last stable 6.x release instead.
