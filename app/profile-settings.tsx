import SettingsHeader from "@/components/setting/SettingsHeader";
import SettingsSection from "@/components/setting/SettingsSection";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Bell, Camera, Eye, Volume2 } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Image,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { API_BASE_URL } from "@/services/api/profile";
import CustomToggle from "../components/common/CustomToggle";
import { useThemeColors } from "../hooks/useThemeColors";
import { useAuth, useAuthUser } from "../hooks/useAuth";

const resolveImageUrl = (value: string | undefined, fallback = "") => {
  if (!value) return fallback;
  if (/^https?:\/\//i.test(value)) return value;

  const normalizedPath = value.startsWith("/") ? value : `/${value}`;
  return `${API_BASE_URL}${normalizedPath}`;
};

export default function ProfileSettings() {
  const colors = useThemeColors();
  const { updateUserProfile } = useAuth();
  const { user, reload } = useAuthUser();

  // Form state
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [gender, setGender] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string>("");
  const [selectedFiles, setSelectedFiles] = useState<{
    avatar?: { uri: string; name: string; type: string };
    cover?: { uri: string; name: string; type: string };
  }>({});

  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Preferences state
  const [pushNotifications, setPushNotifications] = useState(true);
  const [readReceipts, setReadReceipts] = useState(true);
  const [soundEffects, setSoundEffects] = useState(true);

  // Khởi tạo form với dữ liệu người dùng hiện tại
  useEffect(() => {
    if (user) {
      setDisplayName(user.fullName || "");
      setEmail(user.email || "");
      setPhoneNumber(user.phoneNumber || "");
      setBirthDate(user.birthDate || "");
      setGender(user.gender || "");
      setAvatarPreview(resolveImageUrl(user.avatarUrl));
    }
  }, [user]);

  const handleBirthDateChange = (event: any, selectedDate?: Date) => {
    if (selectedDate) {
      const dateString = selectedDate.toISOString().split("T")[0]; // Format: YYYY-MM-DD
      setBirthDate(dateString);
    }
    setShowDatePicker(false);
  };

  const inferMimeType = (uri: string, fallback?: string | null) => {
    if (fallback && fallback.includes("/")) {
      return fallback;
    }

    const normalized = uri.split("?")[0].toLowerCase();
    if (normalized.endsWith(".png")) return "image/png";
    if (normalized.endsWith(".gif")) return "image/gif";
    if (normalized.endsWith(".webp")) return "image/webp";
    if (normalized.endsWith(".heic")) return "image/heic";
    return "image/jpeg";
  };

  const handleUploadAvatar = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        const asset = result.assets[0];
        const fileName =
          asset.fileName ||
          asset.uri.split("/").pop() ||
          `avatar-${Date.now()}.jpg`;
        const mimeType = inferMimeType(asset.uri, asset.mimeType);

        setAvatarPreview(asset.uri);
        setSelectedFiles((prev) => ({
          ...prev,
          avatar: {
            uri: asset.uri,
            name: fileName,
            type: mimeType,
          },
        }));
      }
    } catch {
      Alert.alert("Error", "Failed to pick image");
    }
  };

  const handleRemoveAvatar = () => {
    Alert.alert("Remove Avatar", "Bạn có chắc muốn xóa ảnh đại diện?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xóa",
        style: "destructive",
        onPress: () => {
          setAvatarPreview("");
          setSelectedFiles((prev) => {
            const newFiles = { ...prev };
            delete newFiles.avatar;
            return newFiles;
          });
        },
      },
    ]);
  };

  const handleSaveChanges = async () => {
    if (!displayName.trim()) {
      setError("Display name is required");
      return;
    }

    setIsSaving(true);
    setError("");
    setSuccessMessage("");

    try {
      await updateUserProfile(
        {
          fullName: displayName,
          email: email || undefined,
          phoneNumber: phoneNumber || undefined,
          birthDate: birthDate || undefined,
          gender: gender || undefined,
        },
        selectedFiles || undefined,
      );

      await reload();
      setSelectedFiles({});
      setSuccessMessage("Profile updated successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to update profile";
      setError(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscardChanges = () => {
    Alert.alert("Hủy thay đổi", "Bạn có chắc muốn hủy tất cả thay đổi?", [
      { text: "Không", style: "cancel" },
      {
        text: "Có",
        onPress: () => {
          if (user) {
            setDisplayName(user.fullName || "");
            setEmail(user.email || "");
            setPhoneNumber(user.phoneNumber || "");
            setBirthDate(user.birthDate || "");
            setGender(user.gender || "");
            setAvatarPreview(resolveImageUrl(user.avatarUrl));
            setSelectedFiles({});
          }
          setError("");
          setSuccessMessage("");
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
            <View className="h-32 w-32 overflow-hidden rounded-full bg-orange-bg-heavy">
              {avatarPreview ? (
                <Image
                  source={{ uri: avatarPreview }}
                  className="h-full w-full"
                  resizeMode="cover"
                />
              ) : (
                <View className="h-full w-full items-center justify-center bg-gray-300">
                  <Camera size={40} color="#999" />
                </View>
              )}
            </View>
            <TouchableOpacity
              onPress={handleUploadAvatar}
              className="absolute bottom-0 right-0 h-10 w-10 items-center justify-center rounded-full bg-orange-primary"
            >
              <Camera size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <View className="flex flex-col gap-2 items-center">
            <Text className="text-lg font-bold text-gray-primary">
              {displayName}
            </Text>
            <Text className="text-sm text-gray-secondary">
              JPG, GIF or PNG. Max size of 800K
            </Text>

            {/* Button Group */}
            <View className="flex-row justify-center items-center gap-3">
              <TouchableOpacity
                onPress={handleUploadAvatar}
                className="rounded-[12px] bg-orange-primary px-6 py-3"
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
          {/* Error Message */}
          {error && (
            <View className="mb-4 rounded-lg bg-red-100 border border-red-300 p-3">
              <Text className="text-sm font-semibold text-red-600">
                {error}
              </Text>
            </View>
          )}

          {/* Success Message */}
          {successMessage && (
            <View className="mb-4 rounded-lg bg-green-100 border border-green-300 p-3">
              <Text className="text-sm font-semibold text-green-600">
                {successMessage}
              </Text>
            </View>
          )}

          {/* Display Name */}
          <View className="mb-5">
            <Text className="mb-2 text-sm font-semibold text-gray-primary">
              Display Name
            </Text>
            <TextInput
              value={displayName}
              onChangeText={setDisplayName}
              className="rounded-lg border border-orange-border-light bg-orange-bg-light px-4 py-3 text-gray-primary"
              placeholder="Enter your display name"
              placeholderTextColor={colors.graySecondary}
            />
          </View>

          {/* Email */}
          <View className="mb-5">
            <Text className="mb-2 text-sm font-semibold text-gray-primary">
              Email
            </Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              className="rounded-lg border border-orange-border-light bg-orange-bg-light px-4 py-3 text-gray-primary"
              placeholder="Enter your email"
              placeholderTextColor={colors.graySecondary}
              keyboardType="email-address"
            />
          </View>

          {/* Phone Number */}
          <View className="mb-5">
            <Text className="mb-2 text-sm font-semibold text-gray-primary">
              Phone Number
            </Text>
            <TextInput
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              className="rounded-lg border border-orange-border-light bg-orange-bg-light px-4 py-3 text-gray-primary"
              placeholder="Enter your phone number"
              placeholderTextColor={colors.graySecondary}
              keyboardType="phone-pad"
            />
          </View>

          {/* Birth Date */}
          <View className="mb-5">
            <Text className="mb-2 text-sm font-semibold text-gray-primary">
              Birth Date
            </Text>
            {Platform.OS === "android" ? (
              <>
                <TouchableOpacity onPress={() => setShowDatePicker(true)}>
                  <TextInput
                    value={birthDate}
                    editable={false}
                    className="rounded-lg border border-orange-border-light bg-orange-bg-light px-4 py-3 text-gray-primary"
                    placeholder="Select your birth date (YYYY-MM-DD)"
                    placeholderTextColor={colors.graySecondary}
                  />
                </TouchableOpacity>
                <Text className="mt-1 text-xs text-gray-secondary">
                  Format: YYYY-MM-DD
                </Text>

                {/* Date Picker Modal - Android Only */}
                {showDatePicker && (
                  <View className="mt-4 rounded-lg border border-orange-border-light bg-orange-bg-light p-4">
                    <DateTimePicker
                      value={birthDate ? new Date(birthDate) : new Date()}
                      mode="date"
                      display="default"
                      onChange={handleBirthDateChange}
                      maximumDate={new Date()}
                    />
                  </View>
                )}
              </>
            ) : (
              <>
                <TextInput
                  value={birthDate}
                  onChangeText={setBirthDate}
                  className="rounded-lg border border-orange-border-light bg-orange-bg-light px-4 py-3 text-gray-primary"
                  placeholder="Enter birth date (YYYY-MM-DD)"
                  placeholderTextColor={colors.graySecondary}
                />
                <Text className="mt-1 text-xs text-gray-secondary">
                  Format: YYYY-MM-DD
                </Text>
              </>
            )}
          </View>

          {/* Gender */}
          <View className="mb-6">
            <Text className="mb-2 text-sm font-semibold text-gray-primary">
              Gender
            </Text>
            <TouchableOpacity
              onPress={() => {
                Alert.alert("Select Gender", "Choose your gender", [
                  {
                    text: "Male",
                    onPress: () => setGender("MALE"),
                  },
                  {
                    text: "Female",
                    onPress: () => setGender("FEMALE"),
                  },
                  {
                    text: "Other",
                    onPress: () => setGender("OTHER"),
                  },
                  {
                    text: "Cancel",
                    style: "cancel",
                  },
                ]);
              }}
              className="rounded-lg border border-orange-border-light bg-orange-bg-light px-4 py-3"
            >
              <Text
                className={`text-base ${gender ? "text-gray-primary" : "text-gray-secondary"}`}
              >
                {gender
                  ? gender === "MALE"
                    ? "Male"
                    : gender === "FEMALE"
                      ? "Female"
                      : "Other"
                  : "Select Gender"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Preferences Section */}
        <SettingsSection title="Preferences">
          {/* Push Notifications */}
          <View className="mb-3 flex-row items-center justify-between rounded-xl bg-orange-bg-light p-4 border border-orange-border-light">
            <View className="flex-1 flex-row items-center">
              <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-orange-bg-heavy">
                <Bell size={20} color={colors.orangePrimary} />
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
          <View className="mb-3 flex-row items-center justify-between rounded-xl bg-orange-bg-light p-4 border border-orange-border-light">
            <View className="flex-1 flex-row items-center">
              <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-orange-bg-heavy">
                <Eye size={20} color={colors.orangePrimary} />
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
          <View className="mb-6 flex-row items-center justify-between rounded-xl bg-orange-bg-light p-4 border border-orange-border-light">
            <View className="flex-1 flex-row items-center">
              <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-orange-bg-heavy">
                <Volume2 size={20} color={colors.orangePrimary} />
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
            disabled={isSaving}
            className="mr-3 flex-1 items-center justify-center rounded-lg border border-gray-300 py-4"
          >
            <Text className="text-base font-semibold text-gray-primary">
              Discard Changes
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleSaveChanges}
            disabled={isSaving}
            className={`flex-1 items-center justify-center rounded-lg py-4 ${
              isSaving ? "bg-gray-400" : "bg-orange-primary"
            }`}
          >
            {isSaving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-base font-semibold text-white">
                Save Changes
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
