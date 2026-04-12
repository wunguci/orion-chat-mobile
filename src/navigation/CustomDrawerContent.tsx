import {
  DrawerContentComponentProps,
  DrawerContentScrollView,
} from "@react-navigation/drawer";
import { router, usePathname } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { whColors } from "@/constants/tailwindColors";
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
          color: isActive ? whColors.primary : whColors.textSecondary,
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
    <View style={[styles.root, { paddingTop: insets.top + 4 }]}>
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
          <Text style={styles.userSub}>Xem profile</Text>
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
    backgroundColor: whColors.bgLight,
  },
  contentContainer: {
    paddingTop: 0,
    paddingBottom: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: whColors.bgMedium,
    borderWidth: 1.5,
    borderColor: whColors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: whColors.primary,
    fontWeight: "700",
    fontSize: 14,
  },
  userName: {
    color: whColors.textPrimary,
    fontWeight: "600",
    fontSize: 14,
  },
  userSub: {
    color: whColors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  divider: {
    height: 0.5,
    backgroundColor: whColors.borderLight,
    marginHorizontal: 12,
    marginVertical: 6,
  },
  sectionLabel: {
    fontSize: 11,
    color: whColors.textSecondary,
    letterSpacing: 0.8,
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 6,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginHorizontal: 8,
    borderRadius: 10,
    marginBottom: 2,
  },
  itemActive: {
    backgroundColor: whColors.bgHeavy,
  },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrapActive: {
    backgroundColor: whColors.bgMedium,
  },
  itemLabel: {
    fontSize: 14,
    color: whColors.textSecondary,
    fontWeight: "500",
  },
  itemLabelActive: {
    color: whColors.primaryHover,
    fontWeight: "600",
  },
});
