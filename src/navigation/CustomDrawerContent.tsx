import {
  DrawerContentComponentProps,
  DrawerContentScrollView,
} from "@react-navigation/drawer";
import { router, usePathname } from "expo-router";
import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { whColors } from "@/constants/tailwindColors";
import { useAuthUser } from "@/hooks/useAuth";
import { API_BASE_URL } from "@/services/api/profile";
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
    href: "/work-hub",
    label: "WorkHub",
    icon: <Briefcase size={20} strokeWidth={2} />,
    match: (pathname) => pathname.startsWith("/work-hub"),
  },
  {
    href: "/(tabs)/video-call",
    label: "Video Call",
    icon: <Video size={20} strokeWidth={2} />,
    match: (pathname) => pathname.startsWith("/(tabs)/video-call"),
  },
];

const resolveImageUrl = (value?: string | null) => {
  if (!value) return undefined;
  if (/^https?:\/\//i.test(value)) return value;

  const normalizedPath = value.startsWith("/") ? value : `/${value}`;
  return `${API_BASE_URL}${normalizedPath}`;
};

const getInitials = (name?: string | null) => {
  const normalized = (name || "User").trim();
  return normalized
    .split(/\s+/)
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

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
        {React.isValidElement<{ color?: string }>(icon)
          ? React.cloneElement(icon, {
              color: isActive ? whColors.primary : whColors.textSecondary,
            })
          : icon}
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
  const { user, loading } = useAuthUser();
  const displayName = user?.fullName || user?.phoneNumber || "User";
  const subtitle = user?.phoneNumber || user?.email || "No phone";
  const avatarUri = resolveImageUrl(user?.avatarUrl);

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
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
          ) : (
            <Text style={styles.avatarText}>{getInitials(displayName)}</Text>
          )}
        </View>
        <View>
          <Text style={styles.userName} numberOfLines={1}>
            {loading ? "Loading..." : displayName}
          </Text>
          <Text style={styles.userSub} numberOfLines={1}>
            {loading ? "" : subtitle}
          </Text>
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
        <Text style={styles.sectionLabel}>TÍNH NĂNG KHÁC</Text>

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
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
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
