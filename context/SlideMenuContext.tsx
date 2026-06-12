import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    Image,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, usePathname } from 'expo-router';
import {
    MessageCircle,
    Users,
    Calendar,
    User,
    Sparkles,
    FileText,
    Briefcase,
    Video,
    X,
} from 'lucide-react-native';
import { useAuthUser } from '@/hooks/useAuth';
import { useThemeColors } from '@/hooks/useThemeColors';
import { API_BASE_URL } from '@/services/api/profile';

const DRAWER_WIDTH = 272;
const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Context
type SlideMenuContextType = {
    openMenu: () => void;
    closeMenu: () => void;
};

const SlideMenuContext = createContext<SlideMenuContextType>({
    openMenu: () => {},
    closeMenu: () => {},
});

export const useSlideMenu = () => useContext(SlideMenuContext);

// Helpers 
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

// Menu items
type MenuItem = {
    href: string;
    label: string;
    icon: React.ReactNode;
    match: (p: string) => boolean;
};

const MAIN_ITEMS: MenuItem[] = [
    {
        href: '/(tabs)',
        label: 'Chats',
        icon: <MessageCircle size={20} strokeWidth={2} />,
        match: (p) =>
            p === '/(tabs)' ||
            p === '/(tabs)/index' ||
            p.startsWith('/(tabs)/(main)'),
    },
    {
        href: '/(tabs)/friends',
        label: 'Friends',
        icon: <Users size={20} strokeWidth={2} />,
        match: (p) => p === '/(tabs)/friends',
    },
    {
        href: '/(tabs)/ai',
        label: 'Orion AI',
        icon: <Sparkles size={20} strokeWidth={2} />,
        match: (p) => p.startsWith('/(tabs)/ai'),
    },
    {
        href: '/(tabs)/setting',
        label: 'Profile',
        icon: <User size={20} strokeWidth={2} />,
        match: (p) => p === '/(tabs)/setting',
    },
];

const EXTRA_ITEMS: MenuItem[] = [
    {
        href: '/(tabs)/calendar',
        label: 'Calendar',
        icon: <Calendar size={20} strokeWidth={2} />,
        match: (p) => p.startsWith('/(tabs)/calendar'),
    },
    {
        href: '/(tabs)/notes',
        label: 'Notes',
        icon: <FileText size={20} strokeWidth={2} />,
        match: (p) => p.startsWith('/(tabs)/notes'),
    },
    {
        href: '/work-hub',
        label: 'WorkHub',
        icon: <Briefcase size={20} strokeWidth={2} />,
        match: (p) => p.startsWith('/work-hub'),
    },
];

