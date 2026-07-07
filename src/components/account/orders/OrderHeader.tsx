import React from 'react';
import { Order } from '@/types';
import { STATUS_COLORS } from '@/components/account/orders/constants';
import { formatPrice } from '@/lib/utils';

interface OrderHeaderProps {
  order: Order;
}

export const OrderHeader: React.FC<OrderHeaderProps> = ({ order }) => {
  return (
    <div className="p-4 md:p-6 border-b-2 border-brutal-black flex flex-wrap justify-between items-center gap-4">
      <div>
        <p className="font-mono text-xs uppercase text-brutal-black/60">Order Number</p>
        <p className="font-mono font-bold">{order.order_number}</p>
      </div>
      <div>
        <p className="font-mono text-xs uppercase text-brutal-black/60">Date</p>
        <p className="font-sans text-sm">
          {new Date(order.created_at).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
        </p>
      </div>
      <div>
        <p className="font-mono text-xs uppercase text-brutal-black/60">Status</p>
        <span
          className={`inline-block mt-1 font-mono text-[10px] uppercase px-2 py-0.5 ${
            STATUS_COLORS[order.status] || ''
          }`}
        >
          {order.status}
        </span>
      </div>
      <div>
        <p className="font-mono text-xs uppercase text-brutal-black/60">Total</p>
        <p className="font-mono font-bold text-accent">
          {formatPrice(order.total_amount / 100)}
        </p>
      </div>
    </div>
  );
};
