import React from 'react';
import { ViewProps } from 'react-native';
import { BlurView } from 'expo-blur';

interface GlassPanelProps extends ViewProps {
  intensity?: number;
  variant?: 'primary' | 'secondary' | 'dark';
  radius?: 'lg' | 'xl' | '2xl';
  children: React.ReactNode;
  className?: string;
}

export default function GlassPanel({ 
  intensity = 30, 
  variant = 'primary', 
  radius = 'xl', 
  children, 
  className = '', 
  ...props 
}: GlassPanelProps) {
  
  const bgColors = {
    primary: 'bg-glass-primary',
    secondary: 'bg-glass-secondary',
    dark: 'bg-black/60',
  };

  const rounded = {
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    '2xl': 'rounded-2xl',
  };

  return (
    <BlurView 
      intensity={intensity} 
      tint="dark" 
      className={`overflow-hidden border border-glass-border ${bgColors[variant]} ${rounded[radius]} ${className}`}
      {...props}
    >
      {children}
    </BlurView>
  );
}