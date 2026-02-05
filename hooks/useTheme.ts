import { useColorScheme } from "@/hooks/use-color-scheme";
import { Colors } from "@/constants/theme";

export const useTheme = () => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  return { colors, colorScheme };
};
