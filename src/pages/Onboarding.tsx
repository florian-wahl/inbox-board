import React from 'react';
import { Box, Typography, Paper, Button, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import { Check as CheckIcon } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const Onboarding: React.FC = () => {
    const { login } = useAuth();

    const handleSignIn = async () => {
        await login();
    };

    return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
            <Paper sx={{ p: 4, maxWidth: 500, textAlign: 'center' }}>
                <Typography variant="h4" gutterBottom>
                    Welcome to Inbox Board
                </Typography>

                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                    Manage your email subscriptions and track your orders in one place
                </Typography>

                <List sx={{ textAlign: 'left', mb: 3 }}>
                    <ListItem>
                        <ListItemIcon>
                            <CheckIcon />
                        </ListItemIcon>
                        <ListItemText primary="Automatically detect subscription emails" />
                    </ListItem>
                    <ListItem>
                        <ListItemIcon>
                            <CheckIcon />
                        </ListItemIcon>
                        <ListItemText primary="Track recent orders and purchases" />
                    </ListItem>
                    <ListItem>
                        <ListItemIcon>
                            <CheckIcon />
                        </ListItemIcon>
                        <ListItemText primary="Identify high-noise senders to unsubscribe" />
                    </ListItem>
                    <ListItem>
                        <ListItemIcon>
                            <CheckIcon />
                        </ListItemIcon>
                        <ListItemText primary="All data stays on your device - privacy first" />
                    </ListItem>
                </List>

                <Button
                    variant="contained"
                    size="large"
                    onClick={handleSignIn}
                    sx={{ mt: 2 }}
                >
                    Sign in with Google
                </Button>

                <Typography variant="caption" display="block" sx={{ mt: 2, color: 'text.secondary' }}>
                    We only access your Gmail to analyze subscription and order emails.
                    Your data never leaves your device.
                </Typography>
            </Paper>
        </Box>
    );
};

export default Onboarding; 