import SettingsHeader from "@/components/setting/SettingsHeader";
import SettingsSection from "@/components/setting/SettingsSection";
import { useRouter } from "expo-router";
import { Info, Laptop, Monitor, QrCode, Smartphone } from "lucide-react-native";
import React, { useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

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
  const router = useRouter();
  const [devices] = useState<Device[]>([
    {
      id: "1",
      name: "Macbook Pro - Chrome",
      location: "San Francisco, USA",
      ip: "192.168.1.1",
      isCurrent: true,
      icon: <Laptop size={24} color="#FF6B3D" />,
    },
    {
      id: "2",
      name: "iPhone 15 Pro",
      location: "London, UK",
      lastActive: "2 hours ago",
      icon: <Smartphone size={24} color="#FF6B3D" />,
    },
    {
      id: "3",
      name: "Window Desktop - Edge",
      location: "New York, USA",
      lastActive: "Oct 24, 2024",
      icon: <Monitor size={24} color="#FF6B3D" />,
    },
  ]);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <SettingsHeader title="Linked Devices" />
      <ScrollView className="flex-1 pb-4 bg-gray-50">
        {/* Header Description */}
        <View className="px-4 py-4">
          <Text className="text-sm leading-5 text-gray-secondary">
            Manage your active sessions and link new devices to keep your
            conversations synced
          </Text>
        </View>

        {/* Logout from all devices */}
        <View className="px-4">
          <TouchableOpacity className="rounded-3xl bg-orange-primary py-4">
            <Text className="text-center font-semibold text-white">
              Log out from all other devices
            </Text>
          </TouchableOpacity>
        </View>

        {/* Link New Device */}
        <SettingsSection title="">
          <View className="bg-white py-5 px-6 flex flex-col gap-5 border border-orange-border-light rounded-2xl">
            <View className="flex-row items-center gap-3">
              <View className="rounded-xl bg-orange-100 p-3">
                <QrCode size={24} color="#FF6B3D" />
              </View>
              <View className="flex-1">
                <Text className="font-semibold text-gray-primary">
                  Link a New Device
                </Text>
                <Text className="mt-0.5 text-xs text-gray-secondary">
                  Scan the QR code with your mobile app to link a new devices
                </Text>
              </View>
            </View>
            <TouchableOpacity
              className="bg-orange-primary py-3 rounded-lg"
              onPress={() => router.push("/qr-scan")}
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
                className="flex-row items-center justify-between px-4 py-4 bg-orange-bg-light border border-orange-border-light rounded-2xl"
              >
                <View className="flex-1 flex-row items-center gap-1">
                  <View className="rounded-lg bg-orange-100 p-2">
                    {device.icon}
                  </View>
                  <View className="ml-3 flex-1">
                    <Text className="font-semibold text-gray-primary">
                      {device.name}
                    </Text>
                    <Text className="mt-0.5 text-xs text-gray-secondary">
                      {device.location}
                    </Text>
                    {device.ip && (
                      <Text className="text-xs text-gray-500">
                        IP: {device.ip}
                      </Text>
                    )}
                    {device.lastActive && (
                      <Text className="mt-0.5 text-xs text-gray-secondary">
                        Last active: {device.lastActive}
                      </Text>
                    )}
                  </View>
                </View>

                {device.isCurrent ? (
                  <View className="ml-2 rounded-full bg-orange-primary px-3 py-1">
                    <Text className="text-xs font-semibold text-white">
                      Current
                    </Text>
                  </View>
                ) : (
                  <TouchableOpacity className="ml-2">
                    <Text className="font-semibold text-orange-primary">
                      Logout
                    </Text>
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </SettingsSection>

        {/* Security Tip */}
        <View className="mx-4 mt-4 flex-row gap-3 rounded-2xl bg-blue-50 p-4 justify-start items-start">
          <View className="rounded-full bg-[#3B82F6]">
            <Info size={20} color="white" />
          </View>
          <View className="flex-1">
            <Text className="font-semibold text-[#4168DD]">Security Tip</Text>
            <Text className="mt-1 text-xs leading-4 text-[#3B82F6]">
              If you see a session you do not recognize, log it out immediately
              and change your account password
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
