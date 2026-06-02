import React, {
    createContext,
    useCallback,
    useEffect,
    useRef,
    useState,
} from 'react';
import { Alert, AppState, AppStateStatus } from 'react-native';
import { AuthState, User } from '../types/auth';
import { tokenUtils } from '../utils/tokenUtils';
import { login as apiLogin, logout as apiLogout } from '../services/api/auth';
import { chatSocketService } from '../services/websocket/chatSocket';
import {
    profileApi,
    UpdateProfileDto,
    UpdateProfileFiles,
} from '../services/api/profile';
import { subscribeSessionExpired } from '../services/auth/sessionEvents';

export const AuthContext = createContext<{
    state: AuthState;
    login: (
        phone: string,
        password: string,
        rememberMe: boolean,
    ) => Promise<void>;
    logout: (options?: { skipApi?: boolean }) => Promise<void>;
    isSessionValid: () => Promise<boolean>;
    updateUserProfile: (
        updateData: UpdateProfileDto,
        files?: UpdateProfileFiles,
    ) => Promise<User>;
} | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [state, setState] = useState<AuthState>({
        isAuthenticated: false,
        user: null,
        token: null,
        loading: true,
        error: null,
        lastActivityTime: null,
    });

    const appStateRef = useRef<AppStateStatus>('active');
    const sessionExpiredAlertShownRef = useRef(false);
    const sessionCheckIntervalRef = useRef<ReturnType<
        typeof setInterval
    > | null>(null);

    // Restore session on app start
    useEffect(() => {
        const restoreSession = async () => {
            try {
                const token = await tokenUtils.getToken();
                const user = await tokenUtils.getUser();

                if (token && user) {
                    // Check if token is still valid
                    const isValid = await tokenUtils.isTokenValid();

                    if (!isValid) {
                        // Token expired, clear everything
                        await tokenUtils.clearAll();
                        setState((prev) => ({
                            ...prev,
                            isAuthenticated: false,
                            token: null,
                            user: null,
                            loading: false,
                        }));
                        return;
                    }

                    // Check if session timed out (15 minutes of inactivity)
                    const timedOut = await tokenUtils.isSessionTimedOut();
                    if (timedOut) {
                        await tokenUtils.clearAll();
                        setState((prev) => ({
                            ...prev,
                            isAuthenticated: false,
                            token: null,
                            user: null,
                            loading: false,
                        }));
                        return;
                    }

                    // Session is valid
                    await tokenUtils.recordActivity();
                    setState((prev) => ({
                        ...prev,
                        isAuthenticated: true,
                        token,
                        user,
                        loading: false,
                        lastActivityTime: Date.now(),
                    }));
                } else {
                    setState((prev) => ({
                        ...prev,
                        loading: false,
                    }));
                }
            } catch (error) {
                console.error('Error restoring session:', error);
                setState((prev) => ({
                    ...prev,
                    loading: false,
                }));
            }
        };

        restoreSession();
    }, []);

    // Monitor app state (foreground/background) to detect multi-tab logout
    useEffect(() => {
        const handleAppStateChange = async (nextAppState: AppStateStatus) => {
            // If app came to foreground
            if (
                appStateRef.current.match(/inactive|background/) &&
                nextAppState === 'active'
            ) {
                // Verify session is still valid (moved check here)
                if (state.token && state.user) {
                    const tokenValid = await tokenUtils.isTokenValid();
                    const sessionTimedOut =
                        await tokenUtils.isSessionTimedOut();

                    if (!tokenValid || sessionTimedOut) {
                        // Logout inline instead of calling logout function
                        await tokenUtils.clearAll();
                        if (sessionCheckIntervalRef.current) {
                            clearInterval(sessionCheckIntervalRef.current);
                        }
                        setState((prev) => ({
                            ...prev,
                            isAuthenticated: false,
                            token: null,
                            user: null,
                            error: null,
                            lastActivityTime: null,
                        }));
                    }
                }
            }

            appStateRef.current = nextAppState;
        };

        const subscription = AppState.addEventListener(
            'change',
            handleAppStateChange,
        );
        return () => {
            subscription.remove();
        };
    }, [state.token, state.user]);

    // Periodic session validation (check every 30 seconds)
    useEffect(() => {
        if (!state.isAuthenticated) return;

        sessionCheckIntervalRef.current = setInterval(async () => {
            if (!state.token || !state.user) return;

            const isValid = await tokenUtils.isTokenValid();
            const timedOut = await tokenUtils.isSessionTimedOut();

            if (!isValid || timedOut) {
                // Session invalid, logout
                await tokenUtils.clearAll();
                setState((prev) => ({
                    ...prev,
                    isAuthenticated: false,
                    token: null,
                    user: null,
                    error: null,
                    lastActivityTime: null,
                }));
            } else {
                // Update last activity
                await tokenUtils.recordActivity();
            }
        }, 30000); // Check every 30 seconds

        return () => {
            if (sessionCheckIntervalRef.current) {
                clearInterval(sessionCheckIntervalRef.current);
            }
        };
    }, [state.isAuthenticated, state.token, state.user]);

    const isSessionValid = async (): Promise<boolean> => {
        if (!state.token || !state.user) return false;

        try {
            // Check if token is still valid (not expired)
            const tokenValid = await tokenUtils.isTokenValid();
            if (!tokenValid) return false;

            // Check if session has timed out (15 minutes of inactivity)
            const sessionTimedOut = await tokenUtils.isSessionTimedOut();
            if (sessionTimedOut) return false;

            return true;
        } catch (error) {
            console.error('Error validating session:', error);
            return false;
        }
    };

    useEffect(() => {
        if (!state.isAuthenticated) {
            sessionExpiredAlertShownRef.current = false;
            return;
        }

        return subscribeSessionExpired((payload) => {
            if (sessionExpiredAlertShownRef.current) return;
            sessionExpiredAlertShownRef.current = true;

            console.log(
                '[AuthContext] Session expired or replaced:',
                payload.message ||
                    'Phiên làm việc đã hết hạn hoặc bạn đã đăng nhập ở nơi khác',
            );

            Alert.alert(
                'Phiên đăng nhập đã hết hạn',
                'Phiên làm việc đã hết hạn hoặc bạn đã đăng nhập ở nơi khác. Bạn cần đăng nhập lại.',
                [
                    {
                        text: 'OK',
                        onPress: () => {
                            void logout({ skipApi: true }).catch((error) => {
                                console.log(
                                    '[AuthContext] Local logout after session expiry failed:',
                                    error,
                                );
                            });
                        },
                    },
                ],
                { cancelable: false },
            );
        });
    }, [state.isAuthenticated]);

    const login = async (
        phone: string,
        password: string,
        rememberMe: boolean,
    ) => {
        setState((prev) => ({
            ...prev,
            loading: true,
            error: null,
        }));

        try {
            const response = await apiLogin(phone, password);

            if (!response.success || !response.data) {
                setState((prev) => ({
                    ...prev,
                    loading: false,
                    error: response.message || 'Login failed',
                }));
                throw new Error(response.message || 'Login failed');
            }

            const { token, ...userData } = response.data;

            // Transform backend response to User interface
            const user: User = {
                userId: userData.userId || '',
                phoneNumber: userData.phoneNumber || phone,
                fullName: userData.fullName || '',
                email: userData.email,
                birthDate: userData.birthDate,
                gender: userData.gender,
                avatarUrl: userData.avatarUrl,
                coverImage: userData.coverImage,
                isOnline:
                    userData.isOnline !== undefined ? userData.isOnline : true,
                showOnlineStatus:
                    userData.showOnlineStatus !== undefined
                        ? userData.showOnlineStatus
                        : true,
                isActive:
                    userData.isActive !== undefined ? userData.isActive : true,
                isDeleted:
                    userData.isDeleted !== undefined
                        ? userData.isDeleted
                        : false,
                createdAt: userData.createdAt,
                lastLoginAt: userData.lastLoginAt,
                loginTime: userData.loginTime,
            };

            // Save token and user
            await tokenUtils.setToken(token);
            await tokenUtils.setUser(user);

            // Save remember me preference
            if (rememberMe) {
                await tokenUtils.setRememberMe(phone);
            }

            // Record activity time
            await tokenUtils.recordActivity();

            setState((prev) => ({
                ...prev,
                isAuthenticated: true,
                token,
                user,
                loading: false,
                error: null,
                lastActivityTime: Date.now(),
            }));
        } catch (error: any) {
            const errorMessage = error?.message || 'Login failed';
            setState((prev) => ({
                ...prev,
                loading: false,
                error: errorMessage,
            }));
            throw error;
        }
    };

    const logout = useCallback(async (options?: { skipApi?: boolean }) => {
        try {
            console.log('[AuthContext] Starting logout...');

            const token = state.token;
            if (token && !options?.skipApi) {
                try {
                    console.log('[AuthContext] Calling backend logout API...');
                    await apiLogout(token);
                    console.log(
                        '[AuthContext] Backend logout API call successful',
                    );
                } catch (apiError) {
                    console.warn(
                        '[AuthContext] Backend logout API error (continuing with local logout):',
                        apiError,
                    );
                    // Continue with local logout even if API fails
                }
            } else if (options?.skipApi) {
                console.log(
                    '[AuthContext] Skipping backend logout API; clearing local session only',
                );
            }

            console.log(
                '[AuthContext] Clearing local auth state and tokens...',
            );
            // Clear all stored data including tokens
            await tokenUtils.clearAll();

            // Disconnect chat socket to avoid stale session usage
            chatSocketService.disconnect();

            // Clear session check interval
            if (sessionCheckIntervalRef.current) {
                clearInterval(sessionCheckIntervalRef.current);
            }

            setState((prev) => ({
                ...prev,
                isAuthenticated: false,
                token: null,
                user: null,
                error: null,
                lastActivityTime: null,
            }));

            console.log('[AuthContext] Logout completed - all tokens cleared');
        } catch (error) {
            console.error('[AuthContext] Error during logout:', error);
            throw error;
        }
    }, [state.token]);

    const updateUserProfile = async (
        updateData: UpdateProfileDto,
        files?: UpdateProfileFiles,
    ): Promise<User> => {
        try {
            const response = await profileApi.updateProfile(updateData, files);

            if (!response.success || !response.data) {
                throw new Error(response.message || 'Failed to update profile');
            }

            const userData = response.data;

            // Chuyển đổi response thành giao diện người dùng
            const updatedUser: User = {
                userId: userData.userId || '',
                phoneNumber: userData.phoneNumber || '',
                fullName: userData.fullName || '',
                email: userData.email,
                birthDate: userData.birthDate,
                gender: userData.gender,
                avatarUrl: userData.avatarUrl,
                coverImage: userData.coverImage,
                isOnline:
                    userData.isOnline !== undefined ? userData.isOnline : true,
                showOnlineStatus:
                    userData.showOnlineStatus !== undefined
                        ? userData.showOnlineStatus
                        : true,
                isActive:
                    userData.isActive !== undefined ? userData.isActive : true,
                isDeleted:
                    userData.isDeleted !== undefined
                        ? userData.isDeleted
                        : false,
                createdAt: userData.createdAt,
                lastLoginAt: userData.lastLoginAt,
                loginTime: state.user?.loginTime,
            };

            // Save updated user
            await tokenUtils.setUser(updatedUser);

            // Update state
            setState((prev) => ({
                ...prev,
                user: updatedUser,
            }));

            return updatedUser;
        } catch (error: any) {
            console.error('Error updating profile:', error);
            throw error;
        }
    };

    const value = {
        state,
        login,
        logout,
        isSessionValid,
        updateUserProfile,
    };

    return (
        <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    );
}
