import { useCallback, useEffect, useState } from "react";
import {
  notificationSettingsApi,
  type NotificationSettingsResponse,
} from "@/services/api/settings";

export function useNotificationSettings() {
  const [settings, setSettings] = useState<NotificationSettingsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const data = await notificationSettingsApi.getMySettings();
      setSettings(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Không thể tải cài đặt thông báo");
    } finally {
      setLoading(false);
    }
  }, []);

  const updateSettings = useCallback(
    async (updates: Partial<NotificationSettingsResponse>) => {
      try {
        const data = await notificationSettingsApi.updateMySettings(updates);
        setSettings(data);
        setError(null);
        return data;
      } catch (err: any) {
        setError(err.message || "Không thể cập nhật cài đặt thông báo");
        throw err;
      }
    },
    [],
  );

  const toggleMute = useCallback(async () => {
    try {
      const data = await notificationSettingsApi.toggleMute();
      setSettings(data);
      setError(null);
      return data;
    } catch (err: any) {
      setError(err.message || "Không thể thay đổi cài đặt im lặng");
      throw err;
    }
  }, []);

  useEffect(() => {
    void fetchSettings();
  }, [fetchSettings]);

  return {
    settings,
    loading,
    error,
    updateSettings,
    toggleMute,
    refetch: fetchSettings,
  };
}
