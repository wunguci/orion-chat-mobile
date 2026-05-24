import { fetchApi } from "@/services/api/fetch-api";
import type {
  ActivityEntry,
  AutomationRule,
  Board,
  BoardColumn,
  DocumentItem,
  Epic,
  FileItem,
  Goal,
  Label,
  Milestone,
  ReportData,
  Sprint,
  Task,
  TaskPriority,
  TaskStatus,
  WorkHubUser,
  WorkloadMember,
  Workspace,
  WorkspaceDashboardStats,
  WorkspaceMember,
  WorkspaceRole,
  WorkspaceType,
} from "@/types/workhub";

type UserResponse = {
  userId: string;
  fullName: string;
  email: string | null;
  phoneNumber?: string;
  avatarUrl: string | null;
  isOnline?: boolean;
};

type WorkspaceMemberResponse = {
  id: string;
  role: string;
  joinedAt: string;
  user: UserResponse;
};

type WorkspaceResponse = {
  workspaceId: string;
  workspaceName: string;
  description: string | null;
  type: string;
  avatarUrl: string | null;
  color: string;
  isPublic: boolean;
  createdAt: string;
  owner: UserResponse;
  members?: WorkspaceMemberResponse[];
  boards?: BoardResponse[];
};

type BoardResponse = {
  boardId: string;
  boardName: string;
  description: string | null;
  backgroundColor: string;
  icon: string;
  createdAt: string;
  columns?: ColumnResponse[];
};

type ColumnResponse = {
  columnId: string;
  name: string;
  status: string;
  color: string;
  order: number;
};

type LabelResponse = {
  labelId: string;
  text: string;
  color: string;
  type: string;
};

type TaskResponse = {
  taskId: string;
  title: string;
  description: string | null;
  priority: string;
  status: string;
  order: number;
  startDate: string | null;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
  board?: { boardId: string };
  column: ColumnResponse | null;
  createdBy: UserResponse;
  assignees?: { user: UserResponse }[];
  labels?: LabelResponse[];
};

const STATUS_TO_FE: Record<string, TaskStatus> = {
  TODO: "todo",
  IN_PROGRESS: "inprogress",
  REVIEW: "review",
  DONE: "done",
};

const STATUS_TO_BE: Record<TaskStatus, string> = {
  todo: "TODO",
  inprogress: "IN_PROGRESS",
  review: "REVIEW",
  done: "DONE",
};

const PRIORITY_TO_FE: Record<string, TaskPriority> = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  URGENT: "critical",
};

const PRIORITY_TO_BE: Record<TaskPriority, string> = {
  low: "LOW",
  medium: "MEDIUM",
  high: "HIGH",
  critical: "URGENT",
};

const ROLE_TO_FE: Record<string, WorkspaceRole> = {
  OWNER: "owner",
  ADMIN: "admin",
  MEMBER: "member",
};

const ROLE_TO_BE: Record<WorkspaceRole, string> = {
  owner: "OWNER",
  admin: "ADMIN",
  member: "MEMBER",
};

const normalizeStatus = (value?: string): TaskStatus =>
  STATUS_TO_FE[value || ""] || "todo";

const normalizePriority = (value?: string): TaskPriority =>
  PRIORITY_TO_FE[value || ""] || "low";

const normalizeRole = (value?: string): WorkspaceRole =>
  ROLE_TO_FE[value || ""] || "member";

export const statusToBackend = (status: TaskStatus) => STATUS_TO_BE[status];
export const priorityToBackend = (priority: TaskPriority) =>
  PRIORITY_TO_BE[priority];
export const roleToBackend = (role: WorkspaceRole) => ROLE_TO_BE[role];

const mapUser = (user: UserResponse): WorkHubUser => ({
  id: user.userId,
  name: user.fullName || "Unknown",
  email: user.email || "",
  phone: user.phoneNumber,
  avatar: user.avatarUrl || undefined,
  status: user.isOnline ? "online" : "offline",
});

const mapColumn = (column: ColumnResponse): BoardColumn => ({
  id: column.columnId,
  name: column.name,
  status: normalizeStatus(column.status),
  color: column.color || "#0d9488",
  order: column.order || 0,
});

