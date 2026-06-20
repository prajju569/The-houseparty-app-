import React from 'react';
import { Pressable, Text, PressableProps } from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring 
} from 'react-native-reanimated';

// 1. Tell TypeScript this component accepts 'className'
type CustomPressableProps = PressableProps & { className?: string };
const AnimatedPressable = Animated.createAnimatedComponent(
  Pressable as unknown as React.ComponentClass<CustomPressableProps>
);

interface ButtonProps extends PressableProps {
  label: string;
  variant?: 'primary' | 'glass';
  className?: string;
}

export default function Button({ 
  label, 
  variant = 'primary', 
  className = '', 
  ...props 
}: ButtonProps) {
  const scale = useSharedValue(1);

  // Wireframe specific spring physics
  const springConfig = {
    mass: 1,
    stiffness: 220,
    damping: 26,
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const handlePressIn = () => {
    scale.value = withSpring(0.96, springConfig);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, springConfig);
  };

  const baseStyles = "h-[56px] w-full flex-row items-center justify-center rounded-full px-6";
  const variants = {
    primary: "bg-accent",
    glass: "bg-glass-primary border border-glass-border",
  };

  // We use NativeWind classes for the text too, keeping it perfectly consistent
  const textStyles = {
    primary: "text-onAccent font-semibold text-[16px] tracking-tight",
    glass: "text-[#F4F2EC] font-semibold text-[15px] tracking-tight",
  };

  return (
    <AnimatedPressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={animatedStyle}
      // 2. className must be a top-level prop for NativeWind to intercept it!
      className={`${baseStyles} ${variants[variant]} ${className}`}
      {...props}
    >
      <Text className={textStyles[variant]}>{label}</Text>
    </AnimatedPressable>
  );
}