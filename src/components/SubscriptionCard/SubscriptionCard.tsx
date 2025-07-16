import React from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import { Subscription } from '../../types/subscription';

interface SubscriptionCardProps {
    subscription: Subscription;
}

const SubscriptionCard: React.FC<SubscriptionCardProps> = ({ subscription }) => {
    return (
        <Card>
            <CardContent>
                <Typography variant="h6">{subscription.merchant}</Typography>
                <Typography variant="body2" color="text.secondary">
                    {subscription.plan}
                </Typography>
                <Box mt={1}>
                    <Typography variant="body1">
                        ${subscription.amount} {subscription.currency}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        Next billing: {subscription.nextBilling}
                    </Typography>
                </Box>
            </CardContent>
        </Card>
    );
};

export default SubscriptionCard; 