const mapBoard = (board: BoardResponse, workspaceId = ""): Board => ({
  id: board.boardId,
  workspaceId,
  name: board.boardName,
  description: board.description || undefined,
  color: board.backgroundColor || "#0d9488",
  icon: board.icon || "board",
  columns: (board.columns || []).map(mapColumn).sort((a, b) => a.order - b.order),
  createdAt: board.createdAt,
});

const mapMember = (member: WorkspaceMemberResponse): WorkspaceMember => ({
  user: mapUser(member.user),
  role: normalizeRole(member.role),
  joinedAt: member.joinedAt,
});

const mapWorkspace = (workspace: WorkspaceResponse): Workspace => ({
  id: workspace.workspaceId,
  name: workspace.workspaceName,
  description: workspace.description || "",
  type: (workspace.type || "business").toLowerCase() as WorkspaceType,
  avatar: workspace.avatarUrl || undefined,
  color: workspace.color || "#0d9488",
  isPublic: Boolean(workspace.isPublic),
  createdAt: workspace.createdAt,
  owner: mapUser(workspace.owner),
  members: (workspace.members || []).map(mapMember),
  boards: (workspace.boards || []).map((board) =>
    mapBoard(board, workspace.workspaceId),
  ),
});

const mapLabel = (label: LabelResponse): Label => ({
  id: label.labelId,
  text: label.text,
  color: label.color || "#0d9488",
  type: (label.type || "FEATURE").toLowerCase() as Label["type"],
});

const mapTask = (task: TaskResponse): Task => ({
  id: task.taskId,
  boardId: task.board?.boardId || "",
  columnId: task.column?.columnId || "",
  title: task.title,
  description: task.description || "",
  status: normalizeStatus(task.status),
  priority: normalizePriority(task.priority),
  assignees: (task.assignees || []).map((item) => mapUser(item.user)),
  labels: (task.labels || []).map(mapLabel),
  startDate: task.startDate || undefined,
  deadline: task.dueDate || undefined,
  createdBy: mapUser(task.createdBy),
  createdAt: task.createdAt,
  updatedAt: task.updatedAt,
  order: task.order || 0,
});

const mapActivity = (item: any): ActivityEntry => ({
  id: item.activityId || item.id,
  action: item.action || "updated",
  description: item.description || "",
  timestamp: item.timestamp || item.createdAt || new Date().toISOString(),
  task: item.task
    ? { id: item.task.taskId || item.task.id, title: item.task.title }
    : undefined,
  user: item.user ? mapUser(item.user) : emptyUser,
});

const emptyUser: WorkHubUser = {
  id: "",
  name: "Unknown",
  email: "",
  status: "offline",
};

