import type { ActionFunction } from '@remix-run/node';
import { json } from '@remix-run/node';

import { stripe } from '~/stripe.server';
import { handleStripeEvent } from '~/routes/webhook.server';

//[credit @kiliman to get this webhook working](https://github.com/remix-run/remix/discussions/1978)
export const action: ActionFunction = async ({ request }) => {
  const payload = await request.text();
  const sig = request.headers.get('stripe-signature')!;

  try {
    const { type, data, id } = stripe.webhooks.constructEvent(
      payload,
      sig,
      process.env.STRIPE_WEBHOOK_ENDPOINT_SECRET!
    );
    handleStripeEvent(type, data, id);
  } catch (err: any) {
    throw json({ errors: [{ message: err.message }] }, 400);
  }

  return new Response(null, { status: 200 });
};
