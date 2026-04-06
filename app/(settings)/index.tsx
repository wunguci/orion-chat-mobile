import { useRouter } from "expo-router";
import { navigate } from "expo-router/build/global-state/routing";
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
} from "lucide-react-native";
import React, { useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import SettingsItem from "@/components/setting/SettingsItem";
import SettingsSection from "@/components/setting/SettingsSection";
import { useThemeColors } from "@/hooks/useThemeColors";

export default function Setting() {
  const router = useRouter();
  const colors = useThemeColors();
  const [darkMode, setDarkMode] = useState(false);

  // Mock user data
  const user = {
    name: "Nguyễn Văn A",
    email: "nguyenvana@example.com",
    avatar: "https://via.placeholder.com/100",
    phone: "+84 123 456 789",
  };

  const handleLogout = () => {
    Alert.alert(
      "Đăng xuất",
      "Bạn có chắc chắn muốn đăng xuất?",
      [
        {
          text: "Hủy",
          style: "cancel",
        },
        {
          text: "Đăng xuất",
          style: "destructive",
          onPress: () => {
            // Handle logout logic here
            router.replace("/(auth)/login");
          },
        },
      ],
      { cancelable: true },
    );
  };

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="border-b border-gray-200 bg-white px-4 pb-4 pt-4">
        <Text className="text-2xl font-bold text-orange-primary">Cài đặt</Text>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Profile Section */}
        <View className="mt-4 bg-white px-4 py-6">
          <TouchableOpacity
            className="flex-row items-center"
            onPress={() => router.push("/(settings)/profile")}
          >
            <Image
              source={{ uri: user.avatar }}
              className="h-16 w-16 rounded-full"
            />
            <View className="ml-4 flex-1">
              <Text className="text-lg font-semibold text-gray-800">
                {user.name}
              </Text>
              <Text className="mt-1 text-sm text-gray-500">{user.email}</Text>
              <Text className="mt-0.5 text-sm text-gray-500">{user.phone}</Text>
            </View>
            <ChevronRight size={24} color={colors.graySecondary} />
          </TouchableOpacity>
        </View>

        {/* Account Settings */}
        <SettingsSection title="Cài đặt Chung">
          <View className="overflow-hidden rounded-lg">
            <SettingsItem
              icon={<User size={24} color={colors.orangePrimary} />}
              title="Thông tin cá nhân"
              subtitle="Chỉnh sửa thông tin của bạn"
              onPress={() => router.push("/(settings)/profile-settings")}
            />

            <SettingsItem
              title="Bảo mật & Quyền riêng tư"
              subtitle="Cập nhật mức độ bảo mật và quyền riêng tư"
              icon={<Shield size={24} color={colors.orangePrimary} />}
              onPress={() => {
                navigate("/(settings)/privacy-security");
              }}
            />
            <SettingsItem
              icon={<Bell size={24} color={colors.orangePrimary} />}
              title="Thông báo"
              subtitle="Cập nhật cài đặt thông báo của bạn"
              onPress={() => {
                navigate("/(settings)/notification-setting");
              }}
            />

            <SettingsItem
              icon={<Smartphone size={24} color={colors.orangePrimary} />}
              title="Thiết bị đã đăng nhập"
              subtitle="Quản lý các thiết bị đã đăng nhập vào tài khoản"
              onPress={() => {
                navigate("/(settings)/linked-devices");
              }}
            />
          </View>
        </SettingsSection>

        {/* Appearance */}
        <SettingsSection title="Giao diện">
          <View className="overflow-hidden rounded-lg">
            <SettingsItem
              icon={<Moon size={24} color={colors.orangePrimary} />}
              title="Chế độ tối"
              subtitle="Bật/tắt giao diện tối"
              toggleValue={darkMode}
              onToggle={setDarkMode}
              showChevron={false}
            />
            <SettingsItem
              icon={<Palette size={24} color={colors.orangePrimary} />}
              title="Chủ đề"
              subtitle="Tùy chỉnh màu sắc giao diện"
              onPress={() => {
                navigate("/(settings)/appearance-setting");
              }}
            />
          </View>
        </SettingsSection>

        {/* Support */}
        <SettingsSection title="Hỗ trợ">
          <View className="overflow-hidden rounded-lg">
            <SettingsItem
              icon={<HelpCircle size={24} color={colors.orangePrimary} />}
              title="Trung tâm trợ giúp"
              subtitle="Câu hỏi thường gặp và hướng dẫn"
              onPress={() => {
                /* Navigate to help */
              }}
            />
            <SettingsItem
              icon={<HelpCircle size={24} color={colors.orangePrimary} />}
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
