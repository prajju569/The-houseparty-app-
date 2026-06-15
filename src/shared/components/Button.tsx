import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';

type Variant = 'primary' | 'secondary' | 'ghost' | 'gold';
type Size    = 'sm' | 'md' | 'lg';

interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  fullWidth?: boolean;
}

const containerStyles: Record<Variant, ViewStyle> = {
  primary:   { backgroundColor: '#0A0A0A' },
  secondary: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E8E7E3' },
  ghost:     { backgroundColor: 'transparent' },
  gold:      { backgroundColor: '#C8A951' },
};

const sizeStyles: Record<Size, ViewStyle> = {
  sm: { paddingHorizontal: 14, paddingVertical: 8 },
  md: { paddingHorizontal: 20, paddingVertical: 13 },
  lg: { paddingHorizontal: 24, paddingVertical: 16 },
};

const labelColorStyles: Record<Variant, TextStyle> = {
  primary:   { color: '#FFFFFF' },
  secondary: { color: '#0A0A0A' },
  ghost:     { color: '#0A0A0A' },
  gold:      { color: '#FFFFFF' },
};

const labelSizeStyles: Record<Size, TextStyle> = {
  sm: { fontSize: 13 },
  md: { fontSize: 15 },
  lg: { fontSize: 16 },
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading,
  disabled,
  style,
  fullWidth,
}: ButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.72}
      style={[
        s.base,
        containerStyles[variant],
        sizeStyles[size],
        fullWidth && s.fullWidth,
        (disabled || loading) && s.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'secondary' || variant === 'ghost' ? '#0A0A0A' : '#FFFFFF'}
          size="small"
        />
      ) : (
        <Text style={[s.label, labelColorStyles[variant], labelSizeStyles[size]]}>
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  base:      { borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  fullWidth: { width: '100%' },
  disabled:  { opacity: 0.38 },
  label:     { fontWeight: '600', letterSpacing: 0.15 },
});
