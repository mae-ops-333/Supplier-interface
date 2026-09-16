import Stripe from "stripe";

let cached: Stripe | null = null;

/** Returns null (not a throw) when no key is configured, so callers can
 * fall back to the dev fake-payment flow instead of crashing. */
export function getStripeClient(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  if (!cached) cached = new Stripe(key);
  return cached;
}
