import { MaterialCommunityIcons } from "@expo/vector-icons";
import { API_BASE_URL } from "@/config/api";
import { useTheme } from "@/hooks/useTheme";
import {
  chatApi,
  ConversationMediaItem,
  MessageItem,
} from "@/services/api/chat";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Linking,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type MediaTab = "image" | "video" | "file" | "link" | "audio";

type LinkItem = {
  id: string;
  url: string;
  title: string;
  senderName?: string;
  createdAt?: string;
};
type GroupedMediaItem = ConversationMediaItem | LinkItem;

const TABS: { key: MediaTab; label: string; icon: keyof typeof MaterialCommunityIcons.glyphMap }[] = [
  { key: "image", label: "Ảnh", icon: "image-outline" },
  { key: "file", label: "File", icon: "file-outline" },
  { key: "link", label: "Link", icon: "link-variant" },
  { key: "audio", label: "Tin nhắn thoại", icon: "microphone-outline" },
];

const QUICK_FILTERS = [
  { label: "Theo người gửi", icon: "account-outline" as const },
  { label: "Video", icon: "video-outline" as const },
  { label: "Theo thời gian", icon: "clock-outline" as const },
];

const toAbsoluteUrl = (url?: string | null) => {
  if (!url) return undefined;
  if (
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("data:") ||
    url.startsWith("blob:")
  ) {
    return url;
  }

  const base = API_BASE_URL.replace(/\/$/, "");
  const path = url.startsWith("/") ? url : `/${url}`;
  return `${base}${path}`;
};

const getMediaKind = (item: ConversationMediaItem): MediaTab => {
  const messageType = String(item.messageType || "").toLowerCase();
  const mimeType = String(item.mimeType || "").toLowerCase();

  if (item.fileCategory === "image" || mimeType.startsWith("image/") || messageType === "image") {
    return "image";
  }
  if (item.fileCategory === "video" || mimeType.startsWith("video/") || messageType === "video") {
    return "video";
  }
  if (item.fileCategory === "audio" || mimeType.startsWith("audio/") || messageType === "audio") {
    return "audio";
  }

  return "file";
};

