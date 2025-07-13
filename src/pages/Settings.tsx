import React from 'react';
import { Box, Typography, Paper, TextField, Button, Switch, FormControlLabel } from '@mui/material';

const Settings: React.FC = () => {
    return (
        <Box>
            <Typography variant="h4" gutterBottom>
                Settings
            </Typography>

            <Paper sx={{ p: 3, maxWidth: 600 }}>
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
        </Box>
    );
};

export default Settings; 