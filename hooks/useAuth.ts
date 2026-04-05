import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";
import { API_BASE_URL, profileApi } from "../services/api/profile";

export interface AuthUserProfile {
  id: string;
  fullName?: string;
  username?: string;
  bio?: string;
  avatarUrl?: string;
  coverUrl?: string;
  address?: string;
  currentLocation?: string;
  birthdate?: string;
  birthdayLabel?: string;
  joinedAt?: string;
  memberStatus?: string;
  interests?: string[];
  stats?: {
    friends?: number | string;
    photos?: number | string;
    videos?: number | string;
  };
  raw?: Record<string, unknown>;
}

const USER_CANDIDATE_KEYS = ["auth_user", "user", "current_user", "profile"];

const parseStoredUser = (raw: string | null): AuthUserProfile | null => {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Record<string, any>;
    const id =
      parsed?.id || parsed?.userId || parsed?.user?.id || parsed?.user?.userId;
    if (!id) return null;

    return {
      id: String(id),
      fullName: parsed.fullName || parsed.name || parsed.displayName,
      username: parsed.username,
      bio: parsed.bio || parsed.statusMessage || parsed.about,
      avatarUrl: parsed.avatarUrl || parsed.avatar || parsed.photoUrl,
      coverUrl: parsed.coverUrl || parsed.coverImage,
      address: parsed.address,
      currentLocation: parsed.currentLocation || parsed.location,
      birthdate: parsed.birthdate || parsed.birthDate || parsed.dateOfBirth,
      birthdayLabel: parsed.birthdayLabel,
      joinedAt: parsed.joinedAt || parsed.createdAt,
      memberStatus: parsed.memberStatus,
      interests: parsed.interests || parsed.tags,
      stats: parsed.stats || {
        friends: parsed.friendsCount,
        photos: parsed.photosCount,
        videos: parsed.videosCount,
      },
      raw: parsed,
    };
  } catch {
    return null;
  }
};

const resolveAssetUrl = (url?: string) => {
  if (!url) return undefined;
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  const normalized = url.startsWith("/") ? url : `/${url}`;
  return `${API_BASE_URL}${normalized}`;
};

const normalizeProfile = (payload: Record<string, any>): AuthUserProfile => {
  return {
    id: String(payload.userId || payload.id),
    fullName: payload.fullName || payload.name,
    username: payload.username,
    bio: payload.bio,
    avatarUrl: resolveAssetUrl(payload.avatarUrl),
    coverUrl: resolveAssetUrl(payload.coverImage || payload.coverUrl),
    birthdate: payload.birthDate || payload.birthdate,
    joinedAt: payload.createdAt || payload.joinedAt,
    memberStatus: payload.memberStatus,
    raw: payload,
  };
};

export const useAuthUser = () => {
  const [user, setUser] = useState<AuthUserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const hasAuthToken = async () => {
    const tokenCandidates = [
      await AsyncStorage.getItem("auth_token"),
      await AsyncStorage.getItem("token"),
      await AsyncStorage.getItem("accessToken"),
    ];
    return tokenCandidates.some((item) => !!item);
  };

  const refreshProfile = useCallback(
    async (options?: { silent?: boolean; showError?: boolean }) => {
      const silent = options?.silent ?? false;
      const showError = options?.showError ?? !silent;

      if (!silent) {
        setLoading(true);
      }

      try {
        const response = await profileApi.getProfile();
        const normalized = normalizeProfile(
          response.data as Record<string, any>,
        );

        await AsyncStorage.setItem("auth_user", JSON.stringify(normalized));
        setUser(normalized);
        setError(null);
      } catch (err) {
        console.error("Failed to refresh profile", err);
        if (showError) {
          setError("Khong the tai thong tin nguoi dung.");
        }
      } finally {
        if (!silent) {
          setLoading(false);
        }
      }
    },
    [],
  );

  const loadUser = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let hasCachedUser = false;
      for (const key of USER_CANDIDATE_KEYS) {
        const raw = await AsyncStorage.getItem(key);
        const parsed = parseStoredUser(raw);
        if (parsed) {
          setUser(parsed);
          hasCachedUser = true;
          break;
        }
      }

      const fallbackId = await AsyncStorage.getItem("userId");
      if (fallbackId) {
        setUser({ id: fallbackId });
        hasCachedUser = true;
      }

      if (!hasCachedUser) {
        setUser(null);
      }

      setLoading(false);

      if (await hasAuthToken()) {
        await refreshProfile({ silent: true });
        return;
      }

      if (!hasCachedUser) {
        setError("Khong tim thay thong tin nguoi dung.");
      }
    } catch (err) {
      console.error("Failed to load auth user", err);
      setUser(null);
      setError("Khong the tai thong tin nguoi dung.");
    }
  }, [refreshProfile]);

  useEffect(() => {
    void loadUser();
  }, [loadUser]);

  return {
    user,
    loading,
    error,
    reload: () => refreshProfile({ silent: false, showError: true }),
  };
};
