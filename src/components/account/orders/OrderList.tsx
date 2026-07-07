import React from 'react';
import { Order } from '@/types';
import { OrderCard } from './OrderCard';

interface OrderListProps {
  orders: Order[];
}

export const OrderList: React.FC<OrderListProps> = ({ orders }) => {
  return (
    <div className="space-y-6">
      {orders.map((order) => (
        <OrderCard key={order.id} order={order} />
      ))}
      {/* TODO: Pagination can be introduced here */}
    </div>
  );
};
