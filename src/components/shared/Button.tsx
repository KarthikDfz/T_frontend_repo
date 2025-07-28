import React from 'react';
import { Button as UIButton, ButtonProps as UIButtonProps } from '@/components/ui/button';

type ButtonProps = UIButtonProps;

const Button: React.FC<ButtonProps> = ({ children, ...props }) => {
  return <UIButton {...props}>{children}</UIButton>;
};

export default Button; 