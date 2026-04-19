import API_BASE_URL from '../../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface FetchOptions extends RequestInit {
    params?: Record<string, string | number | boolean>;
}

/**
 * Lấy JWT token từ AsyncStorage
 */
const getAuthToken = async () => {
    const tokenCandidates = [
        await AsyncStorage.getItem('auth_token'),
        await AsyncStorage.getItem('token'),
        await AsyncStorage.getItem('accessToken'),
    ];
    return tokenCandidates.find((item) => !!item) || null;
};

// make API request với định danh nền tảng di động

export async function fetchApi<T = any>(
    endpoint: string,
    options?: FetchOptions,
): Promise<T> {
    const { params, ...fetchOptions } = options || {};

    // dựng URL với tham số truy vấn
    let url = `${API_BASE_URL}${endpoint}`;
    if (params) {
        const queryString = new URLSearchParams(
            Object.entries(params).map(([key, value]) => [key, String(value)]),
        ).toString();
        if (queryString) {
            url += `?${queryString}`;
        }
    }

    // Get token for authorization
    const token = await getAuthToken();

    // thêm tiêu đề nền tảng cho tất cả các yêu cầu
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-Platform': 'mobile', // ← Tự động thêm tiêu đề nền tảng
        ...(fetchOptions.headers as Record<string, string> | undefined),
    };

    // Add authorization header if token exists
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
        ...fetchOptions,
        headers,
    });

    if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorMessage;
        } catch {
            // bỏ qua lỗi phân tích, sử dụng thông điệp mặc định
        }
        throw new Error(errorMessage);
    }

    const text = await response.text();
    return text ? (JSON.parse(text) as T) : ({} as T);
}
