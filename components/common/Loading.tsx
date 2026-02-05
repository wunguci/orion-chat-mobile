import { useTheme } from "@/hooks/useTheme";
import React from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

interface LoadingProps {
  size?: "small" | "large";
  fullScreen?: boolean;
}

export const Loading: React.FC<LoadingProps> = ({
  size = "large",
  fullScreen = false,
}) => {
  const { colors } = useTheme();

  if (fullScreen) {
    return (
      <View style={[styles.fullScreen, { backgroundColor: colors.background }]}>
        <ActivityIndicator size={size} color={colors.primary} />
      </View>
    );
  }

  return <ActivityIndicator size={size} color={colors.primary} />;
};

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