const jsonBody = (body: unknown) => ({
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

export const workHubApi = {
  async getWorkspaces(userId: string) {
    const rows = await fetchApi<WorkspaceResponse[]>("/workspaces", {
      params: { userId },
    });
    return rows.map(mapWorkspace);
  },

  async getWorkspace(id: string) {
    return mapWorkspace(await fetchApi<WorkspaceResponse>(`/workspaces/${id}`));
  },

  async createWorkspace(input: {
    name: string;
    description?: string;
    type: WorkspaceType;
    color?: string;
    isPublic?: boolean;
    ownerId: string;
  }) {
    return mapWorkspace(
      await fetchApi<WorkspaceResponse>("/workspaces", {
        method: "POST",
        ...jsonBody({
          workspaceName: input.name,
          description: input.description,
          type: input.type.toUpperCase(),
          color: input.color,
          isPublic: input.isPublic,
          ownerId: input.ownerId,
        }),
      }),
    );
  },

  async updateWorkspace(id: string, input: Partial<Workspace>) {
    return mapWorkspace(
      await fetchApi<WorkspaceResponse>(`/workspaces/${id}`, {
        method: "PATCH",
        ...jsonBody({
          workspaceName: input.name,
          description: input.description,
          type: input.type?.toUpperCase(),
          color: input.color,
          isPublic: input.isPublic,
        }),
      }),
    );
  },

  deleteWorkspace(id: string) {
    return fetchApi(`/workspaces/${id}`, { method: "DELETE" });
  },

  async getDashboardStats(id: string): Promise<WorkspaceDashboardStats> {
    const data = await fetchApi<any>(`/workspaces/${id}/dashboard-stats`);
    return {
      summary: data.summary,
      boardStats: data.boardStats || [],
      recentActivities: (data.recentActivities || []).map(mapActivity),
      trendLast7Days: data.trendLast7Days || [],
    };
  },

  async getMembers(workspaceId: string) {
    const rows = await fetchApi<WorkspaceMemberResponse[]>(
      `/workspaces/${workspaceId}/members`,
    );
    return rows.map(mapMember);
  },

  inviteMember(workspaceId: string, value: string, role: WorkspaceRole) {
    return fetchApi(`/workspaces/${workspaceId}/members/invite`, {
      method: "POST",
      ...jsonBody({ method: "name", value, role: roleToBackend(role) }),
    });
  },

  updateMemberRole(workspaceId: string, userId: string, role: WorkspaceRole) {
    return fetchApi(`/workspaces/${workspaceId}/members/${userId}`, {
      method: "PATCH",
      ...jsonBody({ role: roleToBackend(role) }),
    });
  },

  removeMember(workspaceId: string, userId: string) {
    return fetchApi(`/workspaces/${workspaceId}/members/${userId}`, {
      method: "DELETE",
    });
  },

  async getBoards(workspaceId: string) {
    const rows = await fetchApi<BoardResponse[]>(
      `/workspaces/${workspaceId}/boards`,
    );
    return rows.map((board) => mapBoard(board, workspaceId));
  },

  async getBoard(workspaceId: string, boardId: string) {
    return mapBoard(
      await fetchApi<BoardResponse>(
        `/workspaces/${workspaceId}/boards/${boardId}`,
      ),
      workspaceId,
    );
  },

  async createBoard(
    workspaceId: string,
    input: { name: string; description?: string; color?: string; icon?: string },
  ) {
    return mapBoard(
      await fetchApi<BoardResponse>(`/workspaces/${workspaceId}/boards`, {
        method: "POST",
        ...jsonBody({
          boardName: input.name,
          description: input.description,
          backgroundColor: input.color,
          icon: input.icon || "board",
        }),
      }),
      workspaceId,
    );
  },

  updateBoard(
    workspaceId: string,
    boardId: string,
    input: { name?: string; description?: string; color?: string; icon?: string },
  ) {
    return fetchApi(`/workspaces/${workspaceId}/boards/${boardId}`, {
      method: "PATCH",
      ...jsonBody({
        boardName: input.name,
        description: input.description,
        backgroundColor: input.color,
        icon: input.icon,
      }),
    });
  },

  deleteBoard(workspaceId: string, boardId: string) {
    return fetchApi(`/workspaces/${workspaceId}/boards/${boardId}`, {
      method: "DELETE",
    });
  },

  async getTasksByBoard(boardId: string) {
    const rows = await fetchApi<TaskResponse[]>(`/boards/${boardId}/tasks`);
    return rows.map(mapTask);
  },

  async createTask(
    boardId: string,
    input: {
      title: string;
      description?: string;
      priority: TaskPriority;
      status: TaskStatus;
      columnId?: string;
      createdById?: string;
      assigneeIds?: string[];
      labelIds?: string[];
      dueDate?: string;
    },
  ) {
    return mapTask(
      await fetchApi<TaskResponse>(`/boards/${boardId}/tasks`, {
        method: "POST",
        ...jsonBody({
          ...input,
          priority: priorityToBackend(input.priority),
          status: statusToBackend(input.status),
        }),
      }),
    );
  },

  async updateTask(
    taskId: string,
    input: Partial<{
      title: string;
      description: string;
      priority: TaskPriority;
      status: TaskStatus;
      columnId: string;
      assigneeIds: string[];
      labelIds: string[];
      dueDate: string;
    }>,
  ) {
    return mapTask(
      await fetchApi<TaskResponse>(`/tasks/${taskId}`, {
        method: "PATCH",
        ...jsonBody({
          ...input,
          priority: input.priority ? priorityToBackend(input.priority) : undefined,
          status: input.status ? statusToBackend(input.status) : undefined,
        }),
      }),
    );
  },

  moveTask(taskId: string, columnId: string, status: TaskStatus) {
    return fetchApi(`/tasks/${taskId}/move`, {
      method: "PATCH",
      ...jsonBody({ columnId, status: statusToBackend(status) }),
    });
  },

  deleteTask(taskId: string) {
    return fetchApi(`/tasks/${taskId}`, { method: "DELETE" });
  },

  async getLabels(workspaceId: string) {
    const rows = await fetchApi<LabelResponse[]>(`/workspaces/${workspaceId}/labels`);
    return rows.map(mapLabel);
  },

  async createLabel(workspaceId: string, input: { text: string; color: string; type: Label["type"] }) {
    return mapLabel(
      await fetchApi<LabelResponse>(`/workspaces/${workspaceId}/labels`, {
        method: "POST",
        ...jsonBody({
          workspaceId,
          text: input.text,
          color: input.color,
          type: input.type.toUpperCase(),
        }),
      }),
    );
  },

  deleteLabel(workspaceId: string, labelId: string) {
    return fetchApi(`/workspaces/${workspaceId}/labels/${labelId}`, {
      method: "DELETE",
    });
  },

  async getGoals(workspaceId: string): Promise<Goal[]> {
    const rows = await fetchApi<any[]>(`/workspaces/${workspaceId}/goals`);
    return rows.map((item) => ({
      id: item.goalId,
      title: item.title,
      description: item.description || "",
      status: item.status || "on_track",
      progress: item.progress || 0,
      startDate: item.startDate || "",
      endDate: item.endDate || "",
      owner: item.owner ? mapUser(item.owner) : emptyUser,
    }));
  },

  createGoal(workspaceId: string, input: { title: string; description?: string; ownerId: string }) {
    return fetchApi(`/workspaces/${workspaceId}/goals`, {
      method: "POST",
      ...jsonBody({ ...input, status: "on_track", progress: 0 }),
    });
  },

  deleteGoal(id: string) {
    return fetchApi(`/goals/${id}`, { method: "DELETE" });
  },

  async getSprints(workspaceId: string): Promise<Sprint[]> {
    const rows = await fetchApi<any[]>(`/workspaces/${workspaceId}/sprints`);
    return rows.map((item) => ({
      id: item.sprintId,
      name: item.name,
      goal: item.goal || "",
      status: item.status || "planning",
      startDate: item.startDate || "",
      endDate: item.endDate || "",
    }));
  },

  createSprint(workspaceId: string, input: { name: string; goal?: string }) {
    return fetchApi(`/workspaces/${workspaceId}/sprints`, {
      method: "POST",
      ...jsonBody({ ...input, status: "planning" }),
    });
  },

  deleteSprint(id: string) {
    return fetchApi(`/sprints/${id}`, { method: "DELETE" });
  },

  async getEpics(workspaceId: string): Promise<Epic[]> {
    const rows = await fetchApi<any[]>(`/workspaces/${workspaceId}/epics`);
    return rows.map((item) => ({
      id: item.epicId,
      title: item.title,
      description: item.description || "",
      status: item.status || "planned",
      color: item.color || "#0d9488",
      progress: item.progress || 0,
      startDate: item.startDate || "",
      endDate: item.endDate || "",
      owner: item.owner ? mapUser(item.owner) : emptyUser,
      boardName: item.board?.boardName,
    }));
  },

  createEpic(workspaceId: string, input: { title: string; description?: string; ownerId: string }) {
    return fetchApi(`/workspaces/${workspaceId}/epics`, {
      method: "POST",
      ...jsonBody({ ...input, status: "planned", progress: 0, color: "#0d9488" }),
    });
  },

  deleteEpic(id: string) {
    return fetchApi(`/epics/${id}`, { method: "DELETE" });
  },

  async getMilestones(workspaceId: string): Promise<Milestone[]> {
    const rows = await fetchApi<any[]>(`/workspaces/${workspaceId}/milestones`);
    return rows.map((item) => ({
      id: item.milestoneId,
      title: item.title,
      date: item.date,
      status: item.status || "upcoming",
    }));
  },

  createMilestone(workspaceId: string, input: { title: string; date: string }) {
    return fetchApi(`/workspaces/${workspaceId}/milestones`, {
      method: "POST",
      ...jsonBody({ ...input, status: "upcoming" }),
    });
  },

  deleteMilestone(id: string) {
    return fetchApi(`/milestones/${id}`, { method: "DELETE" });
  },

  async getAutomations(workspaceId: string): Promise<AutomationRule[]> {
    const rows = await fetchApi<any[]>(`/workspaces/${workspaceId}/automations`);
    return rows.map((item) => ({
      id: item.ruleId,
      name: item.name,
      description: item.description || "",
      isEnabled: Boolean(item.isEnabled),
      triggerCount: item.triggerCount || 0,
      lastTriggered: item.lastTriggered || null,
    }));
  },

  createAutomation(workspaceId: string, input: { name: string; description?: string }) {
    return fetchApi(`/workspaces/${workspaceId}/automations`, {
      method: "POST",
      ...jsonBody({
        ...input,
        trigger: { type: "manual" },
        action: { type: "notify" },
      }),
    });
  },

  toggleAutomation(id: string) {
    return fetchApi(`/automations/${id}/toggle`, { method: "PATCH", ...jsonBody({}) });
  },

  deleteAutomation(id: string) {
    return fetchApi(`/automations/${id}`, { method: "DELETE" });
  },

  async getDocuments(workspaceId: string): Promise<DocumentItem[]> {
    const rows = await fetchApi<any[]>(`/workspaces/${workspaceId}/documents`);
    return rows.map((item) => ({
      id: item.documentId,
      title: item.title,
      content: item.content || "",
      isFavorite: Boolean(item.isFavorite),
      viewCount: item.viewCount || 0,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      createdBy: item.createdBy ? mapUser(item.createdBy) : emptyUser,
    }));
  },

  createDocument(workspaceId: string, input: { title: string; content?: string; createdById: string }) {
    return fetchApi(`/workspaces/${workspaceId}/documents`, {
      method: "POST",
      ...jsonBody(input),
    });
  },

  updateDocument(id: string, input: { title?: string; content?: string; lastEditedById?: string }) {
    return fetchApi(`/documents/${id}`, { method: "PATCH", ...jsonBody(input) });
  },

  deleteDocument(id: string) {
    return fetchApi(`/documents/${id}`, { method: "DELETE" });
  },

  async getWorkspaceFiles(workspaceId: string, parentId?: string): Promise<FileItem[]> {
    const rows = await fetchApi<any[]>(`/workspaces/${workspaceId}/files`, {
      params: parentId ? { parentId } : undefined,
    });
    return rows.map((item) => ({
      id: item.fileId,
      name: item.name,
      type: item.type === "folder" ? "folder" : "file",
      mimeType: item.mimeType || undefined,
      size: item.size || undefined,
      url: item.url || undefined,
      parentId: item.parent?.fileId || null,
      uploadedAt: item.uploadedAt || item.createdAt,
      accessLevel: item.accessLevel || "workspace",
    }));
  },

  createWorkspaceFolder(workspaceId: string, name: string, parentId?: string) {
    return fetchApi(`/workspaces/${workspaceId}/folders`, {
      method: "POST",
      ...jsonBody({ name, type: "folder", parentId, accessLevel: "workspace" }),
    });
  },

  deleteWorkspaceFile(id: string) {
    return fetchApi(`/workspace-files/${id}`, { method: "DELETE" });
  },

  async getWorkspaceActivities(workspaceId: string): Promise<ActivityEntry[]> {
    const rows = await fetchApi<any[]>(`/workspaces/${workspaceId}/activities`);
    return rows.map(mapActivity);
  },

  async getWorkload(workspaceId: string): Promise<WorkloadMember[]> {
    const rows = await fetchApi<any[]>(`/workspaces/${workspaceId}/workload`);
    return rows.map((item) => ({
      user: mapUser(item.user),
      totalTasks: item.totalTasks || 0,
      todoTasks: item.todoTasks || 0,
      inProgressTasks: item.inProgressTasks || 0,
      reviewTasks: item.reviewTasks || 0,
      doneTasks: item.doneTasks || 0,
      overdueTasks: item.overdueTasks || 0,
    }));
  },

  async getReports(workspaceId: string): Promise<ReportData> {
    const data = await fetchApi<any>(`/workspaces/${workspaceId}/reports`);
    return {
      period: data.period,
      boards: data.boards || [],
      members: (data.members || []).map((item: any) => ({
        ...item,
        user: mapUser(item.user),
      })),
      overdue: (data.overdue || []).map((item: any) => ({
        ...item,
        assignees: (item.assignees || []).map(mapUser),
      })),
    };
  },
};
