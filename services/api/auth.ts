import type {
    SendOtpResponse,
    VerifyOtpResponse,
    RegisterResponse,
    LoginResponse,
    ErrorResponse,
} from '../../types/auth';
import { API_BASE_URL, fetchWithTimeout } from '../../config/api';
import { tokenUtils } from '../../utils/tokenUtils';

/**
 * Send OTP to phone number
 */
export async function sendOtp(phoneNumber: string): Promise<SendOtpResponse> {
    try {
        const response = await fetchWithTimeout(
            `${API_BASE_URL}/auth/send-otp`,
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

        const result = await response.json();
        if (result && result.success === false) {
            throw new Error(result.message || 'Gửi OTP thất bại');
        }

        return result;
    } catch (error) {
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
        const response = await fetchWithTimeout(
            `${API_BASE_URL}/auth/verify-otp`,
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
        const response = await fetchWithTimeout(
            `${API_BASE_URL}/auth/complete-register`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Platform': 'mobile',
                },
                body: JSON.stringify(formData),
            },
        );

        if (!response.ok) {
            const errorData: ErrorResponse = await response.json();
            throw new Error(
                errorData.message ||
                    `Failed to register: ${response.statusText}`,
            );
        }

        return response.json();
    } catch (error) {
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
        const response = await fetchWithTimeout(`${API_BASE_URL}/auth/login`, {
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
                const message = Array.isArray(errorData?.message)
                    ? errorData?.message.join(', ')
                    : errorData?.message;
                errorMessage =
                    message ||
                    errorData?.error ||
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
        console.log(
            '[logout] Attempting logout with token:',
            token ? `${token.substring(0, 20)}...` : 'NO TOKEN',
        );

        const response = await fetchWithTimeout(
            `${API_BASE_URL}/auth/logout-with-token`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Platform': 'mobile',
                },
                body: JSON.stringify({ token, platform: 'mobile' }),
            },
        );

        console.log(
            '[logout] Response status:',
            response.status,
            response.statusText,
        );

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

        const result = await response.json();
        console.log('[logout] Logout successful:', result);
        return result;
    } catch (error) {
        throw error;
    }
}

export async function confirmQrLogin(qrToken: string): Promise<{
    success: boolean;
    message?: string;
    data?: { status: 'confirmed' };
}> {
    const token = await tokenUtils.getToken();
    if (!token) {
        throw new Error('Bạn cần đăng nhập trên mobile trước khi quét QR.');
    }

    const response = await fetchWithTimeout(`${API_BASE_URL}/auth/qr/confirm`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Platform': 'mobile',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ qrToken }),
    });

    if (!response.ok) {
        const errorData: ErrorResponse = await response
            .json()
            .catch(() => ({}));
        throw new Error(errorData.message || 'Không thể xác nhận đăng nhập QR');
    }

    return response.json();
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
        const response = await fetchWithTimeout(
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

        const result = await response.json();
        if (result && result.success === false) {
            throw new Error(result.message || 'Gửi OTP thất bại');
        }

        return result;
    } catch (error) {
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
        const response = await fetchWithTimeout(
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
        const response = await fetchWithTimeout(
            `${API_BASE_URL}/auth/reset-password`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Platform': 'mobile',
                },
                body: JSON.stringify(formData),
            },
        );

        if (!response.ok) {
            const errorData: ErrorResponse = await response.json();
            throw new Error(
                errorData.message ||
                    `Failed to reset password: ${response.statusText}`,
            );
        }

        return response.json();
    } catch (error) {
        throw error;
    }
}
