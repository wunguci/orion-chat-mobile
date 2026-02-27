import { Link2, Search, X } from "lucide-react-native";
import React, { useMemo, useState } from "react";
import {
  Image,
  Modal,
  SafeAreaView,
  SectionList,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import CustomToggle from "../common/CustomToggle";

interface User {
  id: string;
  name: string;
  username?: string;
  avatar: string;
}

interface AddMemberModalProps {
  visible: boolean;
  onClose: () => void;
  currentMembers: string[];
}

const users: User[] = [
  {
    id: "user1",
    name: "Anh Long",
    username: "@long1248",
    avatar: "https://via.placeholder.com/48?text=AL",
  },
  {
    id: "user2",
    name: "Ba",
    avatar: "https://via.placeholder.com/48?text=Ba",
  },
  {
    id: "user3",
    name: "Bà chủ tiệm Tap Nham",
    avatar: "https://via.placeholder.com/48?text=BT",
  },
  {
    id: "user4",
    name: "Bà Nội",
    avatar: "https://via.placeholder.com/48?text=BN",
  },
  {
    id: "user5",
    name: "Bảo Trọng",
    avatar: "https://via.placeholder.com/48?text=BT2",
  },
  {
    id: "user6",
    name: "Bé để Chubby",
    avatar: "https://via.placeholder.com/48?text=BC",
  },
  {
    id: "user7",
    name: "Buicongdanh",
    avatar: "https://via.placeholder.com/48?text=BD",
  },
  {
    id: "user8",
    name: "Bụng to Lò xo ngắn",
    avatar: "https://via.placeholder.com/48?text=BL",
  },
];

export default function AddMemberModal({
  visible,
  onClose,
  currentMembers,
}: AddMemberModalProps) {
  const [searchText, setSearchText] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [notifyNewMembers, setNotifyNewMembers] = useState(true);

  // Group users by first letter
  const groupedUsers = useMemo(() => {
    const filtered = users.filter(
      (user) =>
        user.name.toLowerCase().includes(searchText.toLowerCase()) ||
        user.username?.toLowerCase().includes(searchText.toLowerCase()),
    );

    const grouped: Record<string, User[]> = {};
    filtered.forEach((user) => {
      const firstLetter = user.name[0].toUpperCase();
      if (!grouped[firstLetter]) {
        grouped[firstLetter] = [];
      }
      grouped[firstLetter].push(user);
    });

    return Object.entries(grouped)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([letter, items]) => ({
        title: letter,
        data: items,
      }));
  }, [searchText]);

  const toggleUser = (userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    );
  };

  const isUserSelected = (userId: string) => selectedUsers.includes(userId);
  const isUserAlreadyMember = (userId: string) =>
    currentMembers.includes(userId);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      presentationStyle="fullScreen"
    >
      <SafeAreaView className="flex-1 bg-white">
        {/* Header */}
        <View className="flex-row items-center justify-between border-b border-gray-border px-4 py-4">
          <TouchableOpacity onPress={onClose}>
            <X size={24} color="#505050" />
          </TouchableOpacity>
          <View className="flex-1 ml-4">
            <Text className="text-lg font-bold text-gray-primary">
              Thêm vào nhóm
            </Text>
            <Text className="mt-1 text-xs text-gray-secondary">
              Đã chọn: {selectedUsers.length}
            </Text>
          </View>
        </View>

        {/* Search Bar */}
        <View className="px-4 py-3">
          <View className="flex-row items-center gap-2 rounded-full bg-gray-border px-3 py-2">
            <Search size={20} color="#94a3b8" />
            <TextInput
              placeholder="Tìm tên hoặc số điện thoại"
              placeholderTextColor="#cbd5e1"
              value={searchText}
              onChangeText={setSearchText}
              className="flex-1 text-sm text-gray-primary"
            />
            {searchText.length > 0 && (
              <Text className="text-xs font-semibold text-gray-secondary">
                {users.length}
              </Text>
            )}
          </View>
        </View>

        {/* Invite by Link Option */}
        <TouchableOpacity className="flex-row items-center gap-3 px-4 py-3">
          <View className="h-12 w-12 rounded-full bg-blue-100 items-center justify-center">
            <Link2 size={20} color="#2563EB" />
          </View>
          <View className="flex-1">
            <Text className="text-base font-semibold text-gray-primary">
              Mời vào nhóm bằng link
            </Text>
          </View>
        </TouchableOpacity>

        {/* Divider */}
        <View className="h-px bg-gray-100" />

        {/* Users List */}
        <SectionList
          sections={groupedUsers}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const isAlreadyMember = isUserAlreadyMember(item.id);
            const isSelected = isUserSelected(item.id);

            return (
              <TouchableOpacity
                onPress={() => !isAlreadyMember && toggleUser(item.id)}
                disabled={isAlreadyMember}
                className={`flex-row items-center gap-3 px-4 py-3 ${
                  isAlreadyMember ? "opacity-50" : ""
                }`}
              >
                {/* Checkbox */}
                <View
                  className={`h-6 w-6 rounded-full border-2 items-center justify-center ${
                    isSelected
                      ? "bg-orange-primary border-orange-primary"
                      : isAlreadyMember
                        ? "bg-gray-200 border-gray-300"
                        : "bg-white border-gray-300"
                  }`}
                >
                  {isSelected && (
                    <View className="h-1.5 w-3 border-b-2 border-r-2 border-white rotate-12" />
                  )}
                </View>

                {/* Avatar */}
                <Image
                  source={{ uri: item.avatar }}
                  className="h-10 w-10 rounded-full bg-gray-200"
                />

                {/* Name and Username */}
                <View className="flex-1">
                  <Text
                    className={`text-base font-semibold ${
                      isAlreadyMember ? "text-gray-400" : "text-gray-primary"
                    }`}
                  >
                    {item.name}
                  </Text>
                  {item.username && (
                    <Text
                      className={`text-xs ${
                        isAlreadyMember
                          ? "text-gray-300"
                          : "text-gray-secondary"
                      }`}
                    >
                      {item.username}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          }}
          renderSectionHeader={({ section: { title } }) => (
            <View className="bg-gray-50 px-4 py-2">
              <Text className="text-xs font-semibold text-gray-secondary uppercase">
                {title}
              </Text>
            </View>
          )}
          contentContainerStyle={{ paddingBottom: 20 }}
        />

        {/* Bottom Settings */}
        <View className="border-t border-gray-border bg-white px-4 py-4">
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="text-sm font-semibold text-gray-primary">
                Thành viên mới xem được tin gửi gần đây
              </Text>
            </View>
            <CustomToggle
              value={notifyNewMembers}
              onValueChange={setNotifyNewMembers}
            />
          </View>
        </View>

        {/* Action Buttons */}
        <View className="flex-row gap-3 px-4 pb-4">
          <TouchableOpacity
            onPress={onClose}
            className="flex-1 rounded-full border border-gray-300 bg-white py-3"
          >
            <Text className="text-center font-semibold text-gray-primary">
              Hủy
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            disabled={selectedUsers.length === 0}
            className={`flex-1 rounded-full py-3 ${
              selectedUsers.length > 0 ? "bg-orange-primary" : "bg-gray-200"
            }`}
          >
            <Text
              className={`text-center font-semibold ${
                selectedUsers.length > 0 ? "text-white" : "text-gray-400"
              }`}
            >
              Thêm ({selectedUsers.length})
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}
