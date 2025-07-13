import React from 'react';
import { List, ListItem, ListItemText, ListItemSecondaryAction, Switch } from '@mui/material';

interface UnsubscribeListProps {
    senders: string[];
}

const UnsubscribeList: React.FC<UnsubscribeListProps> = ({ senders }) => {
    return (
        <List>
            {senders.map((sender) => (
                <ListItem key={sender}>
                    <ListItemText primary={sender} />
                    <ListItemSecondaryAction>
                        <Switch />
                    </ListItemSecondaryAction>
                </ListItem>
            ))}
        </List>
    );
};

export default UnsubscribeList; 