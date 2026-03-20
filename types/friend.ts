export type FriendCategory =
  | "friends"
  | "requests"
  | "groups"
  | "group_invites";

export interface FriendItem {
  id: string;
  name: string;
  avatar?: string;
  isOnline: boolean;
  subtext?: string;
}

export interface FriendRequestItem {
  id: string;
  senderId: string;
  receiverId: string;
  name: string;
  avatar?: string;
  timeAgo: string;
  status: "pending" | "accepted" | "declined" | "canceled";
}

export interface SuggestedFriendItem {
  id: string;
  name: string;
  avatar?: string;
  mutualGroupCount: number;
  mutualGroupNames: string[];
}

export interface RecentlyActiveItem {
  id: string;
  name: string;
  avatar?: string;
  isOnline: boolean;
}

export interface GroupItem {
  id: string;
  name: string;
  avatar?: string;
  memberCount: number;
  isPublic: boolean;
  type: "BUSINESS" | "EDUCATION" | "COMMUNITY" | "PERSONAL";
}

export interface GroupInviteItem {
  id: string;
  groupId: string;
  groupName: string;
  groupAvatar?: string;
  inviterName: string;
  invitedAt: string;
  status: "pending" | "accepted" | "declined" | "revoked";
}

export interface SearchUserItem {
  id: string;
  fullName: string;
  phoneNumber?: string;
  avatarUrl?: string;
  isOnline: boolean;
}
