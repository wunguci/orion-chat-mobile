import { Tabs } from 'expo-router';
import React from 'react';
import { whColors } from '@/constants/tailwindColors';
import CustomTabBar from './CustomTabBar';

export default function BottomTabNavigator() {
    return (
        <Tabs
            tabBar={(props) => <CustomTabBar {...props} />}
            screenOptions={{
                headerShown: false,
                sceneStyle: { backgroundColor: whColors.bgLight },
            }}
        >
            {/* Main 4 tabs */}
            <Tabs.Screen name="index" options={{ title: 'Chats' }} />
            <Tabs.Screen name="friends" options={{ title: 'Bạn bè' }} />
            <Tabs.Screen name="ai" options={{ title: 'AI Bot' }} />
            <Tabs.Screen name="setting" options={{ title: 'Hồ sơ' }} />

            {/* Hidden screens (still routable, not shown in tab bar) */}
            <Tabs.Screen
                name="calendar"
                options={{ href: null, title: 'Lịch' }}
            />
            <Tabs.Screen
                name="notes"
                options={{ href: null, title: 'Ghi chú' }}
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
