import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Avatar } from '@/components/common/Avatar';
import { RecentlyActiveFriend } from '@/types/user';

interface Props {
  friend: RecentlyActiveFriend;
  onPress: (id: string) => void;
}

export const RecentlyActiveItem: React.FC<Props> = ({ friend, onPress }) => {
  return (
    <TouchableOpacity 
      onPress={() => onPress(friend.id)}
      className="items-center mx-2"
      activeOpacity={0.7}
    >
      {/* Avatar with online indicator */}
      <View className="relative">
        <Avatar 
          uri={friend.avatar} 
          name={friend.name} 
          size="lg" 
        />
        {friend.status === 'online' && (
          <View className="absolute bottom-0 right-0 w-4 h-4 bg-green-online border-2 border-white rounded-full" />
        )}
      </View>
      
      {/* Name */}
      <Text className="text-sm font-medium text-gray-primary mt-2" numberOfLines={1}>
        {friend.name.split(' ')[0]} {friend.name.split(' ')[1]?.[0]}.
      </Text>
      
      {/* Time */}
      <Text className="text-xs text-gray-text mt-0.5">
        {friend.timeAgo}
      </Text>
    </TouchableOpacity>
  );
};