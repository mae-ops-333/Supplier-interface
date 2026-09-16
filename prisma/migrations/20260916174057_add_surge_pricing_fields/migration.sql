-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Campaign" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "advertiserId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "scope" TEXT NOT NULL DEFAULT 'SELECTED_PLAN_ROOMS',
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "targetingMode" TEXT NOT NULL DEFAULT 'NONE',
    "basePriceCents" INTEGER NOT NULL DEFAULT 0,
    "durationDiscountCents" INTEGER NOT NULL DEFAULT 0,
    "specialtySurchargeCents" INTEGER NOT NULL DEFAULT 0,
    "targetingSurchargeCents" INTEGER NOT NULL DEFAULT 0,
    "surgeMultiplierBps" INTEGER NOT NULL DEFAULT 10000,
    "surgeAdjustmentCents" INTEGER NOT NULL DEFAULT 0,
    "totalPriceCents" INTEGER NOT NULL DEFAULT 0,
    "paymentStatus" TEXT NOT NULL DEFAULT 'UNPAID',
    "stripeCheckoutSessionId" TEXT,
    "stripePaymentIntentId" TEXT,
    "impressionCount" INTEGER NOT NULL DEFAULT 0,
    "clickCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Campaign_advertiserId_fkey" FOREIGN KEY ("advertiserId") REFERENCES "Advertiser" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Campaign" ("advertiserId", "basePriceCents", "clickCount", "createdAt", "durationDiscountCents", "endDate", "id", "impressionCount", "name", "paymentStatus", "scope", "specialtySurchargeCents", "startDate", "status", "stripeCheckoutSessionId", "stripePaymentIntentId", "targetingMode", "targetingSurchargeCents", "totalPriceCents", "updatedAt") SELECT "advertiserId", "basePriceCents", "clickCount", "createdAt", "durationDiscountCents", "endDate", "id", "impressionCount", "name", "paymentStatus", "scope", "specialtySurchargeCents", "startDate", "status", "stripeCheckoutSessionId", "stripePaymentIntentId", "targetingMode", "targetingSurchargeCents", "totalPriceCents", "updatedAt" FROM "Campaign";
DROP TABLE "Campaign";
ALTER TABLE "new_Campaign" RENAME TO "Campaign";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
