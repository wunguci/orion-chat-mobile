import { useRouter } from "expo-router";
import { navigate } from "expo-router/build/global-state/routing";
import {
  Bell,
  ChevronRight,
  HelpCircle,
  LogOut,
  Menu,
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
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import SettingsItem from "../../components/setting/SettingsItem";
import SettingsSection from "../../components/setting/SettingsSection";
import { useThemeColors } from "../../hooks/useThemeColors";
import { useAuth, useAuthUser } from "../../hooks/useAuth";
import { API_BASE_URL } from "../../services/api/profile";
import { useSlideMenu } from "@/context/SlideMenuContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const resolveImageUrl = (value: string | undefined, fallback: string) => {
  if (!value) return fallback;
  if (/^https?:\/\//i.test(value)) return value;

  const normalizedPath = value.startsWith("/") ? value : `/${value}`;
  return `${API_BASE_URL}${normalizedPath}`;
};

export default function Setting() {
  const router = useRouter();
  const colors = useThemeColors();
  const { openMenu } = useSlideMenu();
  const insets = useSafeAreaInsets();
  const [darkMode, setDarkMode] = useState(false);
  const { user, loading } = useAuthUser();
  const { logout } = useAuth();

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
          onPress: async () => {
            try {
              console.log("[Setting] Logging out...");

              // Call logout to clear token and auth state
              await logout();

              console.log("[Setting] Logout successful, navigating to login");
              // Navigate to login screen
              router.replace("/(auth)/login");
            } catch (error) {
              console.error("[Setting] Logout error:", error);
              Alert.alert(
                "Error",
                "An error occurred during logout. Please try again.",
              );
            }
          },
        },
      ],
      { cancelable: true },
    );
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }}
      edges={[]}
    >
      {/* Header with hamburger */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 12,
          paddingTop: insets.top + 12,
          paddingBottom: 10,
          backgroundColor: colors.card,
          borderBottomWidth: 0,
          borderBottomColor: colors.border,
        }}
      >
        <TouchableOpacity
          onPress={openMenu}
          activeOpacity={0.7}
          style={{
            width: 38,
            height: 38,
            borderRadius: 10,
            backgroundColor: colors.primaryLight,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Menu size={20} color={colors.primary} strokeWidth={2.5} />
        </TouchableOpacity>
        <Text
          style={{
            flex: 1,
            textAlign: "center",
            fontSize: 17,
            fontWeight: "700",
            color: colors.text,
          }}
        >
          Profile
        </Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {/* Profile Section */}
        <View
          className="mt-4 px-4 py-6"
          style={{ backgroundColor: colors.card }}
        >
          {loading ? (
            <View className="flex-row items-center py-4">
              <ActivityIndicator size="large" color={colors.primary} />
              <Text className="ml-4" style={{ color: colors.textSecondary }}>
                Loading profile...
              </Text>
            </View>
          ) : (
            <TouchableOpacity
              className="flex-row items-center"
              onPress={() => router.push("/(settings)/profile")}
            >
              <Image
                source={{
                  uri: resolveImageUrl(
                    user?.avatarUrl,
                    "https://via.placeholder.com/100",
                  ),
                }}
                className="h-16 w-16 rounded-full bg-gray-300"
              />
              <View className="ml-4 flex-1">
                <Text
                  className="text-lg font-semibold"
                  style={{ color: colors.text }}
                >
                  {user?.fullName || "User"}
                </Text>
                <Text
                  className="mt-1 text-sm"
                  style={{ color: colors.textSecondary }}
                >
                  {user?.email || "No email"}
                </Text>
                <Text
                  className="mt-0.5 text-sm"
                  style={{ color: colors.textSecondary }}
                >
                  {user?.phoneNumber || "No phone"}
                </Text>
              </View>
              <ChevronRight size={24} color={colors.graySecondary} />
            </TouchableOpacity>
          )}
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
                            icon={
                                <Smartphone
                                    size={24}
                                    color={colors.primary}
                                />
                            }
                            title="Logged-in Devices"
                            subtitle="Manage devices logged into your account"
                            onPress={() => {
                                navigate('/(settings)/linked-devices');
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
    </SafeAreaView>
  );
}
