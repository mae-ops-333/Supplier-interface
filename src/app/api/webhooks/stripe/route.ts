import { NextResponse } from "next/server";
import { getStripeClient } from "@/lib/stripe";
import { activateCampaign } from "@/lib/campaigns";
import type Stripe from "stripe";

// Stripe calls this server-to-server after a Checkout session completes.
// Payment confirmation must come from here, not the success_url redirect,
// since a browser redirect can't be trusted (the user could hit the URL
// without actually paying).
export async function POST(req: Request) {
  const stripe = getStripeClient();
  if (!stripe) {
    return NextResponse.json(
      { error: "Stripe is not configured on this deployment" },
      { status: 503 },
    );
  }

  const signature = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const payload = await req.text();

  let event: Stripe.Event;
  try {
    if (!signature || !webhookSecret) {
      throw new Error("Missing Stripe signature or webhook secret");
    }
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (err) {
    console.error("Stripe webhook signature verification failed", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const campaignId = session.metadata?.campaignId;
    if (campaignId) {
      await activateCampaign(campaignId, {
        stripeCheckoutSessionId: session.id,
        stripePaymentIntentId:
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : session.payment_intent?.id,
      });
    }
  }

  return NextResponse.json({ received: true });
}
