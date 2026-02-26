import { useTheme } from '@/hooks/useTheme';
import React from 'react';
import { Text, View } from 'react-native';

interface MessageTimestampProps {
    time: string;
}

export default function MessageTimestamp({ time }: MessageTimestampProps) {
    const { colors } = useTheme();
    return (
        <View
            style={{
                alignItems: 'center',
                marginVertical: 10,
            }}
        >
            <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                {time}
            </Text>
        </View>
    );
}
