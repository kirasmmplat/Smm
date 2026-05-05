import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY && process.env.NODE_ENV === "production") {
  console.warn("⚠️ STRIPE_SECRET_KEY is not set — Stripe payments will be disabled");
}

export const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2026-04-22.dahlia",
      typescript: true,
    })
  : null;

export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET ?? "";
