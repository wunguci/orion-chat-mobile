import { FontSizes, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import "../../index.css";

// Mock data
const MOCK_CONTACTS = [
  {
    id: "1",
    name: "Alice Johnson",
    status: "Available for chat",
    online: true,
  },
  { id: "2", name: "Bob Smith", status: "At work", online: true },
  { id: "3", name: "Charlie Brown", status: "Busy", online: false },
  { id: "4", name: "Diana Prince", status: "Online", online: true },
  { id: "5", name: "Eve Taylor", status: "Away", online: false },
];

export default function ContactsScreen() {
  const { colors } = useTheme();

  const renderContactItem = ({ item }: any) => (
    <TouchableOpacity style={styles.contactItem}>
      {/* Avatar */}
      <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
        <Text style={styles.avatarText}>
          {item.name
            .split(" ")
            .map((w: string) => w[0])
            .join("")
            .slice(0, 2)}
        </Text>
        {item.online && (
          <View style={[styles.onlineDot, { backgroundColor: "#34C759" }]} />
        )}
      </View>

      <View style={styles.contactInfo}>
        <Text style={[styles.contactName, { color: colors.text }]}>
          {item.name}
        </Text>
        <Text
          style={[styles.contactStatus, { color: colors.textSecondary }]}
          numberOfLines={1}
        >
          {item.status}
        </Text>
      </View>

      <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <Text
          style={[styles.headerTitle, { color: colors.text }]}
          className="text-red-500 text-xl font-bold text-blue-500"
        >
          Danh bạ
        </Text>
        <TouchableOpacity>
          <Ionicons
            name="add-circle-outline"
            size={28}
            color={colors.primary}
          />
        </TouchableOpacity>
      </View>

      <FlatList
        data={MOCK_CONTACTS}
        renderItem={renderContactItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.base,
    borderBottomWidth: 1,
    paddingTop: Platform.OS === "ios" ? 60 : Spacing.base,
  },
  headerTitle: {
    fontSize: FontSizes.xxl,
    fontWeight: "700",
  },
  list: {
    paddingVertical: Spacing.sm,
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  onlineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    position: "absolute",
    bottom: 0,
    right: 0,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: FontSizes.base,
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  contactStatus: {
    fontSize: FontSizes.sm,
  },
});
