import SettingsHeader from "@/components/setting/SettingsHeader";
import SettingsItem from "@/components/setting/SettingsItem";
import SettingsSection from "@/components/setting/SettingsSection";
import { useThemeColors } from "@/hooks/useThemeColors";
import {
  AtSign,
  Bell,
  Eye,
  FolderOpen,
  Minus,
  Monitor,
  Volume2,
} from "lucide-react-native";
import React, { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function NotificationsScreen() {
  const [muteAll, setMuteAll] = useState(false);
  const [showDesktop, setShowDesktop] = useState(true);
  const [showPreview, setShowPreview] = useState(true);
  const [notificationSound, setNotificationSound] = useState("Crystal Clear");
  const [enableGroupNotif, setEnableGroupNotif] = useState(true);
  const [mentionsOnly, setMentionsOnly] = useState(true);
  const [ringtone, setRingtone] = useState("Classic Ring");
  const [incomingCallWindow, setIncomingCallWindow] = useState(true);

  const colors = useThemeColors();

  const soundOptions = [
    "Crystal Clear",
    "Subtle Chime",
    "Bold Alert",
    "Custom",
  ];
  const ringtoneOptions = [
    "Classic Ring",
    "Modern Bell",
    "Digital Beep",
    "Custom",
  ];

  return (
    <SafeAreaView className="flex-1 bg-white">
      <SettingsHeader title="Notifications" />
      <ScrollView className="flex-1 pb-4 bg-gray-50">
        {/* Notifications Title & Description */}
        <View className="mb-4 px-4 pt-4">
          <Text className="text-2xl font-bold text-gray-800">
            Notifications
          </Text>
          <Text className="mt-1 text-sm text-gray-secondary">
            Manage how you receive alerts and sounds
          </Text>
        </View>

        {/* Mute All Notifications */}
        <View className="mx-4 mb-2 overflow-hidden rounded-2xl bg-white">
          <SettingsItem
            icon={null}
            title="Mute all notifications"
            subtitle="Temporarily silence all for a while"
            toggleValue={muteAll}
            onToggle={setMuteAll}
          />
        </View>

        {/* Message Notifications */}
        <SettingsSection title="MESSAGE NOTIFICATIONS">
          <View className="overflow-hidden rounded-2xl bg-white border border-gray-border">
            <SettingsItem
              icon={<Monitor size={20} color={colors.orangePrimary} />}
              title="Show Desktop Notifications"
              subtitle="Receive a pop-up alert when you get a direct message"
              toggleValue={showDesktop}
              onToggle={setShowDesktop}
            />
            <View className="h-px bg-gray-100" />
            <SettingsItem
              icon={<Eye size={20} color={colors.orangePrimary} />}
              title="Show Message Preview"
              subtitle="Display the sender and message snippet in alerts"
              toggleValue={showPreview}
              onToggle={setShowPreview}
            />
            <View className="h-px bg-gray-100" />
            <SettingsItem
              icon={<Volume2 size={20} color={colors.orangePrimary} />}
              title="Notification Sound"
              subtitle="Choose the sound for incoming direct messages"
              isRingtone={true}
              ringtoneValue={notificationSound}
              onRingtoneChange={setNotificationSound}
              ringtoneOptions={soundOptions}
              onPlayRingtone={() => console.log("Play notification sound")}
            />
          </View>
        </SettingsSection>

        {/* Group Notifications */}
        <SettingsSection title="GROUP NOTIFICATIONS">
          <View className="overflow-hidden rounded-2xl bg-white border border-gray-border">
            <SettingsItem
              icon={<FolderOpen size={20} color={colors.orangePrimary} />}
              title="Enable Group Notifications"
              subtitle="Receive notifications for activity in group chats"
              toggleValue={enableGroupNotif}
              onToggle={setEnableGroupNotif}
            />
            <View className="h-px bg-gray-100" />
            <SettingsItem
              icon={<AtSign size={20} color={colors.orangePrimary} />}
              title="Mentions Only"
              subtitle="Only notify me if someone @mentions me in a group"
              toggleValue={mentionsOnly}
              onToggle={setMentionsOnly}
            />
          </View>
        </SettingsSection>

        {/* Call Settings */}
        <SettingsSection title="CALL">
          <View className="overflow-hidden rounded-2xl bg-white border border-gray-border">
            <SettingsItem
              icon={<Bell size={20} color={colors.orangePrimary} />}
              title="Ringtone"
              subtitle="Sound played during incoming voice and video call"
              isRingtone={true}
              ringtoneValue={ringtone}
              onRingtoneChange={setRingtone}
              ringtoneOptions={ringtoneOptions}
              onPlayRingtone={() => console.log("Play ringtone")}
            />
            <View className="h-px bg-gray-100" />
            <SettingsItem
              icon={<Minus size={20} color={colors.orangePrimary} />}
              title="Incoming Call Window"
              subtitle="Show call controls even when the app is in background"
              toggleValue={incomingCallWindow}
              onToggle={setIncomingCallWindow}
            />
          </View>
        </SettingsSection>
      </ScrollView>
    </SafeAreaView>
  );
}
