import { Layout } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import React from "react";
import { Image, StyleSheet, Text, View, ViewStyle } from "react-native";

interface AvatarProps {
  uri?: string;
  name?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  showOnline?: boolean;
  style?: ViewStyle;
}

export const Avatar: React.FC<AvatarProps> = ({
  uri,
  name = "U",
  size = "md",
  showOnline = false,
  style,
}) => {
  const { colors } = useTheme();
  const avatarSize = Layout.avatarSize[size];

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getFontSize = () => {
    const fontSizes = { xs: 10, sm: 12, md: 16, lg: 20, xl: 24 };
    return fontSizes[size];
  };

  return (
    <View style={[styles.container, style]}>
      {uri ? (
        <Image
          source={{ uri }}
          style={[
            styles.avatar,
            {
              width: avatarSize,
              height: avatarSize,
              borderRadius: avatarSize / 2,
            },
          ]}
        />
      ) : (
        <View
          style={[
            styles.avatar,
            styles.placeholder,
            {
              width: avatarSize,
              height: avatarSize,
              borderRadius: avatarSize / 2,
              backgroundColor: colors.primary,
            },
          ]}
        >
          <Text
            style={[
              styles.initials,
              {
                fontSize: getFontSize(),
                color: "#FFFFFF",
              },
            ]}
          >
            {getInitials(name)}
          </Text>
        </View>
      )}

      {showOnline && (
        <View
          style={[
            styles.onlineIndicator,
            {
              backgroundColor: colors.online,
              width: avatarSize * 0.25,
              height: avatarSize * 0.25,
              borderRadius: avatarSize * 0.25,
              borderWidth: 2,
              borderColor: colors.background,
            },
          ]}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "relative",
  },
  avatar: {
    backgroundColor: "#E5E5EA",
  },
  placeholder: {
    justifyContent: "center",
    alignItems: "center",
  },
  initials: {
    fontWeight: "600",
  },
  onlineIndicator: {
    position: "absolute",
    bottom: 0,
    right: 0,
  },
});
