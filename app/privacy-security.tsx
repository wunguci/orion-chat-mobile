import SettingsHeader from "@/components/setting/SettingsHeader";
import SettingsSection from "@/components/setting/SettingsSection";
import { useThemeColors } from "@/hooks/useThemeColors";
import { Ban, Check, ChevronRight, Shield } from "lucide-react-native";
import { useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import CustomToggle from "../components/common/CustomToggle";

type VisibilityOption = "everyone" | "contacts" | "nobody";

interface VisibilitySelectorProps {
  value: VisibilityOption;
  onChange: (value: VisibilityOption) => void;
}

function VisibilitySelector({ value, onChange }: VisibilitySelectorProps) {
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
          className={`flex-1 items-center rounded-2xl border-2 py-4 ${
            value === option.key
              ? "border-orange-primary bg-orange-50"
              : "border-orange-border-light bg-white justify-center"
          }`}
        >
          {value === option.key && (
            <View className="mb-2 h-6 w-6 items-center justify-center rounded-full bg-orange-primary">
              <Check size={16} color="white" strokeWidth={3} />
            </View>
          )}
          <Text
            className={`text-base font-medium ${
              value === option.key ? "text-gray-primary" : "text-gray-600"
            }`}
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
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <SettingsHeader title="Privacy & Security" showBack={true} />

      {/* Content */}
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Title Section */}
        <View className="px-4 pb-4 pt-6">
          <Text className="text-2xl font-bold text-gray-primary">
            Privacy & Security
          </Text>
          <Text className="mt-1 text-base text-gray-secondary">
            Manage who can see your info
          </Text>
        </View>

        {/* WHO CAN SEE MY INFO Section */}
        <SettingsSection title="WHO CAN SEE MY INFO">
          {/* Last seen visibility */}
          <View className="mb-6">
            <Text className="mb-3 text-base font-semibold text-gray-primary">
              Last seen visibility
            </Text>
            <VisibilitySelector
              value={lastSeenVisibility}
              onChange={setLastSeenVisibility}
            />
          </View>

          {/* Profile Photo */}
          <View className="mb-6">
            <Text className="mb-3 text-base font-semibold text-gray-primary">
              Profile Photo
            </Text>
            <VisibilitySelector
              value={profilePhotoVisibility}
              onChange={setProfilePhotoVisibility}
            />
          </View>

          {/* About info */}
          <View className="mb-6">
            <Text className="mb-3 text-base font-semibold text-gray-primary">
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
          <Text className="mb-4 text-[18px] font-semibold uppercase tracking-wider text-gray-secondary">
            MESSAGE & SAFETY
          </Text>

          {/* Read Receipts */}
          <View className="mb-4 rounded-2xl bg-white border border-orange-border-light p-4">
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-base font-semibold text-gray-primary">
                  Read Receipts
                </Text>
                <Text className="mt-1 text-sm leading-5 text-gray-primary">
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
          <TouchableOpacity className="mb-4 flex-row items-center justify-between rounded-2xl border border-orange-border-light bg-white p-4">
            <View className="flex-row items-center">
              <View className="mr-4 h-12 w-12 items-center justify-center rounded-full bg-orange-100">
                <Ban size={20} color={colors.orangePrimary}></Ban>
              </View>
              <View>
                <Text className="text-base font-semibold text-gray-primary">
                  Blocked Contacts
                </Text>
                <Text className="mt-1 text-sm text-gray-secondary">
                  14 contacts blocked
                </Text>
              </View>
            </View>
            <ChevronRight size={24} className="text-orange-primary" />
          </TouchableOpacity>

          {/* Two-step Verification */}
          <View className="mb-6 flex-row items-center justify-between rounded-2xl border border-orange-border-light bg-white p-4">
            <View className="flex-row items-center shrink">
              <View className="mr-4 h-12 w-12 items-center justify-center rounded-full bg-orange-100">
                <Shield size={20} color={colors.orangePrimary} />
              </View>
              <View className="flex-1">
                <Text className="text-base font-semibold text-gray-primary">
                  Two-step Verification
                </Text>
                <Text className="mt-1 text-sm text-gray-primary">
                  Add extra security to your account
                </Text>
              </View>
            </View>
            <TouchableOpacity className="ml-auto rounded-full bg-orange-primary px-6 py-3">
              <Text className="text-base font-semibold text-white">Enable</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
