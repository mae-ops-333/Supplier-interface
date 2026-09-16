import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStripeClient } from "@/lib/stripe";
import { activateCampaign } from "@/lib/campaigns";
import { formatCents } from "@/lib/pricing";

// POST /api/checkout — the payment portal entry point. Creates a Stripe
// Checkout session for the campaign's price snapshot. When no Stripe key is
// configured (DEV_FAKE_PAYMENTS), it activates the campaign immediately so
// the whole wizard is clickable in local dev without live keys.
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const campaignId =
    typeof body === "object" && body !== null && "campaignId" in body
      ? String((body as { campaignId: unknown }).campaignId)
      : null;
  if (!campaignId) {
    return NextResponse.json({ error: "campaignId is required" }, { status: 400 });
  }

  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    include: { creative: true },
  });
  if (!campaign) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }
  if (campaign.paymentStatus === "PAID") {
    return NextResponse.json({ error: "Campaign is already paid" }, { status: 409 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const stripe = getStripeClient();
  const useFakePayments =
    !stripe || process.env.DEV_FAKE_PAYMENTS === "true";

  if (useFakePayments) {
    const activated = await activateCampaign(campaign.id, {});
    return NextResponse.json({
      url: `${appUrl}/campaigns/${activated.id}?paid=1`,
      mode: "dev_fake_payment",
    });
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "usd",
          unit_amount: campaign.totalPriceCents,
          product_data: {
            name: `OnlinePlanService placement: ${campaign.name}`,
            description: `${formatCents(campaign.totalPriceCents)} — ${campaign.creative?.headline ?? ""}`,
          },
        },
        quantity: 1,
      },
    ],
    metadata: { campaignId: campaign.id },
    success_url: `${appUrl}/campaigns/${campaign.id}?paid=1&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/campaigns/${campaign.id}?canceled=1`,
  });

  await prisma.campaign.update({
    where: { id: campaign.id },
    data: {
      stripeCheckoutSessionId: session.id,
      paymentStatus: "PROCESSING",
    },
  });

  return NextResponse.json({ url: session.url, mode: "stripe" });
}