const formatDate = (value?: string) => {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleDateString("vi-VN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const formatFileSize = (size?: number) => {
  if (!size) return "";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

const extractLinks = (messages: MessageItem[]): LinkItem[] => {
  const regex = /(https?:\/\/[^\s]+)/gi;

  return messages.flatMap((message) => {
    const matches = String(message.content || "").match(regex) || [];
    return matches.map((url, index) => ({
      id: `${message._id}-${index}`,
      url,
      title: url.replace(/^https?:\/\//, ""),
      senderName: message.senderName,
      createdAt: message.createdAt,
    }));
  });
};

export default function ChatMediaScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const params = useLocalSearchParams<{
    conversationId?: string;
    name?: string;
    tab?: MediaTab;
  }>();
  const conversationId = String(params.conversationId || "");
  const title = String(params.name || "Ảnh, file, link");
  const [activeTab, setActiveTab] = useState<MediaTab>(
    params.tab && ["image", "video", "file", "link", "audio"].includes(params.tab)
      ? params.tab
      : "image",
  );
  const [mediaItems, setMediaItems] = useState<ConversationMediaItem[]>([]);
  const [linkItems, setLinkItems] = useState<LinkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    if (!conversationId) return;

    const [mediaResult, messagesResult] = await Promise.all([
      chatApi.getConversationMedia(conversationId, undefined, 100),
      chatApi.getMessages(conversationId, 100, 0),
    ]);

    setMediaItems(mediaResult.items || []);
    setLinkItems(extractLinks(messagesResult.items || []));
  }, [conversationId]);

  useEffect(() => {
    setLoading(true);
    loadData()
      .catch((error) => {
        console.error("Failed to load conversation media:", error);
      })
      .finally(() => setLoading(false));
  }, [loadData]);

  const refresh = useCallback(() => {
    setRefreshing(true);
    loadData()
      .catch((error) => {
        console.error("Failed to refresh conversation media:", error);
      })
      .finally(() => setRefreshing(false));
  }, [loadData]);

  const groupedItems = useMemo<[string, GroupedMediaItem[]][]>(() => {
    if (activeTab === "link") {
      const links = linkItems;
      return Object.entries(
        links.reduce<Record<string, LinkItem[]>>((acc, item) => {
          const key = formatDate(item.createdAt);
          acc[key] = [...(acc[key] || []), item];
          return acc;
        }, {}),
      );
    }

    const items = mediaItems.filter(
      (item) => !item.isRevoked && getMediaKind(item) === activeTab,
    );

    return Object.entries(
      items.reduce<Record<string, ConversationMediaItem[]>>((acc, item) => {
        const key = formatDate(item.createdAt);
        acc[key] = [...(acc[key] || []), item];
        return acc;
      }, {}),
    ) as [string, GroupedMediaItem[]][];
  }, [activeTab, linkItems, mediaItems]);

  const openUrl = (url?: string) => {
    if (!url) return;
    void Linking.openURL(url);
  };

  const renderMediaGrid = (items: ConversationMediaItem[]) => (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 4 }}>
      {items.map((item) => {
        const uri = toAbsoluteUrl(item.mediaUrl);
        return (
          <TouchableOpacity
            key={item.messageId || item._id || item.mediaUrl}
            activeOpacity={0.82}
            onPress={() => openUrl(uri)}
            style={{
              width: "32.5%",
              aspectRatio: 1,
              backgroundColor: colors.backgroundSecondary,
              overflow: "hidden",
            }}
          >
            {activeTab === "video" ? (
              <View style={{ flex: 1 }}>
                {uri ? (
                  <Image source={{ uri }} style={{ flex: 1 }} resizeMode="cover" />
                ) : null}
                <View
                  style={{
                    position: "absolute",
                    top: 0,
                    right: 0,
                    bottom: 0,
                    left: 0,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "rgba(0,0,0,0.18)",
                  }}
                >
                  <MaterialCommunityIcons name="play-circle" size={34} color="#fff" />
                </View>
              </View>
            ) : uri ? (
              <Image source={{ uri }} style={{ flex: 1 }} resizeMode="cover" />
            ) : null}
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const renderFileList = (items: ConversationMediaItem[]) => (
    <View style={{ gap: 10 }}>
      {items.map((item) => (
        <TouchableOpacity
          key={item.messageId || item._id || item.mediaUrl}
          activeOpacity={0.78}
          onPress={() => openUrl(toAbsoluteUrl(item.mediaUrl))}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            padding: 12,
            borderRadius: 10,
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <MaterialCommunityIcons
            name={activeTab === "audio" ? "microphone-outline" : "file-outline"}
            size={24}
            color={colors.primary}
          />
          <View style={{ flex: 1 }}>
            <Text numberOfLines={1} style={{ color: colors.text, fontWeight: "700" }}>
              {item.fileName || item.content || "Tệp đính kèm"}
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>
              {[item.senderName, formatFileSize(item.fileSize)].filter(Boolean).join(" • ")}
            </Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderLinks = (items: LinkItem[]) => (
    <View style={{ gap: 10 }}>
      {items.map((item) => (
        <TouchableOpacity
          key={item.id}
          activeOpacity={0.78}
          onPress={() => openUrl(item.url)}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            padding: 12,
            borderRadius: 10,
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <MaterialCommunityIcons name="link-variant" size={24} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text numberOfLines={1} style={{ color: colors.text, fontWeight: "700" }}>
              {item.title}
            </Text>
            <Text numberOfLines={1} style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>
              {item.senderName || item.url}
            </Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View
        style={{
          minHeight: 58,
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 12,
          borderBottomWidth: 0.5,
          borderBottomColor: colors.divider,
        }}
      >
        <TouchableOpacity onPress={() => router.back()} hitSlop={10} style={{ padding: 8 }}>
          <MaterialCommunityIcons name="chevron-left" size={30} color={colors.text} />
        </TouchableOpacity>
        <Text
          numberOfLines={1}
          style={{ flex: 1, color: colors.text, fontSize: 22, fontWeight: "800" }}
        >
          {title}
        </Text>
        <TouchableOpacity hitSlop={10} style={{ padding: 8 }}>
          <MaterialCommunityIcons name="magnify" size={25} color={colors.text} />
        </TouchableOpacity>
      </View>

      <View style={{ paddingHorizontal: 12, paddingVertical: 12, gap: 10 }}>
        <View style={{ flexDirection: "row", gap: 8 }}>
          {QUICK_FILTERS.map((item) => (
            <View
              key={item.label}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                paddingHorizontal: 12,
                height: 38,
                borderRadius: 19,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <MaterialCommunityIcons name={item.icon} size={18} color={colors.textSecondary} />
              <Text style={{ color: colors.text, fontSize: 13, fontWeight: "700" }}>{item.label}</Text>
            </View>
          ))}
        </View>

        <View style={{ flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: colors.divider }}>
          {TABS.map((tab) => {
            const active = tab.key === activeTab;
            return (
              <TouchableOpacity
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                style={{
                  flex: 1,
                  alignItems: "center",
                  paddingVertical: 13,
                  borderBottomWidth: active ? 2 : 0,
                  borderBottomColor: colors.text,
                }}
              >
                <Text
                  numberOfLines={1}
                  style={{
                    color: active ? colors.text : colors.textSecondary,
                    fontSize: 14,
                    fontWeight: "800",
                  }}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={groupedItems}
          keyExtractor={([date]) => date}
          contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 28 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} />
          }
          ListEmptyComponent={
            <Text style={{ color: colors.textSecondary, textAlign: "center", marginTop: 80 }}>
              Chưa có nội dung
            </Text>
          }
          renderItem={({ item: [date, items] }) => (
            <View style={{ marginBottom: 24 }}>
              <Text
                style={{
                  color: colors.textSecondary,
                  fontSize: 19,
                  fontWeight: "800",
                  marginBottom: 14,
                }}
              >
                {date}
              </Text>
              {activeTab === "image" || activeTab === "video"
                ? renderMediaGrid(items as ConversationMediaItem[])
                : activeTab === "link"
                  ? renderLinks(items as LinkItem[])
                  : renderFileList(items as ConversationMediaItem[])}
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}
