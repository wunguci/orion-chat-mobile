import { useCallback, useContext, useEffect, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { profileApi, ProfilePayload } from "../services/api/profile";
import type { User } from "../types/auth";

const mapStoredUserToProfile = (user: User): ProfilePayload => ({
  userId: user.userId,
  phoneNumber: user.phoneNumber,
  fullName: user.fullName,
  email: user.email,
  gender: user.gender,
  birthDate: user.birthDate,
  avatarUrl: user.avatarUrl,
  coverImage: user.coverImage,
  isOnline: user.isOnline,
  showOnlineStatus: user.showOnlineStatus,
  isActive: user.isActive,
  createdAt: user.createdAt,
  lastLoginAt: user.lastLoginAt,
});

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return "Khong the tai thong tin profile";
};

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}

export function useAuthUser() {
  const { state } = useAuth();
  const [user, setUser] = useState<ProfilePayload | null>(
    state.user ? mapStoredUserToProfile(state.user) : null,
  );
  const [loading, setLoading] = useState<boolean>(state.loading);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!state.isAuthenticated) {
      setUser(null);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await profileApi.getProfile();

      if (!response.success || !response.data) {
        throw new Error(response.message || "Khong the lay profile");
      }

      setUser(response.data);
    } catch (err) {
      setError(getErrorMessage(err));

      if (state.user) {
        setUser(mapStoredUserToProfile(state.user));
      }
    } finally {
      setLoading(false);
    }
  }, [state.isAuthenticated, state.user, state.loading]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return {
    user,
    loading,
    error,
    reload,
  };
}
