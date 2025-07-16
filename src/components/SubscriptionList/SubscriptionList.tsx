import React from 'react';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import SubscriptionCard from '../SubscriptionCard/SubscriptionCard';
import { Subscription } from '../../types/subscription';

interface SubscriptionListProps {
    subscriptions: Subscription[];
}

const SubscriptionList: React.FC<SubscriptionListProps> = ({ subscriptions }) => {
    return (
        <List>
            {subscriptions.map((subscription) => (
                <ListItem key={subscription.id}>
                    <SubscriptionCard subscription={subscription} />
                </ListItem>
            ))}
        </List>
    );
};

export default SubscriptionList; 