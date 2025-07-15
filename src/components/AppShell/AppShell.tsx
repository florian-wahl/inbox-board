import React from 'react';
import { useNavigate, Outlet } from 'react-router-dom';
import { Box, AppBar, Toolbar, Typography, IconButton, Drawer, List, ListItem, ListItemIcon, ListItemText, ListItemButton } from '@mui/material';
import { Menu as MenuIcon, Dashboard as DashboardIcon, Settings as SettingsIcon, Login as LoginIcon } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useUI } from '../../contexts/UIContext';
import { useInboxData } from '../../contexts/InboxDataContext';
import BottomSheet from '../BottomSheet/BottomSheet';
import ProgressBar from '../ProgressBar/ProgressBar';
import Footer from '../common/Footer';
import { getUserPreferences } from '../../utils/dbUtils';

const AppShell: React.FC = () => {
  const { isAuthenticated, logout } = useAuth();
  const { isBottomSheetOpen, bottomSheetContent, closeBottomSheet, isProgressBarVisible, progressValue } = useUI();
  const { loadingActive } = useInboxData();
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const navigate = useNavigate();
  const [showProgressBar, setShowProgressBar] = React.useState(true);

  React.useEffect(() => {
    (async () => {
      const prefs = await getUserPreferences();
      setShowProgressBar(prefs?.settings?.showProgressBar ?? true);
    })();
  }, []);

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  const handleLogout = () => {
    logout();
    setDrawerOpen(false);
    navigate('/onboarding');
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    setDrawerOpen(false);
  };

  const drawerItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
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
            <IconButton color="inherit" onClick={() => handleNavigation('/onboarding')}>
              <LoginIcon />
            </IconButton>
          )}
        </Toolbar>
      </AppBar>

      {/* Global loading bar under AppBar, no text, no extra padding */}
      {loadingActive && showProgressBar && <ProgressBar position="top" />}

      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={handleDrawerToggle}
      >
        <Box sx={{ width: 250 }} role="presentation">
          <List>
            {drawerItems.map((item) => (
              <ListItem key={item.text} disablePadding>
                <ListItemButton onClick={() => handleNavigation(item.path)}>
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItemButton>
              </ListItem>
            ))}
            {isAuthenticated && (
              <ListItem disablePadding>
                <ListItemButton onClick={handleLogout}>
                  <ListItemIcon><LoginIcon /></ListItemIcon>
                  <ListItemText primary="Logout" />
                </ListItemButton>
              </ListItem>
            )}
          </List>
        </Box>
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Outlet />
      </Box>

      <BottomSheet
        open={isBottomSheetOpen}
        onClose={closeBottomSheet}
      >
        {bottomSheetContent}
      </BottomSheet>

      <Footer />
    </Box>
  );
};

export default AppShell;
