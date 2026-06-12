import { useTheme } from '@/hooks/useTheme';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Modal,
    Pressable,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { Menu } from 'lucide-react-native';
import { useSlideMenu } from '@/context/SlideMenuContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface DropdownItem {
    label: string;
    icon: React.ReactNode;
    onPress: () => void;
}

interface ChatSearchBarProps {
    value: string;
    onChangeText: (text: string) => void;
    onAddFriendsPress?: () => void;
    onCreateGroupPress?: () => void;
    onQrScanPress?: () => void;
}

export default function ChatSearchBar({
    value,
    onChangeText,
    onAddFriendsPress,
    onCreateGroupPress,
    onQrScanPress,
}: ChatSearchBarProps) {
    const { colors } = useTheme();
    const { openMenu } = useSlideMenu();
    const insets = useSafeAreaInsets();
    const [menuVisible, setMenuVisible] = useState(false);
    const [menuPos, setMenuPos] = useState({ top: 0, right: 0 });
    const plusRef = React.useRef<View>(null);

    const dropdownItems: DropdownItem[] = [
        {
            label: 'Add Friends',
            icon: (
                <MaterialCommunityIcons
                    name="account-plus-outline"
                    size={18}
                    color={colors.text}
                />
            ),
            onPress: () => {
                setMenuVisible(false);
                onAddFriendsPress?.();
            },
        },
        {
            label: 'Create Group',
            icon: (
                <MaterialCommunityIcons
                    name="account-group-outline"
                    size={18}
                    color={colors.text}
                />
            ),
            onPress: () => {
                setMenuVisible(false);
                onCreateGroupPress?.();
            },
        },
    ];

    const openDropdown = () => {
        plusRef.current?.measureInWindow((x, y, width, height) => {
            setMenuPos({ top: y + height + 4, right: 12 });
            setMenuVisible(true);
        });
    };

    return (
        <View
            style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 12,
                paddingTop: insets.top + 10,
                paddingBottom: 8,
                backgroundColor: colors.background,
                gap: 10,
            }}
        >
            {/* Hamburger menu button */}
            <TouchableOpacity
                onPress={openMenu}
                activeOpacity={0.7}
                style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    backgroundColor: colors.primaryLight,
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <Menu size={20} color={colors.primary} strokeWidth={2.5} />
            </TouchableOpacity>
            {/* Search bar */}
            <View
                style={{
                    flex: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: colors.backgroundSecondary,
                    borderRadius: 10,
                    paddingHorizontal: 10,
                    height: 40,
                    gap: 6,
                }}
            >
                <Ionicons
                    name="search"
                    size={18}
                    color={colors.textSecondary}
                />
                <TextInput
                    value={value}
                    onChangeText={onChangeText}
                    placeholder="Search here..."
                    placeholderTextColor={colors.textSecondary}
                    style={{ flex: 1, color: colors.text, fontSize: 15 }}
                />
            </View>

            {/* QR icon */}
            <TouchableOpacity onPress={onQrScanPress} activeOpacity={0.7}>
                <MaterialCommunityIcons
                    name="qrcode-scan"
                    size={24}
                    color={colors.text}
                />
            </TouchableOpacity>

            {/* Plus button */}
            <TouchableOpacity onPress={openDropdown} ref={plusRef as any}>
                <Ionicons name="add" size={26} color={colors.text} />
            </TouchableOpacity>

            {/* Dropdown menu */}
            <Modal
                transparent
                visible={menuVisible}
                onRequestClose={() => setMenuVisible(false)}
            >
                <Pressable
                    style={{ flex: 1 }}
                    onPress={() => setMenuVisible(false)}
                >
                    <View
                        style={{
                            position: 'absolute',
                            top: menuPos.top,
                            right: menuPos.right,
                            backgroundColor: colors.card,
                            borderRadius: 12,
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.25,
                            shadowRadius: 8,
                            elevation: 8,
                            minWidth: 180,
                            overflow: 'hidden',
                        }}
                    >
                        {dropdownItems.map((item, index) => (
                            <TouchableOpacity
                                key={index}
                                onPress={item.onPress}
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    paddingHorizontal: 16,
                                    paddingVertical: 14,
                                    gap: 10,
                                    borderBottomWidth:
                                        index < dropdownItems.length - 1
                                            ? 0.5
                                            : 0,
                                    borderBottomColor: colors.divider,
                                }}
                            >
                                {item.icon}
                                <Text
                                    style={{ color: colors.text, fontSize: 15 }}
                                >
                                    {item.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </Pressable>
            </Modal>
        </View>
    );
}
