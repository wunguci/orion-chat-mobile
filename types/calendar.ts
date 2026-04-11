export const RecurrenceType = {
  NONE: "none",
  DAILY: "daily",
  WEEKLY: "weekly",
  MONTHLY: "monthly",
  YEARLY: "yearly",
} as const;

export type RecurrenceType =
  (typeof RecurrenceType)[keyof typeof RecurrenceType];

export interface Participant {
  id: string;
  type: "friend" | "group";
  name: string;
  avatar: string;
  userId?: string;
  groupId?: string;
}

export interface ParticipantOption {
  id: string;
  type: "friend" | "group";
  name: string;
  avatarUrl?: string | null;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  location?: string;
  description?: string;
  color: string;
  category: "personal" | "meeting" | "reminder" | "other";
  recurrence: RecurrenceType;
  notificationMinutes: number;
  isAllDay?: boolean;
  participants?: Participant[];
  createdAt?: string;
  updatedAt?: string;
}

export type ViewMode = "day" | "week" | "month" | "year";
