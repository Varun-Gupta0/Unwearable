import React from 'react';
import { Order } from '@/types';
import { OrderHeader } from './OrderHeader';
import { OrderItem } from './OrderItem';
import { OrderSummary } from './OrderSummary';

interface OrderCardProps {
  order: Order;
}

export const OrderCard: React.FC<OrderCardProps> = ({ order }) => {
  return (
    <div
      className="border-brutal border-3 border-brutal-black bg-cream overflow-hidden"
      style={{ boxShadow: "6px 6px 0 #0A0A0A" }}
    >
      <OrderHeader order={order} />

      <div className="p-4 md:p-6 space-y-4">
        {order.items.map((item, idx) => (
          <OrderItem key={idx} item={item} />
        ))}
      </div>

      <OrderSummary order={order} />

      {order.status === "failed" && (
        <div className="bg-accent/10 p-4 border-t-2 border-brutal-black flex items-center gap-3">
          <span className="text-xl">⚠</span>
          <p className="font-sans text-xs text-accent">
            There was an issue processing your order for fulfillment. Our team is looking into it.
          </p>
        </div>
      )}
    </div>
  );
};
