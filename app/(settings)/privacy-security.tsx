import SettingsHeader from "@/components/setting/SettingsHeader";
import SettingsSection from "@/components/setting/SettingsSection";
import { useThemeColors } from "@/hooks/useThemeColors";
import { Ban, Check, ChevronRight, Shield } from "lucide-react-native";
import { useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import CustomToggle from "@/components/common/CustomToggle";

type VisibilityOption = "everyone" | "contacts" | "nobody";

interface VisibilitySelectorProps {
  value: VisibilityOption;
  onChange: (value: VisibilityOption) => void;
}

function VisibilitySelector({ value, onChange }: VisibilitySelectorProps) {
  const colors = useThemeColors();
  const options: { key: VisibilityOption; label: string }[] = [
    { key: "everyone", label: "Everyone" },
    { key: "contacts", label: "My Contacts" },
    { key: "nobody", label: "Nobody" },
  ];

  return (
    <View className="flex-row justify-between gap-2">
      {options.map((option) => (
        <TouchableOpacity
          key={option.key}
          onPress={() => onChange(option.key)}
          className="flex-1 items-center rounded-2xl py-4"
          style={{
            borderWidth: 2,
            borderColor:
              value === option.key ? colors.primary : colors.border,
            backgroundColor:
              value === option.key ? colors.primaryLight : colors.card,
            justifyContent: value === option.key ? undefined : "center",
          }}
        >
          {value === option.key && (
            <View
              className="mb-2 h-6 w-6 items-center justify-center rounded-full"
              style={{ backgroundColor: colors.primary }}
            >
              <Check size={16} color="white" strokeWidth={3} />
            </View>
          )}
          <Text
            className="text-base font-medium"
            style={{
              color:
                value === option.key ? colors.text : colors.textSecondary,
            }}
          >
            {option.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export default function PrivacySecurity() {
  const colors = useThemeColors();
  const [lastSeenVisibility, setLastSeenVisibility] =
    useState<VisibilityOption>("everyone");
  const [profilePhotoVisibility, setProfilePhotoVisibility] =
    useState<VisibilityOption>("contacts");
  const [aboutInfoVisibility, setAboutInfoVisibility] =
    useState<VisibilityOption>("nobody");
  const [readReceipts, setReadReceipts] = useState(true);

  return (
    <SafeAreaView
      className="flex-1"
      style={{ backgroundColor: colors.background }}
    >
      {/* Content */}
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Title Section */}
        <View className="px-4 pb-4 pt-6">
          <Text className="text-2xl font-bold" style={{ color: colors.text }}>
            Privacy & Security
          </Text>
          <Text className="mt-1 text-base" style={{ color: colors.textSecondary }}>
            Manage who can see your info
          </Text>
        </View>

        {/* WHO CAN SEE MY INFO Section */}
        <SettingsSection title="WHO CAN SEE MY INFO">
          {/* Last seen visibility */}
          <View className="mb-6">
            <Text className="mb-3 text-base font-semibold" style={{ color: colors.text }}>
              Last seen visibility
            </Text>
            <VisibilitySelector
              value={lastSeenVisibility}
              onChange={setLastSeenVisibility}
            />
          </View>

          {/* Profile Photo */}
          <View className="mb-6">
            <Text className="mb-3 text-base font-semibold" style={{ color: colors.text }}>
              Profile Photo
            </Text>
            <VisibilitySelector
              value={profilePhotoVisibility}
              onChange={setProfilePhotoVisibility}
            />
          </View>

          {/* About info */}
          <View className="mb-6">
            <Text className="mb-3 text-base font-semibold" style={{ color: colors.text }}>
              About info
            </Text>
            <VisibilitySelector
              value={aboutInfoVisibility}
              onChange={setAboutInfoVisibility}
            />
          </View>
        </SettingsSection>

        {/* MESSAGE & SAFETY Section */}
        <View className="mt-6 px-4">
          <Text className="mb-4 text-[18px] font-semibold uppercase tracking-wider" style={{ color: colors.textSecondary }}>
            MESSAGE & SAFETY
          </Text>

          {/* Read Receipts */}
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
                <Text className="text-base font-semibold" style={{ color: colors.text }}>
                  Read Receipts
                </Text>
                <Text className="mt-1 text-sm leading-5" style={{ color: colors.textSecondary }}>
                  If turned off, you will not send or receive Read Receipts.
                  Read receipts are always sent for group chats
                </Text>
              </View>
              <View className="ml-4">
                <CustomToggle
                  value={readReceipts}
                  onValueChange={setReadReceipts}
                />
              </View>
            </View>
          </View>

          {/* Blocked Contacts */}
          <TouchableOpacity
            className="mb-4 flex-row items-center justify-between rounded-2xl p-4"
            style={{
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <View className="flex-row items-center">
              <View
                className="mr-4 h-12 w-12 items-center justify-center rounded-full"
                style={{ backgroundColor: colors.primaryLight }}
              >
                <Ban size={20} color={colors.primary}></Ban>
              </View>
              <View>
                <Text className="text-base font-semibold" style={{ color: colors.text }}>
                  Blocked Contacts
                </Text>
                <Text className="mt-1 text-sm" style={{ color: colors.textSecondary }}>
                  14 contacts blocked
                </Text>
              </View>
            </View>
            <ChevronRight size={24} color={colors.primary} />
          </TouchableOpacity>

          {/* Two-step Verification */}
          <View
            className="mb-6 flex-row items-center justify-between rounded-2xl p-4"
            style={{
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <View className="flex-row items-center shrink">
              <View
                className="mr-4 h-12 w-12 items-center justify-center rounded-full"
                style={{ backgroundColor: colors.primaryLight }}
              >
                <Shield size={20} color={colors.primary} />
              </View>
              <View className="flex-1">
                <Text className="text-base font-semibold" style={{ color: colors.text }}>
                  Two-step Verification
                </Text>
                <Text className="mt-1 text-sm" style={{ color: colors.textSecondary }}>
                  Add extra security to your account
                </Text>
              </View>
            </View>
            <TouchableOpacity
              className="ml-auto rounded-full px-6 py-3"
              style={{ backgroundColor: colors.primary }}
            >
              <Text className="text-base font-semibold text-white">Enable</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
