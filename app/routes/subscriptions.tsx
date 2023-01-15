import type { MetaFunction } from '@remix-run/node';

import { useLoaderData } from '@remix-run/react';
import { useFetcher } from '@remix-run/react';
import { Outlet } from '@remix-run/react';

import { Loader } from '~/components/loader';
import { Pricing } from '~/components/pricing/basic';
import { loader as GetLoggedInUser } from '~/routes/api/stripe/getLoggedInUser';
import { plans } from '~/types/subscription';
import { getHumanReadableTierName } from '~/types/subscription';
import { formatDistance } from 'date-fns';
import { UserWithSubscription } from '~/user.server';
import { USER_STATUS } from '~/types/user';
export const meta: MetaFunction = () => {
  return {
    title: 'Manage Subscription',
    description: 'different subscription selection',
  };
};

export const loader = GetLoggedInUser;

const Subscription = () => {
  const user = useLoaderData() as UserWithSubscription;

  const subscriptionFetcher = useFetcher();
  const billingFetcher = useFetcher();

  return (
    <>
      <Outlet />

      {user.status == USER_STATUS.IN_SUBSCRIPTION ? (
        <div className="flex flex-col justify-center items-center gap-y-3 mt-3">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
            className="w-32 text-green-500"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>

          <span className="text-2xl font-bold text-black">
            You are currently subscribed to{' '}
            <span className="text-primary-200">
              {' '}
              {getHumanReadableTierName(
                user.subscription?.stripe_plan_id!
              )}{' '}
            </span>{' '}
            Plan.
          </span>

          {user.subscription?.ends_at && (
            <span className="text-sm text-gray-600 font-normal">
              Expires{' '}
              {formatDistance(new Date(user.subscription.ends_at), new Date(), {
                addSuffix: true,
              })}
            </span>
          )}

          <span
            className="px-4 py-1.5 text-sm  border border-gray-300 outline-none shadow-sm  rounded  bg-white hover:bg-gray-50 text-md text-gray-600 font-normal cursor-pointer"
            onClick={() => {
              billingFetcher.submit(null, {
                action: '/api/stripe/manageSubscription',
                method: 'post',
              });
            }}
          >
            Manage Subscription
            {billingFetcher.state === 'submitting' && (
              <Loader size={15} className="inline" />
            )}
          </span>
        </div>
      ) : (
        <>
          <h1 className="text-5xl mt-20 font-bold tracking-tight text-gray-900 sm:text-center">
            Subscription Plans
          </h1>
          <p className="mt-5 text-xl text-gray-500 sm:text-center">
            Start 7 days free trial, then select a plan to enjoy further.
          </p>
          <div className="flex gap-x-2 max-w-lg m-auto mt-10">
            {plans.map((t) => {
              return (
                <Pricing
                  key={t.name}
                  name={t.name}
                  loading={
                    subscriptionFetcher.state === 'submitting' &&
                    t.priceId ===
                      subscriptionFetcher.submission?.formData?.get('priceId')
                  }
                  onClick={() => {
                    subscriptionFetcher.submit(
                      { plan: t.tier },
                      {
                        action: '/api/stripe/checkout',
                        method: 'post',
                      }
                    );
                  }}
                  price={t.price}
                />
              );
            })}
          </div>
        </>
      )}
    </>
  );
};

export default Subscription;
