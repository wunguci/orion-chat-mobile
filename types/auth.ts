export interface User {
    userId: string;
    phoneNumber: string;
    fullName: string;
    email?: string;
    birthDate?: string;
    gender?: string;
    avatarUrl?: string;
    coverImage?: string;
    isOnline?: boolean;
    showOnlineStatus?: boolean;
    isActive?: boolean;
    isDeleted?: boolean;
    createdAt?: string;
    lastLoginAt?: string;
    loginTime?: string;
}

export interface LoginRequest {
    phone: string;
    password: string;
}

export interface LoginResponse {
    success: boolean;
    message: string;
    data?: {
        token: string;
        phoneNumber: string;
        fullName: string;
        email?: string;
        birthDate?: string;
        gender?: string;
        userId?: string;
        avatarUrl?: string;
        coverImage?: string;
        isOnline?: boolean;
        showOnlineStatus?: boolean;
        isActive?: boolean;
        isDeleted?: boolean;
        createdAt?: string;
        lastLoginAt?: string;
        loginTime?: string;
    };
}

export interface AuthState {
    isAuthenticated: boolean;
    user: User | null;
    token: string | null;
    loading: boolean;
    error: string | null;
    lastActivityTime: number | null;
}

export interface TokenPayload {
    phoneNumber: string;
    iat: number;
    exp: number;
}

export interface SendOtpResponse {
    success: boolean;
    message: string;
    data?: {
        phoneNumber: string;
        otpId: string;
        expiresIn: number;
    };
}

export interface VerifyOtpResponse {
    success: boolean;
    message: string;
    data?: {
        phoneNumber: string;
        verified: boolean;
    };
}

export interface RegisterResponse {
    success: boolean;
    message: string;
    data?: {
        userId: string;
        phoneNumber: string;
        fullName: string;
    };
}

export interface ErrorResponse {
    success: boolean;
    message: string;
    error?: string;
}
