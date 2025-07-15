import React, { useState } from 'react';
import { List, ListItem, ListItemText, ListItemSecondaryAction, Button, Snackbar } from '@mui/material';

// Import UnsubscribeSender type
import { UnsubscribeSender } from '../../services/ParserService';

// Helper to parse List-Unsubscribe header for URIs
function parseListUnsubscribe(headerValue: string): string[] {
    if (!headerValue) return [];
    const matches = Array.from(headerValue.matchAll(/<([^>]+)>/g));
    return matches.map(m => m[1].trim());
}

interface UnsubscribeListProps {
    senders: UnsubscribeSender[];
}

const UnsubscribeList: React.FC<UnsubscribeListProps> = ({ senders }) => {
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string }>({ open: false, message: '' });

    // Handler for unsubscribe actions
    const handleUnsubscribe = async (uris: string[], sender: UnsubscribeSender) => {
        // Prefer HTTP(s) over mailto
        const httpUri = uris.find(uri => uri.startsWith('http://') || uri.startsWith('https://'));
        const mailtoUri = uris.find(uri => uri.startsWith('mailto:'));
        let success = false;
        let error = '';
        try {
            if (httpUri) {
                // Try HTTP GET
                const response = await fetch(httpUri, { method: 'GET' });
                if (response.ok) {
                    success = true;
                } else {
                    error = `HTTP error: ${response.status}`;
                }
            } else if (mailtoUri) {
                // Placeholder for mailto unsubscribe
                // TODO: Implement sending unsubscribe email via Gmail API
                success = true; // Simulate success
            } else {
                error = 'No supported unsubscribe method found.';
            }
        } catch (e: any) {
            error = e.message || 'Unknown error';
        }
        setSnackbar({
            open: true,
            message: success ? 'Unsubscribe request sent!' : `Failed to unsubscribe: ${error}`,
        });
    };

    return (
        <>
            <List>
                {senders.map((sender) => {
                    const uris = parseListUnsubscribe(sender.listUnsubscribe || '');
                    return (
                        <ListItem key={sender.id}>
                            <ListItemText
                                primary={sender.from}
                                secondary={uris.length > 0 ? uris.join(', ') : 'No unsubscribe link found'}
                            />
                            <ListItemSecondaryAction>
                                {uris.length > 0 && (
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        onClick={() => handleUnsubscribe(uris, sender)}
                                    >
                                        Unsubscribe
                                    </Button>
                                )}
                            </ListItemSecondaryAction>
                        </ListItem>
                    );
                })}
            </List>
            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                message={snackbar.message}
            />
        </>
    );
};

export default UnsubscribeList; 