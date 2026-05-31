/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { useAppearance } from "@/context/AppearanceContext";

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof ReturnType<typeof useAppearance>["colors"],
) {
  const { colors, colorScheme } = useAppearance();
  const colorFromProps = props[colorScheme];

  if (colorFromProps) {
    return colorFromProps;
  }

  return colors[colorName];
}
