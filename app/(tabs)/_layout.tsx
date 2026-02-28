import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, useColorScheme } from 'react-native';

const ACTIVE_COLOR = '#00B14F';
const INACTIVE_COLOR = '#8E8E93';

export default function TabLayout() {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: ACTIVE_COLOR,
                tabBarInactiveTintColor: INACTIVE_COLOR,
                tabBarStyle: {
                    backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
                    borderTopColor: isDark ? '#38383A' : '#E5E5EA',
                    height: Platform.OS === 'ios' ? 85 : 62,
                    paddingBottom: Platform.OS === 'ios' ? 25 : 10,
                },
                tabBarLabelStyle: {
                    fontSize: 11,
                    fontWeight: '500',
                },
                headerShown: false,
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Tin nhắn',
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons
                            name={
                                focused ? 'chatbubbles' : 'chatbubbles-outline'
                            }
                            size={24}
                            color={color}
                        />
                    ),
                }}
            />
            <Tabs.Screen
                name="explore"
                options={{
                    title: 'Danh bạ',
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons
                            name={focused ? 'people' : 'people-outline'}
                            size={24}
                            color={color}
                        />
                    ),
                }}
            />
            <Tabs.Screen
                name="test"
                options={{
                    title: 'Lịch hẹn',
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons
                            name={focused ? 'calendar' : 'calendar-outline'}
                            size={24}
                            color={color}
                        />
                    ),
                }}
            />
            <Tabs.Screen
                name="setting"
                options={{
                    title: 'Cá nhân',
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons
                            name={focused ? 'person' : 'person-outline'}
                            size={24}
                            color={color}
                        />
                    ),
                }}
            />
            <Tabs.Screen 
                name='friends'
                options={{
                    title: 'Bạn bè',
                    tabBarIcon: ({ color, focused}) => (
                        <Ionicons 
                            name={focused ? 'people' : 'people-outline'}
                            size={24}
                            color={color}
                        />
                    )
                }}
            />
        </Tabs>
    );
}
