import { useState, useCallback, useEffect } from 'react';
import {
  userSettingsApi,
  notificationSettingsApi,
  privacySettingsApi,
  userDevicesApi,
} from '../services/api/settings';

interface UserSettings {
  id: string;
  userId: string;
  theme: string;
  fontSize: number;
  wallpaper: string;
  fontFamily: string;
  accentColor: string;
  createdAt: Date;
  updatedAt: Date;
}

interface NotificationSettings {
  id: string;
  userId: string;
  groupNotifications: boolean;
  tagNotifications: boolean;
  muteAll: boolean;
  messageNotifications: boolean;
  friendRequestNotifications: boolean;
  callNotifications: boolean;
  notificationSound: string;
  doNotDisturbStart: number;
  doNotDisturbEnd: number;
  createdAt: Date;
  updatedAt: Date;
}

interface PrivacySettings {
  id: string;
  userId: string;
  profileVisibility: string;
  messagePermission: string;
  lastSeenVisibility: boolean;
  onlineStatusVisibility: boolean;
  allowAIToSeeProfile: boolean;
  allowAIToSeeMessages: boolean;
  allowAIToSeeMedia: boolean;
  callPermission: string;
  allowScreenSharing: boolean;
  allowDataCollection: boolean;
  allowAnalytics: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface UserDevice {
  id: string;
  userId: string;
  deviceName: string;
  deviceType: string;
  deviceModel: string;
  osType: string;
  osVersion: string;
  appVersion: string;
  lastLogin: Date;
  isActive: boolean;
  fcmToken: string;
  ipAddress: string;
  createdAt: Date;
}

export const useUserSettings = () => {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const response = await userSettingsApi.getMySettings();
      setSettings(response.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch settings');
    } finally {
      setLoading(false);
    }
  }, []);

  const updateSettings = useCallback(async (updates: Partial<UserSettings>) => {
    try {
      const response = await userSettingsApi.updateMySettings(updates);
      setSettings(response.data);
      setError(null);
      return response.data;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update settings');
      throw err;
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, []);

  return { settings, loading, error, updateSettings, refetch: fetchSettings };
};

export const useNotificationSettings = () => {
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const response = await notificationSettingsApi.getMySettings();
      setSettings(response.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch settings');
    } finally {
      setLoading(false);
    }
  }, []);

  const updateSettings = useCallback(
    async (updates: Partial<NotificationSettings>) => {
      try {
        const response = await notificationSettingsApi.updateMySettings(updates);
        setSettings(response.data);
        setError(null);
        return response.data;
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to update settings');
        throw err;
      }
    },
    [],
  );

  const toggleMute = useCallback(async () => {
    try {
      const response = await notificationSettingsApi.toggleMuteMe();
      setSettings(response.data);
      setError(null);
      return response.data;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to toggle mute');
      throw err;
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, []);

  return {
    settings,
    loading,
    error,
    updateSettings,
    toggleMute,
    refetch: fetchSettings,
  };
};

export const usePrivacySettings = () => {
  const [settings, setSettings] = useState<PrivacySettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const response = await privacySettingsApi.getMySettings();
      setSettings(response.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch settings');
    } finally {
      setLoading(false);
    }
  }, []);

  const updateSettings = useCallback(async (updates: Partial<PrivacySettings>) => {
    try {
      const response = await privacySettingsApi.updateMySettings(updates);
      setSettings(response.data);
      setError(null);
      return response.data;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update settings');
      throw err;
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, []);

  return { settings, loading, error, updateSettings, refetch: fetchSettings };
};

export const useUserDevices = () => {
  const [devices, setDevices] = useState<UserDevice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDevices = useCallback(async () => {
    setLoading(true);
    try {
      const response = await userDevicesApi.getMyDevices();
      setDevices(response.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch devices');
    } finally {
      setLoading(false);
    }
  }, []);

  const removeDevice = useCallback(async (id: string) => {
    try {
      await userDevicesApi.removeDevice(id);
      setDevices((prev) => prev.filter((d) => d.id !== id));
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to remove device');
      throw err;
    }
  }, []);

  const deactivateDevice = useCallback(async (id: string) => {
    try {
      const response = await userDevicesApi.deactivateDevice(id);
      setDevices((prev) =>
        prev.map((d) => (d.id === id ? response.data : d)),
      );
      setError(null);
      return response.data;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to deactivate device');
      throw err;
    }
  }, []);

  useEffect(() => {
    fetchDevices();
  }, []);

  return {
    devices,
    loading,
    error,
    removeDevice,
    deactivateDevice,
    refetch: fetchDevices,
  };
};
