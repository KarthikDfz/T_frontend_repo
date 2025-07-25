
import React from 'react';

interface BrandLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ 
  className = "", 
  size = 'md' 
}) => {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16'
  };

  return (
    <div className={`${sizeClasses[size]} ${className}`}>
      <img 
        src="/lovable-uploads/5e80d876-2fd7-45b1-b83e-f943d53a9209.png" 
        alt="Brand Logo" 
        className="w-full h-full object-contain"
      />
    </div>
  );
};
