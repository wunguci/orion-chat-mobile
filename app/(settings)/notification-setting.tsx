import SettingsItem from "@/components/setting/SettingsItem";
import SettingsSection from "@/components/setting/SettingsSection";
import { useNotificationSettings } from "@/hooks/useNotificationSettings";
import { useThemeColors } from "@/hooks/useThemeColors";
import {
  Bell,
  BellOff,
  MessageSquare,
  Phone,
  Play,
  UserPlus,
  Users,
} from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type FormData = {
  muteAll: boolean;
  messageNotifications: boolean;
  friendRequestNotifications: boolean;
  groupNotifications: boolean;
  tagNotifications: boolean;
  callNotifications: boolean;
  notificationSound: string;
};

const DEFAULT_FORM: FormData = {
  muteAll: false,
  messageNotifications: true,
  friendRequestNotifications: true,
  groupNotifications: true,
  tagNotifications: true,
  callNotifications: true,
  notificationSound: "Crystal Clear",
};

const SOUND_OPTIONS = ["Crystal Clear", "Bell", "Chime", "Ding"];

function settingsToForm(s: Record<string, any> | null): FormData {
  if (!s) return DEFAULT_FORM;
  return {
    muteAll: s.muteAll ?? false,
    messageNotifications: s.messageNotifications ?? true,
    friendRequestNotifications: s.friendRequestNotifications ?? true,
    groupNotifications: s.groupNotifications ?? true,
    tagNotifications: s.tagNotifications ?? true,
    callNotifications: s.callNotifications ?? true,
    notificationSound: s.notificationSound ?? "Crystal Clear",
  };
}

