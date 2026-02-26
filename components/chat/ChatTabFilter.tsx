import { useTheme } from '@/hooks/useTheme';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

export type ChatTab = 'all' | 'unread';

interface ChatTabFilterProps {
    activeTab: ChatTab;
    onTabChange: (tab: ChatTab) => void;
}

const TABS: { key: ChatTab; label: string }[] = [
    { key: 'all', label: 'Tất cả' },
    { key: 'unread', label: 'Chưa đọc' },
];

// Zalo-like green active color
const ACTIVE_COLOR = '#00B14F';

export default function ChatTabFilter({
    activeTab,
    onTabChange,
}: ChatTabFilterProps) {
    const { colors } = useTheme();

    return (
        <View
            style={{
                flexDirection: 'row',
                borderBottomWidth: 0.5,
                borderBottomColor: colors.divider,
                backgroundColor: colors.background,
            }}
        >
            {TABS.map((tab) => {
                const isActive = tab.key === activeTab;
                return (
                    <TouchableOpacity
                        key={tab.key}
                        onPress={() => onTabChange(tab.key)}
                        style={{
                            paddingHorizontal: 20,
                            paddingVertical: 12,
                            borderBottomWidth: isActive ? 2 : 0,
                            borderBottomColor: ACTIVE_COLOR,
                        }}
                    >
                        <Text
                            style={{
                                fontSize: 15,
                                fontWeight: isActive ? '700' : '400',
                                color: isActive
                                    ? ACTIVE_COLOR
                                    : colors.textSecondary,
                            }}
                        >
                            {tab.label}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
}
