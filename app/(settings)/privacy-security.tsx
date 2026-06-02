import CustomToggle from "@/components/common/CustomToggle";
import SettingsSection from "@/components/setting/SettingsSection";
import { useThemeColors } from "@/hooks/useThemeColors";
import {
  ContactPermission,
  PrivacySettingsResponse,
  privacySettingsApi,
  ProfileVisibility,
} from "@/services/api/settings";
import {
  Check,
  Info,
  MessageCircle,
  Phone,
  UserRound,
} from "lucide-react-native";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type PrivacyForm = {
  profileVisibility: ProfileVisibility;
  messagePermission: ContactPermission;
  callPermission: ContactPermission;
  lastSeenVisibility: boolean;
  onlineStatusVisibility: boolean;
};

type Option<T extends string> = {
  key: T;
  label: string;
};

const defaultForm: PrivacyForm = {
  profileVisibility: "friends",
  messagePermission: "friends",
  callPermission: "friends",
  lastSeenVisibility: true,
  onlineStatusVisibility: true,
};

const profileOptions: Option<ProfileVisibility>[] = [
  { key: "public", label: "Public" },
  { key: "friends", label: "Friends" },
  { key: "private", label: "Private" },
];

const contactOptions: Option<ContactPermission>[] = [
  { key: "everyone", label: "Everyone" },
  { key: "friends", label: "Friends" },
  { key: "nobody", label: "Nobody" },
];

const normalizeContactPermission = (
  value?: string | null,
): ContactPermission => {
  if (value === "everyone" || value === "friends" || value === "nobody") {
    return value;
  }
  if (value === "none") {
    return "nobody";
  }
  return "friends";
};

const normalizeProfileVisibility = (
  value?: string | null,
): ProfileVisibility => {
  if (value === "public" || value === "friends" || value === "private") {
    return value;
  }
  return "friends";
};

const toForm = (settings?: PrivacySettingsResponse | null): PrivacyForm => ({
  profileVisibility: normalizeProfileVisibility(settings?.profileVisibility),
  messagePermission: normalizeContactPermission(settings?.messagePermission),
  callPermission: normalizeContactPermission(settings?.callPermission),
  lastSeenVisibility: settings?.lastSeenVisibility ?? true,
  onlineStatusVisibility: settings?.onlineStatusVisibility ?? true,
});