export default function NotificationSettingScreen() {
  const colors = useThemeColors();
  const { settings, loading, updateSettings } = useNotificationSettings();

  const [formData, setFormData] = useState<FormData>(DEFAULT_FORM);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (settings) {
      setFormData(settingsToForm(settings));
      setHasChanges(false);
    }
  }, [settings]);

  const handleToggle = useCallback((field: keyof FormData) => {
    setFormData((prev) => ({ ...prev, [field]: !prev[field] }));
    setHasChanges(true);
    setSaveError(null);
    setSaveSuccess(null);
  }, []);

  const handleSoundChange = useCallback((value: string) => {
    setFormData((prev) => ({ ...prev, notificationSound: value }));
    setHasChanges(true);
    setSaveError(null);
    setSaveSuccess(null);
  }, []);

  const handleDiscard = useCallback(() => {
    setFormData(settingsToForm(settings));
    setHasChanges(false);
    setSaveError(null);
    setSaveSuccess(null);
  }, [settings]);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(null);
    try {
      await updateSettings(formData);
      setHasChanges(false);
      setSaveSuccess("Settings saved successfully");
      setTimeout(() => setSaveSuccess(null), 3000);
    } catch (err: any) {
      setSaveError(err.message || "Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  }, [formData, updateSettings]);

  if (loading && !settings) {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text className="mt-3 text-sm" style={{ color: colors.textSecondary }}>
          Loading settings...
        </Text>
      </View>
    );
  }

  const disabledSectionStyle = formData.muteAll ? { opacity: 0.4 } : undefined;

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>

        {/* Mute All */}
        <View className="mx-4 mt-6">
          <View
            className="overflow-hidden rounded-2xl"
            style={{
              borderWidth: 1.5,
              borderColor: formData.muteAll ? colors.primary : colors.border,
              backgroundColor: formData.muteAll ? colors.primaryLight : colors.card,
            }}
          >
            <SettingsItem
              icon={<BellOff size={24} color={colors.primary} />}
              title="Mute All Notifications"
              subtitle={
                formData.muteAll
                  ? "All notifications are currently muted — turn this off to receive notifications"
                  : "Temporarily silence all notifications"
              }
              toggleValue={formData.muteAll}
              onToggle={() => handleToggle("muteAll")}
              showChevron={false}
            />
          </View>
        </View>

        {/* Sections disabled when muteAll is on */}
        <View style={disabledSectionStyle} pointerEvents={formData.muteAll ? "none" : "auto"}>

          {/* Message Notifications */}
          <SettingsSection title="Messages">
            <View className="overflow-hidden rounded-2xl">
              <SettingsItem
                icon={<MessageSquare size={24} color={colors.primary} />}
                title="Message Notifications"
                subtitle="Receive notifications for new messages"
                toggleValue={formData.messageNotifications}
                onToggle={() => handleToggle("messageNotifications")}
                showChevron={false}
              />
              <SettingsItem
                icon={<UserPlus size={24} color={colors.primary} />}
                title="Friend Request Notifications"
                subtitle="Receive notifications for friend requests"
                toggleValue={formData.friendRequestNotifications}
                onToggle={() => handleToggle("friendRequestNotifications")}
                showChevron={false}
              />
            </View>
          </SettingsSection>

          {/* Group Notifications */}
          <SettingsSection title="Groups">
            <View className="overflow-hidden rounded-2xl">
              <SettingsItem
                icon={<Users size={24} color={colors.primary} />}
                title="Group Notifications"
                subtitle="Receive notifications for group chats"
                toggleValue={formData.groupNotifications}
                onToggle={() => handleToggle("groupNotifications")}
                showChevron={false}
              />
              <SettingsItem
                icon={<Bell size={24} color={colors.primary} />}
                title="Tag Notifications"
                subtitle="Only notify me if someone tags me"
                toggleValue={formData.tagNotifications}
                onToggle={() => handleToggle("tagNotifications")}
                showChevron={false}
              />
            </View>
          </SettingsSection>

          {/* Call Notifications */}
          <SettingsSection title="Calls">
            <View className="overflow-hidden rounded-2xl">
              <SettingsItem
                icon={<Phone size={24} color={colors.primary} />}
                title="Call Notifications"
                subtitle="Receive notifications for incoming calls"
                toggleValue={formData.callNotifications}
                onToggle={() => handleToggle("callNotifications")}
                showChevron={false}
              />
            </View>
          </SettingsSection>

        </View>

        {/* Sound Settings */}
        <SettingsSection title="Sound">
          <View className="overflow-hidden rounded-2xl">
            <SettingsItem
              icon={<Play size={24} color={colors.primary} />}
              title="Notification Sound"
              subtitle="Choose the sound for notifications"
              isRingtone
              ringtoneValue={formData.notificationSound}
              ringtoneOptions={SOUND_OPTIONS}
              onRingtoneChange={handleSoundChange}
            />
          </View>
        </SettingsSection>

        {/* Save / Discard */}
        <View className="mx-4 mb-10 mt-6">
          {saveError && (
            <View className="mb-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
              <Text className="text-sm text-red-600">{saveError}</Text>
            </View>
          )}
          {saveSuccess && (
            <View
              className="mb-3 rounded-xl px-4 py-3"
              style={{
                backgroundColor: colors.primaryLight,
                borderWidth: 1,
                borderColor: colors.primary,
              }}
            >
              <Text className="text-sm font-medium" style={{ color: colors.primary }}>
                {saveSuccess}
              </Text>
            </View>
          )}

          <View className="flex-row justify-end gap-3">
            <TouchableOpacity
              onPress={handleDiscard}
              disabled={isSaving || !hasChanges}
              className="rounded-xl px-6 py-3"
              style={{
                backgroundColor: colors.card,
                borderWidth: 1,
                borderColor: colors.border,
                opacity: isSaving || !hasChanges ? 0.45 : 1,
              }}
            >
              <Text className="font-semibold" style={{ color: colors.text }}>
                Discard Changes
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => { void handleSave(); }}
              disabled={isSaving || !hasChanges}
              className="rounded-xl px-6 py-3"
              style={{
                backgroundColor: colors.primary,
                opacity: isSaving || !hasChanges ? 0.45 : 1,
              }}
            >
              <Text className="font-semibold text-white">
                {isSaving ? "Saving..." : "Save Changes"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>
    </View>
  );
}
