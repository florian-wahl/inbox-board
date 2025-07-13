import React from 'react';
import { List, ListItem } from '@mui/material';
import OrderCard from '../OrderCard/OrderCard';
import { Order } from '../../types/order';

interface OrderListProps {
    orders: Order[];
}

const OrderList: React.FC<OrderListProps> = ({ orders }) => {
    return (
        <List>
            {orders.map((order) => (
                <ListItem key={order.id}>
                    <OrderCard order={order} />
                </ListItem>
            ))}
        </List>
    );
};

export default OrderList; 