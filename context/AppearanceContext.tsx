import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useColorScheme } from "react-native";
import {
  APPEARANCE_STORAGE_KEY,
  AppearanceSettings,
  buildAppearanceColors,
  DEFAULT_APPEARANCE_SETTINGS,
  normalizeAppearanceColor,
  normalizeAppearanceTheme,
  resolveAppearanceColorScheme,
} from "@/constants/appearance";
import { settingsApi, UserSettingsResponse } from "@/services/api/settings";
import { useAuth } from "@/hooks/useAuth";

type AppearanceContextValue = {
  settings: AppearanceSettings;
  colors: ReturnType<typeof buildAppearanceColors>;
  colorScheme: "light" | "dark";
  loading: boolean;
  refreshAppearance: () => Promise<void>;
  updateAppearance: (updates: Partial<AppearanceSettings>) => Promise<void>;
};

const AppearanceContext = createContext<AppearanceContextValue | null>(null);

function mapUserSettings(
  settings?: UserSettingsResponse | null,
): Partial<AppearanceSettings> {
  if (!settings) return {};

  return {
    theme: normalizeAppearanceTheme(settings.theme),
    appearanceColor: normalizeAppearanceColor(settings.appearanceColor),
    wallpaper: settings.wallpaper,
    fontSize: settings.fontSize,
  };
}

function normalizeSettings(
  settings: Partial<AppearanceSettings>,
): AppearanceSettings {
  return {
    ...DEFAULT_APPEARANCE_SETTINGS,
    ...settings,
    theme: normalizeAppearanceTheme(settings.theme),
    appearanceColor: normalizeAppearanceColor(settings.appearanceColor),
  };
}

export function AppearanceProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const { state: authState } = useAuth();
  const [settings, setSettings] = useState<AppearanceSettings>(
    DEFAULT_APPEARANCE_SETTINGS,
  );
  const [loading, setLoading] = useState(true);

  const persistSettings = useCallback(async (nextSettings: AppearanceSettings) => {
    await AsyncStorage.setItem(
      APPEARANCE_STORAGE_KEY,
      JSON.stringify(nextSettings),
    );
  }, []);

  const refreshAppearance = useCallback(async () => {
    setLoading(true);

    try {
      const cached = await AsyncStorage.getItem(APPEARANCE_STORAGE_KEY);
      if (cached) {
        setSettings(normalizeSettings(JSON.parse(cached)));
      }

      if (!authState.isAuthenticated) return;

      const remoteSettings = await settingsApi.getMySettings();
      const nextSettings = normalizeSettings(mapUserSettings(remoteSettings));
      setSettings(nextSettings);
      await persistSettings(nextSettings);
    } catch (error) {
      console.warn("[AppearanceProvider] Cannot load appearance settings", error);
    } finally {
      setLoading(false);
    }
  }, [authState.isAuthenticated, persistSettings]);

  const updateAppearance = useCallback(
    async (updates: Partial<AppearanceSettings>) => {
      const nextSettings = normalizeSettings({ ...settings, ...updates });

      setSettings(nextSettings);
      await persistSettings(nextSettings);

      if (authState.isAuthenticated) {
        try {
          const remoteSettings = await settingsApi.updateMySettings({
            theme: nextSettings.theme,
            appearanceColor: nextSettings.appearanceColor,
            wallpaper: nextSettings.wallpaper,
            fontSize: nextSettings.fontSize,
          });
          const syncedSettings = normalizeSettings({
            ...nextSettings,
            ...mapUserSettings(remoteSettings),
          });
          setSettings(syncedSettings);
          await persistSettings(syncedSettings);
        } catch (error) {
          console.warn(
            "[AppearanceProvider] Cannot sync appearance settings",
            error,
          );
        }
      }
    },
    [authState.isAuthenticated, persistSettings, settings],
  );

  useEffect(() => {
    void refreshAppearance();
  }, [refreshAppearance]);

  const colorScheme = resolveAppearanceColorScheme(settings.theme, systemScheme);
  const colors = useMemo(
    () => buildAppearanceColors(settings, systemScheme),
    [settings, systemScheme],
  );

  const value = useMemo(
    () => ({
      settings,
      colors,
      colorScheme,
      loading,
      refreshAppearance,
      updateAppearance,
    }),
    [
      settings,
      colors,
      colorScheme,
      loading,
      refreshAppearance,
      updateAppearance,
    ],
  );

  return (
    <AppearanceContext.Provider value={value}>
      {children}
    </AppearanceContext.Provider>
  );
}

export function useAppearance() {
  const value = useContext(AppearanceContext);
  if (!value) {
    return {
      settings: DEFAULT_APPEARANCE_SETTINGS,
      colors: buildAppearanceColors(DEFAULT_APPEARANCE_SETTINGS, "light"),
      colorScheme: "light" as const,
      loading: false,
      refreshAppearance: async () => {},
      updateAppearance: async () => {},
    };
  }

  return value;
}
