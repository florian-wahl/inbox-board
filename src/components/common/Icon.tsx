import React from 'react';
import { SvgIcon, SvgIconProps } from '@mui/material';

interface IconProps extends SvgIconProps {
    children: React.ReactNode;
}

const Icon: React.FC<IconProps> = ({ children, ...props }) => {
    return <SvgIcon {...props}>{children}</SvgIcon>;
};

export default Icon; 