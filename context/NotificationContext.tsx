import { notificationApi } from "@/services/api/notification";
import { notificationSocketService } from "@/services/websocket/notificationSocket";
import type { AppNotification } from "@/types/notification";
import { tokenUtils } from "@/utils/tokenUtils";
import { useRouter } from "expo-router";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/hooks/useAuth";

type NotificationToastItem = {
  id: string;
  notification: AppNotification;
};

type NotificationContextValue = {
  notifications: AppNotification[];
  unreadCount: number;
  unreadMessageCount: number;
  unreadByConversation: Record<string, number>;
  loading: boolean;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<AppNotification | null>;
  markConversationNotificationsAsRead: (conversationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  openNotification: (item: AppNotification) => Promise<void>;
};

const NotificationContext = createContext<NotificationContextValue | null>(
  null,
);

const getNotificationConversationId = (
  item: AppNotification,
): string | undefined => {
  const metadata = item.metadata;
  if (!metadata || typeof metadata !== "object") return undefined;

  const conversationId = metadata.conversationId;
  if (typeof conversationId === "string" && conversationId.length > 0) {
    return conversationId;
  }

  const groupId = metadata.groupId;
  if (typeof groupId === "string" && groupId.length > 0) {
    return groupId;
  }

  return undefined;
};

const isConversationScopedNotification = (item: AppNotification): boolean => {
  const conversationId = getNotificationConversationId(item);
  if (!conversationId) return false;

  return (
    item.type === "message" ||
    item.type === "call" ||
    item.type === "group_invite" ||
    item.type === "group_join_approved" ||
    item.type === "group_join_rejected" ||
    item.type === "group_promoted" ||
    item.type === "group_removed" ||
    item.type === "group_dissolved"
  );
};

function NotificationToastStack({
  items,
  onDismiss,
  onOpen,
}: {
  items: NotificationToastItem[];
  onDismiss: (id: string) => void;
  onOpen: (item: AppNotification) => void;
}) {
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (items.length === 0) return;

    const timer = setInterval(() => {
      const oldest = items[items.length - 1];
      if (oldest) {
        onDismiss(oldest.id);
      }
    }, 5500);

    return () => clearInterval(timer);
  }, [items, onDismiss]);

  if (items.length === 0) return null;

  return (
    <View
      pointerEvents="box-none"
      className="absolute left-0 right-0 z-50 px-3"
      style={{ top: insets.top + 8 }}
    >
      {items.map(({ id, notification }) => (
        <TouchableOpacity
          key={id}
          activeOpacity={0.88}
          className="mb-2 rounded-xl border-l-4 border-orange-500 bg-white px-4 py-3 shadow"
          onPress={() => onOpen(notification)}
        >
          <View className="mb-1 flex-row items-center justify-between">
            <Text className="text-[11px] font-semibold uppercase tracking-wide text-orange-600">
              Thong bao moi
            </Text>
            <TouchableOpacity
              className="ml-2"
              onPress={(event) => {
                event.stopPropagation();
                onDismiss(id);
              }}
            >
              <Text className="text-xs font-medium text-gray-500">Dong</Text>
            </TouchableOpacity>
          </View>

          <View className="flex-row items-start justify-between">
            <View className="mr-2 flex-1">
              <Text className="text-sm font-semibold text-gray-800">
                {notification.title || "Thông báo mới"}
              </Text>
              <Text className="mt-1 text-xs text-gray-600">
                {notification.body}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { state } = useAuth();

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [toastItems, setToastItems] = useState<NotificationToastItem[]>([]);

  const userId = state.user?.userId;

  const fetchNotifications = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    try {
      const [listRes, unreadRes] = await Promise.all([
        notificationApi.getMyNotifications(20, 0),
        notificationApi.getUnreadCount(),
      ]);

      setNotifications(listRes.items || []);
      setUnreadCount(unreadRes.count || 0);
    } catch (error) {
      console.error("Failed to fetch mobile notifications:", error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const markAsRead = useCallback(
    async (id: string) => {
      try {
        const updated = await notificationApi.markAsRead(id);
        const target = notifications.find((item) => item._id === id);
        const shouldDecrease = !!target && !target.isRead;

        setNotifications((prev) =>
          prev.map((item) => (item._id === id ? updated : item)),
        );

        if (shouldDecrease) {
          setUnreadCount((prev) => Math.max(0, prev - 1));
        }

        return updated;
      } catch (error) {
        console.error("Failed to mark notification as read:", error);
        return null;
      }
    },
    [notifications],
  );

  const markConversationNotificationsAsRead = useCallback(
    async (conversationId: string) => {
      if (!conversationId) return;

      const pending = notifications.filter(
        (item) =>
          !item.isRead &&
          isConversationScopedNotification(item) &&
          getNotificationConversationId(item) === conversationId,
      );

      if (pending.length === 0) return;

      await Promise.all(pending.map((item) => markAsRead(item._id)));

      try {
        const unread = await notificationApi.getUnreadCount();
        setUnreadCount(unread.count || 0);
      } catch (error) {
        console.error(
          "Failed to refresh unread count after conversation read:",
          error,
        );
      }
    },
    [notifications, markAsRead],
  );

  const markAllAsRead = useCallback(async () => {
    try {
      await notificationApi.markAllAsRead();
      setNotifications((prev) =>
        prev.map((item) => ({ ...item, isRead: true })),
      );
      setUnreadCount(0);
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
  }, []);

  const deleteNotification = useCallback(
    async (id: string) => {
      try {
        const target = notifications.find((item) => item._id === id);
        await notificationApi.remove(id);

        setNotifications((prev) => prev.filter((item) => item._id !== id));
        setToastItems((prev) => prev.filter((item) => item.id !== id));

        if (target && !target.isRead) {
          setUnreadCount((prev) => Math.max(0, prev - 1));
        }
      } catch (error) {
        console.error("Failed to delete notification:", error);
      }
    },
    [notifications],
  );

  const dismissToast = useCallback((id: string) => {
    setToastItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const openNotification = useCallback(
    async (item: AppNotification) => {
      if (!item.isRead) {
        await markAsRead(item._id);
      }

      const conversationId = getNotificationConversationId(item);

      if (conversationId && isConversationScopedNotification(item)) {
        await markConversationNotificationsAsRead(conversationId);
        router.push({
          pathname: "/chat/[id]",
          params: {
            id: conversationId,
            name: item.title || "Chat",
          },
        });
        return;
      }

      if (item.type === "friend_request") {
        router.push({
          pathname: "/(tabs)/(main)/explore",
          params: { activeCategory: "requests" },
        });
        return;
      }

      if (item.type === "group_invite") {
        router.push({
          pathname: "/(tabs)/(main)/explore",
          params: { activeCategory: "group_invites" },
        });
        return;
      }

      if (item.type === "event_invite" || item.type === "event_reminder") {
        router.push("/(tabs)/(main)/calendar");
        return;
      }

      if (item.link?.startsWith("/friends")) {
        router.push("/(tabs)/(main)/explore");
        return;
      }

      if (item.link?.startsWith("/calendar")) {
        router.push("/(tabs)/(main)/calendar");
        return;
      }

      if (item.link?.startsWith("/chat")) {
        router.push("/(tabs)/(main)");
      }
    },
    [markAsRead, markConversationNotificationsAsRead, router],
  );

  useEffect(() => {
    if (!userId) return;
    fetchNotifications().catch(() => undefined);
  }, [userId, fetchNotifications]);

  useEffect(() => {
    if (!userId) return;

    let mounted = true;

    const setupSocket = async () => {
      const token = await tokenUtils.getToken();
      if (!mounted) return;

      const socket = notificationSocketService.connect(
        userId,
        token || undefined,
      );

      const handleNew = (payload: AppNotification) => {
        setNotifications((prev) => {
          const hasExisting = prev.some((item) => item._id === payload._id);
          if (hasExisting) {
            return prev.map((item) =>
              item._id === payload._id ? payload : item,
            );
          }
          return [payload, ...prev];
        });

        setToastItems((prev) => {
          const next = [{ id: payload._id, notification: payload }, ...prev];
          return next.slice(0, 4);
        });

        void handleRefreshUnread();
      };

      const handleUpdated = (payload: AppNotification) => {
        setNotifications((prev) =>
          prev.map((item) => (item._id === payload._id ? payload : item)),
        );
      };

      const handleRefreshUnread = async () => {
        try {
          const unread = await notificationApi.getUnreadCount();
          setUnreadCount(unread.count || 0);
        } catch (error) {
          console.error("Failed to refresh mobile unread count:", error);
        }
      };

      socket.on("notifications:new", handleNew);
      socket.on("notifications:updated", handleUpdated);
      socket.on("notifications:refresh_unread", handleRefreshUnread);
      socket.on("notifications:all_read", () => {
        setNotifications((prev) =>
          prev.map((item) => ({ ...item, isRead: true })),
        );
        setUnreadCount(0);
      });

      return () => {
        socket.off("notifications:new", handleNew);
        socket.off("notifications:updated", handleUpdated);
        socket.off("notifications:refresh_unread", handleRefreshUnread);
        socket.off("notifications:all_read");
      };
    };

    let cleanupSocketListeners: (() => void) | undefined;
    setupSocket().then((cleanup) => {
      cleanupSocketListeners = cleanup;
    });

    return () => {
      mounted = false;
      cleanupSocketListeners?.();
      notificationSocketService.disconnect();
    };
  }, [userId]);

  const unreadMessageCount = useMemo(
    () =>
      notifications.filter(
        (item) => !item.isRead && isConversationScopedNotification(item),
      ).length,
    [notifications],
  );

  const unreadByConversation = useMemo(() => {
    const result: Record<string, number> = {};

    notifications.forEach((item) => {
      const conversationId = getNotificationConversationId(item);
      if (
        !item.isRead &&
        typeof conversationId === "string" &&
        isConversationScopedNotification(item)
      ) {
        result[conversationId] = (result[conversationId] || 0) + 1;
      }
    });

    return result;
  }, [notifications]);

  const value = useMemo<NotificationContextValue>(
    () => ({
      notifications,
      unreadCount,
      unreadMessageCount,
      unreadByConversation,
      loading,
      fetchNotifications,
      markAsRead,
      markConversationNotificationsAsRead,
      markAllAsRead,
      deleteNotification,
      openNotification,
    }),
    [
      notifications,
      unreadCount,
      unreadMessageCount,
      unreadByConversation,
      loading,
      fetchNotifications,
      markAsRead,
      markConversationNotificationsAsRead,
      markAllAsRead,
      deleteNotification,
      openNotification,
    ],
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <NotificationToastStack
        items={toastItems}
        onDismiss={dismissToast}
        onOpen={(notification) => {
          void openNotification(notification);
        }}
      />
    </NotificationContext.Provider>
  );
}

export function useNotificationContext() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotificationContext must be used within NotificationProvider",
    );
  }

  return context;
}
