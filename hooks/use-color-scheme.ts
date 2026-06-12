import { useAppearance } from "@/context/AppearanceContext";

export function useColorScheme() {
  const { colorScheme } = useAppearance();
  return colorScheme;
}
