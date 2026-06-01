import { useTheme } from '@/hooks/useTheme';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

export type ChatTab = 'all' | 'unread';

interface ChatTabFilterProps {
    activeTab: ChatTab;
    onTabChange: (tab: ChatTab) => void;
}

const TABS: { key: ChatTab; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'unread', label: 'Unread' },
];

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
                            borderBottomColor: colors.primary,
                        }}
                    >
                        <Text
                            style={{
                                fontSize: 15,
                                fontWeight: isActive ? '700' : '400',
                                color: isActive
                                    ? colors.primary
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
