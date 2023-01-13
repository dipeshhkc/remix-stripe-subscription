import type { ActionFunction } from "@remix-run/server-runtime";
import { redirect } from "@remix-run/server-runtime";

import { stripeCheckout } from "~/stripe.server";
import { getPriceId } from "~/types/subscription";
import { getLoggedInUser } from "~/user.server";

export const action: ActionFunction = async ({ request }) => {
  const user = await getLoggedInUser();
  if (!user) {
    return redirect("/");
  }
  const form = await request.formData();
  const priceName = form.get("priceName") as string;
  const tier = form.get("tier") as string;
  const priceId = getPriceId(priceName)!;
  const url = await stripeCheckout({
    priceId,
    tier,
    user,
  });

  return redirect(url);
};
