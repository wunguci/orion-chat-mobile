export type WorkspaceType = "business" | "education" | "community" | "personal";
export type WorkspaceRole = "owner" | "admin" | "member";
export type TaskStatus = "todo" | "inprogress" | "review" | "done";
export type TaskPriority = "low" | "medium" | "high" | "critical";

export interface WorkHubUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  status: "online" | "offline" | "away";
}

export interface WorkspaceMember {
  user: WorkHubUser;
  role: WorkspaceRole;
  joinedAt: string;
}

export interface Workspace {
  id: string;
  name: string;
  description: string;
  type: WorkspaceType;
  avatar?: string;
  color: string;
  isPublic: boolean;
  createdAt: string;
  owner: WorkHubUser;
  members: WorkspaceMember[];
  boards: Board[];
}

export interface Board {
  id: string;
  workspaceId: string;
  name: string;
  description?: string;
  color: string;
  icon: string;
  columns: BoardColumn[];
  createdAt: string;
}

export interface BoardColumn {
  id: string;
  name: string;
  status: TaskStatus;
  color: string;
  order: number;
}

export interface Label {
  id: string;
  text: string;
  color: string;
  type: "feature" | "bug" | "design" | "urgent" | "improvement";
}

export interface Task {
  id: string;
  boardId: string;
  columnId: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignees: WorkHubUser[];
  labels: Label[];
  startDate?: string;
  deadline?: string;
  createdBy: WorkHubUser;
  createdAt: string;
  updatedAt: string;
  order: number;
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  status: "on_track" | "at_risk" | "behind" | "completed";
  progress: number;
  startDate: string;
  endDate: string;
  owner: WorkHubUser;
}

export interface Sprint {
  id: string;
  name: string;
  goal: string;
  status: "planning" | "active" | "completed" | "cancelled";
  startDate: string;
  endDate: string;
}

export interface Epic {
  id: string;
  title: string;
  description: string;
  status: "planned" | "in_progress" | "completed" | "blocked";
  color: string;
  progress: number;
  startDate: string;
  endDate: string;
  owner: WorkHubUser;
  boardName?: string;
}

export interface Milestone {
  id: string;
  title: string;
  date: string;
  status: "reached" | "upcoming" | "missed";
}

export interface AutomationRule {
  id: string;
  name: string;
  description: string;
  isEnabled: boolean;
  triggerCount: number;
  lastTriggered: string | null;
}

export interface DocumentItem {
  id: string;
  title: string;
  content: string;
  isFavorite: boolean;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
  createdBy: WorkHubUser;
}

export interface FileItem {
  id: string;
  name: string;
  type: "file" | "folder";
  mimeType?: string;
  size?: number;
  url?: string;
  parentId: string | null;
  uploadedAt: string;
  accessLevel: "workspace" | "admin_only" | "specific_users";
}

export interface WorkspaceDashboardStats {
  summary: {
    totalTasks: number;
    completedTasks: number;
    inProgressTasks: number;
    reviewTasks: number;
    todoTasks: number;
    overdueTasks: number;
    completionRate: number;
    totalBoards: number;
    totalMembers: number;
  };
  boardStats: {
    boardId: string;
    boardName: string;
    totalTasks: number;
    completedTasks: number;
    inProgressTasks: number;
    overdueTasks: number;
  }[];
  recentActivities: ActivityEntry[];
  trendLast7Days: { date: string; completed: number }[];
}

export interface ActivityEntry {
  id: string;
  action: string;
  description: string;
  timestamp: string;
  task?: { id?: string; title?: string };
  user: WorkHubUser;
}

export interface WorkloadMember {
  user: WorkHubUser;
  totalTasks: number;
  todoTasks: number;
  inProgressTasks: number;
  reviewTasks: number;
  doneTasks: number;
  overdueTasks: number;
}

export interface ReportData {
  period: {
    totalTasks: number;
    completedTasks: number;
    newTasks: number;
    completionRate: number;
  };
  boards: {
    boardId: string;
    boardName: string;
    totalTasks: number;
    completedTasks: number;
    inProgressTasks: number;
  }[];
  members: {
    user: WorkHubUser;
    totalTasks: number;
    completedTasks: number;
    avgCompletionDays: number;
  }[];
  overdue: {
    taskId: string;
    title: string;
    dueDate: string;
    assignees: WorkHubUser[];
    daysOverdue: number;
  }[];
}
