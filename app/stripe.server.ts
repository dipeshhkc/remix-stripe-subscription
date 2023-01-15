
import Stripe from 'stripe';
import { UserWithSubscription } from './user.server';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2022-11-15',
});

export const stripeCheckout = async ({
  priceId,
  plan,
  user,
}: {
  priceId: string;
  plan: string;
  user: UserWithSubscription;
}): Promise<string> => {
  const lineItems = [
    {
      price: priceId,
      quantity: 1,
    },
  ];
  const customerData = user?.subscription?.stripe_customer_id
    ? { customer: user?.subscription?.stripe_customer_id }
    : { customer_email: user!.email };

  const session = await stripe.checkout.sessions.create({
    ...customerData,
    mode: 'subscription',
    client_reference_id: String(user!.id),
    payment_method_types: ['card', 'us_bank_account'],
    line_items: lineItems,
    success_url: `${process.env.ORIGIN}/dashboard`,
    cancel_url: `${process.env.ORIGIN}/subscriptions`,
    allow_promotion_codes: true,
    metadata: { plan },
  });

  return session.url!;
};
