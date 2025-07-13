import React from 'react';
import { LinearProgress, Box, Typography } from '@mui/material';

interface ProgressBarProps {
    value: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ value }) => {
    return (
        <Box sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1000 }}>
            <Box sx={{ p: 2, bgcolor: 'background.paper', borderTop: 1, borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Box sx={{ flexGrow: 1, mr: 1 }}>
                        <LinearProgress variant="determinate" value={value} />
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                        {Math.round(value)}%
                    </Typography>
                </Box>
                <Typography variant="caption" color="text.secondary">
                    Processing emails...
                </Typography>
            </Box>
        </Box>
    );
};

export default ProgressBar; 