import React from 'react';
import { Card, CardContent, Typography, Box, Chip } from '@mui/material';
import { Order } from '../../types/order';

interface OrderCardProps {
    order: Order;
    threadCount?: number;
}

const OrderCard: React.FC<OrderCardProps> = ({ order, threadCount }) => {
    return (
        <Card>
            <CardContent>
                <Box display="flex" alignItems="center" gap={1}>
                    <Typography variant="h6">{order.merchant}</Typography>
                    {threadCount && threadCount > 1 && (
                        <Chip label={threadCount} size="small" color="default" sx={{ verticalAlign: 'middle' }} />
                    )}
                </Box>
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