import React from 'react';
import SvgIcon from '@mui/material/SvgIcon';
import { SvgIconProps } from '@mui/material/SvgIcon';

interface IconProps extends SvgIconProps {
    children: React.ReactNode;
}

const Icon: React.FC<IconProps> = ({ children, ...props }) => {
    return <SvgIcon {...props}>{children}</SvgIcon>;
};

export default Icon; 