import { API_BASE_URL } from "@/services/api/profile";
import { useAuth, useAuthUser } from "@/hooks/useAuth";
import { useThemeColors } from "@/hooks/useThemeColors";
import * as ImagePicker from "expo-image-picker";
import { Camera } from "lucide-react-native";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type EditableField = "fullName" | "email" | "phoneNumber" | "birthDate" | "gender";

type ProfileForm = Record<EditableField, string>;

const EDITABLE_FIELDS: Array<{
  key: EditableField;
  label: string;
  placeholder: string;
  keyboardType?: "default" | "email-address" | "phone-pad";
}> = [
  {
    key: "fullName",
    label: "Display Name",
    placeholder: "Enter your display name",
  },
  {
    key: "email",
    label: "Email",
    placeholder: "Enter your email",
    keyboardType: "email-address",
  },
  {
    key: "phoneNumber",
    label: "Phone Number",
    placeholder: "Enter your phone number",
    keyboardType: "phone-pad",
  },
  {
    key: "birthDate",
    label: "Birth Date",
    placeholder: "YYYY-MM-DD",
  },
  {
    key: "gender",
    label: "Gender",
    placeholder: "Select gender",
  },
];

const emptyForm: ProfileForm = {
  fullName: "",
  email: "",
  phoneNumber: "",
  birthDate: "",
  gender: "",
};

const hasOwnField = (value: unknown, key: string) =>
  !!value && Object.prototype.hasOwnProperty.call(value, key);

const normalizeDate = (value: unknown) => {
  if (!value) return "";
  if (typeof value !== "string") return String(value);
  return value.includes("T") ? value.split("T")[0] : value;
};

const normalizeGender = (value: string) => value.trim().toLowerCase();

const displayGender = (value: string) => {
  const normalized = normalizeGender(value);
  if (normalized === "male") return "Male";
  if (normalized === "female") return "Female";
  if (normalized === "other") return "Other";
  return value || "Select gender";
};

