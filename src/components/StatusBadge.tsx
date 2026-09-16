import { Badge } from "@/components/ui";
import type { CampaignStatus, PaymentStatus } from "@prisma/client";

const STATUS_TONE: Record<CampaignStatus, "neutral" | "warn" | "good" | "bad"> = {
  DRAFT: "neutral",
  PENDING_PAYMENT: "warn",
  ACTIVE: "good",
  PAUSED: "warn",
  COMPLETED: "neutral",
  CANCELLED: "bad",
};

const PAYMENT_TONE: Record<PaymentStatus, "neutral" | "warn" | "good" | "bad"> = {
  UNPAID: "warn",
  PROCESSING: "warn",
  PAID: "good",
  FAILED: "bad",
  REFUNDED: "neutral",
};

export function CampaignStatusBadge({ status }: { status: CampaignStatus }) {
  return <Badge tone={STATUS_TONE[status]}>{status.replace("_", " ")}</Badge>;
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  return <Badge tone={PAYMENT_TONE[status]}>{status}</Badge>;
}
