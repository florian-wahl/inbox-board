import React from 'react';
import { LinearProgress, Box } from '@mui/material';

interface ProgressBarProps {
    position?: 'top' | 'bottom';
}

const ProgressBar: React.FC<ProgressBarProps> = ({ position = 'top' }) => {
    return (
        <Box sx={{ position: 'relative', width: '100%', zIndex: 2000 }}>
            <LinearProgress color="primary" />
        </Box>
    );
};

export default ProgressBar; 