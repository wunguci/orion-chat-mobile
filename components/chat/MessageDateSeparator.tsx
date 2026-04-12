import { useTheme } from '@/hooks/useTheme';
import React from 'react';
import { Text, View } from 'react-native';

interface MessageDateSeparatorProps {
    label: string;
}

export default function MessageDateSeparator({
    label,
}: MessageDateSeparatorProps) {
    const { colors } = useTheme();

    return (
        <View
            style={{
                alignItems: 'center',
                justifyContent: 'center',
                marginVertical: 10,
            }}
        >
            <View
                style={{
                    backgroundColor: 'rgba(255,255,255,0.08)',
                    borderRadius: 999,
                    borderWidth: 1,
                    borderColor: 'rgba(255,255,255,0.12)',
                    paddingHorizontal: 14,
                    paddingVertical: 5,
                }}
            >
                <Text
                    style={{
                        color: colors.textSecondary,
                        fontSize: 12,
                        fontWeight: '600',
                    }}
                >
                    {label}
                </Text>
            </View>
        </View>
    );
}
