import { chatApi } from "@/services/api/chat";
import {
  downloadFileDirectly,
  showDownloadAlert,
} from "@/utils/directFileDownload";
import { Message } from "@/types/chat";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  Modal,
  Share,
  StatusBar,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface ImageViewerModalProps {
  visible: boolean;
  images: Message[];
  initialMessageId?: string | null;
  conversationId: string;
  onClose: () => void;
}

function formatViewerTime(timestamp?: string) {
  if (!timestamp) return "";

  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function getInitials(name?: string) {
  return (name || "?")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function ImageViewerModal({
  visible,
  images,
  initialMessageId,
  conversationId,
  onClose,
}: ImageViewerModalProps) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const topInset = Math.max(insets.top, 44);
  const bottomInset = Math.max(insets.bottom, 12);
  const imageViewportHeight = Math.max(240, height - topInset - bottomInset - 170);
  const listRef = useRef<FlatList<Message>>(null);
  const initialIndex = Math.max(
    0,
    images.findIndex((image) => image.id === initialMessageId),
  );
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  const currentImage = images[currentIndex] || images[0];

  useEffect(() => {
    if (!visible) return;

    const nextIndex = Math.max(
      0,
      images.findIndex((image) => image.id === initialMessageId),
    );

    setCurrentIndex(nextIndex);

    requestAnimationFrame(() => {
      listRef.current?.scrollToIndex({
        index: nextIndex,
        animated: false,
      });
    });
  }, [visible, initialMessageId, images]);

  const viewabilityConfig = useMemo(
    () => ({
      itemVisiblePercentThreshold: 60,
    }),
    [],
  );

  const handleViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: Array<{ index: number | null }> }) => {
      const index = viewableItems[0]?.index;
      if (typeof index === "number") {
        setCurrentIndex(index);
      }
    },
  ).current;

  const handleReact = useCallback(
    async (emoji: string) => {
      if (!currentImage) return;

      try {
        await chatApi.addEmojiReaction(currentImage.id, emoji, conversationId);
      } catch (error) {
        Alert.alert(
          "Khong the gui emoji",
          error instanceof Error ? error.message : "Vui long thu lai",
        );
      }
    },
    [conversationId, currentImage],
  );

  const handleShare = useCallback(async () => {
    if (!currentImage?.imageUri) return;

    try {
      await Share.share({
        message: currentImage.imageUri,
        url: currentImage.imageUri,
      });
    } catch (error) {
      Alert.alert(
        "Khong the chia se",
        error instanceof Error ? error.message : "Vui long thu lai",
      );
    }
  }, [currentImage]);

  const handleDownload = useCallback(async () => {
    if (!currentImage?.imageUri) return;

    const fileName = currentImage.fileName || `image-${currentImage.id}.jpg`;
    const result = await downloadFileDirectly(currentImage.imageUri, fileName);
    showDownloadAlert(result);
  }, [currentImage]);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: "#000",
          paddingTop: topInset,
          paddingBottom: bottomInset,
        }}
      >
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 14,
            paddingVertical: 10,
          }}
        >
          <TouchableOpacity onPress={onClose} hitSlop={10}>
            <Ionicons name="chevron-back" size={34} color="#fff" />
          </TouchableOpacity>

          <View
            style={{
              width: 42,
              height: 42,
              borderRadius: 21,
              overflow: "hidden",
              marginLeft: 10,
              backgroundColor: "#1F2937",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {currentImage?.senderAvatar ? (
              <Image
                source={{ uri: currentImage.senderAvatar }}
                style={{ width: 42, height: 42 }}
              />
            ) : (
              <Text style={{ color: "#fff", fontWeight: "700" }}>
                {getInitials(currentImage?.senderName)}
              </Text>
            )}
          </View>

          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text
              numberOfLines={1}
              style={{ color: "#fff", fontSize: 17, fontWeight: "700" }}
            >
              {currentImage?.isMine
                ? "Bạn"
                : currentImage?.senderName || "Unknown"}
            </Text>
            <Text style={{ color: "rgba(255,255,255,0.75)", fontSize: 13 }}>
              {formatViewerTime(currentImage?.timestamp)}
            </Text>
          </View>

          <TouchableOpacity onPress={handleDownload} hitSlop={10}>
            <Ionicons name="download-outline" size={30} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleShare}
            hitSlop={10}
            style={{ marginLeft: 18 }}
          >
            <MaterialCommunityIcons
              name="dots-vertical"
              size={30}
              color="#fff"
            />
          </TouchableOpacity>
        </View>

        <FlatList
          ref={listRef}
          data={images}
          horizontal
          pagingEnabled
          keyExtractor={(item) => item.id}
          initialScrollIndex={initialIndex}
          getItemLayout={(_, index) => ({
            length: width,
            offset: width * index,
            index,
          })}
          onViewableItemsChanged={handleViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          showsHorizontalScrollIndicator={false}
          onScrollToIndexFailed={(info) => {
            setTimeout(() => {
              listRef.current?.scrollToIndex({
                index: info.index,
                animated: false,
              });
            }, 100);
          }}
          renderItem={({ item }) => (
            <View
              style={{
                width,
                height: imageViewportHeight,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Image
                source={{ uri: item.imageUri }}
                style={{ width, height: imageViewportHeight }}
                resizeMode="contain"
              />
            </View>
          )}
        />

        <View
          style={{
            paddingHorizontal: 28,
            paddingBottom: 8,
            paddingTop: 12,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <View
            style={{
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.35)",
              borderRadius: 8,
              paddingHorizontal: 12,
              paddingVertical: 8,
            }}
          >
            <Text style={{ color: "#fff", fontSize: 18, fontWeight: "700" }}>
              HD
            </Text>
          </View>

          <View style={{ flexDirection: "row", gap: 14 }}>
            {["❤️", "😂", "👍"].map((emoji) => (
              <TouchableOpacity
                key={emoji}
                onPress={() => void handleReact(emoji)}
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.25)",
                  backgroundColor: "rgba(255,255,255,0.10)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ fontSize: 25 }}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            onPress={handleShare}
            style={{
              width: 54,
              height: 54,
              borderRadius: 27,
              backgroundColor: "#fff",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="arrow-redo" size={28} color="#111" />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
