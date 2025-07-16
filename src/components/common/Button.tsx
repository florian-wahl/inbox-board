import React from 'react';
import MuiButton from '@mui/material/Button';
import { ButtonProps } from '@mui/material/Button';

interface CustomButtonProps extends ButtonProps {
    children: React.ReactNode;
}

const Button: React.FC<CustomButtonProps> = ({ children, ...props }) => {
    return <MuiButton {...props}>{children}</MuiButton>;
};

export default Button; 