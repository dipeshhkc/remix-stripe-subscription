import type { ActionFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import { add } from 'date-fns';
import type Stripe from 'stripe';

import { stripe } from '~/stripe.server';
import { getTierName } from '~/types/subscription';
import { db } from '~/db.server';

const handleStripeEvent = async (
  type: string,
  data: Stripe.Event.Data,
  id: string
) => {
  try {
    const isTestEvent = id === 'evt_00000000000000';

    if (isTestEvent) {
      return;
    }

    switch (type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(data.object);
        break;

      case 'customer.subscription.updated':
        await handleCustomerSubscriptionUpdated(data.object);
        break;

      case 'invoice.paid':
        await handleInvoicePaid(data.object);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(data.object);
        break;

      case 'customer.subscription.deleted':
        await handleCustomerSubscriptionDeleted(data.object);
        break;
    }

    return true;
  } catch (e) {
    console.log({ message: e });
  }
};

const handleCheckoutSessionCompleted = async (
  session: Stripe.Event.Data.Object
) => {
  const data = session as Stripe.Checkout.Session;
  const user = await db.user.findFirst({
    where: { email: data.customer_email! },
  });

  const stripeSubscriptionId = data.subscription?.toString();
  const stripeSub = await stripe.subscriptions.retrieve(stripeSubscriptionId!);
  const subItems = stripeSub.items.data;
  const subItem = subItems[0];

  const subscription = await db.subscription.create({
    data: {
      stripe_subscription_id: stripeSubscriptionId!,
      stripe_customer_id: data.customer?.toString()!,
      stripe_status: stripeSub.status,
      userId: user!.id,
      stripe_plan_id: subItem.price.id,
      stripe_plan_name: data.metadata?.tier || subItem.plan.nickname,
    },
  });

  await db.user.update({
    where: { id: user!.id },
    data: {
      subscription_id: subscription.id,
    },
  });

  console.log({
    message: `Session checkout completed`,
    user,
  });
};

const handleInvoicePaid = async (data: Stripe.Event.Data.Object) => {
  const invoice = data as Stripe.Invoice;

  const stripeSubId = invoice.subscription?.toString();
  if (
    invoice.billing_reason === 'subscription_create' ||
    invoice.billing_reason === 'subscription_update'
  ) {
    // this should already be handled with 'checkout.session.completed' or with 'customer.subscription.updated'
    return;
  }
  const subscription = await db.subscription.findFirst({
    where: {
      stripe_subscription_id: stripeSubId,
    },
  });

  await db.subscription.update({
    where: { id: subscription!.id },
    data: { ends_at: null, stripe_status: 'active' },
  });

  console.log({ message: 'Invoice paid' });
};

const handleInvoicePaymentFailed = async (data: Stripe.Event.Data.Object) => {
  const invoice = data as Stripe.Invoice;
  const stripeSub = invoice.subscription;
  const subId = typeof stripeSub === 'string' ? stripeSub : stripeSub?.id;

  const subscription = await db.subscription.findFirst({
    where: {
      stripe_subscription_id: subId,
    },
  });

  if (!subscription) {
    console.log({
      message: `Received invoice payment failed event but there is no subscription ${subId} with us`,
    });

    return;
  }
  //notify user of invoice failed
  console.log({ message: 'Invoice payment failed' });
};

const handleCustomerSubscriptionUpdated = async (
  data: Stripe.Event.Data.Object
) => {
  const stripeSub = data as Stripe.Subscription;
  const subscription = await db.subscription.findFirst({
    where: {
      stripe_subscription_id: stripeSub.id,
    },
  });

  //subscription cancellation
  if (stripeSub.cancel_at_period_end) {
    await db.subscription.update({
      where: { id: subscription!.id },
      data: {
        //Possible values are incomplete, incomplete_expired, trialing, active, past_due, canceled, or unpaid.
        stripe_status: stripeSub.status,
        ends_at: new Date(stripeSub.current_period_end * 1000),
      },
    });

    console.log({
      message: `Subscription cancelled ${subscription!.stripe_subscription_id}`,
    });
  } else {
    const newSubscriptionPlan = stripeSub.items.data[0].price;
    const newPlanId = newSubscriptionPlan.id;
    // there may be changes in plan
    if (subscription!.stripe_plan_id !== newPlanId) {
      const oldPlanName = subscription!.stripe_plan_name;

      await db.subscription.update({
        where: { id: subscription!.id },
        data: {
          stripe_plan_id: newSubscriptionPlan.id,
          stripe_plan_name:
            newSubscriptionPlan.nickname || getTierName(newSubscriptionPlan.id),
          stripe_status: stripeSub.status,
        },
      });

      console.log({
        message: `Subscription plan switched from ${oldPlanName} to ${
          newSubscriptionPlan.nickname
        } for ${subscription!.stripe_subscription_id}`,
      });
    } else {
      // plan may be renewed after cancellation
      await db.subscription.update({
        where: { id: subscription!.id },
        data: {
          ends_at: null,
        },
      });
    }
  }
};

const handleCustomerSubscriptionDeleted = async (
  data: Stripe.Event.Data.Object
) => {
  const stripeSub = data as Stripe.Subscription;
  const subscription = await db.subscription.findFirst({
    where: {
      stripe_subscription_id: stripeSub.id,
    },
  });

  await db.subscription.update({
    where: { id: subscription!.id },
    data: {
      ends_at: add(new Date(), { days: 1 }),
      stripe_status: stripeSub.status,
    },
  });

  console.log({
    message: `Subscription deleted ${subscription!.stripe_subscription_id}>`,
  });
};

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
