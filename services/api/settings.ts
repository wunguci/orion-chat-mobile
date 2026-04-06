import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// User Settings API
export const userSettingsApi = {
  getMySettings: () => api.get('/user-settings/me'),
  getSettings: (userId: string) => api.get(`/user-settings/${userId}`),
  createSettings: (data: any) => api.post('/user-settings', data),
  updateMySettings: (data: any) => api.patch('/user-settings/me/update', data),
  updateSettings: (userId: string, data: any) =>
    api.patch(`/user-settings/${userId}`, data),
  deleteSettings: (userId: string) => api.delete(`/user-settings/${userId}`),
};

// Notification Settings API
export const notificationSettingsApi = {
  getMySettings: () => api.get('/notification-settings/me'),
  getSettings: (userId: string) =>
    api.get(`/notification-settings/${userId}`),
  createSettings: (data: any) => api.post('/notification-settings', data),
  updateMySettings: (data: any) =>
    api.patch('/notification-settings/me/update', data),
  updateSettings: (userId: string, data: any) =>
    api.patch(`/notification-settings/${userId}`, data),
  toggleMuteMe: () => api.patch('/notification-settings/me/toggle-mute'),
  toggleMute: (userId: string) =>
    api.patch(`/notification-settings/${userId}/toggle-mute`),
  deleteSettings: (userId: string) =>
    api.delete(`/notification-settings/${userId}`),
};

// Privacy Settings API
export const privacySettingsApi = {
  getMySettings: () => api.get('/privacy-settings/me'),
  getSettings: (userId: string) =>
    api.get(`/privacy-settings/${userId}`),
  createSettings: (data: any) => api.post('/privacy-settings', data),
  updateMySettings: (data: any) =>
    api.patch('/privacy-settings/me/update', data),
  updateSettings: (userId: string, data: any) =>
    api.patch(`/privacy-settings/${userId}`, data),
  deleteSettings: (userId: string) =>
    api.delete(`/privacy-settings/${userId}`),
};

// User Devices API
export const userDevicesApi = {
  getMyDevices: () => api.get('/user-devices/me/devices'),
  getMyActiveDevices: () => api.get('/user-devices/me/active-devices'),
  getDevices: (userId: string) =>
    api.get(`/user-devices/user/${userId}`),
  getDevice: (id: string) => api.get(`/user-devices/${id}`),
  createDevice: (data: any) => api.post('/user-devices', data),
  updateDevice: (id: string, data: any) =>
    api.patch(`/user-devices/${id}`, data),
  updateLastLogin: (id: string) =>
    api.patch(`/user-devices/${id}/last-login`),
  deactivateDevice: (id: string) =>
    api.patch(`/user-devices/${id}/deactivate`),
  removeDevice: (id: string) => api.delete(`/user-devices/${id}`),
  removeAllExcept: (userId: string, currentDeviceId: string) =>
    api.delete(`/user-devices/user/${userId}/except/${currentDeviceId}`),
};
