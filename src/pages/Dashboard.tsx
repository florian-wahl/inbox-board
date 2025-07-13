import React from 'react';
import { Box, Grid, Typography } from '@mui/material';
import { useInboxData } from '../contexts/InboxDataContext';

const Dashboard: React.FC = () => {
    const { subscriptions, orders, unsubscribes } = useInboxData();

    return (
        <Box>
            <Typography variant="h4" gutterBottom>
                Dashboard
            </Typography>

            <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                    <Box sx={{ p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
                        <Typography variant="h6" gutterBottom>
                            Subscriptions ({subscriptions.length})
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Subscription cards will be displayed here
                        </Typography>
                    </Box>
                </Grid>

                <Grid item xs={12} md={6}>
                    <Box sx={{ p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
                        <Typography variant="h6" gutterBottom>
                            Recent Orders ({orders.length})
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Order cards will be displayed here
                        </Typography>
                    </Box>
                </Grid>

                <Grid item xs={12}>
                    <Box sx={{ p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
                        <Typography variant="h6" gutterBottom>
                            Unsubscribe List ({unsubscribes.length})
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            High-noise senders will be displayed here
                        </Typography>
                    </Box>
                </Grid>
            </Grid>
        </Box>
    );
};

export default Dashboard; 