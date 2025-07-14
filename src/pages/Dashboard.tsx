import React, { useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import { useInboxData } from '../contexts/InboxDataContext';

const Dashboard: React.FC = () => {
    const { subscriptions, orders, unsubscribes, reload } = useInboxData();

    // Trigger data loading when dashboard mounts
    useEffect(() => {
        console.log('Dashboard mounted - checking for parsed data...');
        console.log('Current subscriptions:', subscriptions.length);
        console.log('Current orders:', orders.length);
    }, [subscriptions.length, orders.length]);

    return (
        <Box>
            <Typography variant="h4" gutterBottom>
                Dashboard
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                    <Box sx={{ flex: '1 1 300px', minWidth: 0 }}>
                        <Box sx={{ p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
                            <Typography variant="h6" gutterBottom>
                                Subscriptions ({subscriptions.length})
                            </Typography>
                            {subscriptions.length > 0 ? (
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                    {subscriptions.map((subscription) => (
                                        <Box key={subscription.id} sx={{ p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                                            <Typography variant="body2" fontWeight="medium">
                                                {subscription.merchant}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {subscription.plan} - ${subscription.amount}
                                            </Typography>
                                        </Box>
                                    ))}
                                </Box>
                            ) : (
                                <Typography variant="body2" color="text.secondary">
                                    No subscriptions found
                                </Typography>
                            )}
                        </Box>
                    </Box>

                    <Box sx={{ flex: '1 1 300px', minWidth: 0 }}>
                        <Box sx={{ p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
                            <Typography variant="h6" gutterBottom>
                                Recent Orders ({orders.length})
                            </Typography>
                            {orders.length > 0 ? (
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                    {orders.map((order) => (
                                        <Box key={order.id} sx={{ p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                                            <Typography variant="body2" fontWeight="medium">
                                                {order.merchant}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                ${isNaN(order.amount) || order.amount === undefined ? '0.00' : order.amount} - {new Date(order.date).toLocaleDateString()}
                                            </Typography>
                                        </Box>
                                    ))}
                                </Box>
                            ) : (
                                <Typography variant="body2" color="text.secondary">
                                    No orders found
                                </Typography>
                            )}
                        </Box>
                    </Box>
                </Box>

                <Box>
                    <Box sx={{ p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
                        <Typography variant="h6" gutterBottom>
                            Unsubscribe List ({unsubscribes.length})
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            High-noise senders will be displayed here
                        </Typography>
                    </Box>
                </Box>
            </Box>
        </Box>
    );
};

export default Dashboard; 