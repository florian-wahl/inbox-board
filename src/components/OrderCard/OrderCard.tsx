import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';
import { Order } from '../../types/order';

interface OrderCardProps {
    order: Order;
}

const OrderCard: React.FC<OrderCardProps> = ({ order }) => {
    return (
        <Card>
            <CardContent>
                <Typography variant="h6">{order.merchant}</Typography>
                <Typography variant="body2" color="text.secondary">
                    Order #{order.orderNumber}
                </Typography>
                <Box mt={1}>
                    <Typography variant="body1">
                        ${order.amount} {order.currency}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        {order.date} - {order.status}
                    </Typography>
                </Box>
            </CardContent>
        </Card>
    );
};

export default OrderCard; 