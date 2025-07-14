import React from 'react';
import { LinearProgress, Box, Typography } from '@mui/material';

interface ProgressBarProps {
    value?: number;
    position?: 'top' | 'bottom';
}

const ProgressBar: React.FC<ProgressBarProps> = ({ value, position = 'top' }) => {
    return (
        <Box sx={{ position: 'fixed', [position]: 0, left: 0, right: 0, zIndex: 2000 }}>
            <Box sx={{ p: 0, bgcolor: 'background.paper', borderBottom: position === 'top' ? 1 : 0, borderTop: position === 'bottom' ? 1 : 0, borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 0 }}>
                    <Box sx={{ flexGrow: 1, mr: 1 }}>
                        {typeof value === 'number' ? (
                            <LinearProgress variant="determinate" value={value} />
                        ) : (
                            <LinearProgress variant="indeterminate" />
                        )}
                    </Box>
                    {typeof value === 'number' && (
                        <Typography variant="body2" color="text.secondary">
                            {Math.round(value)}%
                        </Typography>
                    )}
                </Box>
                <Typography variant="caption" color="text.secondary">
                    Processing emails...
                </Typography>
            </Box>
        </Box>
    );
};

export default ProgressBar; 