import { Outlet } from 'react-router';
import { UserWithSubscription } from '~/user.server';
import { loader as GetLoggedInUser } from '~/routes/api/stripe/getLoggedInUser';
import { Link, useLoaderData } from '@remix-run/react';
import { formatDistance } from 'date-fns';
import { getHumanReadableTierName } from '~/types/subscription';
import { USER_STATUS } from '~/types/user';

export const loader = GetLoggedInUser;

const getSubscriptionText = (user: UserWithSubscription) => {
  switch (user.status) {
    case USER_STATUS.NO_ACTIVE_SUBSCRIPTION:
      return (
        <div className=" flex items-center justify-between bg-red-200">
          <p className="font-mono text-red-700 flex items-center gap-x-2">
            You have no active subscription! Visit{' '}
            <Link to="/subscriptions" className="underline">
              subscription page{' '}
            </Link>{' '}
            and choose a plan.
          </p>
        </div>
      );
    case USER_STATUS.IS_IN_TRIAL:
      return (
        <div className=" flex items-center justify-between bg-primary-5">
          <p className="font-mono text-cyan-600 flex items-center gap-x-2">
            We hope you are enjoying your trial! [expires{' '}
            {formatDistance(new Date(user.trial_ends_at!), new Date(), {
              addSuffix: true,
            })}
            ] Visit the{' '}
            <Link to="/subscriptions" className="underline">
              subscription page{' '}
            </Link>{' '}
            to check out the available plans.
          </p>
        </div>
      );
    case USER_STATUS.IN_SUBSCRIPTION:
      return (
        <div className="flex items-center justify-between bg-primary-5">
          <p className="font-mono text-cyan-600 flex items-center gap-x-2">
            You are currently subscribed to{' '}
            <span className="text-primary-200">
              {' '}
              {getHumanReadableTierName(user.subscription?.stripe_plan_id!)}
            </span>{' '}
            Plan. Visit the{' '}
            <Link to="/subscriptions" className="underline">
              subscription page{' '}
            </Link>{' '}
            to know more about your plan.
          </p>
        </div>
      );
    default:
      return <></>;
  }
};

export default function Index() {
  const user = useLoaderData<UserWithSubscription>();
  return (
    <>
      <Outlet />
      <p className="text-xl text-gray-500 px-10 mt-20">
        Welcome <span className="font-bold">{user.email}</span>{' '}
        {getSubscriptionText(user)}
      </p>
    </>
  );
}
