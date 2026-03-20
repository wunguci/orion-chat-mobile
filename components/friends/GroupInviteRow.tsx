import { Avatar } from "@/components/common/Avatar";
import type { GroupInviteItem } from "@/types/friend";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

interface Props {
  invite: GroupInviteItem;
  onAccept: (inviteId: string) => void;
  onDecline: (inviteId: string) => void;
}

export const GroupInviteRow: React.FC<Props> = ({
  invite,
  onAccept,
  onDecline,
}) => {
  return (
    <View className="flex-row items-center px-4 py-3 border-b border-gray-100">
      <Avatar uri={invite.groupAvatar} name={invite.groupName} size="lg" />
      <View className="ml-3 flex-1">
        <Text className="text-base font-semibold text-gray-primary">
          {invite.groupName}
        </Text>
        <Text className="text-sm text-gray-text">
          Invited by {invite.inviterName} • {invite.invitedAt}
        </Text>
        <View className="flex-row mt-3 gap-2">
          <TouchableOpacity
            onPress={() => onAccept(invite.id)}
            className="flex-1 bg-green-primary py-2.5 rounded-lg items-center"
          >
            <Text className="text-white font-semibold">Accept</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => onDecline(invite.id)}
            className="flex-1 bg-green-bg-light py-2.5 rounded-lg items-center"
          >
            <Text className="text-green-primary font-semibold">Decline</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};
