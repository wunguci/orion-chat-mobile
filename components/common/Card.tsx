import { BorderRadius, Shadows, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import React from "react";
import { StyleSheet, TouchableOpacity, View, ViewStyle } from "react-native";

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  padding?: boolean;
  shadow?: boolean;
  style?: ViewStyle;
}

export const Card: React.FC<CardProps> = ({
  children,
  onPress,
  padding = true,
  shadow = true,
  style,
}) => {
  const { colors } = useTheme();

  const cardStyle: any[] = [
    styles.card,
    {
      backgroundColor: colors.card,
      borderColor: colors.border,
    },
    padding && styles.padding,
    shadow && Shadows.small,
    style,
  ].filter(Boolean);

  if (onPress) {
    return (
      <TouchableOpacity style={cardStyle} onPress={onPress} activeOpacity={0.7}>
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={cardStyle}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  padding: {
    padding: Spacing.base,
  },
});