// Drawer Row 
function DrawerRow({
    label,
    icon,
    isActive,
    onPress,
}: {
    label: string;
    icon: React.ReactNode;
    isActive: boolean;
    onPress: () => void;
}) {
    const colors = useThemeColors();

    return (
        <TouchableOpacity
            style={[
                styles.item,
                isActive && { backgroundColor: colors.primaryLight },
            ]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <View
                style={[
                    styles.iconWrap,
                    isActive && { backgroundColor: colors.backgroundSecondary },
                ]}
            >
                {React.isValidElement<{ color?: string }>(icon)
                    ? React.cloneElement(icon, {
                          color: isActive
                              ? colors.primary
                              : colors.textSecondary,
                      })
                    : icon}
            </View>
            <Text
                style={[
                    styles.itemLabel,
                    {
                        color: isActive ? colors.primaryDark : colors.textSecondary,
                        fontWeight: isActive ? '700' : '500',
                    },
                ]}
            >
                {label}
            </Text>
        </TouchableOpacity>
    );
}

// Slide Menu Component 
function SlideMenuDrawer({
    visible,
    onClose,
}: {
    visible: boolean;
    onClose: () => void;
}) {
    const insets = useSafeAreaInsets();
    const pathname = usePathname();
    const { user, loading } = useAuthUser();
    const colors = useThemeColors();
    const displayName = user?.fullName || user?.phoneNumber || 'User';
    const subtitle = user?.phoneNumber || user?.email || '';
    const avatarUri = resolveImageUrl(user?.avatarUrl);

    const translateX = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
    const backdropOpacity = useRef(new Animated.Value(0)).current;

    React.useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.spring(translateX, {
                    toValue: 0,
                    useNativeDriver: true,
                    tension: 65,
                    friction: 11,
                }),
                Animated.timing(backdropOpacity, {
                    toValue: 1,
                    duration: 220,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(translateX, {
                    toValue: -DRAWER_WIDTH,
                    duration: 200,
                    useNativeDriver: true,
                }),
                Animated.timing(backdropOpacity, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [visible, translateX, backdropOpacity]);

    const navigate = (href: string) => {
        onClose();
        setTimeout(() => router.push(href as any), 120);
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="none"
            statusBarTranslucent
            onRequestClose={onClose}
        >
            {/* Backdrop */}
            <TouchableWithoutFeedback onPress={onClose}>
                <Animated.View
                    style={[
                        StyleSheet.absoluteFillObject,
                        {
                            backgroundColor: `${colors.primary}2E`,
                            opacity: backdropOpacity,
                        },
                    ]}
                />
            </TouchableWithoutFeedback>

            {/* Drawer panel */}
            <Animated.View
                style={[
                    styles.drawer,
                    {
                        paddingTop: insets.top + 8,
                        backgroundColor: colors.card,
                        transform: [{ translateX }],
                    },
                ]}
            >
                {/* Close button */}
                <TouchableOpacity
                    style={[
                        styles.closeBtn,
                        { backgroundColor: colors.backgroundSecondary },
                    ]}
                    onPress={onClose}
                    activeOpacity={0.7}
                >
                    <X size={18} color={colors.textSecondary} />
                </TouchableOpacity>

                {/* Profile header */}
                <TouchableOpacity
                    style={styles.header}
                    onPress={() => navigate('/(settings)/profile')}
                    activeOpacity={0.8}
                >
                    <View
                        style={[
                            styles.avatar,
                            {
                                backgroundColor: colors.primaryLight,
                                borderColor: colors.primary,
                            },
                        ]}
                    >
                        {avatarUri ? (
                            <Image
                                source={{ uri: avatarUri }}
                                style={styles.avatarImage}
                            />
                        ) : (
                            <Text style={[styles.avatarText, { color: colors.primary }]}>
                                {getInitials(displayName)}
                            </Text>
                        )}
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text
                            style={[styles.userName, { color: colors.text }]}
                            numberOfLines={1}
                        >
                            {loading ? 'Loading...' : displayName}
                        </Text>
                        {!!subtitle && (
                            <Text
                                style={[
                                    styles.userSub,
                                    { color: colors.textSecondary },
                                ]}
                                numberOfLines={1}
                            >
                                {subtitle}
                            </Text>
                        )}
                    </View>
                </TouchableOpacity>

                <View style={[styles.divider, { backgroundColor: colors.border }]} />

                {/* Main nav items */}
                {MAIN_ITEMS.map((item) => (
                    <DrawerRow
                        key={item.href}
                        label={item.label}
                        icon={item.icon}
                        isActive={item.match(pathname)}
                        onPress={() => navigate(item.href)}
                    />
                ))}

                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                <Text
                    style={[
                        styles.sectionLabel,
                        { color: colors.textSecondary },
                    ]}
                >
                    OTHER FEATURES
                </Text>

                {EXTRA_ITEMS.map((item) => (
                    <DrawerRow
                        key={item.href}
                        label={item.label}
                        icon={item.icon}
                        isActive={item.match(pathname)}
                        onPress={() => navigate(item.href)}
                    />
                ))}
            </Animated.View>
        </Modal>
    );
}

// Provider
export function SlideMenuProvider({ children }: { children: React.ReactNode }) {
    const [visible, setVisible] = useState(false);

    const openMenu = useCallback(() => setVisible(true), []);
    const closeMenu = useCallback(() => setVisible(false), []);

    return (
        <SlideMenuContext.Provider value={{ openMenu, closeMenu }}>
            {children}
            <SlideMenuDrawer visible={visible} onClose={closeMenu} />
        </SlideMenuContext.Provider>
    );
}

// Styles
const styles = StyleSheet.create({
    drawer: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: DRAWER_WIDTH,
        shadowColor: '#000',
        shadowOffset: { width: 4, height: 0 },
        shadowOpacity: 0.12,
        shadowRadius: 12,
        elevation: 16,
    },
    closeBtn: {
        position: 'absolute',
        top: 12,
        right: 12,
        padding: 8,
        borderRadius: 20,
        zIndex: 10,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 16,
        paddingVertical: 16,
        marginTop: 4,
    },
    avatar: {
        width: 46,
        height: 46,
        borderRadius: 23,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    avatarImage: {
        width: '100%',
        height: '100%',
    },
    avatarText: {
        fontWeight: '700',
        fontSize: 15,
    },
    userName: {
        fontWeight: '700',
        fontSize: 15,
    },
    userSub: {
        fontSize: 12,
        marginTop: 2,
    },
    divider: {
        height: 0.5,
        marginHorizontal: 12,
        marginVertical: 6,
    },
    sectionLabel: {
        fontSize: 10,
        letterSpacing: 1,
        marginHorizontal: 16,
        marginTop: 8,
        marginBottom: 4,
        fontWeight: '700',
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 12,
        paddingVertical: 11,
        marginHorizontal: 8,
        borderRadius: 10,
        marginBottom: 2,
    },
    iconWrap: {
        width: 32,
        height: 32,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    itemLabel: {
        fontSize: 14,
    },
});
