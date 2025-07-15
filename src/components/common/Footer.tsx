import React from 'react';
import { Box, Typography } from '@mui/material';

// The version will be injected at build time via Vite define
const version = import.meta.env.VITE_APP_VERSION || '0.0.0';

const Footer: React.FC = () => (
    <Box component="footer" sx={{ py: 2, textAlign: 'center', mt: 'auto', color: 'text.secondary' }}>
        <Typography variant="body2">
            Version {version}
        </Typography>
    </Box>
);

export default Footer; 