function OptionSelector<T extends string>({
  options,
  value,
  onChange,
}: {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
}) {
  const colors = useThemeColors();

  return (
    <View className="flex-row gap-2">
      {options.map((option) => {
        const selected = value === option.key;
        return (
          <TouchableOpacity
            key={option.key}
            onPress={() => onChange(option.key)}
            className="min-h-[56px] flex-1 items-center justify-center rounded-2xl px-2 py-3"
            style={{
              borderWidth: 2,
              borderColor: selected ? colors.primary : colors.border,
              backgroundColor: selected ? colors.primaryLight : colors.card,
            }}
          >
            {selected ? (
              <View
                className="mb-1 h-5 w-5 items-center justify-center rounded-full"
                style={{ backgroundColor: colors.primary }}
              >
                <Check size={13} color="white" strokeWidth={3} />
              </View>
            ) : null}
            <Text
              className="text-center text-sm font-semibold"
              style={{
                color: selected ? colors.text : colors.textSecondary,
              }}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function SettingCard({
  icon,
  title,
  description,
  children,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  children: ReactNode;
}) {
  const colors = useThemeColors();

  return (
    <View
      className="mb-4 rounded-2xl p-4"
      style={{
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <View className="mb-4 flex-row gap-3">
        <View
          className="h-11 w-11 items-center justify-center rounded-full"
          style={{ backgroundColor: colors.primaryLight }}
        >
          {icon}
        </View>
        <View className="flex-1">
          <Text
            className="text-base font-semibold"
            style={{ color: colors.text }}
          >
            {title}
          </Text>
          <Text
            className="mt-1 text-sm leading-5"
            style={{ color: colors.textSecondary }}
          >
            {description}
          </Text>
        </View>
      </View>
      {children}
    </View>
  );
}

export default function PrivacySecurity() {
  const colors = useThemeColors();
  const [form, setForm] = useState<PrivacyForm>(defaultForm);
  const [savedForm, setSavedForm] = useState<PrivacyForm>(defaultForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const hasChanges = useMemo(
    () => JSON.stringify(form) !== JSON.stringify(savedForm),
    [form, savedForm],
  );

  const loadSettings = useCallback(async () => {
    setLoading(true);
    try {
      const settings = await privacySettingsApi.getMySettings();
      const nextForm = toForm(settings);
      setForm(nextForm);
      setSavedForm(nextForm);
    } catch (error) {
      Alert.alert(
        "Privacy settings",
        error instanceof Error ? error.message : "Cannot load privacy settings",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  const updateForm = <K extends keyof PrivacyForm>(
    key: K,
    value: PrivacyForm[K],
  ) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSave = async () => {
    if (!hasChanges || saving) return;

    setSaving(true);
    try {
      const result = await privacySettingsApi.updateMySettings(form);
      const nextForm = toForm(result);
      setForm(nextForm);
      setSavedForm(nextForm);
      Alert.alert("Privacy settings", "Your privacy settings have been saved.");
    } catch (error) {
      Alert.alert(
        "Save failed",
        error instanceof Error ? error.message : "Cannot save privacy settings",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView
      className="flex-1"
      edges={["left", "right", "bottom"]}
      style={{ backgroundColor: colors.background }}
    >
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <>
          <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
            {/* <View className="px-4 pb-4 pt-6">
              <Text className="text-2xl font-bold" style={{ color: colors.text }}>
                Privacy & Security
              </Text>
              <Text className="mt-1 text-base" style={{ color: colors.textSecondary }}>
                Manage who can see your info and contact you
              </Text>
            </View> */}

            <SettingsSection title="WHO CAN SEE MY INFO" noTopMargin>
              <SettingCard
                icon={<UserRound size={20} color={colors.primary} />}
                title="Profile visibility"
                description="Choose who can see your full profile details."
              >
                <OptionSelector
                  options={profileOptions}
                  value={form.profileVisibility}
                  onChange={(value) => updateForm("profileVisibility", value)}
                />
              </SettingCard>

              <View
                className="mb-4 rounded-2xl p-4"
                style={{
                  backgroundColor: colors.card,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <Text
                      className="text-base font-semibold"
                      style={{ color: colors.text }}
                    >
                      Last seen
                    </Text>
                    <Text
                      className="mt-1 text-sm leading-5"
                      style={{ color: colors.textSecondary }}
                    >
                      Allow others to see your last seen status.
                    </Text>
                  </View>
                  <CustomToggle
                    value={form.lastSeenVisibility}
                    onValueChange={(value) =>
                      updateForm("lastSeenVisibility", value)
                    }
                  />
                </View>
              </View>

              <View
                className="mb-4 rounded-2xl p-4"
                style={{
                  backgroundColor: colors.card,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <Text
                      className="text-base font-semibold"
                      style={{ color: colors.text }}
                    >
                      Online status
                    </Text>
                    <Text
                      className="mt-1 text-sm leading-5"
                      style={{ color: colors.textSecondary }}
                    >
                      Allow others to see when you are online.
                    </Text>
                  </View>
                  <CustomToggle
                    value={form.onlineStatusVisibility}
                    onValueChange={(value) =>
                      updateForm("onlineStatusVisibility", value)
                    }
                  />
                </View>
              </View>
            </SettingsSection>

            <View className="mt-6 px-4">
              <Text
                className="mb-4 text-[18px] font-semibold uppercase tracking-wider"
                style={{ color: colors.textSecondary }}
              >
                CONTACT PERMISSIONS
              </Text>

              <SettingCard
                icon={<MessageCircle size={20} color={colors.primary} />}
                title="Message permission"
                description="Choose who can start a private chat with you."
              >
                <OptionSelector
                  options={contactOptions}
                  value={form.messagePermission}
                  onChange={(value) => updateForm("messagePermission", value)}
                />
              </SettingCard>

              <SettingCard
                icon={<Phone size={20} color={colors.primary} />}
                title="Call permission"
                description="Choose who can call you directly."
              >
                <OptionSelector
                  options={contactOptions}
                  value={form.callPermission}
                  onChange={(value) => updateForm("callPermission", value)}
                />
              </SettingCard>

              <View
                className="mb-24 flex-row gap-3 rounded-2xl p-4"
                style={{
                  backgroundColor: colors.primaryLight,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Info size={20} color={colors.primary} />
                <Text
                  className="flex-1 text-sm leading-5"
                  style={{ color: colors.text }}
                >
                  These settings are enforced by the server. People outside your
                  selected audience will see a notice instead of opening chat or
                  call.
                </Text>
              </View>
            </View>
          </ScrollView>

          <View
            className="border-t px-4 py-3"
            style={{
              backgroundColor: colors.background,
              borderColor: colors.border,
            }}
          >
            <TouchableOpacity
              onPress={handleSave}
              disabled={!hasChanges || saving}
              className="h-12 items-center justify-center rounded-2xl"
              style={{
                backgroundColor: colors.primary,
                opacity: !hasChanges || saving ? 0.5 : 1,
              }}
            >
              {saving ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-base font-semibold text-white">
                  Save Changes
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}
