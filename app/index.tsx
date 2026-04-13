import { Redirect } from 'expo-router';
import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

// Redirect based on auth state
export default function Index() {
    const { state } = useAuth();

    useEffect(() => {
        console.log(
            '[Index] App Index loaded - isAuthenticated:',
            state.isAuthenticated,
            'loading:',
            state.loading,
        );
    }, [state.isAuthenticated, state.loading]);

    // Still loading, stay on index
    if (state.loading) {
        console.log('[Index] Still loading, staying on index');
        return null;
    }

    // Not authenticated, go to login
    if (!state.isAuthenticated) {
        console.log('[Index] Not authenticated, redirecting to login');
        return <Redirect href="/(auth)/login" />;
    }

    // Authenticated, go to home
    console.log('[Index] Authenticated, redirecting to home');
    return <Redirect href="/home" />;
}
