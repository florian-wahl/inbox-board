import React, { useState } from 'react';
import { Box, Typography, Paper, TextField, Button, Switch, FormControlLabel, Alert, Divider } from '@mui/material';
import { purgeDatabase, getDatabaseStats, decodeExistingEmails } from '../utils/dbUtils';
import { useInboxData } from '../contexts/InboxDataContext';

const Settings: React.FC = () => {
    const [dbStats, setDbStats] = useState<{ tokens: number; rawEmails: number; parsedItems: number } | null>(null);
    const [isPurging, setIsPurging] = useState(false);
    const [purgeMessage, setPurgeMessage] = useState<string | null>(null);
    const [isDecoding, setIsDecoding] = useState(false);
    const [decodeMessage, setDecodeMessage] = useState<string | null>(null);
    const { testParsing } = useInboxData();

    const handlePurgeDatabase = async () => {
        if (window.confirm('Are you sure you want to purge all data? This will remove all emails, subscriptions, and orders. This action cannot be undone.')) {
            setIsPurging(true);
            setPurgeMessage(null);

            try {
                await purgeDatabase();
                setPurgeMessage('Database purged successfully!');
                // Refresh stats
                const stats = await getDatabaseStats();
                setDbStats(stats);
            } catch (error) {
                setPurgeMessage('Error purging database. Please try again.');
                console.error('Purge error:', error);
            } finally {
                setIsPurging(false);
            }
        }
    };

    const handleGetStats = async () => {
        try {
            const stats = await getDatabaseStats();
            setDbStats(stats);
        } catch (error) {
            console.error('Error getting stats:', error);
        }
    };

    const handleTestParsing = async () => {
        try {
            await testParsing();
        } catch (error) {
            console.error('Error testing parsing:', error);
        }
    };

    const handleDecodeExistingEmails = async () => {
        if (window.confirm('This will decode any base64 encoded email content in your database. This may take a moment. Continue?')) {
            setIsDecoding(true);
            setDecodeMessage(null);

            try {
                const result = await decodeExistingEmails();
                setDecodeMessage(`Successfully decoded ${result.updated} out of ${result.total} email records!`);
                // Refresh stats
                const stats = await getDatabaseStats();
                setDbStats(stats);
            } catch (error) {
                setDecodeMessage('Error decoding existing emails. Please try again.');
                console.error('Decode error:', error);
            } finally {
                setIsDecoding(false);
            }
        }
    };

    const handleTestNewEmailFetch = async () => {
        try {
            console.log('=== TESTING NEW EMAIL FETCH ===');

            // Get a single recent message to test
            const { gmailService } = await import('../services/GmailService');
            const messages = await gmailService.getRecentMessages(1);

            if (messages.length > 0) {
                const message = messages[0];
                const { fullBody, decodedBody, mimeType, parts } = gmailService.extractEmailContent(message.payload, message.snippet);

                console.log('Test email extraction results:', {
                    messageId: message.id,
                    fullBodyLength: fullBody?.length || 0,
                    decodedBodyLength: decodedBody?.length || 0,
                    fullBodySample: fullBody?.substring(0, 100) + '...',
                    decodedBodySample: decodedBody?.substring(0, 100) + '...',
                    fullBodyIsBase64: fullBody && /^[A-Za-z0-9+/]*={0,2}$/.test(fullBody) && fullBody.length % 4 === 0,
                    decodedBodyIsBase64: decodedBody && /^[A-Za-z0-9+/]*={0,2}$/.test(decodedBody) && decodedBody.length % 4 === 0,
                });

                setDecodeMessage(`Test completed. Check console for details. FullBody: ${fullBody?.length || 0} chars, DecodedBody: ${decodedBody?.length || 0} chars`);
            } else {
                setDecodeMessage('No recent messages found to test');
            }
        } catch (error) {
            console.error('Error testing new email fetch:', error);
            setDecodeMessage('Error testing new email fetch. Check console for details.');
        }
    };

    return (
        <Box>
            <Typography variant="h4" gutterBottom>
                Settings
            </Typography>

            <Paper sx={{ p: 3, maxWidth: 600, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                    Gmail Account
                </Typography>
                <TextField
                    fullWidth
                    label="Gmail Account"
                    margin="normal"
                    disabled
                    value="user@gmail.com"
                />

                <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                    Sync Settings
                </Typography>
                <TextField
                    fullWidth
                    label="Cache Size (MB)"
                    type="number"
                    margin="normal"
                    defaultValue={100}
                />
                <TextField
                    fullWidth
                    label="Sync Frequency (minutes)"
                    type="number"
                    margin="normal"
                    defaultValue={30}
                />

                <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                    Preferences
                </Typography>
                <FormControlLabel
                    control={<Switch defaultChecked />}
                    label="Auto-sync on startup"
                />
                <FormControlLabel
                    control={<Switch />}
                    label="Show progress bar"
                />

                <Box sx={{ mt: 3 }}>
                    <Button variant="contained" color="primary">
                        Export Data (JSON)
                    </Button>
                </Box>
            </Paper>

            <Paper sx={{ p: 3, maxWidth: 600 }}>
                <Typography variant="h6" gutterBottom>
                    Database Management
                </Typography>

                <Box sx={{ mb: 2 }}>
                    <Button
                        variant="outlined"
                        onClick={handleGetStats}
                        sx={{ mr: 2 }}
                    >
                        Get Database Stats
                    </Button>

                    <Button
                        variant="outlined"
                        onClick={handleTestParsing}
                        sx={{ mr: 2 }}
                    >
                        Test Parsing
                    </Button>

                    <Button
                        variant="outlined"
                        onClick={handleDecodeExistingEmails}
                        disabled={isDecoding}
                        sx={{ mr: 2 }}
                    >
                        {isDecoding ? 'Decoding...' : 'Decode Existing Emails'}
                    </Button>

                    <Button
                        variant="outlined"
                        onClick={handleTestNewEmailFetch}
                        sx={{ mr: 2 }}
                    >
                        Test New Email Fetch
                    </Button>

                    {dbStats && (
                        <Box sx={{ mt: 2 }}>
                            <Typography variant="body2" color="text.secondary">
                                Tokens: {dbStats.tokens} |
                                Raw Emails: {dbStats.rawEmails} |
                                Parsed Items: {dbStats.parsedItems}
                            </Typography>
                        </Box>
                    )}
                </Box>

                <Divider sx={{ my: 2 }} />

                <Typography variant="subtitle1" gutterBottom color="error">
                    Danger Zone
                </Typography>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    This will permanently delete all stored emails, subscriptions, and orders from your device.
                </Typography>

                <Button
                    variant="contained"
                    color="error"
                    onClick={handlePurgeDatabase}
                    disabled={isPurging}
                >
                    {isPurging ? 'Purging...' : 'Purge All Data'}
                </Button>

                {purgeMessage && (
                    <Alert
                        severity={purgeMessage.includes('Error') ? 'error' : 'success'}
                        sx={{ mt: 2 }}
                    >
                        {purgeMessage}
                    </Alert>
                )}

                {decodeMessage && (
                    <Alert
                        severity={decodeMessage.includes('Error') ? 'error' : 'success'}
                        sx={{ mt: 2 }}
                    >
                        {decodeMessage}
                    </Alert>
                )}
            </Paper>
        </Box>
    );
};

export default Settings; 