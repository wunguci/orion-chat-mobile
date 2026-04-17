import { MessageCircle, Users, Calendar, User } from "lucide-react-native";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { whColors } from "@/constants/tailwindColors";
import { useNotificationContext } from "@/context/NotificationContext";

type TabIconType = {
  default: React.ReactNode;
  active: React.ReactNode;
};

const TAB_ICON: Record<string, TabIconType> = {
  index: {
    default: <Users size={22} strokeWidth={1.7} color={whColors.textMuted} />,
    active: <Users size={22} strokeWidth={2.4} color={whColors.primary} />,
  },
  chat: {
    default: (
      <MessageCircle size={22} strokeWidth={1.7} color={whColors.textMuted} />
    ),
    active: (
      <MessageCircle size={22} strokeWidth={2.4} color={whColors.primary} />
    ),
  },
  explore: {
    default: (
      <Calendar size={22} strokeWidth={1.7} color={whColors.textMuted} />
    ),
    active: <Calendar size={22} strokeWidth={2.4} color={whColors.primary} />,
  },
  profile: {
    default: <User size={22} strokeWidth={1.7} color={whColors.textMuted} />,
    active: <User size={22} strokeWidth={2.4} color={whColors.primary} />,
  },
};

export default function CustomTabBar({ state, navigation }: any) {
  const insets = useSafeAreaInsets();
  const { unreadMessageCount } = useNotificationContext();

  return (
    <View
      style={[styles.container, { paddingBottom: Math.max(insets.bottom, 6) }]}
    >
      {state.routes.map((route: any, index: number) => {
        const isFocused = state.index === index;
        const icon = TAB_ICON[route.name] || TAB_ICON.index;

        return (
          <TouchableOpacity
            key={route.key}
            style={styles.tabItem}
            onPress={() => {
              const event = navigation.emit({
                type: "tabPress",
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            }}
            activeOpacity={0.7}
          >
            <View style={[styles.iconWrap, isFocused && styles.iconWrapActive]}>
              {isFocused ? icon.active : icon.default}
              {route.name === "index" && unreadMessageCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {unreadMessageCount > 99 ? "99+" : unreadMessageCount}
                  </Text>
                </View>
              )}
            </View>
            {isFocused && <View style={styles.dot} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: whColors.bgLight,
    borderTopWidth: 1,
    borderTopColor: whColors.borderLight,
    paddingTop: 4,
    paddingHorizontal: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    gap: 3,
    paddingVertical: 2,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrapActive: {
    backgroundColor: whColors.bgHeavy,
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -6,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 3,
    backgroundColor: "#ef4444",
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "700",
    lineHeight: 11,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: whColors.primary,
  },
});
