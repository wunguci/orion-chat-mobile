import { useTheme } from '@/hooks/useTheme';
import React from 'react';
import { Image, Text, View } from 'react-native';

interface SingleAvatarProps {
    uri?: string;
    name: string;
    size: number;
}

function SingleAvatar({ uri, name, size }: SingleAvatarProps) {
    const { colors } = useTheme();

    const initials = name
        .split(' ')
        .map((w) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    if (uri) {
        return (
            <Image
                source={{ uri }}
                style={{
                    width: size,
                    height: size,
                    borderRadius: size / 2,
                }}
            />
        );
    }

    return (
        <View
            style={{
                width: size,
                height: size,
                borderRadius: size / 2,
                backgroundColor: colors.primary,
                alignItems: 'center',
                justifyContent: 'center',
            }}
        >
            <Text
                style={{
                    color: '#fff',
                    fontSize: size * 0.36,
                    fontWeight: '600',
                }}
            >
                {initials}
            </Text>
        </View>
    );
}

interface ChatAvatarProps {
    name: string;
    avatarUri?: string;
    avatarUris?: string[];
    isGroup: boolean;
    size?: number;
}

export default function ChatAvatar({
    name,
    avatarUri,
    avatarUris,
    isGroup,
    size = 50,
}: ChatAvatarProps) {
    const { colors } = useTheme();

    if (isGroup && avatarUris && avatarUris.length > 1) {
        const smallSize = size * 0.64;

        return (
            <View style={{ width: size, height: size }}>
                {/* Back avatars (bottom-right) */}
                {avatarUris.length >= 2 && (
                    <View
                        style={{
                            position: 'absolute',
                            right: 0,
                            bottom: 0,
                            borderRadius: smallSize / 2,
                            borderWidth: 2,
                            borderColor: colors.background,
                        }}
                    >
                        <SingleAvatar
                            uri={avatarUris[1]}
                            name={name}
                            size={smallSize}
                        />
                    </View>
                )}
                {/* Front avatar (top-left) */}
                <View
                    style={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        borderRadius: smallSize / 2,
                        borderWidth: 2,
                        borderColor: colors.background,
                    }}
                >
                    <SingleAvatar
                        uri={avatarUris[0]}
                        name={name}
                        size={smallSize}
                    />
                </View>
            </View>
        );
    }

    return (
        <SingleAvatar
            uri={avatarUri ?? avatarUris?.[0]}
            name={name}
            size={size}
        />
    );
}
