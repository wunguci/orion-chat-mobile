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

interface DropdownItem {
    label: string;
    icon: React.ReactNode;
    onPress: () => void;
}

interface ChatSearchBarProps {
    value: string;
    onChangeText: (text: string) => void;
    onCreateGroupPress?: () => void;
}

export default function ChatSearchBar({
    value,
    onChangeText,
    onCreateGroupPress,
}: ChatSearchBarProps) {
    const { colors } = useTheme();
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
            onPress: () => setMenuVisible(false),
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

    const openMenu = () => {
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
                paddingVertical: 8,
                backgroundColor: colors.background,
                gap: 10,
            }}
        >
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
            <TouchableOpacity>
                <MaterialCommunityIcons
                    name="qrcode-scan"
                    size={24}
                    color={colors.text}
                />
            </TouchableOpacity>

            {/* Plus button */}
            <TouchableOpacity onPress={openMenu} ref={plusRef as any}>
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
