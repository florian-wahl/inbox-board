import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import CheckIcon from '@mui/icons-material/Check';
import MailIcon from '@mui/icons-material/Mail';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import SecurityIcon from '@mui/icons-material/Security';
import NotificationsOffIcon from '@mui/icons-material/NotificationsOff';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Onboarding: React.FC = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    const handleSignIn = async () => {
        await login();
        navigate('/dashboard');
    };

    const features = [
        {
            icon: <MailIcon />,
            title: "Smart Email Analysis",
            description: "Automatically detects subscription and order emails from your inbox"
        },
        {
            icon: <ShoppingCartIcon />,
            title: "Order Tracking",
            description: "Keep track of recent purchases and delivery status"
        },
        {
            icon: <NotificationsOffIcon />,
            title: "Unsubscribe Management",
            description: "Identify high-noise senders and easily unsubscribe"
        },
        {
            icon: <SecurityIcon />,
            title: "Privacy First",
            description: "All data stays on your device - we never see your emails"
        }
    ];

    return (
        <Box sx={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row'
        }}>
            {/* Left side - App description */}
            <Box sx={{
                flex: 1,
                backgroundColor: theme.palette.primary.main,
                color: 'white',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                padding: 4,
                position: 'relative',
                overflow: 'hidden'
            }}>
                {/* Background pattern */}
                <Box sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    opacity: 0.1,
                    background: 'linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.1) 50%, transparent 70%)',
                    backgroundSize: '20px 20px'
                }} />

                <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1 }}>
                    <Typography
                        variant="h2"
                        component="h1"
                        gutterBottom
                        sx={{
                            fontWeight: 700,
                            mb: 3
                        }}
                    >
                        Inbox Board
                    </Typography>

                    <Typography
                        variant="h5"
                        sx={{
                            mb: 4,
                            opacity: 0.9,
                            fontWeight: 300
                        }}
                    >
                        Transform your inbox into an organized dashboard
                    </Typography>

                    <Typography
                        variant="body1"
                        sx={{
                            mb: 4,
                            opacity: 0.8,
                            fontSize: '1.1rem',
                            lineHeight: 1.6
                        }}
                    >
                        Stop drowning in emails. Inbox Board automatically organizes your subscription emails,
                        tracks your orders, and helps you unsubscribe from unwanted senders - all while keeping
                        your data private and secure.
                    </Typography>

                    <List sx={{ mb: 4 }}>
                        {features.map((feature, index) => (
                            <ListItem key={index} sx={{ px: 0, py: 1 }}>
                                <ListItemIcon sx={{ color: 'white', minWidth: 40 }}>
                                    {feature.icon}
                                </ListItemIcon>
                                <ListItemText
                                    primary={
                                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                            {feature.title}
                                        </Typography>
                                    }
                                    secondary={
                                        <Typography variant="body2" sx={{ opacity: 0.8 }}>
                                            {feature.description}
                                        </Typography>
                                    }
                                />
                            </ListItem>
                        ))}
                    </List>
                </Container>
            </Box>

            {/* Right side - Sign in */}
            <Box sx={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 4,
                backgroundColor: theme.palette.background.default
            }}>
                <Paper
                    elevation={0}
                    sx={{
                        padding: 4,
                        maxWidth: 400,
                        width: '100%',
                        textAlign: 'center'
                    }}
                >
                    <Typography
                        variant="h4"
                        component="h2"
                        gutterBottom
                        sx={{
                            fontWeight: 600,
                            mb: 2
                        }}
                    >
                        Get Started
                    </Typography>

                    <Typography
                        variant="body1"
                        color="text.secondary"
                        sx={{
                            mb: 4,
                            fontSize: '1.1rem'
                        }}
                    >
                        Sign in with your Google account to start organizing your inbox
                    </Typography>

                    <Button
                        variant="contained"
                        size="large"
                        onClick={handleSignIn}
                        sx={{
                            py: 1.5,
                            px: 4,
                            fontSize: '1.1rem',
                            fontWeight: 600,
                            borderRadius: 2,
                            boxShadow: 2,
                            '&:hover': {
                                boxShadow: 4
                            }
                        }}
                    >
                        Sign in with Google
                    </Button>

                    <Typography
                        variant="caption"
                        display="block"
                        sx={{
                            mt: 3,
                            color: 'text.secondary',
                            lineHeight: 1.5
                        }}
                    >
                        We only access your Gmail to analyze subscription and order emails.
                        Your data never leaves your device.
                    </Typography>
                </Paper>
            </Box>
        </Box>
    );
};

export default Onboarding; 