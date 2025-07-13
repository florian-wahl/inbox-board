import React from 'react';
import { Button as MuiButton, ButtonProps } from '@mui/material';

interface CustomButtonProps extends ButtonProps {
    children: React.ReactNode;
}

const Button: React.FC<CustomButtonProps> = ({ children, ...props }) => {
    return <MuiButton {...props}>{children}</MuiButton>;
};

export default Button; 