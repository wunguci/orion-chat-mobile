import SettingsHeader from "@/components/setting/SettingsHeader";
import { useAuthUser } from "@/hooks/useAuth";
import { API_BASE_URL } from "@/services/api/profile";
import React, { useMemo } from "react";
import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Feather from "react-native-vector-icons/Feather";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";

const DEFAULT_COVER = "https://via.placeholder.com/1200x480?text=Cover+Image";
const DEFAULT_AVATAR = "https://via.placeholder.com/256x256?text=Avatar";

const resolveImageUrl = (value: string | undefined, fallback: string) => {
  if (!value) return fallback;
  if (/^https?:\/\//i.test(value)) return value;

  const normalizedPath = value.startsWith("/") ? value : `/${value}`;
  return `${API_BASE_URL}${normalizedPath}`;
};

const SkeletonBlock = ({ className }: { className: string }) => (
  <View className={`bg-gray-200 ${className}`} />
);

type ProfileViewModel = {
  name: string;
  bio: string;
  coverImage: string;
  avatar: string;
  birthdate?: string;
  birthdayLabel: string;
  joined?: string;
  memberStatus: string;
  interests: string[];
  stats?: {
    friends?: number;
    photos?: number;
    videos?: number;
  };
};

export default function ProfileScreen() {
  const { user, loading, error, reload } = useAuthUser();

  const profile = useMemo<ProfileViewModel | null>(() => {
    if (!user) return null;

    return {
      name: user.fullName || user.phoneNumber || "Unknown User",
      bio: user.email || "No bio yet",
      coverImage: resolveImageUrl(user.coverImage, DEFAULT_COVER),
      avatar: resolveImageUrl(user.avatarUrl, DEFAULT_AVATAR),
      birthdate: user.birthDate,
      birthdayLabel: "Birthday",
      joined: user.createdAt,
      memberStatus: user.isActive ? "Active member" : "Member",
      interests: [] as string[],
      stats: undefined,
    };
  }, [user]);

  const hasStats =
    !!profile?.stats?.friends ||
    !!profile?.stats?.photos ||
    !!profile?.stats?.videos;

  const detailRows = useMemo(() => {
    if (!profile) return [];

    const rows: Array<{
      icon: string;
      value: string;
      label?: string;
    }> = [];

    if (profile.birthdate) {
      rows.push({
        icon: "card-giftcard",
        value: profile.birthdate,
        label: profile.birthdayLabel,
      });
    }

    if (profile.joined) {
      rows.push({
        icon: "calendar-today",
        value: profile.joined,
        label: profile.memberStatus,
      });
    }

    return rows;
  }, [profile]);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView showsVerticalScrollIndicator={false}>
        {loading && (
          <View className="px-6 py-6">
            <SkeletonBlock className="h-48 w-full rounded-2xl" />
            <View className="items-center -mt-16">
              <SkeletonBlock className="h-32 w-32 rounded-full border-4 border-white" />
            </View>
            <View className="items-center mt-6">
              <SkeletonBlock className="h-6 w-40 rounded-full" />
              <SkeletonBlock className="h-4 w-64 rounded-full mt-3" />
            </View>
          </View>
        )}

        {!loading && error && (
          <View className="px-6 py-6">
            <View className="rounded-2xl border border-red-200 bg-red-50 px-4 py-4">
              <Text className="text-sm text-red-600">{error}</Text>
              <TouchableOpacity
                onPress={reload}
                className="mt-3 self-start rounded-full bg-red-600 px-4 py-2"
              >
                <Text className="text-xs font-semibold text-white">
                  Thu lai
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {!loading && !error && profile && (
          <>
            {/* Cover Image */}
            <View className="h-48 bg-gradient-to-b from-gray-400 to-gray-300">
              <Image
                source={{
                  uri: profile.coverImage,
                }}
                className="h-full w-full"
                resizeMode="cover"
              />
            </View>

            {/* Avatar */}
            <View className=" items-center -mt-16 ">
              <View className=" w-32 h-32 rounded-full bg-green-bg-heavy border-4 border-white items-center justify-center shadow-lg ">
                <Image
                  source={{
                    uri: profile.avatar,
                  }}
                  className=" h-full w-full rounded-full "
                  resizeMode="cover"
                />
              </View>
            </View>

            {/* Name and Bio */}
            <View className="items-center px-6">
              <View className="flex-row items-center justify-center gap-2">
                <Text className="text-2xl font-bold text-teal-700">
                  {profile.name}
                </Text>
                <Feather name="edit-2" size={18} color="#0d9488" />
              </View>

              <Text className="text-center text-gray-600 mt-3 leading-6 text-sm">
                {profile.bio}
              </Text>
            </View>

            {/* Message and Call Buttons */}
            <View className="flex-row gap-4 mt-6 px-6">
              <TouchableOpacity className="flex-1 bg-teal-700 py-3 rounded-full flex-row items-center justify-center gap-2">
                <MaterialIcons name="mail" size={18} color="white" />
                <Text className="text-white font-semibold">Message</Text>
              </TouchableOpacity>

              <TouchableOpacity className="flex-1 border-2 border-teal-700 py-3 rounded-full flex-row items-center justify-center gap-2">
                <Feather name="phone" size={18} color="#0d9488" />
                <Text className="text-teal-700 font-semibold">Call</Text>
              </TouchableOpacity>
            </View>

            {hasStats && (
              <View className="flex-row justify-between bg-white mt-6 py-6 px-8 border-t border-b border-gray-200">
                {profile.stats?.friends !== undefined && (
                  <View className="items-center">
                    <Text className="font-bold text-lg text-gray-800">
                      {profile.stats.friends}
                    </Text>
                    <Text className="text-gray-500 text-xs mt-1 font-semibold">
                      FRIENDS
                    </Text>
                  </View>
                )}

                {profile.stats?.photos !== undefined && (
                  <View className="items-center">
                    <Text className="font-bold text-lg text-gray-800">
                      {profile.stats.photos}
                    </Text>
                    <Text className="text-gray-500 text-xs mt-1 font-semibold">
                      PHOTOS
                    </Text>
                  </View>
                )}

                {profile.stats?.videos !== undefined && (
                  <View className="items-center">
                    <Text className="font-bold text-lg text-gray-800">
                      {profile.stats.videos}
                    </Text>
                    <Text className="text-gray-500 text-xs mt-1 font-semibold">
                      VIDEOS
                    </Text>
                  </View>
                )}
              </View>
            )}

            {profile.interests.length > 0 && (
              <View className="bg-white mt-4 px-6 py-5 border-b border-gray-200">
                <Text className="font-bold text-teal-700 mb-4 text-sm">
                  INTERESTS
                </Text>

                <View className="flex-row flex-wrap gap-2">
                  {profile.interests.map((item: string, index: number) => (
                    <View
                      key={index}
                      className="bg-cyan-50 px-4 py-2 rounded-full border border-cyan-200"
                    >
                      <Text className="text-teal-700 font-medium text-sm">
                        {item}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            <View className="bg-white mt-4 px-6 py-5 border-b border-gray-200">
              <Text className="font-bold text-teal-700 mb-5 text-sm">
                CHI TIẾT
              </Text>

              {detailRows.length === 0 && (
                <Text className="text-gray-500 text-sm">
                  Chua co thong tin chi tiet.
                </Text>
              )}

              {detailRows.map((row, index) => (
                <View
                  key={`${row.icon}-${index}`}
                  className={`flex-row items-start gap-3 ${index < detailRows.length - 1 ? "mb-5" : ""}`}
                >
                  <MaterialIcons
                    name={row.icon as any}
                    size={22}
                    color="#0d9488"
                  />
                  <View className="flex-1">
                    <Text className="text-gray-800 font-medium">
                      {row.value}
                    </Text>
                    {row.label && (
                      <Text className="text-gray-500 text-xs mt-1">
                        {row.label}
                      </Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
