import React from 'react';
import { List, ListItem } from '@mui/material';
import OrderCard from '../OrderCard/OrderCard';
import { Order } from '../../types/order';

interface OrderListProps {
    orders: Order[];
}

const OrderList: React.FC<OrderListProps> = ({ orders }) => {
    // Filter out orders with SENT label
    const nonSentOrders = orders.filter(order => !order.labelIds?.includes('SENT'));

    // Group orders by threadId and only keep the first (oldest) order in each thread
    const threadMap = new Map<string, Order[]>();
    nonSentOrders.forEach(order => {
        if (!threadMap.has(order.threadId)) {
            threadMap.set(order.threadId, []);
        }
        threadMap.get(order.threadId)!.push(order);
    });
    // For each thread, sort by date ascending and pick the first
    const firstOrders = Array.from(threadMap.values()).map(threadOrders => {
        return threadOrders.slice().sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];
    });
    // For each order, get the thread count
    const threadCounts = Object.fromEntries(
        Array.from(threadMap.entries()).map(([threadId, orders]) => [threadId, orders.length])
    );

    return (
        <List>
            {firstOrders.map((order) => (
                <ListItem key={order.id}>
                    <OrderCard order={order} threadCount={threadCounts[order.threadId]} />
                </ListItem>
            ))}
        </List>
    );
};

export default OrderList; 