const resolveImageUrl = (value: string | undefined | null, fallback = "") => {
  if (!value) return fallback;
  if (/^https?:\/\//i.test(value)) return value;

  const normalizedPath = value.startsWith("/") ? value : `/${value}`;
  return `${API_BASE_URL}${normalizedPath}`;
};

export default function ProfileSettings() {
  const colors = useThemeColors();
  const { updateUserProfile } = useAuth();
  const { user, loading, error: loadError, reload } = useAuthUser();

  const [form, setForm] = useState<ProfileForm>(emptyForm);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState<{
    uri: string;
    name: string;
    type: string;
  } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const editableFields = useMemo(
    () => EDITABLE_FIELDS.filter((field) => hasOwnField(user, field.key)),
    [user],
  );
  const canEditAvatar = hasOwnField(user, "avatarUrl");

  useEffect(() => {
    if (!user) return;

    setForm({
      fullName: user.fullName || "",
      email: user.email || "",
      phoneNumber: user.phoneNumber || "",
      birthDate: normalizeDate(user.birthDate),
      gender: user.gender || "",
    });
    setAvatarPreview(resolveImageUrl(user.avatarUrl));
    setSelectedAvatar(null);
    setErrorMessage("");
    setSuccessMessage("");
  }, [user]);

  const updateField = (key: EditableField, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const inferMimeType = (uri: string, fallback?: string | null) => {
    if (fallback && fallback.includes("/")) return fallback;

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

      if (result.canceled) return;

      const asset = result.assets[0];
      const fileName =
        asset.fileName ||
        asset.uri.split("/").pop() ||
        `avatar-${Date.now()}.jpg`;

      setAvatarPreview(asset.uri);
      setSelectedAvatar({
        uri: asset.uri,
        name: fileName,
        type: inferMimeType(asset.uri, asset.mimeType),
      });
    } catch {
      Alert.alert("Error", "Failed to pick image");
    }
  };

  const handleSelectGender = () => {
    Alert.alert("Select Gender", "Choose your gender", [
      { text: "Male", onPress: () => updateField("gender", "male") },
      { text: "Female", onPress: () => updateField("gender", "female") },
      { text: "Other", onPress: () => updateField("gender", "other") },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const handleSaveChanges = async () => {
    const updateData: Partial<ProfileForm> = {};

    for (const field of editableFields) {
      const value =
        field.key === "gender"
          ? normalizeGender(form[field.key])
          : form[field.key].trim();

      if (value) {
        updateData[field.key] = value;
      }
    }

    if (hasOwnField(user, "fullName") && !form.fullName.trim()) {
      setErrorMessage("Display name is required");
      return;
    }

    setIsSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      await updateUserProfile(
        updateData,
        selectedAvatar ? { avatar: selectedAvatar } : undefined,
      );
      await reload();
      setSelectedAvatar(null);
      setSuccessMessage("Profile updated successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to update profile",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscardChanges = () => {
    if (!user) return;

    Alert.alert("Discard Changes", "Are you sure you want to discard changes?", [
      { text: "No", style: "cancel" },
      {
        text: "Yes",
        onPress: () => {
          setForm({
            fullName: user.fullName || "",
            email: user.email || "",
            phoneNumber: user.phoneNumber || "",
            birthDate: normalizeDate(user.birthDate),
            gender: user.gender || "",
          });
          setAvatarPreview(resolveImageUrl(user.avatarUrl));
          setSelectedAvatar(null);
          setErrorMessage("");
          setSuccessMessage("");
        },
      },
    ]);
  };

  const renderInputField = (field: (typeof EDITABLE_FIELDS)[number]) => {
    if (field.key === "gender") {
      return (
        <View key={field.key} className="mb-5">
          <Text
            className="mb-2 text-sm font-semibold"
            style={{ color: colors.text }}
          >
            {field.label}
          </Text>
          <TouchableOpacity
            onPress={handleSelectGender}
            className="rounded-lg px-4 py-3"
            style={{
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: colors.backgroundSecondary,
            }}
          >
            <Text
              className="text-base"
              style={{ color: form.gender ? colors.text : colors.textSecondary }}
            >
              {displayGender(form.gender)}
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View key={field.key} className="mb-5">
        <Text
          className="mb-2 text-sm font-semibold"
          style={{ color: colors.text }}
        >
          {field.label}
        </Text>
        <TextInput
          value={form[field.key]}
          onChangeText={(value) => updateField(field.key, value)}
          className="rounded-lg px-4 py-3"
          style={{
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.backgroundSecondary,
            color: colors.text,
          }}
          placeholder={field.placeholder}
          placeholderTextColor={colors.textSecondary}
          keyboardType={field.keyboardType || "default"}
          autoCapitalize={field.key === "email" ? "none" : "sentences"}
        />
      </View>
    );
  };

  return (
    <SafeAreaView
      className="flex-1"
      edges={["left", "right", "bottom"]}
      style={{ backgroundColor: colors.background }}
    >
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {loading && !user ? (
          <View className="items-center justify-center py-16">
            <ActivityIndicator color={colors.primary} />
            <Text className="mt-3 text-sm" style={{ color: colors.textSecondary }}>
              Loading profile...
            </Text>
          </View>
        ) : (
          <>
            {canEditAvatar && (
              <View className="flex flex-col gap-4 items-center pb-8 pt-0">
                <View className="relative">
                  <View
                    className="h-32 w-32 overflow-hidden rounded-full"
                    style={{ backgroundColor: colors.primaryLight }}
                  >
                    {avatarPreview ? (
                      <Image
                        source={{ uri: avatarPreview }}
                        className="h-full w-full"
                        resizeMode="cover"
                      />
                    ) : (
                      <View
                        className="h-full w-full items-center justify-center"
                        style={{ backgroundColor: colors.backgroundSecondary }}
                      >
                        <Camera size={40} color={colors.textSecondary} />
                      </View>
                    )}
                  </View>
                  <TouchableOpacity
                    onPress={handleUploadAvatar}
                    className="absolute bottom-0 right-0 h-10 w-10 items-center justify-center rounded-full"
                    style={{ backgroundColor: colors.primary }}
                  >
                    <Camera size={20} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>

                <Text
                  className="text-lg font-bold"
                  style={{ color: colors.text }}
                >
                  {form.fullName || form.phoneNumber || "Profile"}
                </Text>
              </View>
            )}

            <View className="px-6">
              {(errorMessage || loadError) && (
                <View className="mb-4 rounded-lg border border-red-300 bg-red-100 p-3">
                  <Text className="text-sm font-semibold text-red-600">
                    {errorMessage || loadError}
                  </Text>
                </View>
              )}

              {successMessage && (
                <View className="mb-4 rounded-lg border border-green-300 bg-green-100 p-3">
                  <Text className="text-sm font-semibold text-green-600">
                    {successMessage}
                  </Text>
                </View>
              )}

              {editableFields.length > 0 ? (
                editableFields.map(renderInputField)
              ) : (
                <View className="rounded-lg p-4" style={{ backgroundColor: colors.card }}>
                  <Text style={{ color: colors.textSecondary }}>
                    No editable profile fields are available.
                  </Text>
                </View>
              )}
            </View>

            <View className="flex-row px-6 pb-8 pt-2">
              <TouchableOpacity
                onPress={handleDiscardChanges}
                disabled={isSaving}
                className="mr-3 flex-1 items-center justify-center rounded-lg py-4"
                style={{ borderWidth: 1, borderColor: colors.border }}
              >
                <Text
                  className="text-base font-semibold"
                  style={{ color: colors.text }}
                >
                  Discard Changes
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSaveChanges}
                disabled={isSaving || editableFields.length === 0}
                className="flex-1 items-center justify-center rounded-lg py-4"
                style={{
                  backgroundColor:
                    isSaving || editableFields.length === 0
                      ? colors.textSecondary
                      : colors.primary,
                }}
              >
                {isSaving ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text className="text-base font-semibold text-white">
                    Save Changes
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
