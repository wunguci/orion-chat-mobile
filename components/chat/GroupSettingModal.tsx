import {
  ArrowLeft,
  Bell,
  ChevronRight,
  Edit2,
  Image as ImageIcon,
  Search,
  UserPlus,
  Wallpaper,
} from "lucide-react-native";
import React, { useState } from "react";
import {
  Modal,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import CustomToggle from "../common/CustomToggle";
import AddMemberModal from "./AddMemberModal";

interface GroupSettingsModalProps {
  visible: boolean;
  onClose: () => void;
  groupName: string;
  groupMembers: number;
}

type MenuType = "dropdown" | "media" | "toggle";

interface MenuItem {
  label: string;
  description: string;
  menuType: MenuType;
  toggleKey?: string;
}

const currentGroupMembers = ["thu-hoi", "phan-phuoc-hiep"];

export default function GroupSettingsModal({
  visible,
  onClose,
  groupName,
  groupMembers,
}: GroupSettingsModalProps) {
  const [showAddMember, setShowAddMember] = useState(false);
  const [toggleStates, setToggleStates] = useState({
    pinChat: false,
    hideChat: false,
    muteNotification: false,
  });

  const handleToggle = (key: string, value: boolean) => {
    setToggleStates((prev) => ({ ...prev, [key]: value }));
  };

  const menuGroups: MenuItem[][] = [
    [
      {
        label: "Thêm mô tả nhóm",
        description: "",
        menuType: "dropdown",
      },
    ],
    [
      {
        label: "Ảnh, file, link",
        description: "",
        menuType: "media",
      },
      {
        label: "Lịch nhóm",
        description: "",
        menuType: "dropdown",
      },
      {
        label: "Tin nhắn đã ghim",
        description: "",
        menuType: "dropdown",
      },
      {
        label: "Bình chọn",
        description: "",
        menuType: "dropdown",
      },
    ],
    [
      {
        label: "Cài đặt nhóm",
        description: "",
        menuType: "dropdown",
      },
    ],
    [
      {
        label: `Xem thành viên (${groupMembers})`,
        description: "",
        menuType: "dropdown",
      },
      {
        label: "Phê duyệt thành viên mới",
        description: "",
        menuType: "dropdown",
      },
      {
        label: "Link nhóm",
        description: "https://chatapp.com/group/123456",
        menuType: "dropdown",
      },
    ],
    [
      {
        label: "Ghim trò chuyện",
        description: "",
        menuType: "toggle",
        toggleKey: "pinChat",
      },
      {
        label: "Ẩn trò chuyện",
        description: "",
        menuType: "toggle",
        toggleKey: "hideChat",
      },
      {
        label: "Cài đặt cá nhân",
        description: "",
        menuType: "dropdown",
      },
      {
        label: "Tin nhắn tự động xóa",
        description: "Không tự xóa",
        menuType: "dropdown",
      },
    ],
    [
      {
        label: "Báo xấu",
        description: "",
        menuType: "dropdown",
      },
      {
        label: "Chuyển quyền nhóm trưởng",
        description: "",
        menuType: "dropdown",
      },
      {
        label: "Dung lượng trò chuyện",
        description: "",
        menuType: "dropdown",
      },
      {
        label: "Xóa lịch sử trò chuyện",
        description: "",
        menuType: "dropdown",
      },
      {
        label: "Rời nhóm",
        description: "",
        menuType: "dropdown",
      },
    ],
  ];

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="slide"
      presentationStyle="fullScreen"
    >
      <SafeAreaView edges={["top"]} className="flex-1">
        <View className="flex-1 bg-white">
          {/* Header */}
          <View className="flex-row items-center justify-between bg-orange-primary px-4 py-4">
            <TouchableOpacity onPress={onClose} className="p-2">
              <ArrowLeft size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text className="flex-1 text-center text-lg font-semibold text-white">
              Tuỳ chọn
            </Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView className="flex-1">
            {/* Group Profile Section */}
            <View className="items-center bg-white py-6">
              {/* Avatar */}
              <View className="relative">
                <View className="h-32 w-32 items-center justify-center rounded-full bg-orange-primary">
                  <Text className="text-4xl font-bold text-white">HGN</Text>
                </View>
                <TouchableOpacity className="absolute bottom-0 right-0 rounded-full bg-white p-2">
                  <ImageIcon size={20} color="#ee652b" />
                </TouchableOpacity>
              </View>

              {/* Group Name */}
              <View className="mt-4 flex-row items-center gap-2">
                <Text className="text-xl font-bold text-gray-primary">
                  {groupName}
                </Text>
                <TouchableOpacity>
                  <Edit2 size={18} color="#ee652b" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Quick Actions */}
            <View className="flex-row justify-around border-b border-gray-border px-4 py-6">
              <TouchableOpacity className="items-center gap-2">
                <View className="items-center justify-center rounded-full bg-gray-100 p-3">
                  <Search size={24} color="#505050" />
                </View>
                <Text className="text-xs text-gray-primary">Tìm tin nhắn</Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="items-center gap-2"
                onPress={() => setShowAddMember(true)}
              >
                <View className="items-center justify-center rounded-full bg-gray-100 p-3">
                  <UserPlus size={24} color="#505050" />
                </View>
                <Text className="text-xs text-gray-primary">
                  Thêm thành viên
                </Text>
              </TouchableOpacity>

              <TouchableOpacity className="items-center gap-2">
                <View className="items-center justify-center rounded-full bg-gray-100 p-3">
                  <Wallpaper size={24} color="#505050" />
                </View>
                <Text className="text-xs text-gray-primary">Đổi hình nền</Text>
              </TouchableOpacity>

              <TouchableOpacity className="items-center gap-2">
                <View className="items-center justify-center rounded-full bg-gray-100 p-3">
                  <Bell size={24} color="#505050" />
                </View>
                <Text className="text-xs text-gray-primary">Tắt thông báo</Text>
              </TouchableOpacity>
            </View>

            {/* Menu Items */}
            <View className="bg-gray-50 py-3">
              {menuGroups.map((group, groupIndex) => (
                <View key={groupIndex} className="mb-3">
                  {group.map((item, itemIndex) => (
                    <View key={itemIndex}>
                      {item.menuType === "toggle" ? (
                        <View className="flex-row items-center justify-between bg-white px-4 py-4">
                          <View className="flex-1">
                            <Text className="text-base text-gray-primary">
                              {item.label}
                            </Text>
                            {item.description && (
                              <Text className="mt-1 text-xs text-gray-secondary">
                                {item.description}
                              </Text>
                            )}
                          </View>
                          <CustomToggle
                            value={
                              toggleStates[
                                item.toggleKey as keyof typeof toggleStates
                              ] || false
                            }
                            onValueChange={(value) =>
                              handleToggle(item.toggleKey!, value)
                            }
                          />
                        </View>
                      ) : (
                        <TouchableOpacity className="flex-row items-center justify-between bg-white px-4 py-4">
                          <View className="flex-1">
                            <Text className="text-base text-gray-primary">
                              {item.label}
                            </Text>
                            {item.description && (
                              <Text className="mt-1 text-xs text-gray-secondary">
                                {item.description}
                              </Text>
                            )}
                          </View>
                          <ChevronRight size={20} color="#cbd5e1" />
                        </TouchableOpacity>
                      )}
                      {/* Media Preview for "Ảnh, file, link" */}
                      {item.menuType === "media" && (
                        <View className="bg-white px-4 py-3 border-t border-gray-border">
                          <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                          >
                            <View className="flex-row gap-2">
                              <View className="h-24 w-20 rounded-lg bg-gray-200" />
                              <View className="h-24 w-20 rounded-lg bg-gray-200" />
                              <View className="h-24 w-20 rounded-lg bg-gray-200" />
                              <View className="h-24 w-20 rounded-lg bg-gray-200" />
                              <View className="h-24 w-12 items-center justify-center rounded-lg bg-gray-200">
                                <ChevronRight size={20} color="#cbd5e1" />
                              </View>
                            </View>
                          </ScrollView>
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      </SafeAreaView>

      {/* Add Member Modal */}
      <AddMemberModal
        visible={showAddMember}
        onClose={() => setShowAddMember(false)}
        currentMembers={currentGroupMembers}
      />
    </Modal>
  );
}
