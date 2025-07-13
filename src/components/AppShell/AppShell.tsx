import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Box, AppBar, Toolbar, Typography, IconButton, Drawer, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import { Menu as MenuIcon, Dashboard as DashboardIcon, Settings as SettingsIcon, Login as LoginIcon } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useUI } from '../../contexts/UIContext';
import Dashboard from '../../pages/Dashboard';
import Settings from '../../pages/Settings';
import Onboarding from '../../pages/Onboarding';
import BottomSheet from '../BottomSheet/BottomSheet';
import ProgressBar from '../ProgressBar/ProgressBar';

const AppShell: React.FC = () => {
    const { isAuthenticated, logout } = useAuth();
    const { isBottomSheetOpen, bottomSheetContent, closeBottomSheet, isProgressBarVisible, progressValue } = useUI();
    const [drawerOpen, setDrawerOpen] = React.useState(false);

    const handleDrawerToggle = () => {
        setDrawerOpen(!drawerOpen);
    };

    const handleLogout = () => {
        logout();
        setDrawerOpen(false);
    };

    const drawerItems = [
        { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
        { text: 'Settings', icon: <SettingsIcon />, path: '/settings' },
    ];

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <AppBar position="static">
                <Toolbar>
                    <IconButton
                        color="inherit"
                        aria-label="open drawer"
                        edge="start"
                        onClick={handleDrawerToggle}
                        sx={{ mr: 2 }}
                    >
                        <MenuIcon />
                    </IconButton>
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                        Inbox Board
                    </Typography>
                    {!isAuthenticated && (
                        <IconButton color="inherit">
                            <LoginIcon />
                        </IconButton>
                    )}
                </Toolbar>
            </AppBar>

            <Drawer
                anchor="left"
                open={drawerOpen}
                onClose={handleDrawerToggle}
            >
                <Box sx={{ width: 250 }} role="presentation">
                    <List>
                        {drawerItems.map((item) => (
                            <ListItem button key={item.text} onClick={handleDrawerToggle}>
                                <ListItemIcon>{item.icon}</ListItemIcon>
                                <ListItemText primary={item.text} />
                            </ListItem>
                        ))}
                        {isAuthenticated && (
                            <ListItem button onClick={handleLogout}>
                                <ListItemIcon><LoginIcon /></ListItemIcon>
                                <ListItemText primary="Logout" />
                            </ListItem>
                        )}
                    </List>
                </Box>
            </Drawer>

            <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
                <Routes>
                    <Route path="/" element={isAuthenticated ? <Dashboard /> : <Onboarding />} />
                    <Route path="/settings" element={<Settings />} />
                </Routes>
            </Box>

            {isProgressBarVisible && (
                <ProgressBar value={progressValue} />
            )}

            <BottomSheet
                open={isBottomSheetOpen}
                onClose={closeBottomSheet}
            >
                {bottomSheetContent}
            </BottomSheet>
        </Box>
    );
};

export default AppShell; 