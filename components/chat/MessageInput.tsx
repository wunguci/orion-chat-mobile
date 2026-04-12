import AttachmentPickerModal from '@/components/chat/AttachmentPickerModal';
import { useTheme } from '@/hooks/useTheme';
import { AttachmentAsset } from '@/types/chat';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Platform,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface MessageInputProps {
    value: string;
    onChangeText: (text: string) => void;
    onSend: () => void;
    onAttach?: (asset: AttachmentAsset) => void;
    replyPreviewText?: string;
    onCancelReply?: () => void;
    disabled?: boolean;
    disabledReason?: string;
}

export default function MessageInput({
    value,
    onChangeText,
    onSend,
    onAttach,
    replyPreviewText,
    onCancelReply,
    disabled = false,
    disabledReason,
}: MessageInputProps) {
    const { colors } = useTheme();
    const { bottom } = useSafeAreaInsets();
    const hasText = value.trim().length > 0;
    const [pickerVisible, setPickerVisible] = useState(false);

    return (
        <>
            <View
                style={{
                    flexDirection: 'column',
                    paddingHorizontal: 12,
                    paddingTop: 8,
                    paddingBottom:
                        bottom > 0 ? bottom : Platform.OS === 'ios' ? 20 : 10,
                    backgroundColor: colors.background,
                    borderTopWidth: 0.5,
                    borderTopColor: colors.divider,
                }}
            >
                {replyPreviewText ? (
                    <View
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: 8,
                            backgroundColor: colors.backgroundSecondary,
                            borderRadius: 10,
                            paddingHorizontal: 10,
                            paddingVertical: 8,
                        }}
                    >
                        <View style={{ flex: 1, paddingRight: 8 }}>
                            <Text
                                style={{
                                    color: colors.textSecondary,
                                    fontSize: 12,
                                }}
                                numberOfLines={1}
                            >
                                {`Reply: ${replyPreviewText}`}
                            </Text>
                        </View>
                        <TouchableOpacity onPress={onCancelReply} hitSlop={10}>
                            <Ionicons
                                name="close"
                                size={18}
                                color={colors.textSecondary}
                            />
                        </TouchableOpacity>
                    </View>
                ) : null}

                <View
                    style={{
                        flexDirection: 'row',
                        alignItems: 'flex-end',
                        gap: 8,
                    }}
                >
                    {/* Attach */}
                    <TouchableOpacity
                        disabled={disabled}
                        onPress={() => setPickerVisible(true)}
                        style={{
                            width: 36,
                            height: 36,
                            borderRadius: 18,
                            borderWidth: 1.5,
                            borderColor: colors.border,
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: 2,
                            opacity: disabled ? 0.45 : 1,
                        }}
                    >
                        <Ionicons
                            name="add"
                            size={22}
                            color={colors.textSecondary}
                        />
                    </TouchableOpacity>

                    {/* Text input */}
                    <View
                        style={{
                            flex: 1,
                            backgroundColor: colors.backgroundSecondary,
                            borderRadius: 22,
                            paddingHorizontal: 14,
                            paddingVertical: Platform.OS === 'ios' ? 10 : 5,
                            minHeight: 40,
                            justifyContent: 'center',
                        }}
                    >
                        <TextInput
                            value={value}
                            onChangeText={onChangeText}
                            placeholder={
                                disabled
                                    ? disabledReason || 'Khong the gui tin nhan'
                                    : 'Type your message'
                            }
                            placeholderTextColor={colors.textSecondary}
                            editable={!disabled}
                            style={{
                                color: colors.text,
                                fontSize: 15,
                                maxHeight: 100,
                                textAlignVertical: 'center',
                            }}
                            multiline
                            returnKeyType="default"
                        />
                    </View>

                    {/* Send or mic + emoji */}
                    {hasText ? (
                        <TouchableOpacity
                            disabled={disabled}
                            onPress={onSend}
                            style={{
                                width: 36,
                                height: 36,
                                borderRadius: 18,
                                backgroundColor: '#00B14F',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: 2,
                                opacity: disabled ? 0.45 : 1,
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
            </View>

            <AttachmentPickerModal
                visible={pickerVisible}
                onClose={() => setPickerVisible(false)}
                onAttach={(asset) => {
                    setPickerVisible(false);
                    onAttach?.(asset);
                }}
            />
        </>
    );
}
