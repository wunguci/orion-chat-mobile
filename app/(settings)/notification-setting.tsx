import SettingsHeader from "@/components/setting/SettingsHeader";
import { useNotificationContext } from "@/context/NotificationContext";
import { useThemeColors } from "@/hooks/useThemeColors";
import type { AppNotification, NotificationType } from "@/types/notification";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type NotificationFilter = "all" | "unread" | NotificationType;

const FILTER_OPTIONS: Array<{ key: NotificationFilter; label: string }> = [
  { key: "all", label: "Tất cả" },
  { key: "unread", label: "Chưa đọc" },
  { key: "message", label: "Tin nhắn" },
  { key: "call", label: "Cuộc gọi" },
  { key: "friend_request", label: "Kết bạn" },
  { key: "group_invite", label: "Nhóm" },
  { key: "event_invite", label: "Lịch" },
  { key: "event_reminder", label: "Nhắc lịch" },
  { key: "system", label: "Hệ thống" },
];

function formatTimeLabel(value: string) {
  const createdAt = new Date(value).getTime();
  if (Number.isNaN(createdAt)) return "Vừa xong";

  const diffMs = Date.now() - createdAt;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "Vừa xong";
  if (diffMin < 60) return `${diffMin} phút trước`;

  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} giờ trước`;

  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 7) return `${diffDay} ngày trước`;

  return new Date(value).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function NotificationCard({
  item,
  onOpen,
  onMarkRead,
  onDelete,
}: {
  item: AppNotification;
  onOpen: () => void;
  onMarkRead: () => void;
  onDelete: () => void;
}) {
  const colors = useThemeColors();

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onOpen}
      className="mb-2 rounded-xl px-4 py-3"
      style={{
        borderWidth: 1,
        borderColor: item.isRead ? colors.border : colors.primary,
        backgroundColor: item.isRead ? colors.card : colors.primaryLight,
      }}
    >
      <View className="flex-row items-start justify-between">
        <View className="mr-3 flex-1">
          <Text className="text-base font-semibold" style={{ color: colors.text }}>
            {item.title || "Thông báo"}
          </Text>
          <Text className="mt-1 text-sm" style={{ color: colors.textSecondary }}>{item.body}</Text>
          <Text className="mt-2 text-xs" style={{ color: colors.textSecondary }}>
            {formatTimeLabel(item.createdAt)}
          </Text>
        </View>

        {!item.isRead && (
          <View
            className="mt-1 h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: colors.primary }}
          />
        )}
      </View>

      <View className="mt-3 flex-row gap-2">
        {!item.isRead && (
          <TouchableOpacity
            activeOpacity={0.85}
            className="rounded-lg px-3 py-2"
            style={{ backgroundColor: colors.card }}
            onPress={(event) => {
              event.stopPropagation();
              onMarkRead();
            }}
          >
            <Text className="text-xs font-semibold" style={{ color: colors.text }}>Đánh dấu đã đọc</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          activeOpacity={0.85}
          className="rounded-lg px-3 py-2"
          style={{ backgroundColor: colors.backgroundSecondary }}
          onPress={(event) => {
            event.stopPropagation();
            onDelete();
          }}
        >
          <Text className="text-xs font-semibold" style={{ color: "#ef4444" }}>Xoá</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

export default function NotificationsScreen() {
  const colors = useThemeColors();
  const {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    openNotification,
  } = useNotificationContext();

  const [filter, setFilter] = useState<NotificationFilter>("all");

  const filteredNotifications = useMemo(() => {
    if (filter === "all") return notifications;
    if (filter === "unread") return notifications.filter((item) => !item.isRead);
    return notifications.filter((item) => item.type === filter);
  }, [notifications, filter]);

  const isInitialLoading = loading && notifications.length === 0;

  return (
    <SafeAreaView
      className="flex-1"
      style={{ backgroundColor: colors.background }}
    >
      <SettingsHeader title="Thông báo" />

      <View className="flex-1" style={{ backgroundColor: colors.background }}>
        <View
          className="px-4 pb-3 pt-3"
          style={{
            backgroundColor: colors.card,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          }}
        >
          <View className="mb-3 flex-row items-center justify-between">
            <View>
              <Text className="text-xl font-bold" style={{ color: colors.text }}>
                Trung tâm thông báo
              </Text>
              <Text className="mt-1 text-xs" style={{ color: colors.textSecondary }}>
                {unreadCount} chưa đọc
              </Text>
            </View>

            <TouchableOpacity
              disabled={unreadCount === 0}
              className="rounded-lg px-3 py-2"
              style={{
                backgroundColor:
                  unreadCount === 0
                    ? colors.backgroundSecondary
                    : colors.primary,
              }}
              onPress={() => {
                void markAllAsRead();
              }}
            >
              <Text className="text-xs font-semibold text-white">Đánh dấu tất cả</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            horizontal
            data={FILTER_OPTIONS}
            keyExtractor={(item) => item.key}
            contentContainerStyle={{ paddingRight: 8 }}
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => {
              const active = item.key === filter;
              return (
                <TouchableOpacity
                  className="mr-2 rounded-full px-3 py-1.5"
                  style={{
                    backgroundColor: active
                      ? colors.primary
                      : colors.backgroundSecondary,
                  }}
                  onPress={() => setFilter(item.key)}
                >
                  <Text
                    className="text-xs font-semibold"
                    style={{ color: active ? "#FFFFFF" : colors.text }}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />
        </View>

        {isInitialLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="small" color={colors.primary} />
            <Text className="mt-2 text-sm" style={{ color: colors.textSecondary }}>
              Đang tải thông báo...
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredNotifications}
            keyExtractor={(item) => item._id}
            contentContainerStyle={{ padding: 12, paddingBottom: 28 }}
            refreshControl={
              <RefreshControl
                refreshing={loading}
                onRefresh={() => {
                  void fetchNotifications();
                }}
              />
            }
            ListEmptyComponent={
              <View className="mt-14 items-center px-8">
                <Text className="text-base font-semibold" style={{ color: colors.text }}>
                  Không có thông báo
                </Text>
                <Text className="mt-1 text-center text-sm" style={{ color: colors.textSecondary }}>
                  Khi có hoạt động mới, thông báo sẽ xuất hiện tại đây.
                </Text>
              </View>
            }
            renderItem={({ item }) => (
              <NotificationCard
                item={item}
                onOpen={() => {
                  void openNotification(item);
                }}
                onMarkRead={() => {
                  void markAsRead(item._id);
                }}
                onDelete={() => {
                  void deleteNotification(item._id);
                }}
              />
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
}
