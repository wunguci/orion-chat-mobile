import { useRouter } from "expo-router";
import { navigate } from "expo-router/build/global-state/routing";
import {
  Bell,
  ChevronRight,
  HelpCircle,
  LogOut,
  Moon,
  Palette,
  Server,
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
    name: "John Doe",
    email: "nguyenvana@example.com",
    avatar: "https://via.placeholder.com/100",
    phone: "+84 123 456 789",
  };

  const handleLogout = () => {
    Alert.alert(
      "Log out",
      "Are you sure you want to log out?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Log out",
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
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      {/* Header */}
      <View
        className="px-4 pb-4 pt-4"
        style={{
          backgroundColor: colors.card,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <Text className="text-2xl font-bold" style={{ color: colors.primary }}>
          Settings
        </Text>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Profile Section */}
        <View
          className="mt-4 px-4 py-6"
          style={{ backgroundColor: colors.card }}
        >
          <TouchableOpacity
            className="flex-row items-center"
            onPress={() => router.push("/(settings)/profile")}
          >
            <Image
              source={{ uri: user.avatar }}
              className="h-16 w-16 rounded-full"
            />
            <View className="ml-4 flex-1">
              <Text
                className="text-lg font-semibold"
                style={{ color: colors.text }}
              >
                {user.name}
              </Text>
              <Text
                className="mt-1 text-sm"
                style={{ color: colors.textSecondary }}
              >
                {user.email}
              </Text>
              <Text
                className="mt-0.5 text-sm"
                style={{ color: colors.textSecondary }}
              >
                {user.phone}
              </Text>
            </View>
            <ChevronRight size={24} color={colors.graySecondary} />
          </TouchableOpacity>
        </View>

        {/* Account Settings */}
        <SettingsSection title="General Settings">
          <View className="overflow-hidden rounded-lg">
            <SettingsItem
              icon={<User size={24} color={colors.primary} />}
              title="Personal Information"
              subtitle="Edit your information"
              onPress={() => router.push("/(settings)/profile-settings")}
            />

            <SettingsItem
              title="Security & Privacy"
              subtitle="Update your security and privacy levels"
              icon={<Shield size={24} color={colors.primary} />}
              onPress={() => {
                navigate("/(settings)/privacy-security");
              }}
            />
            <SettingsItem
              icon={<Bell size={24} color={colors.primary} />}
              title="Notifications"
              subtitle="Update your notification settings"
              onPress={() => {
                navigate("/(settings)/notification-setting");
              }}
            />

            {/* <SettingsItem
              icon={<Smartphone size={24} color={colors.primary} />}
              title="Logged-in Devices"
              subtitle="Manage devices logged into your account"
              onPress={() => {
                navigate("/(settings)/linked-devices");
              }}
            /> */}
            <SettingsItem
              icon={<Server size={24} color={colors.orangePrimary} />}
              title="Mobile Configuration"
              subtitle="API, Socket, and TURN configuration for mobile"
              onPress={() => {
                navigate("/(settings)/mobile-config" as any);
              }}
            />
          </View>
        </SettingsSection>

        {/* Appearance */}
        <SettingsSection title="Appearance">
          <View className="overflow-hidden rounded-lg">
            {/* <SettingsItem
              icon={<Moon size={24} color={colors.primary} />}
              title="Dark Mode"
              subtitle="Toggle dark theme"
              toggleValue={darkMode}
              onToggle={setDarkMode}
              showChevron={false}
            /> */}
            <SettingsItem
              icon={<Palette size={24} color={colors.primary} />}
              title="Theme"
              subtitle="Customize interface colors"
              onPress={() => {
                navigate("/(settings)/appearance-setting");
              }}
            />
          </View>
        </SettingsSection>

        {/* Support */}
        {/* <SettingsSection title="Support">
          <View className="overflow-hidden rounded-lg">
            <SettingsItem
              icon={<HelpCircle size={24} color={colors.primary} />}
              title="Help Center"
              subtitle="FAQs and guides"
              onPress={() => {}}
            />
            <SettingsItem
              icon={<HelpCircle size={24} color={colors.primary} />}
              title="About App"
              subtitle="Version 1.0.0"
              onPress={() => {}}
            />
          </View>
        </SettingsSection> */}

        {/* Logout */}
        <View className="mt-6 px-4 pb-8">
          <TouchableOpacity
            onPress={handleLogout}
            className="flex-row items-center justify-center rounded-lg bg-red-500 py-4"
          >
            <LogOut size={24} color="#FFFFFF" />
            <Text className="ml-2 text-base font-semibold text-white">
              Log Out
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
