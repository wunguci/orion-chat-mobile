export interface User {
  id: string;
  name: string;
  avatar?: string;
  status?: "online" | "offline";
  lastActive?: string;
}

export interface FriendRequest extends User {
  mutualFriends?: string;
  mutualCount?: number; 
}

export interface SuggestedFriend extends User {
  jobTitle?: string;
  company?: string;
}

export interface RecentlyActiveFriend extends User {
  timeAgo: string;
}
