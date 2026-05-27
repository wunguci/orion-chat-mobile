import React from 'react';
import {
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Menu } from 'lucide-react-native';
import { whColors } from '@/constants/tailwindColors';
import { useSlideMenu } from '@/context/SlideMenuContext';
import { useAuthUser } from '@/hooks/useAuth';
import { API_BASE_URL } from '@/services/api/profile';

const resolveImageUrl = (value?: string | null) => {
    if (!value) return undefined;
    if (/^https?:\/\//i.test(value)) return value;
    const normalizedPath = value.startsWith('/') ? value : `/${value}`;
    return `${API_BASE_URL}${normalizedPath}`;
};

const getInitials = (name?: string | null) => {
    const normalized = (name || 'U').trim();
    return normalized
        .split(/\s+/)
        .map((w) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
};

type TabHeaderProps = {
    title: string;
    /** Optional right-side slot for extra action buttons */
    rightSlot?: React.ReactNode;
};

export default function TabHeader({ title, rightSlot }: TabHeaderProps) {
    const insets = useSafeAreaInsets();
    const { openMenu } = useSlideMenu();
    const { user } = useAuthUser();

    const avatarUri = resolveImageUrl(user?.avatarUrl);
    const displayName = user?.fullName || user?.phoneNumber || 'User';

    return (
        <View style={[styles.container, { paddingTop: insets.top + 4 }]}>
            {/* Left: Hamburger menu */}
            <TouchableOpacity
                style={styles.menuBtn}
                onPress={openMenu}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
                <Menu size={21} color={whColors.primary} strokeWidth={2} />
            </TouchableOpacity>

            {/* Center: Title */}
            <Text style={styles.title}>{title}</Text>

            {/* Right: extra actions or avatar */}
            <View style={styles.rightSide}>
                {rightSlot ?? (
                    <View style={styles.avatar}>
                        {avatarUri ? (
                            <Image
                                source={{ uri: avatarUri }}
                                style={styles.avatarImage}
                            />
                        ) : (
                            <Text style={styles.avatarText}>
                                {getInitials(displayName)}
                            </Text>
                        )}
                    </View>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingBottom: 10,
        backgroundColor: whColors.bgLight,
        borderBottomWidth: 1,
        borderBottomColor: whColors.borderLight,
    },
    menuBtn: {
        width: 38,
        height: 38,
        borderRadius: 10,
        backgroundColor: whColors.bgHeavy,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        flex: 1,
        textAlign: 'center',
        fontSize: 17,
        fontWeight: '700',
        color: whColors.textPrimary,
    },
    rightSide: {
        width: 38,
        alignItems: 'flex-end',
    },
    avatar: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: whColors.bgMedium,
        borderWidth: 1.5,
        borderColor: whColors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    avatarImage: {
        width: '100%',
        height: '100%',
    },
    avatarText: {
        color: whColors.primary,
        fontWeight: '700',
        fontSize: 13,
    },
});
