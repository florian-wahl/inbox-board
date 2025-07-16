import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import Alert from '@mui/material/Alert';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import RadioGroup from '@mui/material/RadioGroup';
import Radio from '@mui/material/Radio';
import { purgeDatabase, getUserPreferences, setUserPreferences, purgeEmailData } from '../utils/dbUtils';
import { useInboxData } from '../contexts/InboxDataContext';
import { useUI, ThemeMode } from '../contexts/UIContext';

const Settings: React.FC = () => {
    const [isPurging, setIsPurging] = useState(false);
    const [purgeMessage, setPurgeMessage] = useState<string | null>(null);
    const [isPurgingEmailData, setIsPurgingEmailData] = useState(false);
    const [purgeEmailDataMessage, setPurgeEmailDataMessage] = useState<string | null>(null);
    const { reload } = useInboxData();
    const { theme, setTheme } = useUI();

    // Configuration state
    const [batchSize, setBatchSize] = useState<number>(30);
    const [dateRange, setDateRange] = useState<number>(15);
    const [showProgressBar, setShowProgressBar] = useState<boolean>(true);

    React.useEffect(() => {
        (async () => {
            const prefs = await getUserPreferences();
            if (prefs) {
                setBatchSize(prefs.batchSize ?? 20);
                setDateRange(prefs.dateRange ?? 30);
                setShowProgressBar(prefs.settings?.showProgressBar ?? true);
            }
        })();
    }, []);

    // Save preferences to DB when changed
    React.useEffect(() => {
        setUserPreferences({ batchSize, dateRange, settings: { showProgressBar } });
    }, [batchSize, dateRange, showProgressBar]);

    const handlePurgeDatabase = async () => {
        if (window.confirm('Are you sure you want to purge all data? This will remove all emails, subscriptions, and orders. This action cannot be undone.')) {
            setIsPurging(true);
            setPurgeMessage(null);

            try {
                await purgeDatabase();
                setPurgeMessage('Database purged successfully!');
            } catch (error) {
                setPurgeMessage('Error purging database. Please try again.');
                console.error('Purge error:', error);
            } finally {
                setIsPurging(false);
            }
        }
    };

    const handlePurgeEmailData = async () => {
        if (window.confirm('Are you sure you want to purge all email data? This will remove all emails, subscriptions, and orders, but keep your login token. This action cannot be undone.')) {
            setIsPurgingEmailData(true);
            setPurgeEmailDataMessage(null);
            try {
                await purgeEmailData();
                setPurgeEmailDataMessage('Email data purged successfully!');
            } catch (error) {
                setPurgeEmailDataMessage('Error purging email data. Please try again.');
                console.error('Purge email data error:', error);
            } finally {
                setIsPurgingEmailData(false);
            }
        }
    };

    const handleReloadWithSettings = async () => {
        await reload(batchSize, dateRange, showProgressBar);
    };

    return (
        <Box>
            <Typography variant="h4" gutterBottom>
                Settings
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                <Box sx={{ width: '100%', maxWidth: 800 }}>
                    <Box sx={{ p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
                        <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                            Sync Settings
                        </Typography>
                        <TextField
                            fullWidth
                            label="Batch Size"
                            type="number"
                            margin="normal"
                            value={batchSize}
                            onChange={e => setBatchSize(Number(e.target.value))}
                            inputProps={{ min: 1, max: 100 }}
                        />
                        <TextField
                            fullWidth
                            label="Date Range (days)"
                            type="number"
                            margin="normal"
                            value={dateRange}
                            onChange={e => setDateRange(Number(e.target.value))}
                            inputProps={{ min: 1, max: 365 }}
                        />
                        <FormControlLabel
                            control={<Switch checked={showProgressBar} onChange={e => setShowProgressBar(e.target.checked)} />}
                            label="Show progress bar during email loading"
                        />
                        <Box sx={{ mt: 2 }}>
                            <Button variant="contained" color="primary" onClick={handleReloadWithSettings}>
                                Reload Emails with New Settings
                            </Button>
                        </Box>

                        <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                            Appearance
                        </Typography>
                        <FormControl component="fieldset" sx={{ mb: 2 }}>
                            <FormLabel component="legend">Theme</FormLabel>
                            <RadioGroup
                                row
                                value={theme}
                                onChange={e => setTheme(e.target.value as ThemeMode)}
                                name="theme-mode"
                            >
                                <FormControlLabel value="light" control={<Radio />} label="Light" />
                                <FormControlLabel value="dark" control={<Radio />} label="Dark" />
                                <FormControlLabel value="system" control={<Radio />} label="System" />
                            </RadioGroup>
                        </FormControl>
                    </Box>
                </Box>

                <Box sx={{ width: '100%', maxWidth: 800 }}>
                    <Box sx={{ p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
                        <Typography variant="h6" gutterBottom>
                            Database Management
                        </Typography>

                        <Divider sx={{ my: 2 }} />

                        <Typography variant="subtitle1" gutterBottom color="error">
                            Danger Zone
                        </Typography>

                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            This will permanently delete all stored emails, subscriptions, and orders from your device, but keep your login token.
                        </Typography>
                        <Button
                            variant="contained"
                            color="warning"
                            onClick={handlePurgeEmailData}
                            disabled={isPurgingEmailData}
                            sx={{ mb: 2 }}
                        >
                            {isPurgingEmailData ? 'Purging Email Data...' : 'Purge Email Data'}
                        </Button>
                        {purgeEmailDataMessage && (
                            <Alert
                                severity={purgeEmailDataMessage.includes('Error') ? 'error' : 'success'}
                                sx={{ mt: 2 }}
                            >
                                {purgeEmailDataMessage}
                            </Alert>
                        )}

                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            This will permanently delete all stored emails, subscriptions, orders, and login tokens from your device.
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
                    </Box>
                </Box>
            </Box>
        </Box>
    );
};

export default Settings; 