import SettingsHeader from "@/components/setting/SettingsHeader";
import SettingsSection from "@/components/setting/SettingsSection";
import { Info, Laptop, Monitor, QrCode, Smartphone } from "lucide-react-native";
import React, { useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useThemeColors } from "@/hooks/useThemeColors";

interface Device {
  id: string;
  name: string;
  browser?: string;
  location: string;
  ip?: string;
  lastActive?: string;
  icon: React.ReactNode;
  isCurrent?: boolean;
}

export default function DevicesScreen() {
  const colors = useThemeColors();
  const [devices] = useState<Device[]>([
    {
      id: "1",
      name: "Macbook Pro - Chrome",
      location: "San Francisco, USA",
      ip: "192.168.1.1",
      isCurrent: true,
      icon: <Laptop size={24} color={colors.primary} />,
    },
    {
      id: "2",
      name: "iPhone 15 Pro",
      location: "London, UK",
      lastActive: "2 hours ago",
      icon: <Smartphone size={24} color={colors.primary} />,
    },
    {
      id: "3",
      name: "Window Desktop - Edge",
      location: "New York, USA",
      lastActive: "Oct 24, 2024",
      icon: <Monitor size={24} color={colors.primary} />,
    },
  ]);

  return (
    <SafeAreaView
      className="flex-1"
      style={{ backgroundColor: colors.background }}
    >
      <SettingsHeader title="Linked Devices" />
      <ScrollView
        className="flex-1 pb-4"
        style={{ backgroundColor: colors.background }}
      >
        {/* Header Description */}
        <View className="px-4 py-4">
          <Text className="text-sm leading-5" style={{ color: colors.textSecondary }}>
            Manage your active sessions and link new devices to keep your
            conversations synced
          </Text>
        </View>

        {/* Logout from all devices */}
        <View className="px-4">
          <TouchableOpacity
            className="rounded-3xl py-4"
            style={{ backgroundColor: colors.primary }}
          >
            <Text className="text-center font-semibold text-white">
              Log out from all other devices
            </Text>
          </TouchableOpacity>
        </View>

        {/* Link New Device */}
        <SettingsSection title="">
          <View
            className="py-5 px-6 flex flex-col gap-5 rounded-2xl"
            style={{
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <View className="flex-row items-center gap-3">
              <View
                className="rounded-xl p-3"
                style={{ backgroundColor: colors.primaryLight }}
              >
                <QrCode size={24} color={colors.primary} />
              </View>
              <View className="flex-1">
                <Text className="font-semibold" style={{ color: colors.text }}>
                  Link a New Device
                </Text>
                <Text className="mt-0.5 text-xs" style={{ color: colors.textSecondary }}>
                  Scan the QR code with your mobile app to link a new devices
                </Text>
              </View>
            </View>
            <TouchableOpacity
              className="py-3 rounded-lg"
              style={{ backgroundColor: colors.primary }}
            >
              <Text className="text-center font-semibold text-white">
                Link via QR Code
              </Text>
            </TouchableOpacity>
          </View>
        </SettingsSection>

        {/* Active Sessions */}
        <SettingsSection title="ACTIVE SESSIONS">
          <View className="flex flex-col gap-4">
            {devices.map((device, index) => (
              <TouchableOpacity
                key={device.id}
                className="flex-row items-center justify-between px-4 py-4 rounded-2xl"
                style={{
                  backgroundColor: colors.card,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <View className="flex-1 flex-row items-center gap-1">
                  <View
                    className="rounded-lg p-2"
                    style={{ backgroundColor: colors.primaryLight }}
                  >
                    {device.icon}
                  </View>
                  <View className="ml-3 flex-1">
                    <Text className="font-semibold" style={{ color: colors.text }}>
                      {device.name}
                    </Text>
                    <Text className="mt-0.5 text-xs" style={{ color: colors.textSecondary }}>
                      {device.location}
                    </Text>
                    {device.ip && (
                      <Text className="text-xs" style={{ color: colors.textSecondary }}>
                        IP: {device.ip}
                      </Text>
                    )}
                    {device.lastActive && (
                      <Text className="mt-0.5 text-xs" style={{ color: colors.textSecondary }}>
                        Last active: {device.lastActive}
                      </Text>
                    )}
                  </View>
                </View>

                {device.isCurrent ? (
                  <View
                    className="ml-2 rounded-full px-3 py-1"
                    style={{ backgroundColor: colors.primary }}
                  >
                    <Text className="text-xs font-semibold text-white">
                      Current
                    </Text>
                  </View>
                ) : (
                  <TouchableOpacity className="ml-2">
                    <Text className="font-semibold" style={{ color: colors.primary }}>
                      Logout
                    </Text>
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </SettingsSection>

        {/* Security Tip */}
        <View
          className="mx-4 mt-4 flex-row gap-3 rounded-2xl p-4 justify-start items-start"
          style={{ backgroundColor: colors.primaryLight }}
        >
          <View
            className="rounded-full p-1"
            style={{ backgroundColor: colors.primary }}
          >
            <Info size={20} color="white" />
          </View>
          <View className="flex-1">
            <Text className="font-semibold" style={{ color: colors.primaryDark }}>Security Tip</Text>
            <Text className="mt-1 text-xs leading-4" style={{ color: colors.primary }}>
              If you see a session you do not recognize, log it out immediately
              and change your account password
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
