import {
  ArrowLeft,
  CheckCircle2,
  MoreVertical,
  Search,
  UserPlus,
} from "lucide-react-native";
import React, { useState } from "react";
import {
  Image,
  Modal,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import AddMemberModal from "./AddMemberModal";

interface Member {
  id: string;
  name: string;
  avatar: string;
  role: "admin" | "moderator" | "member";
  status: string;
  addedBy?: string;
}

interface ViewMembersModalProps {
  visible: boolean;
  onClose: () => void;
  groupName: string;
}

type TabType = "all" | "leaders" | "invited" | "blocked";

const mockMembers: Member[] = [
  {
    id: "1",
    name: "Bạn",
    avatar: "https://via.placeholder.com/40?text=BN",
    role: "admin",
    status: "Trưởng nhóm",
  },
  {
    id: "2",
    name: "Duyên",
    avatar: "https://via.placeholder.com/40?text=DY",
    role: "member",
    status: "Thêm bởi tôi",
    addedBy: "Bạn",
  },
  {
    id: "3",
    name: "Phan Phước Hiệp",
    avatar: "https://via.placeholder.com/40?text=PPH",
    role: "member",
    status: "Thêm bởi bạn",
    addedBy: "Bạn",
  },
  {
    id: "4",
    name: "Thu hôi",
    avatar: "https://via.placeholder.com/40?text=TH",
    role: "member",
    status: "Thêm bởi bạn",
    addedBy: "Bạn",
  },
];

export default function ViewMembersModal({
  visible,
  onClose,
  groupName,
}: ViewMembersModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [searchText, setSearchText] = useState("");

  const [showAddMember, setShowAddMember] = useState(false);
  const currentGroupMembers = ["user2", "user3", "user5"];

  const filteredMembers = mockMembers.filter((member) => {
    const matchesSearch = member.name
      .toLowerCase()
      .includes(searchText.toLowerCase());

    switch (activeTab) {
      case "leaders":
        return (
          matchesSearch &&
          (member.role === "admin" || member.role === "moderator")
        );
      case "invited":
        return (
          matchesSearch &&
          member.role === "member" &&
          member.status.includes("mời")
        );
      case "blocked":
        return false; // No blocked members in mock data
      default:
        return matchesSearch;
    }
  });

  const renderMember = (member: Member) => (
    <View
      key={member.id}
      className="flex-row items-center justify-between border-b border-gray-border px-4 py-3"
    >
      <View className="flex-row items-center gap-3 flex-1">
        <Image
          source={{ uri: member.avatar }}
          className="h-12 w-12 rounded-full"
        />
        <View className="flex-1">
          <Text className="text-base font-semibold text-gray-primary">
            {member.name}
          </Text>
          <Text className="mt-0.5 text-xs text-gray-secondary">
            {member.status}
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <Modal visible={visible} transparent animationType="slide">
      <SafeAreaView className="flex-1 bg-orange-bg-light">
        {/* Header */}
        <View className="flex-row items-center justify-between bg-orange-primary px-4 py-4">
          <View className="flex-row items-center gap-3">
            <TouchableOpacity onPress={onClose}>
              <ArrowLeft size={24} color="white" />
            </TouchableOpacity>
            <Text className="text-lg font-bold text-white">
              Quản lý thành viên
            </Text>
          </View>
          <View className="flex-row items-center gap-5">
            <TouchableOpacity onPress={() => setShowAddMember(true)}>
              <UserPlus size={24} color="white" />
            </TouchableOpacity>
            <TouchableOpacity>
              <Search size={24} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Tabs */}
        <View className="flex-row border-b border-gray-border bg-white px-4">
          {[
            { id: "all", label: "Tất cả" },
            { id: "leaders", label: "Trưởng và phó nhóm" },
            { id: "invited", label: "Đã mời" },
            { id: "blocked", label: "Đã chặn" },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.id}
              onPress={() => setActiveTab(tab.id as TabType)}
              className={`flex-1 border-b-2 py-3 items-center ${
                activeTab === tab.id
                  ? "border-orange-primary"
                  : "border-transparent"
              }`}
            >
              <Text
                className={`text-sm font-semibold ${
                  activeTab === tab.id
                    ? "text-gray-primary"
                    : "text-gray-secondary"
                }`}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Approve Members Button */}
        {activeTab === "all" && (
          <TouchableOpacity className="flex-row items-center gap-2 bg-white px-4 py-3 border-b border-gray-border">
            <View className="rounded-full bg-gray-border p-2">
              <CheckCircle2 size={20} color="#505050" />
            </View>
            <Text className="font-semibold text-gray-primary">
              Duyệt thành viên
            </Text>
          </TouchableOpacity>
        )}

        {/* Members List */}
        <ScrollView className="flex-1">
          {filteredMembers.length > 0 && (
            <View className="bg-white">
              <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-border">
                <Text className="font-semibold text-orange-primary">
                  Thành viên ({filteredMembers.length})
                </Text>
                <TouchableOpacity>
                  <MoreVertical size={20} color="#505050" />
                </TouchableOpacity>
              </View>
              {filteredMembers.map(renderMember)}
            </View>
          )}

          {filteredMembers.length === 0 && (
            <View className="flex-1 items-center justify-center bg-white">
              <Text className="text-gray-secondary">
                Không có thành viên nào
              </Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>

      <AddMemberModal
        visible={showAddMember}
        onClose={() => setShowAddMember(false)}
        currentMembers={currentGroupMembers}
      />
    </Modal>
  );
}
