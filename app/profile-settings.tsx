import SettingsHeader from "@/components/setting/SettingsHeader";
import SettingsSection from "@/components/setting/SettingsSection";
import { Bell, Camera, Eye, Volume2 } from "lucide-react-native";
import React, { useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import CustomToggle from "../components/common/CustomToggle";
import { useThemeColors } from "../hooks/useThemeColors";

export default function ProfileSettings() {
  const colors = useThemeColors();

  // Form state
  const [displayName, setDisplayName] = useState("Huynh Zang");
  const [username, setUsername] = useState("@zangthanks");
  const [statusMessage, setStatusMessage] = useState(
    "Working on something cozy",
  );
  const [avatar, setAvatar] = useState("https://via.placeholder.com/150");

  // Preferences state
  const [pushNotifications, setPushNotifications] = useState(true);
  const [readReceipts, setReadReceipts] = useState(true);
  const [soundEffects, setSoundEffects] = useState(true);

  const handleUploadAvatar = () => {
    Alert.alert("Upload Avatar", "Chức năng upload ảnh sẽ được thêm vào");
  };

  const handleRemoveAvatar = () => {
    Alert.alert("Remove Avatar", "Bạn có chắc muốn xóa ảnh đại diện?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xóa",
        style: "destructive",
        onPress: () =>
          setAvatar(
            "https://via.placeholder.com/150/CCCCCC/FFFFFF?text=No+Avatar",
          ),
      },
    ]);
  };

  const handleSaveChanges = () => {
    Alert.alert("Thành công", "Đã lưu thay đổi của bạn!");
  };

  const handleDiscardChanges = () => {
    Alert.alert("Hủy thay đổi", "Bạn có chắc muốn hủy tất cả thay đổi?", [
      { text: "Không", style: "cancel" },
      {
        text: "Có",
        onPress: () => {
          // Reset to original values
          setDisplayName("Huynh Zang");
          setUsername("@zangthanks");
          setStatusMessage("Working on something cozy");
        },
      },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <SettingsHeader title="Profile Settings" showBack={true} />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Avatar Section */}
        <View className="flex flex-col gap-4 items-center py-8">
          <View className="relative">
            <View className="h-32 w-32 overflow-hidden rounded-full bg-green-bg-heavy">
              <Image
                source={{ uri: avatar }}
                className="h-full w-full"
                resizeMode="cover"
              />
            </View>
            <TouchableOpacity
              onPress={handleUploadAvatar}
              className="absolute bottom-0 right-0 h-10 w-10 items-center justify-center rounded-full bg-green-primary"
            >
              <Camera size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <View className="flex flex-col gap-2 items-center">
            <Text className="text-lg font-bold text-gray-primary">
              ZangThanks
            </Text>
            <Text className="text-sm text-gray-secondary">
              JPG, GIF or PNG. Max size of 800K
            </Text>

            {/* Button Group */}
            <View className="flex-row justify-center items-center gap-3">
              <TouchableOpacity
                onPress={handleUploadAvatar}
                className="rounded-[12px] bg-green-primary px-6 py-3"
              >
                <Text className="text-sm font-semibold text-white">
                  Upload New
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleRemoveAvatar}
                className="rounded-[12px] border border-gray-300 px-6 py-3"
              >
                <Text className="text-sm font-semibold text-gray-primary">
                  Remove
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Form Fields */}
        <View className="px-6">
          {/* Display Name */}
          <View className="mb-5">
            <Text className="mb-2 text-sm font-semibold text-gray-primary">
              Display Name
            </Text>
            <TextInput
              value={displayName}
              onChangeText={setDisplayName}
              className="rounded-lg border border-green-border-light bg-green-bg-light px-4 py-3 text-gray-primary"
              placeholder="Enter your display name"
              placeholderTextColor={colors.graySecondary}
            />
          </View>

          {/* Username */}
          <View className="mb-5">
            <Text className="mb-2 text-sm font-semibold text-gray-primary">
              Username
            </Text>
            <TextInput
              value={username}
              onChangeText={setUsername}
              className="rounded-lg border border-green-border-light bg-green-bg-light px-4 py-3 text-gray-primary"
              placeholder="Enter your username"
              placeholderTextColor={colors.graySecondary}
              autoCapitalize="none"
            />
          </View>

          {/* Status Message */}
          <View className="mb-6">
            <Text className="mb-2 text-sm font-semibold text-gray-primary">
              Status Message
            </Text>
            <TextInput
              value={statusMessage}
              onChangeText={setStatusMessage}
              className="rounded-lg border border-green-border-light bg-green-bg-light px-4 py-3 text-gray-primary"
              placeholder="Enter your status message"
              placeholderTextColor={colors.graySecondary}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* Preferences Section */}
        <SettingsSection title="Preferences">
          {/* Push Notifications */}
          <View className="mb-3 flex-row items-center justify-between rounded-xl bg-green-bg-light p-4 border border-green-border-light">
            <View className="flex-1 flex-row items-center">
              <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-green-bg-heavy">
                <Bell size={20} color={colors.greenPrimary} />
              </View>
              <View className="flex-1">
                <Text className="text-base font-semibold text-gray-primary">
                  Push Notifications
                </Text>
                <Text className="mt-0.5 text-sm text-gray-secondary">
                  Receive alerts for new messages
                </Text>
              </View>
            </View>
            <CustomToggle
              value={pushNotifications}
              onValueChange={setPushNotifications}
            />
          </View>

          {/* Read Receipts */}
          <View className="mb-3 flex-row items-center justify-between rounded-xl bg-green-bg-light p-4 border border-green-border-light">
            <View className="flex-1 flex-row items-center">
              <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-green-bg-heavy">
                <Eye size={20} color={colors.greenPrimary} />
              </View>
              <View className="flex-1">
                <Text className="text-base font-semibold text-gray-primary">
                  Read Receipts
                </Text>
                <Text className="mt-0.5 text-sm text-gray-secondary">
                  Others can see when you have read messages
                </Text>
              </View>
            </View>
            <CustomToggle
              value={readReceipts}
              onValueChange={setReadReceipts}
            />
          </View>

          {/* Sound Effects */}
          <View className="mb-6 flex-row items-center justify-between rounded-xl bg-green-bg-light p-4 border border-green-border-light">
            <View className="flex-1 flex-row items-center">
              <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-green-bg-heavy">
                <Volume2 size={20} color={colors.greenPrimary} />
              </View>
              <View className="flex-1">
                <Text className="text-base font-semibold text-gray-primary">
                  Sound Effects
                </Text>
                <Text className="mt-0.5 text-sm text-gray-secondary">
                  Play sounds for incoming messages
                </Text>
              </View>
            </View>
            <CustomToggle
              value={soundEffects}
              onValueChange={setSoundEffects}
            />
          </View>
        </SettingsSection>

        {/* Action Buttons */}
        <View className="flex-row px-6 pb-8 pt-2">
          <TouchableOpacity
            onPress={handleDiscardChanges}
            className="mr-3 flex-1 items-center justify-center rounded-lg border border-gray-300 py-4"
          >
            <Text className="text-base font-semibold text-gray-primary">
              Discard Changes
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleSaveChanges}
            className="flex-1 items-center justify-center rounded-lg bg-green-primary py-4"
          >
            <Text className="text-base font-semibold text-white">
              Save Changes
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
