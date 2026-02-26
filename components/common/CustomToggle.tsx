import React, { useEffect, useRef } from "react";
import { Animated, Pressable, StyleSheet } from "react-native";
import { useThemeColors } from "../../hooks/useThemeColors";

interface CustomToggleProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
}

export default function CustomToggle({
  value,
  onValueChange,
  disabled = false,
}: CustomToggleProps) {
  const colors = useThemeColors();
  const animatedValue = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(animatedValue, {
      toValue: value ? 1 : 0,
      useNativeDriver: true,
      friction: 8,
      tension: 100,
    }).start();
  }, [value, animatedValue]);

  const translateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [2, 18], // Move from left to right
  });

  const trackBackgroundColor = value
    ? colors.switchTrackOn
    : colors.switchTrackOff;

  const handlePress = () => {
    if (!disabled) {
      onValueChange(!value);
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      style={[
        styles.track,
        {
          backgroundColor: trackBackgroundColor,
          opacity: disabled ? 0.5 : 1,
        },
      ]}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
    >
      <Animated.View
        style={[
          styles.thumb,
          {
            backgroundColor: colors.switchThumb,
            transform: [{ translateX }],
          },
        ]}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: {
    width: 45,
    height: 28,
    borderRadius: 16,
    justifyContent: "center",
    padding: 2,
  },
  thumb: {
    width: 22,
    height: 22,
    borderRadius: 13.5,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2.5,
    elevation: 4,
  },
});
