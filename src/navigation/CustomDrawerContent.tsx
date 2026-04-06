import {
  DrawerContentComponentProps,
  DrawerContentScrollView,
} from "@react-navigation/drawer";
import { router, usePathname } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  MessageCircle,
  Users,
  Calendar,
  User,
  Sparkles,
  FileText,
  Briefcase,
  Video,
} from "lucide-react-native";

type DrawerItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
  match: (pathname: string) => boolean;
};

const MAIN_ITEMS: DrawerItem[] = [
  {
    href: "/(tabs)/(main)",
    label: "Tin nhắn",
    icon: <MessageCircle size={20} strokeWidth={2} />,
    match: (pathname) =>
      pathname === "/(tabs)/(main)" ||
      pathname.startsWith("/(tabs)/(main)/index"),
  },
  {
    href: "/(tabs)/(main)/explore",
    label: "Danh bạ",
    icon: <Users size={20} strokeWidth={2} />,
    match: (pathname) => pathname.startsWith("/(tabs)/(main)/explore"),
  },
  {
    href: "/(tabs)/(main)/calendar",
    label: "Lịch",
    icon: <Calendar size={20} strokeWidth={2} />,
    match: (pathname) => pathname.startsWith("/(tabs)/(main)/calendar"),
  },
  {
    href: "/(tabs)/(main)/setting",
    label: "Profile",
    icon: <User size={20} strokeWidth={2} />,
    match: (pathname) => pathname.startsWith("/(tabs)/(main)/setting"),
  },
];

const EXTRA_ITEMS: DrawerItem[] = [
  {
    href: "/(tabs)/ai",
    label: "AI Chatbot",
    icon: <Sparkles size={20} strokeWidth={2} />,
    match: (pathname) => pathname.startsWith("/(tabs)/ai"),
  },
  {
    href: "/(tabs)/notes",
    label: "Ghi chú",
    icon: <FileText size={20} strokeWidth={2} />,
    match: (pathname) => pathname.startsWith("/(tabs)/notes"),
  },
  {
    href: "/(tabs)/work-hub",
    label: "WorkHub",
    icon: <Briefcase size={20} strokeWidth={2} />,
    match: (pathname) => pathname.startsWith("/(tabs)/work-hub"),
  },
  {
    href: "/(tabs)/video-call",
    label: "Video Call",
    icon: <Video size={20} strokeWidth={2} />,
    match: (pathname) => pathname.startsWith("/(tabs)/video-call"),
  },
];

const PRIMARY_ORANGE = "#ee652b";
const PRIMARY_TEAL = "#14b8a6";

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
  return (
    <TouchableOpacity
      style={[styles.item, isActive && styles.itemActive]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.iconWrap, isActive && styles.iconWrapActive]}>
        {React.cloneElement(icon as React.ReactElement, {
          color: isActive ? PRIMARY_ORANGE : "#888",
        })}
      </View>
      <Text style={[styles.itemLabel, isActive && styles.itemLabelActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export default function CustomDrawerContent(
  props: DrawerContentComponentProps,
) {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <TouchableOpacity
        style={styles.header}
        onPress={() => {
          router.push("/profile");
          props.navigation.closeDrawer();
        }}
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>HP</Text>
        </View>
        <View>
          <Text style={styles.userName}>Phan Phước Hiệp</Text>
          <Text style={styles.userSub}>Xem profile →</Text>
        </View>
      </TouchableOpacity>

      <View style={styles.divider} />

      <DrawerContentScrollView
        {...props}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {MAIN_ITEMS.map((item) => (
          <DrawerRow
            key={item.href}
            label={item.label}
            icon={item.icon}
            isActive={item.match(pathname)}
            onPress={() => {
              router.push(item.href as any);
              props.navigation.closeDrawer();
            }}
          />
        ))}

        <View style={styles.divider} />
        <Text style={styles.sectionLabel}>TINH NANG KHAC</Text>

        {EXTRA_ITEMS.map((item) => (
          <DrawerRow
            key={item.href}
            label={item.label}
            icon={item.icon}
            isActive={item.match(pathname)}
            onPress={() => {
              router.push(item.href as any);
              props.navigation.closeDrawer();
            }}
          />
        ))}
      </DrawerContentScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#0a0a0a",
  },
  contentContainer: {
    paddingTop: 0,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#1a1a1a",
    borderWidth: 2,
    borderColor: PRIMARY_ORANGE,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: PRIMARY_ORANGE,
    fontWeight: "700",
    fontSize: 16,
  },
  userName: {
    color: "#DDDDDD",
    fontWeight: "500",
    fontSize: 14,
  },
  userSub: {
    color: "#666",
    fontSize: 12,
    marginTop: 2,
  },
  divider: {
    height: 0.5,
    backgroundColor: "#1a1a1a",
    marginHorizontal: 16,
    marginVertical: 8,
  },
  sectionLabel: {
    fontSize: 11,
    color: "#555",
    letterSpacing: 1.2,
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 8,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 13,
    marginHorizontal: 10,
    borderRadius: 12,
    marginBottom: 2,
  },
  itemActive: {
    backgroundColor: "rgba(238, 101, 43, 0.15)",
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrapActive: {
    backgroundColor: "rgba(238, 101, 43, 0.2)",
  },
  itemLabel: {
    fontSize: 15,
    color: "#888",
    fontWeight: "500",
  },
  itemLabelActive: {
    color: PRIMARY_ORANGE,
    fontWeight: "600",
  },
});
