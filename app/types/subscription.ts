

export const plans = [
  {
    name: "Basic",
    tier: "basic",
    price: 5,
    priceId: "price_1MNhAzFSrpGVHE9i8tGqm0R7",
  },
  {
    name: "Pro",
    tier: "pro",
    price: 30,
    priceId: "price_1MNmnJFSrpGVHE9itLCER4dX",
  },
];


export const getPriceId = (name:string) => {
  return plans.find((t) => {return t.tier === name})?.priceId;
};

export const getTierName = (priceId:string) => {
  return plans.find((t) => {return t.priceId === priceId})?.tier;
};

export const getHumanReadableTierName = (priceId:string) => {
  return plans.find((t) => {return t.priceId === priceId})?.name;
};
