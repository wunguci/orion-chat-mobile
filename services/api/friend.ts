import type {
    FriendProfileItem,
    GroupInviteItem,
    GroupItem,
    GroupMemberItem,
    SearchUserItem,
} from '@/types/friend';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API_BASE_URL from '@/config/api';

const buildUrl = (
    path: string,
    params?: Record<string, string | undefined>,
) => {
    const url = new URL(`${API_BASE_URL}${path}`);
    if (params) {
        Object.entries(params).forEach(([key, value]) => {
            if (value) {
                url.searchParams.set(key, value);
            }
        });
    }
    return url.toString();
};

const toJson = async <T>(response: Response): Promise<T> => {
    if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `Request failed with ${response.status}`);
    }
    return (await response.json()) as T;
};

const getAuthToken = async () => {
    const tokenCandidates = [
        await AsyncStorage.getItem('auth_token'),
        await AsyncStorage.getItem('token'),
        await AsyncStorage.getItem('accessToken'),
    ];

    return tokenCandidates.find((item) => !!item) || null;
};

const authFetch = async (url: string, init?: RequestInit) => {
    const token = await getAuthToken();
    const headers = new Headers(init?.headers);

    if (token) {
        headers.set('Authorization', `Bearer ${token}`);
    }

    // CRITICAL: Always send X-Platform header for session validation
    headers.set('X-Platform', 'mobile');

    return fetch(url, {
        ...init,
        headers,
    });
};

export interface FriendResponse {
    id: string;
    fullName: string;
    avatarUrl?: string;
    isOnline: boolean;
    createdAt: string;
}

export interface FriendRequestResponse {
    requestId: string;
    sender: {
        userId: string;
        fullName: string;
        avatarUrl?: string;
    };
    receiver: {
        userId: string;
        fullName: string;
        avatarUrl?: string;
    };
    status: 'pending' | 'accepted' | 'declined' | 'canceled';
    createdAt: string;
}

export interface BlockedFriendResponse {
    id: string;
    fullName: string;
    avatarUrl?: string;
    blockedAt?: string;
    isOnline?: boolean;
}

export const friendApi = {
    async getFriends(userId: string) {
        const response = await authFetch(buildUrl('/friends', { userId }));
        return toJson<FriendResponse[]>(response);
    },

    async getIncomingFriendRequests(userId: string) {
        const response = await authFetch(
            buildUrl('/friend-requests/incoming', { userId }),
        );
        return toJson<FriendRequestResponse[]>(response);
    },

  /**
   * Lấy danh sách lời mời kết bạn đi (mình gửi)
   * Nếu endpoint không tồn tại (404), return empty array
   */
  async getOutgoingFriendRequests(userId: string) {
    try {
      const response = await authFetch(
        buildUrl("/friend-requests/outgoing", { userId }),
      );
      return toJson<FriendRequestResponse[]>(response);
    } catch (error) {
      console.warn("[friendApi] getOutgoingFriendRequests failed, returning empty", error);
      // Nếu 404 hoặc lỗi khác, trả về mảng rỗng
      return [];
    }
  },

    async acceptFriendRequest(requestId: string, userId: string) {
        const response = await authFetch(
            buildUrl(`/friend-requests/${requestId}/accept`),
            {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId }),
            },
        );
        return toJson(response);
    },

    async declineFriendRequest(requestId: string, userId: string) {
        const response = await authFetch(
            buildUrl(`/friend-requests/${requestId}/decline`),
            {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId }),
            },
        );
        return toJson(response);
    },

    async sendFriendRequest(senderId: string, receiverId: string) {
        const response = await authFetch(buildUrl('/friend-requests'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ senderId, receiverId }),
        });
        return toJson(response);
    },

    async searchUsers(userId: string, q: string) {
        const response = await authFetch(
            buildUrl('/friends/search-users', { userId, q }),
        );
        return toJson<SearchUserItem[]>(response);
    },

    async getSuggestions(userId: string) {
        const response = await authFetch(
            buildUrl('/friends/suggestions', { userId }),
        );
        return toJson<
            {
                id: string;
                fullName: string;
                avatarUrl?: string;
                isOnline: boolean;
                mutualGroupCount: number;
                mutualGroupNames: string[];
            }[]
        >(response);
    },

    async getRecentlyActive(userId: string) {
        const response = await authFetch(
            buildUrl('/friends/recently-active', { userId }),
        );
        return toJson<
            {
                id: string;
                fullName: string;
                avatarUrl?: string;
                isOnline: boolean;
            }[]
        >(response);
    },

  /**
   * Lấy danh sách bạn bè bị chặn
   * Nếu endpoint không tồn tại (404), return empty array
   */
  async getBlockedFriends(userId: string) {
    try {
      const response = await authFetch(buildUrl("/friends/blocked", { userId }));
      return toJson<BlockedFriendResponse[]>(response);
    } catch (error) {
      console.warn("[friendApi] getBlockedFriends failed, returning empty", error);
      // Nếu 404 hoặc lỗi khác, trả về mảng rỗng
      return [];
    }
  },

    async getFriendProfile(userId: string, friendId: string) {
        const response = await authFetch(
            buildUrl(`/friends/${userId}/${friendId}/profile`),
        );
        return toJson<FriendProfileItem>(response);
    },

    async removeFriend(userId: string, friendId: string) {
        const response = await authFetch(
            buildUrl(`/friends/${userId}/${friendId}`),
            {
                method: 'DELETE',
            },
        );
        return toJson<{ success: boolean; message: string }>(response);
    },

    async blockFriend(userId: string, friendId: string) {
        const response = await authFetch(
            buildUrl(`/friends/${userId}/${friendId}/block`),
            {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({}),
            },
        );
        return toJson<{ success: boolean; message: string }>(response);
    },

    async unblockFriend(userId: string, friendId: string) {
        const response = await authFetch(
            buildUrl(`/friends/${userId}/${friendId}/unblock`),
            {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({}),
            },
        );
        return toJson<{ success: boolean; message: string }>(response);
    },

    async getMyGroups(userId: string) {
        const response = await authFetch(
            buildUrl('/group-invites/my-groups', { userId }),
        );
        return toJson<GroupItem[]>(response);
    },

    async getGroupMembers(groupId: string) {
        const response = await authFetch(buildUrl(`/groups/${groupId}/members`));
        return toJson<{ groupId: string; items: GroupMemberItem[] }>(response);
    },

    async getIncomingGroupInvites(userId: string) {
        const response = await authFetch(
            buildUrl('/group-invites/incoming', { userId }),
        );
        return toJson<GroupInviteItem[]>(response);
    },

    async acceptGroupInvite(inviteId: string, userId: string) {
        const response = await authFetch(
            buildUrl(`/group-invites/${inviteId}/accept`),
            {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId }),
            },
        );
        return toJson(response);
    },

    async declineGroupInvite(inviteId: string, userId: string) {
        const response = await authFetch(
            buildUrl(`/group-invites/${inviteId}/decline`),
            {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId }),
            },
        );
        return toJson(response);
    },
};
