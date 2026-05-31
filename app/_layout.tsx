import '@/index.css';
import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import 'react-native-reanimated';
import { Provider } from 'react-redux';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { store } from '@/store';
import { AuthProvider } from '@/context/AuthContext';
import { CallProvider } from '@/context/CallContext';
import { SocketProvider } from '@/context/SocketContext';
import { NotificationProvider } from '@/context/NotificationContext';
import { GroupCallProvider } from '@/context/GroupCallContext';
import { StreamVideoProvider } from '@/context/StreamVideoContext';
import { SlideMenuProvider } from '@/context/SlideMenuContext';
import { AppearanceProvider, useAppearance } from '@/context/AppearanceContext';
import { useSessionConflictListener } from '@/hooks/useSessionConflictListener';
import { useAuth } from '@/hooks/useAuth';
import IncomingGroupCallModal from '@/components/call/IncomingGroupCallModal';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

// export const unstable_settings = {
//   anchor: '(tabs)',
// };

function RootLayoutContent() {
    const router = useRouter();
    const { state } = useAuth();
    const { colors, colorScheme } = useAppearance();
    const isInitialMount = useRef(true);
    const wasAuthenticated = useRef(state.isAuthenticated);

    // Monitor auth state and redirect on logout
    useEffect(() => {
        // On initial mount, just track initial state
        if (isInitialMount.current) {
            isInitialMount.current = false;
            wasAuthenticated.current = state.isAuthenticated;
            return;
        }

        // Redirect ONLY if transitioning from authenticated to non-authenticated
        if (
            wasAuthenticated.current &&
            !state.isAuthenticated &&
            !state.loading
        ) {
            router.replace('/(auth)/login');
        }

        // Update ref for next render
        wasAuthenticated.current = state.isAuthenticated;
    }, [state.isAuthenticated, state.loading, router]);

    useSessionConflictListener();

    return (
        <ThemeProvider value={DefaultTheme}>
            <Stack
                screenOptions={{
                    headerShown: false,
                    contentStyle: { backgroundColor: colors.background },
                }}
            >
                <Stack.Screen name="index" options={{ headerShown: false }} />
                <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen
                    name="(settings)"
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="chat/[id]"
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="friend-view"
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="work-hub"
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="ai"
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="profile"
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="modal"
                    options={{ presentation: 'modal', title: 'Modal' }}
                />
            </Stack>
            <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        </ThemeProvider>
    );
}

export default function RootLayout() {
    useEffect(() => {
        // Hide splash screen after layout
        SplashScreen.hideAsync();
    }, []);

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <Provider store={store}>
                <AuthProvider>
                    <StreamVideoProvider>
                        <SocketProvider>
                            <CallProvider>
                                <GroupCallProvider>
                                    <NotificationProvider>
                                        <AppearanceProvider>
                                            <SlideMenuProvider>
                                                <RootLayoutContent />
                                                <IncomingGroupCallModal />
                                            </SlideMenuProvider>
                                        </AppearanceProvider>
                                    </NotificationProvider>
                                </GroupCallProvider>
                            </CallProvider>
                        </SocketProvider>
                    </StreamVideoProvider>
                </AuthProvider>
            </Provider>
        </GestureHandlerRootView>
    );
}
