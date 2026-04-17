export type NotificationType =
  | "message"
  | "call"
  | "friend_request"
  | "group_invite"
  | "event_invite"
  | "event_reminder"
  | "system";

export interface AppNotification {
  _id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  link?: string;
  metadata?: Record<string, any>;
  isRead: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface NotificationListResponse {
  items: AppNotification[];
  total: number;
  limit: number;
  skip: number;
}

export interface UnreadCountResponse {
  count: number;
}
