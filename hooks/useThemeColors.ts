import { useColorScheme } from "react-native";
import { Colors } from "../constants/theme";

/**
 * Custom hook để lấy colors dựa trên theme hiện tại (light/dark)
 *
 * @example
 * const colors = useThemeColors();
 * <Icon color={colors.orangePrimary} />
 * <Text style={{ color: colors.text }}>Hello</Text>
 */
export function useThemeColors() {
  const colorScheme = useColorScheme();
  return Colors[colorScheme ?? "light"];
}
