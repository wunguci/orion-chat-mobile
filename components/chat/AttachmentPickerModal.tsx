import {
  pickDocument,
  pickFromCamera,
  pickFromGallery,
} from "@/hooks/useMediaPicker";
import { useTheme } from "@/hooks/useTheme";
import { AttachmentAsset } from "@/types/chat";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface AttachmentPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onAttach: (asset: AttachmentAsset[]) => void;
}

interface PickerOption {
  key: string;
  label: string;
  icon: React.ReactNode;
  onPress: () => Promise<AttachmentAsset[]>;
}

export default function AttachmentPickerModal({
  visible,
  onClose,
  onAttach,
}: AttachmentPickerModalProps) {
  const { colors } = useTheme();
  const [loading, setLoading] = React.useState(false);

  const handlePick = async (picker: () => Promise<AttachmentAsset[]>) => {
    setLoading(true);
    try {
      const asset = await picker();
      if (asset.length > 0) {
        onClose();
        onAttach(asset);
      }
    } finally {
      setLoading(false);
    }
  };

  const options: PickerOption[] = [
    {
      key: "camera",
      label: "Camera",
      icon: (
        <Ionicons
          name="camera-outline"
          size={28}
          color={colors.primary}
        />
      ),
      onPress: () => pickFromCamera("all"),
    },
    {
      key: "gallery",
      label: "Thư viện",
      icon: (
        <Ionicons
          name="images-outline"
          size={28}
          color={colors.primary}
        />
      ),
      onPress: () => pickFromGallery("all"), // Giới hạn chỉ chọn image -> pickFromGallery('images')
    },
    {
      key: "file",
      label: "File",
      icon: (
        <MaterialCommunityIcons
          name="file-outline"
          size={28}
          color={colors.primary}
        />
      ),
      onPress: pickDocument,
    },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {/* Backdrop */}
      <Pressable
        style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.45)" }}
        onPress={onClose}
      />

      {/* Sheet */}
      <View
        style={{
          backgroundColor: colors.background,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          paddingTop: 12,
          paddingBottom: 36,
          paddingHorizontal: 24,
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
        }}
      >
        {/* Handle */}
        <View
          style={{
            width: 40,
            height: 4,
            borderRadius: 2,
            backgroundColor: colors.divider ?? "#ccc",
            alignSelf: "center",
            marginBottom: 20,
          }}
        />

        <Text
          style={{
            fontSize: 16,
            fontWeight: "600",
            color: colors.text,
            marginBottom: 20,
          }}
        >
          Đính kèm
        </Text>

        {loading ? (
          <ActivityIndicator
            size="large"
            color={colors.primary}
            style={{ marginVertical: 24 }}
          />
        ) : (
          <View style={{ flexDirection: "row", gap: 24 }}>
            {options.map((opt) => (
              <TouchableOpacity
                key={opt.key}
                onPress={() => handlePick(opt.onPress)}
                style={{ alignItems: "center", gap: 8 }}
              >
                <View
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: 16,
                    backgroundColor: colors.backgroundSecondary,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {opt.icon}
                </View>
                <Text
                  style={{
                    fontSize: 13,
                    color: colors.textSecondary,
                  }}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </Modal>
  );
}
