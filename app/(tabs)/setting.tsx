import { useRouter } from 'expo-router';
import { navigate } from 'expo-router/build/global-state/routing';
import {
    Bell,
    ChevronRight,
    HelpCircle,
    LogOut,
    Moon,
    Palette,
    Shield,
    Smartphone,
    User,
} from 'lucide-react-native';
import React, { useState } from 'react';
import {
    Alert,
    Image,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
    ActivityIndicator,
} from 'react-native';
import SettingsItem from '../../components/setting/SettingsItem';
import SettingsSection from '../../components/setting/SettingsSection';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useAuth, useAuthUser } from '../../hooks/useAuth';
import { API_BASE_URL } from '../../services/api/profile';

const resolveImageUrl = (value: string | undefined, fallback: string) => {
    if (!value) return fallback;
    if (/^https?:\/\//i.test(value)) return value;

    const normalizedPath = value.startsWith('/') ? value : `/${value}`;
    return `${API_BASE_URL}${normalizedPath}`;
};

export default function Setting() {
    const router = useRouter();
    const colors = useThemeColors();
    const [darkMode, setDarkMode] = useState(false);
    const { user, loading } = useAuthUser();
    const { logout } = useAuth();

    const handleLogout = () => {
        Alert.alert(
            'Đăng xuất',
            'Bạn có chắc chắn muốn đăng xuất?',
            [
                {
                    text: 'Hủy',
                    style: 'cancel',
                },
                {
                    text: 'Đăng xuất',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            console.log('[Setting] Logging out...');

                            // Call logout to clear token and auth state
                            await logout();

                            console.log(
                                '[Setting] Logout successful, navigating to login',
                            );
                            // Navigate to login screen
                            router.replace('/(auth)/login');
                        } catch (error) {
                            console.error('[Setting] Logout error:', error);
                            Alert.alert(
                                'Lỗi',
                                'Có lỗi xảy ra khi đăng xuất. Vui lòng thử lại.',
                            );
                        }
                    },
                },
            ],
            { cancelable: true },
        );
    };

    return (
        <View className="flex-1 bg-gray-50">
            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                {/* Profile Section */}
                <View className="mt-4 bg-white px-4 py-6">
                    {loading ? (
                        <View className="flex-row items-center py-4">
                            <ActivityIndicator
                                size="large"
                                color={colors.orangePrimary}
                            />
                            <Text className="ml-4 text-gray-600">
                                Loading profile...
                            </Text>
                        </View>
                    ) : (
                        <TouchableOpacity
                            className="flex-row items-center"
                            onPress={() => router.push('/profile')}
                        >
                            <Image
                                source={{
                                    uri: resolveImageUrl(
                                        user?.avatarUrl,
                                        'https://via.placeholder.com/100',
                                    ),
                                }}
                                className="h-16 w-16 rounded-full bg-gray-300"
                            />
                            <View className="ml-4 flex-1">
                                <Text className="text-lg font-semibold text-gray-800">
                                    {user?.fullName || 'User'}
                                </Text>
                                <Text className="mt-1 text-sm text-gray-500">
                                    {user?.email || 'No email'}
                                </Text>
                                <Text className="mt-0.5 text-sm text-gray-500">
                                    {user?.phoneNumber || 'No phone'}
                                </Text>
                            </View>
                            <ChevronRight
                                size={24}
                                color={colors.graySecondary}
                            />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Account Settings */}
                <SettingsSection title="Cài đặt Chung">
                    <View className="overflow-hidden rounded-lg">
                        <SettingsItem
                            icon={
                                <User size={24} color={colors.orangePrimary} />
                            }
                            title="Thông tin cá nhân"
                            subtitle="Chỉnh sửa thông tin của bạn"
                            onPress={() => router.push('/profile-settings')}
                        />

                        <SettingsItem
                            title="Bảo mật & Quyền riêng tư"
                            subtitle="Cập nhật mức độ bảo mật và quyền riêng tư"
                            icon={
                                <Shield
                                    size={24}
                                    color={colors.orangePrimary}
                                />
                            }
                            onPress={() => {
                                navigate('/privacy-security');
                            }}
                        />
                        <SettingsItem
                            icon={
                                <Bell size={24} color={colors.orangePrimary} />
                            }
                            title="Thông báo"
                            subtitle="Cập nhật cài đặt thông báo của bạn"
                            onPress={() => {
                                navigate('/notifycation-setting');
                            }}
                        />

                        <SettingsItem
                            icon={
                                <Smartphone
                                    size={24}
                                    color={colors.orangePrimary}
                                />
                            }
                            title="Thiết bị đã đăng nhập"
                            subtitle="Quản lý các thiết bị đã đăng nhập vào tài khoản"
                            onPress={() => {
                                navigate('/linked-devices');
                            }}
                        />
                    </View>
                </SettingsSection>

                {/* Appearance */}
                <SettingsSection title="Giao diện">
                    <View className="overflow-hidden rounded-lg">
                        <SettingsItem
                            icon={
                                <Moon size={24} color={colors.orangePrimary} />
                            }
                            title="Chế độ tối"
                            subtitle="Bật/tắt giao diện tối"
                            toggleValue={darkMode}
                            onToggle={setDarkMode}
                            showChevron={false}
                        />
                        <SettingsItem
                            icon={
                                <Palette
                                    size={24}
                                    color={colors.orangePrimary}
                                />
                            }
                            title="Chủ đề"
                            subtitle="Tùy chỉnh màu sắc giao diện"
                            onPress={() => {
                                navigate('/apprearance-setting');
                            }}
                        />
                    </View>
                </SettingsSection>

                {/* Support */}
                <SettingsSection title="Hỗ trợ">
                    <View className="overflow-hidden rounded-lg">
                        <SettingsItem
                            icon={
                                <HelpCircle
                                    size={24}
                                    color={colors.orangePrimary}
                                />
                            }
                            title="Trung tâm trợ giúp"
                            subtitle="Câu hỏi thường gặp và hướng dẫn"
                            onPress={() => {
                                /* Navigate to help */
                            }}
                        />
                        <SettingsItem
                            icon={
                                <HelpCircle
                                    size={24}
                                    color={colors.orangePrimary}
                                />
                            }
                            title="Về ứng dụng"
                            subtitle="Phiên bản 1.0.0"
                            onPress={() => {
                                /* Show about */
                            }}
                        />
                    </View>
                </SettingsSection>

                {/* Logout */}
                <View className="mt-6 px-4 pb-8">
                    <TouchableOpacity
                        onPress={handleLogout}
                        className="flex-row items-center justify-center rounded-lg bg-red-500 py-4"
                    >
                        <LogOut size={24} color="#FFFFFF" />
                        <Text className="ml-2 text-base font-semibold text-white">
                            Đăng xuất
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );
}
