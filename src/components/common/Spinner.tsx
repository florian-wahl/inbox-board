import React from 'react';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';

interface SpinnerProps {
    size?: number;
    color?: 'primary' | 'secondary' | 'inherit';
}

const Spinner: React.FC<SpinnerProps> = ({ size = 40, color = 'primary' }) => {
    return (
        <Box display="flex" justifyContent="center" alignItems="center" p={2}>
            <CircularProgress size={size} color={color} />
        </Box>
    );
};

export default Spinner; 