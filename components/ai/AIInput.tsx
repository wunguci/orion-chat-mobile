import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  extractPrimaryText,
  orionAiApi,
  RewriteTone,
} from "@/services/api/orionAi";
import { useThemeColors } from "@/hooks/useThemeColors";

interface AIInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function AIInput({
  onSend,
  disabled = false,
  placeholder = "Type a message...",
}: AIInputProps) {
  const [message, setMessage] = useState("");
  const [previousMessage, setPreviousMessage] = useState<string | null>(null);
  const [isRewriting, setIsRewriting] = useState(false);
  const colors = useThemeColors();

  const handleSend = () => {
    if (message.trim()) {
      onSend(message.trim());
      setMessage("");
      setPreviousMessage(null);
    }
  };

  const handleRewrite = async (tone: RewriteTone) => {
    const text = message.trim();
    if (!text || isRewriting) return;

    setIsRewriting(true);
    try {
      const response = await orionAiApi.rewriteMessage({
        message: text,
        tone,
        audience: "Orion Chat mobile recipient",
      });
      const rewritten = extractPrimaryText(response);
      if (rewritten) {
        setPreviousMessage(message);
        setMessage(rewritten);
      }
    } catch (error) {
      Alert.alert(
        "AI rewrite failed",
        error instanceof Error ? error.message : "Please try again later.",
      );
    } finally {
      setIsRewriting(false);
    }
  };

  const showRewriteOptions = () => {
    if (!message.trim()) return;

    Alert.alert("Rewrite message", "Choose a tone", [
      { text: "Professional", onPress: () => void handleRewrite("professional") },
      { text: "Polite", onPress: () => void handleRewrite("polite") },
      { text: "Concise", onPress: () => void handleRewrite("concise") },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  return (
    <View className="bg-white border-gray-200" style={{ borderTopWidth: 1 }}>
      {previousMessage ? (
        <View className="flex-row justify-end px-4 pt-2">
          <TouchableOpacity
            onPress={() => {
              setMessage(previousMessage);
              setPreviousMessage(null);
            }}
            className="flex-row items-center px-3 py-1 rounded-full bg-gray-100"
          >
            <Ionicons name="arrow-undo-outline" size={14} color="#4B5563" />
            <Text className="ml-1 text-xs font-medium text-gray-700">Undo</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <View className="flex-row items-center px-4 py-3 gap-3">
        {/* Voice Input Button */}
        <TouchableOpacity disabled={disabled}>
          <Ionicons
            name="mic-outline"
            size={24}
            color={disabled ? "#9CA3AF" : "#6B7280"}
          />
        </TouchableOpacity>

        {/* Text Input */}
        <View className="flex-1 rounded-full px-4 py-2 bg-gray-100">
          <TextInput
            value={message}
            onChangeText={setMessage}
            placeholder={placeholder}
            placeholderTextColor="#9CA3AF"
            multiline
            maxLength={2000}
            editable={!disabled && !isRewriting}
            className="text-base text-black"
            style={{ maxHeight: 100 }}
          />
        </View>

        <TouchableOpacity
          onPress={showRewriteOptions}
          disabled={disabled || isRewriting || !message.trim()}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor:
              disabled || isRewriting || !message.trim() ? "#E5E7EB" : colors.primaryLight,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          {isRewriting ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Ionicons
              name="color-wand-outline"
              size={18}
              color={message.trim() ? colors.primary : "#9CA3AF"}
            />
          )}
        </TouchableOpacity>

        {/* Send Button */}
        <TouchableOpacity
          onPress={handleSend}
          disabled={disabled || isRewriting || !message.trim()}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor:
              disabled || isRewriting || !message.trim() ? "#9CA3AF" : colors.primary,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Ionicons name="send" size={20} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
}
