import { Tabs } from 'expo-router';
import React from 'react';
import CustomTabBar from './CustomTabBar';
import { useThemeColors } from '@/hooks/useThemeColors';

export default function BottomTabNavigator() {
    const colors = useThemeColors();

    return (
        <Tabs
            tabBar={(props) => <CustomTabBar {...props} />}
            screenOptions={{
                headerShown: false,
                sceneStyle: { backgroundColor: colors.background },
            }}
        >
            {/* Main tabs */}
            <Tabs.Screen name="index" options={{ title: 'Chats' }} />
            <Tabs.Screen name="friends" options={{ title: 'Friends' }} />
            <Tabs.Screen name="ai" options={{ title: 'AI Bot' }} />
            <Tabs.Screen name="notification" options={{ title: 'Notifications' }} />
            <Tabs.Screen name="setting" options={{ title: 'Profile' }} />

            {/* Hidden screens (still routable, not shown in tab bar) */}
            <Tabs.Screen
                name="calendar"
                options={{ href: null, title: 'Calendar' }}
            />
            <Tabs.Screen
                name="notes"
                options={{ href: null, title: 'Notes' }}
            />
            <Tabs.Screen
                name="video-call"
                options={{ href: null, title: 'Video Call' }}
            />
            <Tabs.Screen
                name="work-hub"
                options={{ href: null, title: 'WorkHub' }}
            />
            <Tabs.Screen
                name="group-call"
                options={{ href: null, title: 'Group Call' }}
            />
            <Tabs.Screen
                name="explore"
                options={{ href: null }}
            />
            <Tabs.Screen
                name="(main)"
                options={{ href: null }}
            />
        </Tabs>
    );
}
