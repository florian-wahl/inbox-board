import React from 'react';
import { Drawer, Box } from '@mui/material';

interface BottomSheetProps {
    open: boolean;
    onClose: () => void;
    children: React.ReactNode;
}

const BottomSheet: React.FC<BottomSheetProps> = ({ open, onClose, children }) => {
    return (
        <Drawer
            anchor="bottom"
            open={open}
            onClose={onClose}
            PaperProps={{
                sx: {
                    borderTopLeftRadius: 16,
                    borderTopRightRadius: 16,
                    maxHeight: '80vh',
                },
            }}
        >
            <Box sx={{ p: 2 }}>
                {children}
            </Box>
        </Drawer>
    );
};

export default BottomSheet; 