import type { LoaderFunction } from '@remix-run/server-runtime';
import { redirect } from '@remix-run/server-runtime';
import { getLoggedInUser } from '~/user.server';


export const loader: LoaderFunction = async () => {
  const user = await getLoggedInUser();
  if (!user) {
    return redirect('/');
  }

  return user;
};
