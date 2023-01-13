import type { FC, ReactNode } from "react";

interface ICard {
  className?: string;
  onClick?:any;
  children: ReactNode
}

export const Card: FC<ICard> = ({ children, className,onClick }) => {
  return (
    <div
      className={`w-full p-4 mb-4 rounded-lg shadow-md bg-gray-50 border border-gray-200 ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};
