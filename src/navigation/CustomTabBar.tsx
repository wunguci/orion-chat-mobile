import { MessageCircle, Users, Calendar, User } from "lucide-react-native";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const PRIMARY_ORANGE = "#ee652b";

const TAB_ICON: Record<
  string,
  {
    default: React.ReactNode;
    active: React.ReactNode;
  }
> = {
  index: {
    default: <MessageCircle size={24} strokeWidth={1.5} color="#666" />,
    active: (
      <MessageCircle size={24} strokeWidth={2.5} color={PRIMARY_ORANGE} />
    ),
  },
  explore: {
    default: <Users size={24} strokeWidth={1.5} color="#666" />,
    active: <Users size={24} strokeWidth={2.5} color={PRIMARY_ORANGE} />,
  },
  calendar: {
    default: <Calendar size={24} strokeWidth={1.5} color="#666" />,
    active: <Calendar size={24} strokeWidth={2.5} color={PRIMARY_ORANGE} />,
  },
  setting: {
    default: <User size={24} strokeWidth={1.5} color="#666" />,
    active: <User size={24} strokeWidth={2.5} color={PRIMARY_ORANGE} />,
  },
};

export default function CustomTabBar({ state, navigation }: any) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[styles.container, { paddingBottom: Math.max(insets.bottom, 8) }]}
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
            </View>
            {isFocused ? <View style={styles.dot} /> : null}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: "#D6F2F2",
    borderTopWidth: 0.5,
    borderTopColor: "#D6F2F2",
    paddingTop: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrapActive: {
    backgroundColor: "#90f7f7",
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: PRIMARY_ORANGE,
  },
});
