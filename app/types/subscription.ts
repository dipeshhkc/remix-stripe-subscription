

export const tiers = [
  {
    name: "Basic",
    tier: "basic",
    price: 5,
    priceId: "price_1MNhAzFSrpGVHE9i8tGqm0R7",
    priceName: "basic",
  },
  {
    name: "Pro",
    tier: "pro",
    price: 30,
    priceId: "price_1MNmnJFSrpGVHE9itLCER4dX",
    priceName: "pro",
  },
];


export const getPriceId = (name:string) => {
  return tiers.find((t) => {return t.priceName === name})?.priceId;
};

export const getTierName = (priceId:string) => {
  return tiers.find((t) => {return t.priceId === priceId})?.tier;
};

export const getHumanReadableTierName = (priceId:string) => {
  return tiers.find((t) => {return t.priceId === priceId})?.name;
};
