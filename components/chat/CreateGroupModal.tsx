import { Camera, Search, X } from "lucide-react-native";
import React, { useMemo, useState } from "react";
import {
  Image,
  Modal,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface Contact {
  id: string;
  name: string;
  avatar: string;
  lastActive: string;
  emoji?: string;
}

interface CreateGroupModalProps {
  visible: boolean;
  onClose: () => void;
}

const recentContacts: Contact[] = [
  {
    id: "1",
    name: "Người đàn bà Làng chài",
    avatar: "https://via.placeholder.com/60",
    lastActive: "27 phút trước",
  },
  {
    id: "2",
    name: "Kẻ độc hành",
    avatar: "https://via.placeholder.com/60",
    lastActive: "2 giờ trước",
  },
  {
    id: "3",
    name: "Thu hồi",
    avatar: "https://via.placeholder.com/60",
    lastActive: "19 giờ trước",
  },
  {
    id: "4",
    name: "T1 Keria",
    avatar: "https://via.placeholder.com/60",
    lastActive: "20 giờ trước",
    emoji: "❤️",
  },
  {
    id: "5",
    name: "Chubby",
    avatar: "https://via.placeholder.com/60",
    lastActive: "1 ngày trước",
  },
  {
    id: "6",
    name: "Ca Dũ",
    avatar: "https://via.placeholder.com/60",
    lastActive: "2 ngày trước",
  },
  {
    id: "7",
    name: "Phan Phước Hịp",
    avatar: "https://via.placeholder.com/60",
    lastActive: "4 ngày trước",
  },
  {
    id: "8",
    name: "Nguyễn Đức Huy",
    avatar: "https://via.placeholder.com/60",
    lastActive: "5 ngày trước",
  },
  {
    id: "9",
    name: "Thanh Sơn",
    avatar: "https://via.placeholder.com/60",
    lastActive: "7 ngày trước",
  },
];

const contactsData: Contact[] = [
  ...recentContacts,
  {
    id: "10",
    name: "Anh Long",
    avatar: "https://via.placeholder.com/60",
    lastActive: "10 ngày trước",
  },
  {
    id: "11",
    name: "Bùi Công Danh",
    avatar: "https://via.placeholder.com/60",
    lastActive: "15 ngày trước",
  },
];

export default function CreateGroupModal({
  visible,
  onClose,
}: CreateGroupModalProps) {
  const [groupName, setGroupName] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [searchText, setSearchText] = useState("");
  const [activeTab, setActiveTab] = useState<"recent" | "contacts">("recent");

  const filteredContacts = useMemo(() => {
    const dataSource = activeTab === "recent" ? recentContacts : contactsData;
    if (!searchText.trim()) return dataSource;

    return dataSource.filter((contact) =>
      contact.name.toLowerCase().includes(searchText.toLowerCase()),
    );
  }, [searchText, activeTab]);

  const toggleMember = (id: string) => {
    setSelectedMembers((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id],
    );
  };

  const renderContactItem = (contact: Contact) => (
    <TouchableOpacity
      key={contact.id}
      className="flex-row items-center gap-3 border-b border-gray-border px-4 py-3"
      onPress={() => toggleMember(contact.id)}
    >
      <TouchableOpacity
        className={`h-6 w-6 rounded-full border-2 items-center justify-center ${
          selectedMembers.includes(contact.id)
            ? "border-orange-primary bg-orange-primary"
            : "border-gray-300 bg-white"
        }`}
        onPress={() => toggleMember(contact.id)}
      >
        {selectedMembers.includes(contact.id) && (
          <Text className="text-white font-bold text-sm">✓</Text>
        )}
      </TouchableOpacity>

      <Image
        source={{ uri: contact.avatar }}
        className="h-12 w-12 rounded-full bg-gray-300"
      />

      <View className="flex-1">
        <View className="flex-row items-center gap-1">
          <Text className="font-semibold text-gray-primary">
            {contact.name}
          </Text>
          {contact.emoji && <Text className="text-base">{contact.emoji}</Text>}
        </View>
        <Text className="text-xs text-gray-secondary">
          {contact.lastActive}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} transparent animationType="slide">
      <SafeAreaView className="flex-1 bg-white">
        {/* Header */}
        <View className="flex-row items-center justify-between border-b border-gray-border bg-white px-4 py-3">
          <TouchableOpacity onPress={onClose}>
            <X size={24} color="#505050" />
          </TouchableOpacity>
          <View>
            <Text className="text-xl font-bold text-gray-primary">
              Nhóm mới
            </Text>
            <Text className="text-xs text-gray-secondary">
              Đã chọn: {selectedMembers.length}
            </Text>
          </View>
          <View className="w-6" />
        </View>

        <ScrollView className="flex-1 bg-white">
          {/* Group Name Input */}
          <View className="flex-row items-center gap-3 px-4 py-4">
            <TouchableOpacity className="items-center justify-center rounded-full bg-gray-border p-4">
              <Camera size={22} color="#505050" />
            </TouchableOpacity>
            <TextInput
              placeholder="Đặt tên nhóm"
              placeholderTextColor="#cbd5e1"
              value={groupName}
              onChangeText={setGroupName}
              className="flex-1 text-base font-semibold text-gray-primary"
            />
          </View>

          {/* Search Bar */}
          <View className="flex-row items-center gap-2 border-b border-gray-border px-4 py-3">
            <Search size={20} color="#cbd5e1" />
            <TextInput
              placeholder="Tìm tên hoặc số điện thoại"
              placeholderTextColor="#cbd5e1"
              value={searchText}
              onChangeText={setSearchText}
              className="flex-1 text-sm text-gray-primary"
            />
            {contactsData.length > 0 && (
              <View className="rounded-md border border-gray-secondary px-2 py-1">
                <Text className="text-xs font-semibold text-gray-secondary">
                  {contactsData.length}
                </Text>
              </View>
            )}
          </View>

          {/* Tabs */}
          <View className="flex-row border-b border-gray-border">
            <TouchableOpacity
              onPress={() => setActiveTab("recent")}
              className={`flex-1 items-center border-b-2 py-3 ${
                activeTab === "recent"
                  ? "border-orange-primary"
                  : "border-transparent"
              }`}
            >
              <Text
                className={`font-semibold ${
                  activeTab === "recent"
                    ? "text-orange-primary"
                    : "text-gray-secondary"
                }`}
              >
                GẦN ĐÂY
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setActiveTab("contacts")}
              className={`flex-1 items-center border-b-2 py-3 ${
                activeTab === "contacts"
                  ? "border-orange-primary"
                  : "border-transparent"
              }`}
            >
              <Text
                className={`font-semibold ${
                  activeTab === "contacts"
                    ? "text-orange-primary"
                    : "text-gray-secondary"
                }`}
              >
                DANH BA
              </Text>
            </TouchableOpacity>
          </View>

          {/* Contacts List */}
          <View className="flex-1">
            {filteredContacts.length > 0 ? (
              filteredContacts.map(renderContactItem)
            ) : (
              <View className="items-center justify-center py-8">
                <Text className="text-gray-secondary">Không tìm thấy</Text>
              </View>
            )}
          </View>
        </ScrollView>

        {/* Action Buttons */}
        <View className="gap-2 border-t border-gray-border bg-white px-4 py-4">
          <TouchableOpacity
            className="items-center justify-center rounded-full bg-gray-border py-3"
            onPress={onClose}
          >
            <Text className="font-semibold text-gray-primary">Huỷ</Text>
          </TouchableOpacity>
          <TouchableOpacity
            disabled={groupName.trim() === "" || selectedMembers.length === 0}
            className={`items-center justify-center rounded-full py-3 ${
              groupName.trim() === "" || selectedMembers.length === 0
                ? "bg-gray-border"
                : "bg-orange-primary"
            }`}
          >
            <Text
              className={`font-semibold ${
                groupName.trim() === "" || selectedMembers.length === 0
                  ? "text-gray-secondary"
                  : "text-white"
              }`}
            >
              Tạo nhóm ({selectedMembers.length})
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}
