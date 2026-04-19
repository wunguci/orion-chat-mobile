import "@/index.css";
import {
    DarkTheme,
    DefaultTheme,
    ThemeProvider,
} from '@react-navigation/native';
import { Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import 'react-native-reanimated';
import { Provider } from 'react-redux';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { store } from '@/store';
import { AuthProvider } from '@/context/AuthContext';
import { CallProvider } from '@/context/CallContext';
import { SocketProvider } from '@/context/SocketContext';
import { useSessionConflictListener } from '@/hooks/useSessionConflictListener';
import { useAuth } from '@/hooks/useAuth';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

// export const unstable_settings = {
//   anchor: '(tabs)',
// };

function RootLayoutContent() {
    const colorScheme = useColorScheme();
    const router = useRouter();
    const { state } = useAuth();
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
        <ThemeProvider
            value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}
        >
            <Stack
                screenOptions={{
                    headerShown: false,
                    contentStyle: {
                        backgroundColor:
                            colorScheme === 'dark' ? '#000' : '#fff',
                    },
                }}
            >
                <Stack.Screen name="index" options={{ headerShown: false }} />
                <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen
                    name="chat/[id]"
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="friend-view"
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
        <Provider store={store}>
            <AuthProvider>
                <SocketProvider>
                    <CallProvider>
                        <RootLayoutContent />
                    </CallProvider>
                </SocketProvider>
            </AuthProvider>
        </Provider>
    );
}
