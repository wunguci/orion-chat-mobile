import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { TextInput, TouchableOpacity, View } from "react-native";

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

  const handleSend = () => {
    if (message.trim()) {
      onSend(message.trim());
      setMessage("");
    }
  };

  return (
    <View
      className="flex-row items-center px-4 py-3 gap-3 bg-white border-gray-200"
      style={{ borderTopWidth: 1 }}
    >
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
          editable={!disabled}
          className="text-base text-black"
          style={{ maxHeight: 100 }}
        />
      </View>

      {/* Send Button */}
      <TouchableOpacity
        onPress={handleSend}
        disabled={disabled || !message.trim()}
        style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: disabled || !message.trim() ? "#9CA3AF" : "#00B48D",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Ionicons name="send" size={20} color="white" />
      </TouchableOpacity>
    </View>
  );
}
