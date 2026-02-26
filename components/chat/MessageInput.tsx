import { useTheme } from '@/hooks/useTheme';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { Platform, TextInput, TouchableOpacity, View } from 'react-native';

interface MessageInputProps {
    value: string;
    onChangeText: (text: string) => void;
    onSend: () => void;
}

export default function MessageInput({
    value,
    onChangeText,
    onSend,
}: MessageInputProps) {
    const { colors } = useTheme();
    const hasText = value.trim().length > 0;

    return (
        <View
            style={{
                flexDirection: 'row',
                alignItems: 'flex-end',
                paddingHorizontal: 12,
                paddingVertical: 8,
                paddingBottom: Platform.OS === 'ios' ? 20 : 10,
                backgroundColor: colors.background,
                borderTopWidth: 0.5,
                borderTopColor: colors.divider,
                gap: 8,
            }}
        >
            {/* Attach */}
            <TouchableOpacity
                style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    borderWidth: 1.5,
                    borderColor: colors.border,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 2,
                }}
            >
                <Ionicons name="add" size={22} color={colors.textSecondary} />
            </TouchableOpacity>

            {/* Text input */}
            <View
                style={{
                    flex: 1,
                    backgroundColor: colors.backgroundSecondary,
                    borderRadius: 22,
                    paddingHorizontal: 14,
                    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
                    minHeight: 40,
                    justifyContent: 'center',
                }}
            >
                <TextInput
                    value={value}
                    onChangeText={onChangeText}
                    placeholder="Type your message"
                    placeholderTextColor={colors.textSecondary}
                    style={{
                        color: colors.text,
                        fontSize: 15,
                        maxHeight: 100,
                    }}
                    multiline
                    returnKeyType="default"
                />
            </View>

            {/* Send or mic + emoji */}
            {hasText ? (
                <TouchableOpacity
                    onPress={onSend}
                    style={{
                        width: 36,
                        height: 36,
                        borderRadius: 18,
                        backgroundColor: '#00B14F',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: 2,
                    }}
                >
                    <Ionicons name="send" size={18} color="#fff" />
                </TouchableOpacity>
            ) : (
                <View
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 4,
                        marginBottom: 2,
                    }}
                >
                    <TouchableOpacity hitSlop={8}>
                        <Ionicons
                            name="mic-outline"
                            size={24}
                            color={colors.textSecondary}
                        />
                    </TouchableOpacity>
                    <TouchableOpacity hitSlop={8}>
                        <MaterialCommunityIcons
                            name="sticker-emoji"
                            size={24}
                            color={colors.textSecondary}
                        />
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}
