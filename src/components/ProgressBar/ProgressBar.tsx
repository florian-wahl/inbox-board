import React from 'react';
import { LinearProgress, Box } from '@mui/material';

interface ProgressBarProps {
    position?: 'top' | 'bottom';
}

const ProgressBar: React.FC<ProgressBarProps> = ({ position = 'top' }) => {
    return (
        <Box
            sx={{
                position: 'relative',
                width: '100%',
                zIndex: 2000,
                height: '4px', // Explicit height for visibility
                backgroundColor: '#f0f0f0', // Fallback background
                WebkitTransform: 'translateZ(0)', // Safari hardware acceleration
                willChange: 'transform', // Hint for smoother rendering
            }}
        >
            <LinearProgress
                color="primary"
                sx={{
                    height: '100%',
                    '& .MuiLinearProgress-bar': {
                        backgroundColor: '#1976d2', // Ensure visible color
                        willChange: 'transform',
                    },
                }}
            />
        </Box>
    );
};

export default ProgressBar; 