import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL, fetchWithTimeout } from "@/config/api";

/**
 * Xây dựng URL với query parameters
 */
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

/**
 * Parse JSON response từ API
 */
const toJson = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed with ${response.status}`);
  }
  return (await response.json()) as T;
};

/**
 * Lấy JWT token từ AsyncStorage
 */
const getAuthToken = async () => {
  const tokenCandidates = [
    await AsyncStorage.getItem("auth_token"),
    await AsyncStorage.getItem("token"),
    await AsyncStorage.getItem("accessToken"),
  ];

  return tokenCandidates.find((item) => !!item) || null;
};

/**
 * Gửi request HTTP với JWT token
 */
const authFetch = async (url: string, init?: RequestInit) => {
  const token = await getAuthToken();
  const headers = new Headers(init?.headers);
  headers.set("X-Platform", "mobile");

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  // IMPORTANT: Add platform header so server knows this is mobile platform
  // This is critical for session validation - server uses this to check token against correct platform session
  headers.set("X-Platform", "mobile");

  if (!(init?.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  return fetchWithTimeout(url, {
    ...init,
    headers,
  });
};

// ═══════════════════════════════════════════════════════════
// TYPES / TYPES
// ═══════════════════════════════════════════════════════════

/**
 * Thông tin Conversation
 */
export interface ConversationResponse {
  conversationId: string;
  type: "PRIVATE" | "GROUP";
  autoDeleteDuration?: number; // Thời gian tự động xóa tin nhắn (nếu có)
  createdAt?: string;
  myRole?: string;
  myJoinedAt?: string;
  myIsPinned?: boolean;
  myPinnedAt?: string | null;
  myIsHidden?: boolean; // Có phải tôi đã ẩn cuộc trò chuyện này không?
  myIsBlocked?: boolean; // Có phải tôi đã chặn cuộc trò chuyện này không?
  myBlockedBy?: string[]; // Danh sách userId những người đã chặn tôi (dành cho group chat)
  lastMessage?: {
    content: string;
    timestamp?: string;
    createdAt?: string;
    senderId?: string;
    senderBy?: string;
    messageType?: string;
    messageStatus?: string;
  };
  groupInfo?: any;
  blockStatus?: any;
  canUnblock: boolean;
  participants: {
    userId: string;
    fullName: string;
    avatarUrl?: string;
    isOnline?: boolean;
    role?: string;
    joinedAt?: string;
  }[];
}

export interface ConversationMediaItem {
  _id?: string;
  messageId?: string;
  clientMessageId?: string;
  conversationId?: string;
  senderBy?: string;
  senderName?: string;
  senderAvatar?: string;
  content?: string;
  messageType?: string;
  mediaUrl?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  fileCategory?: "image" | "video" | "audio" | "file";
  createdAt?: string;
  isRevoked?: boolean;
}

export interface GroupMemberItem {
  userId: string;
  fullName: string | null;
  phoneNumber?: string | null;
  avatarUrl: string | null;
  role: "admin" | "co-admin" | "member";
  joinedAt: string;
  isMe: boolean;
}

export interface UpdateGroupNameResponse {
  groupId: string;
  groupName: string;
  updatedBy: string;
  updatedAt: string;
}

export interface UpdateGroupAvatarResponse {
  groupId: string;
  groupAvatar: string;
  updatedBy: string;
  updatedAt: string;
}

export interface GroupDetailResponse {
  groupId: string;
  joinRequireApproval: boolean;
  memberCount: number;
  memberLimit: number;
  isMember: boolean;
  myJoinRequestStatus: "none" | "pending" | "approved" | "rejected";
  myRole?: "leader" | "deputy" | "member" | "guest" | "admin" | "co-admin";
  status?: "active" | "dissolved";
}

export interface GroupJoinRequest {
  requestId: string;
  status: "pending" | "approved" | "rejected";
  message?: string;
  createdAt: string;
  requester: {
    userId: string;
    fullName?: string;
  };
}

/**
 * Thông tin Message
 */
export interface MessageItem {
  _id: string;
  clientMessageId: string;
  content: string;
  conversationId: string;
  createdAt: string;
  senderBy: string;
  messageType: string;
  messageStatus: string;
  senderName: string;
  senderAvatar: string;
  mediaUrl?: string;

  // File attachments
  fileName?: string;
  fileSize?: number;
  mimeType?: string;

  // Reply message
  replyToMessageId?: string;
  replyToMessagePreview?: {
    messageId?: string;
    senderName?: string;
    content?: string;
    snippet?: string;
    createdAt?: string;
  };

  // Thu hồi (revoked)
  isRevoked?: boolean;
  revokedBy?: string;
  revokedAt?: string;

  // Emoji reactions
  reactions?: {
    userId: string;
    emoji: string;
    reactedAt: string;
  }[];
  callData?: {
    callType: "audio" | "video";
    callStatus: "missed" | "declined" | "completed" | "active";
    duration?: number;
    participants?: string[];
    isInitiator?: boolean;
    wasRejected?: boolean;
    callId?: string;
  };
}

export interface MessageResponse {
  conversationId: string;
  items: MessageItem[];
}

/**
 * Payload để tạo Conversation
 */
export interface CreateConversationPayload {
  type?: "PRIVATE" | "GROUP";
  participantIds?: string[];
  receiverId?: string;
  participants?: string[];
  // For GROUP type
  groupName?: string;
  memberIds?: string[];
  memberNicknames?: {
    userId: string;
    nickname: string;
  }[];
}

/**
 * Payload để gửi Message
 */
export interface SendMessagePayload {
  conversationId: string;
  content: string;
  type?: "text" | "image" | "file" | "audio";
  mediaUrl?: string;
  fileName?: string;
  fileSize?: number;
}

// ═══════════════════════════════════════════════════════════
// CHAT API SERVICE
// ═══════════════════════════════════════════════════════════

/**
 * Chat API Service untuk mobile platform
 * Xử lý tất cả các request liên quan đến chat
 */
export const chatApi = {
  /**
   * Lấy danh sách Conversations của user hiện tại
   */
  async getConversations(userId: string, limit = 20, offset = 0) {
    const response = await authFetch(
      buildUrl("/conversations", {
        userId,
        limit: limit.toString(),
        offset: offset.toString(),
      }),
    );
    return toJson<ConversationResponse[]>(response);
  },

  /**
   * Lấy chi tiết một Conversation bằng ID
   */
  async getConversation(conversationId: string) {
    const response = await authFetch(
      buildUrl(`/conversations/${conversationId}`),
    );
    return toJson<ConversationResponse>(response);
  },

  /**
   * Tạo hoặc lấy Private Conversation với một bạn bè
   * - Dùng endpoint /conversations/private
   * - Server sẽ kiểm tra nếu conversation đã tồn tại thì return, nếu không thì tạo mới
   *
   * Hoặc tạo GROUP Conversation
   * - Dùng endpoint /conversations
   * - Với type='GROUP'
   */
  async createConversation(payload: CreateConversationPayload) {
    // Handle GROUP conversation creation
    if (payload.type === "GROUP") {
      const response = await authFetch(buildUrl("/conversations"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "GROUP",
          groupName: payload.groupName,
          memberIds: payload.memberIds,
          memberNicknames: payload.memberNicknames,
        }),
      });
      const data = await toJson<ConversationResponse>(response);
      return data;
    }

    // Handle PRIVATE conversation (default)
    const response = await authFetch(buildUrl("/conversations/private"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        recipientId: payload.receiverId || payload.participantIds?.[0],
      }),
    });
    const data = await toJson<ConversationResponse>(response);
    return data;
  },

  async deleteConversation(conversationId: string) {
    const response = await authFetch(
      buildUrl(`/conversations/${conversationId}`),
      {
        method: "DELETE",
      },
    );
    return toJson<{ success: boolean; conversationId: string }>(response);
  },

  async pinConversation(conversationId: string) {
    const response = await authFetch(
      buildUrl(`/conversations/${conversationId}/pin`),
      {
        method: "POST",
      },
    );
    return toJson<any>(response);
  },

  async unpinConversation(conversationId: string) {
    const response = await authFetch(
      buildUrl(`/conversations/${conversationId}/unpin`),
      {
        method: "POST",
      },
    );
    return toJson<any>(response);
  },

  async clearConversationHistory(conversationId: string) {
    const response = await authFetch(
      buildUrl(`/conversations/${conversationId}/clear-history`),
      {
        method: "POST",
      },
    );
    return toJson<any>(response);
  },

  async blockUser(conversationId: string) {
    const response = await authFetch(
      buildUrl(`/conversations/${conversationId}/block`),
      {
        method: "POST",
      },
    );
    return toJson<any>(response);
  },

  async leaveConversation(conversationId: string) {
    const response = await authFetch(
      buildUrl(`/conversations/${conversationId}/leave`),
      {
        method: "POST",
      },
    );
    return toJson<any>(response);
  },

  async updateAutoDeleteDuration(
    conversationId: string,
    autoDeleteDuration: number,
  ) {
    const response = await authFetch(
      buildUrl(`/conversations/${conversationId}/auto-delete-duration`),
      {
        method: "PATCH",
        body: JSON.stringify({ autoDeleteDuration }),
      },
    );
    return toJson<any>(response);
  },

  async hideConversation(conversationId: string, password: string) {
    const response = await authFetch(
      buildUrl(`/conversations/${conversationId}/hide`),
      {
        method: "POST",
        body: JSON.stringify({ password }),
      },
    );
    return toJson<any>(response);
  },

  async unhideConversation(conversationId: string, password: string) {
    const response = await authFetch(
      buildUrl(`/conversations/${conversationId}/reveal`),
      {
        method: "POST",
        body: JSON.stringify({ password }),
      },
    );
    return toJson<any>(response);
  },

  async unblockUser(conversationId: string) {
    const response = await authFetch(
      buildUrl(`/conversations/${conversationId}/unblock`),
      {
        method: "POST",
      },
    );
    return toJson<any>(response);
  },

  async getBlockStatus(conversationId: string) {
    const response = await authFetch(
      buildUrl(`/conversations/${conversationId}/block-status`),
    );
    return toJson<{
      isBlocked?: boolean;
      iAmBlocked?: boolean;
      iAmTheBlocker?: boolean;
      canUnblock?: boolean;
      blockedBy?: string;
      blockedAt?: string;
      conversationId?: string;
      otherUserId?: string;
    }>(response);
  },

  async getConversationMedia(
    conversationId: string,
    cursor?: string,
    limit = 30,
  ) {
    const response = await authFetch(
      buildUrl(`/conversations/${conversationId}/media`, {
        cursor,
        limit: limit.toString(),
      }),
    );
    return toJson<{
      items: ConversationMediaItem[];
      nextCursor: string | null;
    }>(response);
  },

  async getGroupMembers(groupId: string) {
    const response = await authFetch(buildUrl(`/groups/${groupId}/members`));
    return toJson<{ items: GroupMemberItem[] }>(response);
  },

  async getGroupDetail(groupId: string) {
    const response = await authFetch(buildUrl(`/groups/${groupId}`));
    return toJson<GroupDetailResponse>(response);
  },

  async getGroupJoinRequests(groupId: string) {
    const response = await authFetch(
      buildUrl(`/groups/${groupId}/join-requests`),
    );
    return toJson<GroupJoinRequest[] | { items?: GroupJoinRequest[] }>(
      response,
    );
  },

  async approveGroupJoinRequest(groupId: string, requestId: string) {
    const response = await authFetch(
      buildUrl(`/groups/${groupId}/join-requests/${requestId}/approve`),
      {
        method: "POST",
      },
    );
    return toJson<any>(response);
  },

  async rejectGroupJoinRequest(groupId: string, requestId: string) {
    const response = await authFetch(
      buildUrl(`/groups/${groupId}/join-requests/${requestId}/reject`),
      {
        method: "POST",
      },
    );
    return toJson<any>(response);
  },

  async updateGroupAutoDelete(groupId: string, autoDeleteDuration: number) {
    const response = await authFetch(
      buildUrl(`/groups/${groupId}/settings/auto-delete`),
      {
        method: "PATCH",
        body: JSON.stringify({ autoDeleteDuration }),
      },
    );
    return toJson<any>(response);
  },

  async updateGroupJoinApproval(groupId: string, joinRequireApproval: boolean) {
    const response = await authFetch(
      buildUrl(`/groups/${groupId}/settings/join-approval`),
      {
        method: "PATCH",
        body: JSON.stringify({ joinRequireApproval }),
      },
    );
    return toJson<any>(response);
  },

  async updateGroupName(groupId: string, groupName: string) {
    const response = await authFetch(buildUrl(`/groups/${groupId}/name`), {
      method: "PATCH",
      body: JSON.stringify({ groupName }),
    });
    return toJson<UpdateGroupNameResponse>(response);
  },

  async updateGroupAvatar(groupId: string, formData: FormData) {
    const response = await authFetch(buildUrl(`/groups/${groupId}/avatar`), {
      method: "PATCH",
      body: formData,
    });
    return toJson<UpdateGroupAvatarResponse>(response);
  },

  async removeGroupMember(groupId: string, userId: string) {
    const response = await authFetch(
      buildUrl(`/groups/${groupId}/members/${userId}`),
      {
        method: "DELETE",
      },
    );
    return toJson<any>(response);
  },

  async updateGroupMemberRole(
    groupId: string,
    userId: string,
    role: "co-admin" | "member",
  ) {
    const response = await authFetch(
      buildUrl(`/groups/${groupId}/members/${userId}/role`),
      {
        method: "PATCH",
        body: JSON.stringify({ role }),
      },
    );
    return toJson<any>(response);
  },

  async leaveGroup(groupId: string, newAdminUserId?: string) {
    const response = await authFetch(buildUrl(`/groups/${groupId}/leave`), {
      method: "POST",
      body: JSON.stringify({ newAdminUserId }),
    });
    return toJson<any>(response);
  },

  async dissolveGroup(groupId: string) {
    const response = await authFetch(buildUrl(`/groups/${groupId}/dissolve`), {
      method: "POST",
    });
    return toJson<any>(response);
  },

  /**
   * Lấy danh sách Messages trong một Conversation
   */
  async getMessages(conversationId: string, limit = 50, offset = 0) {
    const response = await authFetch(
      buildUrl(`/conversations/${conversationId}/messages`, {
        limit: limit.toString(),
        offset: offset.toString(),
      }),
    );
    return toJson<MessageResponse>(response);
  },

  /**
   * Gửi tin nhắn (sử dụng REST API, thường dùng khi WebSocket chưa sẵn sàng)
   */
  async sendMessage(payload: SendMessagePayload) {
    const response = await authFetch(
      buildUrl(`/conversations/${payload.conversationId}/messages`),
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: payload.content,
          type: payload.type || "text",
          mediaUrl: payload.mediaUrl,
          fileName: payload.fileName,
          fileSize: payload.fileSize,
        }),
      },
    );
    return toJson<MessageResponse>(response);
  },

  async sendAttachment(formData: FormData) {
    const res = await authFetch(`${API_BASE_URL}/messages/upload`, {
      method: "POST",
      body: formData,
    });
    return toJson<MessageItem>(res);
  },

  /**
   * Đánh dấu tin nhắn là đã đọc
   */
  async markAsRead(conversationId: string, messageId: string) {
    const response = await authFetch(
      buildUrl(`/conversations/${conversationId}/messages/${messageId}/read`),
      {
        method: "PATCH",
      },
    );
    return toJson<{ success: boolean }>(response);
  },

  /**
   * Gửi emoji reaction cho tin nhắn
   */
  async addEmojiReaction(
    messageId: string,
    emoji: string,
    conversationId: string,
  ) {
    const payload = {
      messageId,
      emoji,
      conversationId,
    };
    console.log("[addEmojiReaction] Sending payload:", payload);
    const response = await authFetch(buildUrl("/messages/emoji"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    return toJson<any>(response);
  },

  /**
   * Xóa emoji reaction khỏi tin nhắn
   */
  async removeEmojiReaction(messageId: string, conversationId: string) {
    const response = await authFetch(buildUrl("/messages/emoji/remove"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messageId,
        conversationId,
      }),
    });
    return toJson<any>(response);
  },

  /**
   * Thu hồi tin nhắn cho tất cả mọi người
   */
  async revokeMessage(messageId: string, conversationId: string) {
    const response = await authFetch(
      buildUrl("/messages/revoke-for-everyone"),
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messageId,
          conversationId,
        }),
      },
    );
    return toJson<any>(response);
  },

  /**
   * Xóa tin nhắn cho mình
   */
  async deleteMessageForMe(messageId: string, conversationId: string) {
    const response = await authFetch(buildUrl("/messages/delete-for-me"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messageId,
        conversationId,
      }),
    });
    return toJson<any>(response);
  },

  /**
   * Chuyển tiếp tin nhắn
   */
  async forwardMessage(
    sourceMessageId: string,
    targetConversationId: string,
    clientMessageId: string,
  ) {
    const payload = {
      sourceMessageId,
      targetConversationId,
      clientMessageId,
    };
    console.log("[forwardMessage] Sending payload:", payload);
    const response = await authFetch(buildUrl("/messages/forward"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    console.log("[forwardMessage] Response status:", response.status);
    return toJson<any>(response);
  },
};
