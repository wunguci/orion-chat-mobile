import { useTheme } from '@/hooks/useTheme';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';

interface ChatHeaderProps {
    name: string;
    avatarUri?: string;
    isOnline?: boolean;
    onAudioCall?: () => void;
    onVideoCall?: () => void;
    onMenuPress?: () => void;
}

export default function ChatHeader({
    name,
    avatarUri,
    isOnline,
    onAudioCall,
    onVideoCall,
    onMenuPress,
}: ChatHeaderProps) {
    const { colors } = useTheme();

    const initials = name
        .split(' ')
        .map((w) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    return (
        <View
            style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 12,
                paddingVertical: 10,
                backgroundColor: colors.background,
                borderBottomWidth: 0.5,
                borderBottomColor: colors.divider,
                gap: 10,
            }}
        >
            {/* Back */}
            <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
                <Ionicons name="chevron-back" size={26} color={colors.text} />
            </TouchableOpacity>

            {/* Avatar */}
            <View>
                {avatarUri ? (
                    <Image
                        source={{ uri: avatarUri }}
                        style={{
                            width: 38,
                            height: 38,
                            borderRadius: 19,
                        }}
                    />
                ) : (
                    <View
                        style={{
                            width: 38,
                            height: 38,
                            borderRadius: 19,
                            backgroundColor: colors.primary,
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <Text
                            style={{
                                color: '#fff',
                                fontWeight: '700',
                                fontSize: 14,
                            }}
                        >
                            {initials}
                        </Text>
                    </View>
                )}
                {isOnline && (
                    <View
                        style={{
                            width: 10,
                            height: 10,
                            borderRadius: 5,
                            backgroundColor: colors.success,
                            position: 'absolute',
                            bottom: 0,
                            right: 0,
                            borderWidth: 1.5,
                            borderColor: colors.background,
                        }}
                    />
                )}
            </View>

            {/* Name */}
            <Text
                style={{
                    flex: 1,
                    fontSize: 17,
                    fontWeight: '700',
                    color: colors.text,
                }}
                numberOfLines={1}
            >
                {name}
            </Text>

            {/* Action icons */}
            <TouchableOpacity onPress={onAudioCall} hitSlop={8}>
                <Ionicons name="call-outline" size={22} color={colors.text} />
            </TouchableOpacity>
            <TouchableOpacity
                onPress={onVideoCall}
                hitSlop={8}
                style={{ marginLeft: 4 }}
            >
                <Ionicons
                    name="videocam-outline"
                    size={24}
                    color={colors.text}
                />
            </TouchableOpacity>
            <TouchableOpacity
                onPress={onMenuPress}
                hitSlop={8}
                style={{ marginLeft: 4 }}
            >
                <MaterialIcons name="menu" size={24} color={colors.text} />
            </TouchableOpacity>
        </View>
    );
}
