import React, { useRef } from 'react';
import { Animated, TouchableOpacity, TouchableOpacityProps, Platform } from 'react-native';

const useNativeDriver = Platform.OS !== 'web';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

interface ScaleButtonProps extends TouchableOpacityProps {
  children: React.ReactNode;
  scaleTo?: number;
}

export default function ScaleButton({ style, children, disabled, scaleTo = 0.95, onPressIn, onPressOut, ...props }: ScaleButtonProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = (e: any) => {
    if (!disabled) {
      Animated.spring(scale, { toValue: scaleTo, useNativeDriver, speed: 60, bounciness: 0 }).start();
    }
    onPressIn?.(e);
  };

  const handlePressOut = (e: any) => {
    Animated.spring(scale, { toValue: 1, useNativeDriver, speed: 60, bounciness: 4 }).start();
    onPressOut?.(e);
  };

  return (
    <AnimatedTouchable
      style={[style, { transform: [{ scale }] }]}
      disabled={disabled}
      activeOpacity={0.9}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      {...props}
    >
      {children}
    </AnimatedTouchable>
  );
}
