import { Subscription, User } from '.prisma/client';
import { isBefore } from 'date-fns';
import { db } from './db.server';
import { USER_STATUS } from './types/user';

export type UserWithSubscription = User & {
  subscription: Subscription | null;
  status: USER_STATUS;
};

export async function getLoggedInUser(): Promise<UserWithSubscription> {
  const user = await db.user.findUnique({
    where: {
      id: 1,
    },
    include: {
      subscription: true,
    },
  });
  let status = USER_STATUS.IS_IN_TRIAL;
  if (!user?.subscription || user.subscription.stripe_status !== 'active') {
    //no subscription
    status = isBefore(new Date(user?.trial_ends_at!), new Date())
      ? USER_STATUS.NO_ACTIVE_SUBSCRIPTION
      : USER_STATUS.IS_IN_TRIAL;
  } else {
    status =
      user.subscription.ends_at &&
      isBefore(new Date(user.subscription.ends_at), new Date())
        ? USER_STATUS.NO_ACTIVE_SUBSCRIPTION
        : USER_STATUS.IN_SUBSCRIPTION;
  }

  const loggedInUser = user as UserWithSubscription;
  loggedInUser.status = status;

  return loggedInUser;
}
