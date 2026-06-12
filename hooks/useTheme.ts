import { useAppearance } from "@/context/AppearanceContext";

export const useTheme = () => {
  const { colors, colorScheme } = useAppearance();

  return { colors, colorScheme };
};
