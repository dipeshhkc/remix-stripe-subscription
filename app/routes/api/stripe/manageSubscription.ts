import type { ActionFunction } from '@remix-run/server-runtime';
import { redirect } from '@remix-run/server-runtime';

import { stripe } from '~/stripe.server';
import { getLoggedInUser } from '~/user.server';

export const action: ActionFunction = async () => {
  const user = await getLoggedInUser();
  if (!user) {
    return redirect('/');
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: user.subscription?.stripe_customer_id!,
    return_url: `${process.env.ORIGIN}/dashboard`,
  });

  return redirect(session.url);
};
