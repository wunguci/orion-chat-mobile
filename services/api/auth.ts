import type {
    SendOtpResponse,
    VerifyOtpResponse,
    RegisterResponse,
    LoginResponse,
    ErrorResponse,
} from '../../types/auth';
import API_BASE_URL from '../../config/api';

/**
 * Send OTP to phone number
 */
export async function sendOtp(phoneNumber: string): Promise<SendOtpResponse> {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/send-otp`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Platform': 'mobile',
            },
            body: JSON.stringify({ phoneNumber }),
        });

        if (!response.ok) {
            const errorData: ErrorResponse = await response.json();
            throw new Error(
                errorData.message ||
                    `Failed to send OTP: ${response.statusText}`,
            );
        }

        return response.json();
    } catch (error) {
        console.error('[sendOtp] Error:', error);
        throw error;
    }
}

/**
 * Verify OTP
 */
export async function verifyOtp(
    phoneNumber: string,
    otp: string,
): Promise<VerifyOtpResponse> {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Platform': 'mobile',
            },
            body: JSON.stringify({ phoneNumber, otp }),
        });

        if (!response.ok) {
            const errorData: ErrorResponse = await response.json();
            throw new Error(
                errorData.message ||
                    `Failed to verify OTP: ${response.statusText}`,
            );
        }

        return response.json();
    } catch (error) {
        console.error('[verifyOtp] Error:', error);
        throw error;
    }
}

/**
 * Complete Registration
 */
export async function completeRegister(formData: {
    phoneNumber: string;
    password: string;
    fullName: string;
    birthDate: string;
    gender: 'male' | 'female' | 'other';
}): Promise<RegisterResponse> {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/complete-register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Platform': 'mobile',
            },
            body: JSON.stringify(formData),
        });

        if (!response.ok) {
            const errorData: ErrorResponse = await response.json();
            throw new Error(
                errorData.message ||
                    `Failed to register: ${response.statusText}`,
            );
        }

        return response.json();
    } catch (error) {
        console.error('[completeRegister] Error:', error);
        throw error;
    }
}

/**
 * Login
 */
export async function login(
    phoneNumber: string,
    password: string,
): Promise<LoginResponse> {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Platform': 'mobile',
            },
            body: JSON.stringify({
                phoneNumber,
                password,
                deviceType: 'mobile',
                platform: 'mobile',
            }),
        });

        if (!response.ok) {
            let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
            try {
                const errorData = await response.json();
                // Extract error message - handle multiple possible formats
                errorMessage =
                    errorData.message ||
                    (typeof errorData === 'string' ? errorData : null) ||
                    errorMessage;
            } catch {
                // Failed to parse error response
            }
            throw new Error(errorMessage);
        }

        return response.json();
    } catch (error) {
        if (
            error instanceof TypeError &&
            error.message.includes('Failed to fetch')
        ) {
            throw new Error(
                'Không thể kết nối tới server. Vui lòng kiểm tra backend đang chạy',
            );
        }
        throw error;
    }
}

/**
 * Logout
 */
export async function logout(token: string): Promise<{ message: string }> {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/logout`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Platform': 'mobile',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ platform: 'mobile' }),
        });

        if (!response.ok) {
            try {
                const errorData: ErrorResponse = await response.json();
                throw new Error(
                    errorData.message ||
                        `Failed to logout: ${response.statusText}`,
                );
            } catch {
                throw new Error(
                    `HTTP ${response.status}: ${response.statusText}`,
                );
            }
        }

        return response.json();
    } catch (error) {
        console.error('[logout] Error:', error);
        throw error;
    }
}

/**
 * Validate phone number
 */
export function validatePhoneNumber(phone: string): boolean {
    return phone.length >= 10;
}

/**
 * Validate password
 */
export function validatePassword(password: string): boolean {
    return password.length >= 8;
}

/**
 * Send OTP for Forgot Password
 */
export async function sendOtpForgetPassword(
    phoneNumber: string,
): Promise<SendOtpResponse> {
    try {
        const response = await fetch(
            `${API_BASE_URL}/auth/send-otp-forget-password`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Platform': 'mobile',
                },
                body: JSON.stringify({ phoneNumber }),
            },
        );

        if (!response.ok) {
            const errorData: ErrorResponse = await response.json();
            throw new Error(
                errorData.message ||
                    `Failed to send OTP: ${response.statusText}`,
            );
        }

        return response.json();
    } catch (error) {
        console.error('[sendOtpForgetPassword] Error:', error);
        throw error;
    }
}

/**
 * Verify OTP for Forgot Password
 */
export async function verifyOtpForgetPassword(
    phoneNumber: string,
    otp: string,
): Promise<VerifyOtpResponse> {
    try {
        const response = await fetch(
            `${API_BASE_URL}/auth/verify-otp-forget-password`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Platform': 'mobile',
                },
                body: JSON.stringify({ phoneNumber, otp }),
            },
        );

        if (!response.ok) {
            const errorData: ErrorResponse = await response.json();
            throw new Error(
                errorData.message ||
                    `Failed to verify OTP: ${response.statusText}`,
            );
        }

        return response.json();
    } catch (error) {
        console.error('[verifyOtpForgetPassword] Error:', error);
        throw error;
    }
}

/**
 * Reset Password
 */
export async function resetPassword(formData: {
    phoneNumber: string;
    otp: string;
    newPassword: string;
    confirmPassword: string;
}): Promise<{ success: boolean; message: string; data: any }> {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Platform': 'mobile',
            },
            body: JSON.stringify(formData),
        });

        if (!response.ok) {
            const errorData: ErrorResponse = await response.json();
            throw new Error(
                errorData.message ||
                    `Failed to reset password: ${response.statusText}`,
            );
        }

        return response.json();
    } catch (error) {
        console.error('[resetPassword] Error:', error);
        throw error;
    }
}
