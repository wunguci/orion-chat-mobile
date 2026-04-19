import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';
import { TokenPayload, User } from '../types/auth';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';
const REMEMBER_ME_KEY = 'rememberMe_phone';
const LAST_ACTIVITY_KEY = 'lastActivityTime';
const SESSION_TIMEOUT = 15 * 60 * 1000; // 15 minutes in milliseconds

export const tokenUtils = {
    // Save token to AsyncStorage
    async setToken(token: string) {
        await AsyncStorage.setItem(TOKEN_KEY, token);
    },

    // lấy token từ AsyncStorage
    async getToken(): Promise<string | null> {
        return await AsyncStorage.getItem(TOKEN_KEY);
    },

    // Lưu dữ liệu người dùng vào AsyncStorage
    async setUser(user: User) {
        await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
    },

    // Lấy dữ liệu người dùng từ AsyncStorage
    async getUser(): Promise<User | null> {
        const userData = await AsyncStorage.getItem(USER_KEY);
        if (!userData) return null;
        try {
            return JSON.parse(userData);
        } catch {
            return null;
        }
    },

    // Lưu tùy chọn ghi nhớ
    async setRememberMe(phone: string) {
        await AsyncStorage.setItem(REMEMBER_ME_KEY, phone);
    },

    // Lấy số điện thoại đã ghi nhớ
    async getRememberedPhone(): Promise<string | null> {
        return await AsyncStorage.getItem(REMEMBER_ME_KEY);
    },

    // xóa số điện thoại đã ghi nhớ
    async clearRememberMe() {
        await AsyncStorage.removeItem(REMEMBER_ME_KEY);
    },

    // xác thực token
    async isTokenValid(): Promise<boolean> {
        const token = await this.getToken();
        if (!token) return false;

        try {
            const decoded = jwtDecode<TokenPayload>(token);
            const now = Date.now() / 1000;

            // Token không hợp lệ nếu đã hết hạn
            return decoded.exp > now;
        } catch {
            return false;
        }
    },

    // kiểm tra xem phiên làm việc có hết hạn không
    async isSessionTimedOut(): Promise<boolean> {
        const lastActivityStr = await AsyncStorage.getItem(LAST_ACTIVITY_KEY);
        if (!lastActivityStr) return true;

        const lastActivityTime = parseInt(lastActivityStr, 10);
        const now = Date.now();

        return now - lastActivityTime > SESSION_TIMEOUT;
    },

    // Ghi lại hoạt động của người dùng (cập nhật thời gian hoạt động cuối)
    async recordActivity() {
        await AsyncStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
    },

    // Lấy thời gian hoạt động cuối
    async getLastActivityTime(): Promise<number | null> {
        const lastActivityStr = await AsyncStorage.getItem(LAST_ACTIVITY_KEY);
        if (!lastActivityStr) return null;
        return parseInt(lastActivityStr, 10);
    },

    // xóa tất cả dữ liệu xác thực (đăng xuất)
    async clearAll() {
        console.log(
            '[tokenUtils] Clearing all tokens and user data from AsyncStorage',
        );
        await AsyncStorage.multiRemove([
            TOKEN_KEY,
            USER_KEY,
            LAST_ACTIVITY_KEY,
        ]);
        console.log('[tokenUtils] All data cleared successfully');
    },

    // Giải mã token để lấy payload
    decodeToken(token: string): TokenPayload | null {
        try {
            return jwtDecode<TokenPayload>(token);
        } catch {
            return null;
        }
    },
};
