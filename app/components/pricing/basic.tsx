import { Card } from '../card';
import { Loader } from '../loader';

interface Pricing {
  name: string;
  price: number;
  onClick: any;
  loading: boolean;
}

export const Pricing = ({ name, price, onClick, loading }: Pricing) => {
  return (
    <Card className="px-4">
      <h2 className="text-lg font-medium leading-6 text-gray-900">{name}</h2>
      <p className="mt-4">
        <span className="text-4xl font-bold tracking-tight text-gray-900">
          ${price}
        </span>
        <span className="text-base font-medium text-gray-500">/month</span>
      </p>
      <p
        onClick={onClick}
        className="cursor-pointer mt-6 block w-full rounded-md border border-transparent bg-gradient-to-r from-orange-500 to-pink-500 py-2 text-center text-sm font-semibold text-white shadow hover:to-pink-600"
      >
        Buy {name}
        {loading && <Loader size={15} className="inline" />}
      </p>
    </Card>
  );
};
