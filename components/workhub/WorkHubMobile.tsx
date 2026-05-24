import { workHubApi } from "@/services/api/workHub";
import type {
  Board,
  BoardColumn,
  ReportData,
  Task,
  TaskPriority,
  TaskStatus,
  WorkloadMember,
  Workspace,
  WorkspaceDashboardStats,
  WorkspaceRole,
  WorkspaceType,
} from "@/types/workhub";
import { useAuth } from "@/hooks/useAuth";
import { useFocusEffect } from "@react-navigation/native";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft, ChevronRight } from "lucide-react-native";

type WorkHubSection =
  | "dashboard"
  | "members"
  | "insights"
  | "goals"
  | "sprints"
  | "roadmap"
  | "workload"
  | "automations"
  | "reports"
  | "labels"
  | "activity"
  | "documents"
  | "files"
  | "settings";

const palette = {
  bg: "#f5f7fa",
  surface: "#ffffff",
  surfaceAlt: "#f0fdfa",
  tint: "#ccfbf1",
  primary: "#0d9488",
  primaryDark: "#0f766e",
  text: "#1e293b",
  subtext: "#475569",
  muted: "#94a3b8",
  border: "#e2e8f0",
  danger: "#dc2626",
  warning: "#d97706",
  success: "#059669",
};

const workspaceTypes: WorkspaceType[] = [
  "business",
  "education",
  "community",
  "personal",
];

const statusLabels: Record<TaskStatus, string> = {
  todo: "Todo",
  inprogress: "In progress",
  review: "Review",
  done: "Done",
};

const priorityLabels: Record<TaskPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Urgent",
};

const formatDate = (value?: string) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
};

const getInitials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "WH";

function ScreenFrame({
  children,
  refreshing,
  onRefresh,
}: {
  children: React.ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
}) {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.root}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={Boolean(refreshing)}
              onRefresh={onRefresh}
              colors={[palette.primary]}
            />
          ) : undefined
        }
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

function Header({
  title,
  subtitle,
  right,
  showBack = true,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  showBack?: boolean;
}) {
  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        {showBack && (
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.headerButton}
            activeOpacity={0.75}
          >
            <ChevronLeft
              size={24}
              color={styles.headerButtonText.color}
            />
          </TouchableOpacity>
        )}
        <View style={styles.headerTitleWrap}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>
      {right}
    </View>
  );
}

function PrimaryButton({
  label,
  onPress,
  tone = "primary",
  disabled,
}: {
  label: string;
  onPress: () => void;
  tone?: "primary" | "light" | "danger";
  disabled?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
      style={[
        styles.button,
        tone === "light" && styles.buttonLight,
        tone === "danger" && styles.buttonDanger,
        disabled && styles.buttonDisabled,
      ]}
    >
      <Text
        style={[
          styles.buttonText,
          tone === "light" && styles.buttonLightText,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  multiline,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={palette.muted}
        multiline={multiline}
        style={[styles.input, multiline && styles.inputMultiline]}
      />
    </View>
  );
}

function ChoiceRow<T extends string>({
  values,
  selected,
  onSelect,
  labels,
}: {
  values: T[];
  selected: T;
  onSelect: (value: T) => void;
  labels?: Partial<Record<T, string>>;
}) {
  return (
    <View style={styles.choiceRow}>
      {values.map((value) => {
        const active = selected === value;
        return (
          <TouchableOpacity
            key={value}
            style={[styles.choice, active && styles.choiceActive]}
            onPress={() => onSelect(value)}
          >
            <Text style={[styles.choiceText, active && styles.choiceTextActive]}>
              {labels?.[value] || value}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function FormModal({
  visible,
  title,
  values,
  fields,
  onChange,
  onClose,
  onSubmit,
  submitLabel = "Save",
}: {
  visible: boolean;
  title: string;
  values: Record<string, string>;
  fields: { key: string; label: string; placeholder?: string; multiline?: boolean }[];
  onChange: (key: string, value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
  submitLabel?: string;
}) {
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>{title}</Text>
          {fields.map((field) => (
            <Field
              key={field.key}
              label={field.label}
              value={values[field.key] || ""}
              onChangeText={(value) => onChange(field.key, value)}
              placeholder={field.placeholder}
              multiline={field.multiline}
            />
          ))}
          <View style={styles.modalActions}>
            <PrimaryButton label="Cancel" tone="light" onPress={onClose} />
            <PrimaryButton label={submitLabel} onPress={onSubmit} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

export function WorkHubLandingScreen() {
  const { state } = useAuth();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (refresh = false) => {
    const userId = state.user?.userId;
    if (!userId) return;
    if (refresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);
    try {
      setWorkspaces(await workHubApi.getWorkspaces(userId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cannot load workspaces");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [state.user?.userId]);

  useFocusEffect(
    useCallback(() => {
      void load(false);
    }, [load]),
  );

  return (
    <ScreenFrame refreshing={refreshing} onRefresh={() => void load(true)}>
      <Header
        title="WorkHub"
        subtitle="Workspace, boards, tasks and planning"
        showBack={false}
        right={
          <PrimaryButton
            label="New"
            onPress={() => router.push("/work-hub/create" as any)}
          />
        }
      />

      {loading ? <Loader /> : null}
      {error ? <ErrorBox message={error} onRetry={() => void load(false)} /> : null}

      {!loading && !error && workspaces.length === 0 ? (
        <EmptyState
          title="No workspace yet"
          description="Create your first workspace to start using WorkHub on mobile."
          actionLabel="Create workspace"
          onAction={() => router.push("/work-hub/create" as any)}
        />
      ) : null}

      <View style={styles.listGap}>
        {workspaces.map((workspace) => (
          <TouchableOpacity
            key={workspace.id}
            style={styles.workspaceCard}
            onPress={() => router.push(`/work-hub/${workspace.id}` as any)}
            activeOpacity={0.75}
          >
            <View
              style={[styles.workspaceAvatar, { backgroundColor: workspace.color }]}
            >
              <Text style={styles.workspaceAvatarText}>
                {getInitials(workspace.name)}
              </Text>
            </View>
            <View style={styles.workspaceInfo}>
              <Text style={styles.cardTitle}>{workspace.name}</Text>
              <Text style={styles.cardMeta}>
                {workspace.members.length} members · {workspace.boards.length} boards
              </Text>
              {workspace.description ? (
                <Text style={styles.cardText} numberOfLines={2}>
                  {workspace.description}
                </Text>
              ) : null}
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScreenFrame>
  );
}

export function CreateWorkspaceScreen() {
  const { state } = useAuth();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<WorkspaceType>("business");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!name.trim() || !state.user?.userId) return;
    setSaving(true);
    try {
      const workspace = await workHubApi.createWorkspace({
        name: name.trim(),
        description: description.trim(),
        type,
        color: palette.primary,
        isPublic: false,
        ownerId: state.user.userId,
      });
      router.replace(`/work-hub/${workspace.id}` as any);
    } catch (err) {
      Alert.alert("WorkHub", err instanceof Error ? err.message : "Cannot create workspace");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScreenFrame>
      <Header title="Create workspace" subtitle="Set up a tidy team space" />
      <View style={styles.formCard}>
        <Field label="Name" value={name} onChangeText={setName} placeholder="Product Team" />
        <Field
          label="Description"
          value={description}
          onChangeText={setDescription}
          placeholder="What this workspace is for"
          multiline
        />
        <Text style={styles.fieldLabel}>Type</Text>
        <ChoiceRow
          values={workspaceTypes}
          selected={type}
          onSelect={setType}
          labels={{
            business: "Business",
            education: "Education",
            community: "Community",
            personal: "Personal",
          }}
        />
        <PrimaryButton
          label={saving ? "Creating..." : "Create workspace"}
          onPress={submit}
          disabled={saving || !name.trim()}
        />
      </View>
    </ScreenFrame>
  );
}

function WorkHubShell({
  workspace,
  section,
  onReload,
  children,
}: {
  workspace: Workspace;
  section: WorkHubSection;
  onReload: () => void;
  children: React.ReactNode;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const modules = useMemo(
    () => [
      ["dashboard", "Dashboard"],
      ["insights", "Insights"],
      ["members", "Members"],
      ["goals", "Goals"],
      ["sprints", "Sprints"],
      ["roadmap", "Roadmap"],
      ["workload", "Workload"],
      ["automations", "Automations"],
      ["reports", "Reports"],
      ["labels", "Labels"],
      ["activity", "Activity"],
      ["documents", "Docs"],
      ["files", "Files"],
      ["settings", "Settings"],
    ] as const,
    [],
  );

  const go = (target: WorkHubSection) => {
    const suffix = target === "dashboard" ? "" : `/${target}`;
    setMenuOpen(false);
    router.push(`/work-hub/${workspace.id}${suffix}` as any);
  };

  return (
    <>
      <Header
        title={workspace.name}
        subtitle={`${workspace.members.length} members · ${workspace.boards.length} boards`}
        right={
          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => setMenuOpen(true)}
          >
            <Text style={styles.menuButtonText}>Menu</Text>
          </TouchableOpacity>
        }
      />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.navScroller}>
        {modules.map(([id, label]) => (
          <TouchableOpacity
            key={id}
            onPress={() => go(id)}
            style={[styles.navPill, section === id && styles.navPillActive]}
          >
            <Text style={[styles.navPillText, section === id && styles.navPillTextActive]}>
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      {children}
      <Modal visible={menuOpen} animationType="fade" transparent>
        <Pressable style={styles.drawerShade} onPress={() => setMenuOpen(false)}>
          <View style={styles.workhubDrawer}>
            <Text style={styles.drawerTitle}>WorkHub routes</Text>
            {workspace.boards.length > 0 ? (
              <View style={styles.drawerSection}>
                <Text style={styles.sectionLabel}>Boards</Text>
                {workspace.boards.map((board) => (
                  <TouchableOpacity
                    key={board.id}
                    style={styles.drawerRow}
                    onPress={() => {
                      setMenuOpen(false);
                      router.push(`/work-hub/${workspace.id}/boards/${board.id}` as any);
                    }}
                  >
                    <View style={[styles.dot, { backgroundColor: board.color }]} />
                    <Text style={styles.drawerRowText}>{board.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : null}
            <View style={styles.drawerSection}>
              <Text style={styles.sectionLabel}>Modules</Text>
              {modules.map(([id, label]) => (
                <TouchableOpacity
                  key={id}
                  style={[styles.drawerRow, section === id && styles.drawerRowActive]}
                  onPress={() => go(id)}
                >
                  <Text style={styles.drawerRowText}>{label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <PrimaryButton label="Refresh" tone="light" onPress={onReload} />
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

export function WorkHubWorkspaceScreen({ section }: { section: WorkHubSection }) {
  const { state } = useAuth();
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [stats, setStats] = useState<WorkspaceDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <WorkspaceRoute
      section={section}
      userId={state.user?.userId}
      workspace={workspace}
      stats={stats}
      setWorkspace={setWorkspace}
      setStats={setStats}
      loading={loading}
      setLoading={setLoading}
      refreshing={refreshing}
      setRefreshing={setRefreshing}
      error={error}
      setError={setError}
    />
  );
}

export function WorkspaceRoute({
  section,
  userId,
  workspace,
  stats,
  setWorkspace,
  setStats,
  loading,
  setLoading,
  refreshing,
  setRefreshing,
  error,
  setError,
}: {
  section: WorkHubSection;
  userId?: string;
  workspace: Workspace | null;
  stats: WorkspaceDashboardStats | null;
  setWorkspace: (value: Workspace | null) => void;
  setStats: (value: WorkspaceDashboardStats | null) => void;
  loading: boolean;
  setLoading: (value: boolean) => void;
  refreshing: boolean;
  setRefreshing: (value: boolean) => void;
  error: string | null;
  setError: (value: string | null) => void;
}) {
  const params = useLocalSearchParams<{ workspaceId: string }>();
  const workspaceId = String(params.workspaceId || "");

  const load = useCallback(async (refresh = false) => {
    if (!workspaceId) return;
    if (refresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);
    try {
      const [workspaceData, statsData] = await Promise.all([
        workHubApi.getWorkspace(workspaceId),
        workHubApi.getDashboardStats(workspaceId).catch(() => null),
      ]);
      setWorkspace(workspaceData);
      setStats(statsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cannot load workspace");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [workspaceId, setError, setLoading, setRefreshing, setStats, setWorkspace]);

  useFocusEffect(
    useCallback(() => {
      void load(false);
    }, [load]),
  );

  if (loading) {
    return (
      <ScreenFrame>
        <Header title="WorkHub" subtitle="Loading workspace" />
        <Loader />
      </ScreenFrame>
    );
  }

  if (error || !workspace) {
    return (
      <ScreenFrame>
        <Header title="WorkHub" subtitle="Workspace unavailable" />
        <ErrorBox message={error || "Workspace not found"} onRetry={() => void load(false)} />
      </ScreenFrame>
    );
  }

  return (
    <ScreenFrame refreshing={refreshing} onRefresh={() => void load(true)}>
      <WorkHubShell workspace={workspace} section={section} onReload={() => void load(false)}>
        {section === "dashboard" && (
          <DashboardSection workspace={workspace} stats={stats} onReload={() => void load(false)} />
        )}
        {section === "insights" && <InsightsSection stats={stats} />}
        {section === "members" && (
          <MembersSection workspace={workspace} onChanged={() => void load(false)} />
        )}
        {section === "goals" && (
          <GoalsSection workspaceId={workspace.id} userId={userId} />
        )}
        {section === "sprints" && <SprintsSection workspaceId={workspace.id} />}
        {section === "roadmap" && (
          <RoadmapSection workspaceId={workspace.id} userId={userId} />
        )}
        {section === "workload" && <WorkloadSection workspaceId={workspace.id} />}
        {section === "automations" && <AutomationsSection workspaceId={workspace.id} />}
        {section === "reports" && <ReportsSection workspaceId={workspace.id} />}
        {section === "labels" && <LabelsSection workspaceId={workspace.id} />}
        {section === "activity" && <ActivitySection workspaceId={workspace.id} />}
        {section === "documents" && (
          <DocumentsSection workspaceId={workspace.id} userId={userId} />
        )}
        {section === "files" && <FilesSection workspaceId={workspace.id} />}
        {section === "settings" && (
          <SettingsSection workspace={workspace} onChanged={() => void load(false)} />
        )}
      </WorkHubShell>
    </ScreenFrame>
  );
}

function DashboardSection({
  workspace,
  stats,
  onReload,
}: {
  workspace: Workspace;
  stats: WorkspaceDashboardStats | null;
  onReload: () => void;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [values, setValues] = useState({ name: "", description: "" });
  const summary = stats?.summary || {
    totalTasks: 0,
    completedTasks: 0,
    inProgressTasks: 0,
    reviewTasks: 0,
    todoTasks: 0,
    overdueTasks: 0,
    completionRate: 0,
    totalBoards: workspace.boards.length,
    totalMembers: workspace.members.length,
  };

  const save = async () => {
    if (!values.name.trim()) return;
    await workHubApi.createBoard(workspace.id, {
      name: values.name.trim(),
      description: values.description.trim(),
      color: palette.primary,
    });
    setModalOpen(false);
    setValues({ name: "", description: "" });
    onReload();
  };

  return (
    <View style={styles.section}>
      <View style={styles.statsGrid}>
        <Stat label="Total tasks" value={summary.totalTasks} />
        <Stat label="In progress" value={summary.inProgressTasks} tone="warning" />
        <Stat label="Completed" value={summary.completedTasks} tone="success" />
        <Stat label="Overdue" value={summary.overdueTasks} tone="danger" />
      </View>

      <View style={styles.panel}>
        <View style={styles.panelHeader}>
          <View>
            <Text style={styles.panelTitle}>Boards</Text>
            <Text style={styles.panelSub}>{workspace.boards.length} boards in workspace</Text>
          </View>
          <PrimaryButton label="Add" onPress={() => setModalOpen(true)} />
        </View>
        <View style={styles.listGap}>
          {workspace.boards.map((board) => (
            <TouchableOpacity
              key={board.id}
              style={styles.rowCard}
              onPress={() => router.push(`/work-hub/${workspace.id}/boards/${board.id}` as any)}
            >
              <View style={[styles.dotLarge, { backgroundColor: board.color }]} />
              <View style={styles.rowMain}>
                <Text style={styles.cardTitle}>{board.name}</Text>
                <Text style={styles.cardMeta}>{board.columns.length} columns</Text>
              </View>
              <ChevronRight
                size={24}
                color={styles.headerButtonText.color}
              />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Recent activity</Text>
        {(stats?.recentActivities || []).slice(0, 5).map((item) => (
          <SmallLine key={item.id} title={item.user.name} subtitle={item.description} />
        ))}
        {(stats?.recentActivities || []).length === 0 ? (
          <Text style={styles.emptySmall}>No recent activity.</Text>
        ) : null}
      </View>

      <FormModal
        visible={modalOpen}
        title="Create board"
        values={values}
        fields={[
          { key: "name", label: "Board name" },
          { key: "description", label: "Description", multiline: true },
        ]}
        onChange={(key, value) => setValues((prev) => ({ ...prev, [key]: value }))}
        onClose={() => setModalOpen(false)}
        onSubmit={() => void save()}
      />
    </View>
  );
}

export function BoardDetailScreen() {
  const { state } = useAuth();
  const params = useLocalSearchParams<{ workspaceId: string; boardId: string }>();
  const workspaceId = String(params.workspaceId || "");
  const boardId = String(params.boardId || "");
  const [board, setBoard] = useState<Board | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [values, setValues] = useState({ title: "", description: "" });
  const [status, setStatus] = useState<TaskStatus>("todo");
  const [priority, setPriority] = useState<TaskPriority>("medium");

  const load = useCallback(async (refresh = false) => {
    if (refresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    try {
      const [boardData, taskData] = await Promise.all([
        workHubApi.getBoard(workspaceId, boardId),
        workHubApi.getTasksByBoard(boardId),
      ]);
      setBoard(boardData);
      setTasks(taskData);
    } catch (err) {
      Alert.alert("WorkHub", err instanceof Error ? err.message : "Cannot load board");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [boardId, workspaceId]);

  useFocusEffect(
    useCallback(() => {
      void load(false);
    }, [load]),
  );

  const openNew = (column?: BoardColumn) => {
    setEditingTask(null);
    setValues({ title: "", description: "" });
    setStatus(column?.status || "todo");
    setPriority("medium");
    setTaskModalOpen(true);
  };

  const openEdit = (task: Task) => {
    setEditingTask(task);
    setValues({ title: task.title, description: task.description });
    setStatus(task.status);
    setPriority(task.priority);
    setTaskModalOpen(true);
  };

  const saveTask = async () => {
    if (!values.title.trim() || !board) return;
    const column = board.columns.find((item) => item.status === status) || board.columns[0];
    if (editingTask) {
      await workHubApi.updateTask(editingTask.id, {
        title: values.title.trim(),
        description: values.description.trim(),
        status,
        priority,
        columnId: column?.id,
      });
    } else {
      await workHubApi.createTask(board.id, {
        title: values.title.trim(),
        description: values.description.trim(),
        status,
        priority,
        columnId: column?.id,
        createdById: state.user?.userId,
      });
    }
    setTaskModalOpen(false);
    await load(false);
  };

  const deleteTask = (task: Task) => {
    Alert.alert("Delete task", `Delete "${task.title}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await workHubApi.deleteTask(task.id);
          await load(false);
        },
      },
    ]);
  };

  if (loading) {
    return (
      <ScreenFrame>
        <Header title="Board" subtitle="Loading tasks" />
        <Loader />
      </ScreenFrame>
    );
  }

  if (!board) {
    return (
      <ScreenFrame>
        <Header title="Board" subtitle="Not found" />
        <EmptyState title="Board not found" description="This board is not available." />
      </ScreenFrame>
    );
  }

  return (
    <ScreenFrame refreshing={refreshing} onRefresh={() => void load(true)}>
      <Header
        title={board.name}
        subtitle={`${tasks.length} tasks`}
        right={<PrimaryButton label="Task" onPress={() => openNew()} />}
      />

      <View style={styles.section}>
        {board.columns.map((column) => {
          const columnTasks = tasks.filter(
            (task) => task.columnId === column.id || task.status === column.status,
          );
          return (
            <View key={column.id} style={styles.panel}>
              <View style={styles.panelHeader}>
                <View style={styles.inline}>
                  <View style={[styles.dot, { backgroundColor: column.color }]} />
                  <Text style={styles.panelTitle}>{column.name}</Text>
                  <Text style={styles.countBadge}>{columnTasks.length}</Text>
                </View>
                <PrimaryButton label="Add" tone="light" onPress={() => openNew(column)} />
              </View>
              {columnTasks.map((task) => (
                <TouchableOpacity key={task.id} style={styles.taskCard} onPress={() => openEdit(task)}>
                  <Text style={styles.cardTitle}>{task.title}</Text>
                  {task.description ? (
                    <Text style={styles.cardText} numberOfLines={2}>
                      {task.description}
                    </Text>
                  ) : null}
                  <View style={styles.tagRow}>
                    <Text style={styles.tag}>{priorityLabels[task.priority]}</Text>
                    {task.deadline ? <Text style={styles.tag}>Due {formatDate(task.deadline)}</Text> : null}
                  </View>
                  <View style={styles.taskActions}>
                    {board.columns.map((targetColumn) => (
                      <TouchableOpacity
                        key={targetColumn.id}
                        style={styles.miniButton}
                        onPress={() => {
                          void workHubApi
                            .moveTask(task.id, targetColumn.id, targetColumn.status)
                            .then(() => load(false));
                        }}
                      >
                        <Text style={styles.miniButtonText}>{statusLabels[targetColumn.status]}</Text>
                      </TouchableOpacity>
                    ))}
                    <TouchableOpacity style={styles.miniDanger} onPress={() => deleteTask(task)}>
                      <Text style={styles.miniDangerText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ))}
              {columnTasks.length === 0 ? (
                <Text style={styles.emptySmall}>No tasks in this column.</Text>
              ) : null}
            </View>
          );
        })}
      </View>

      <Modal visible={taskModalOpen} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{editingTask ? "Edit task" : "Create task"}</Text>
            <Field label="Title" value={values.title} onChangeText={(value) => setValues((prev) => ({ ...prev, title: value }))} />
            <Field label="Description" value={values.description} onChangeText={(value) => setValues((prev) => ({ ...prev, description: value }))} multiline />
            <Text style={styles.fieldLabel}>Status</Text>
            <ChoiceRow values={["todo", "inprogress", "review", "done"]} selected={status} onSelect={setStatus} labels={statusLabels} />
            <Text style={styles.fieldLabel}>Priority</Text>
            <ChoiceRow values={["low", "medium", "high", "critical"]} selected={priority} onSelect={setPriority} labels={priorityLabels} />
            <View style={styles.modalActions}>
              <PrimaryButton label="Cancel" tone="light" onPress={() => setTaskModalOpen(false)} />
              <PrimaryButton label="Save" onPress={() => void saveTask()} />
            </View>
          </View>
        </View>
      </Modal>
    </ScreenFrame>
  );
}

function MembersSection({ workspace, onChanged }: { workspace: Workspace; onChanged: () => void }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [value, setValue] = useState("");
  const [role, setRole] = useState<WorkspaceRole>("member");

  const invite = async () => {
    if (!value.trim()) return;
    await workHubApi.inviteMember(workspace.id, value.trim(), role);
    setModalOpen(false);
    setValue("");
    onChanged();
  };

  return (
    <View style={styles.section}>
      <View style={styles.panelHeader}>
        <Text style={styles.panelTitle}>Members</Text>
        <PrimaryButton label="Invite" onPress={() => setModalOpen(true)} />
      </View>
      {workspace.members.map((member) => (
        <View key={member.user.id} style={styles.rowCard}>
          <Avatar name={member.user.name} color={workspace.color} />
          <View style={styles.rowMain}>
            <Text style={styles.cardTitle}>{member.user.name}</Text>
            <Text style={styles.cardMeta}>{member.role}</Text>
          </View>
          <TouchableOpacity
            style={styles.miniButton}
            onPress={() => {
              const nextRole = member.role === "member" ? "admin" : "member";
              void workHubApi.updateMemberRole(workspace.id, member.user.id, nextRole).then(onChanged);
            }}
          >
            <Text style={styles.miniButtonText}>Role</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.miniDanger}
            onPress={() => void workHubApi.removeMember(workspace.id, member.user.id).then(onChanged)}
          >
            <Text style={styles.miniDangerText}>Remove</Text>
          </TouchableOpacity>
        </View>
      ))}
      <Modal visible={modalOpen} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Invite member</Text>
            <Field label="Name, phone or user id" value={value} onChangeText={setValue} />
            <Text style={styles.fieldLabel}>Role</Text>
            <ChoiceRow values={["member", "admin"]} selected={role} onSelect={setRole} labels={{ member: "Member", admin: "Admin" }} />
            <View style={styles.modalActions}>
              <PrimaryButton label="Cancel" tone="light" onPress={() => setModalOpen(false)} />
              <PrimaryButton label="Invite" onPress={() => void invite()} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function GenericCreateList<T extends { id: string }>({
  title,
  load,
  create,
  remove,
  fields,
  render,
  empty,
}: {
  title: string;
  load: () => Promise<T[]>;
  create?: (values: Record<string, string>) => Promise<unknown>;
  remove?: (item: T) => Promise<unknown>;
  fields?: { key: string; label: string; placeholder?: string; multiline?: boolean }[];
  render: (item: T) => { title: string; subtitle?: string; meta?: string };
  empty?: string;
}) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await load());
    } finally {
      setLoading(false);
    }
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  const submit = async () => {
    if (!create) return;
    await create(values);
    setValues({});
    setModalOpen(false);
    await refresh();
  };

  return (
    <View style={styles.section}>
      <View style={styles.panelHeader}>
        <Text style={styles.panelTitle}>{title}</Text>
        {create ? <PrimaryButton label="Add" onPress={() => setModalOpen(true)} /> : null}
      </View>
      {loading ? <Loader compact /> : null}
      {!loading && items.length === 0 ? <Text style={styles.emptySmall}>{empty || "No items."}</Text> : null}
      {items.map((item) => {
        const row = render(item);
        return (
          <View key={"id" in item ? item.id : row.title} style={styles.rowCard}>
            <View style={styles.rowMain}>
              <Text style={styles.cardTitle}>{row.title}</Text>
              {row.subtitle ? <Text style={styles.cardText}>{row.subtitle}</Text> : null}
              {row.meta ? <Text style={styles.cardMeta}>{row.meta}</Text> : null}
            </View>
            {remove ? (
              <TouchableOpacity style={styles.miniDanger} onPress={() => void remove(item).then(refresh)}>
                <Text style={styles.miniDangerText}>Delete</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        );
      })}
      {create && fields ? (
        <FormModal
          visible={modalOpen}
          title={`Add ${title}`}
          values={values}
          fields={fields}
          onChange={(key, value) => setValues((prev) => ({ ...prev, [key]: value }))}
          onClose={() => setModalOpen(false)}
          onSubmit={() => void submit()}
        />
      ) : null}
    </View>
  );
}

function GoalsSection({ workspaceId, userId }: { workspaceId: string; userId?: string }) {
  return (
    <GenericCreateList
      title="Goals & OKRs"
      load={() => workHubApi.getGoals(workspaceId)}
      create={(values) => workHubApi.createGoal(workspaceId, { title: values.title, description: values.description, ownerId: userId || "" })}
      remove={(item) => workHubApi.deleteGoal(item.id)}
      fields={[{ key: "title", label: "Goal title" }, { key: "description", label: "Description", multiline: true }]}
      render={(item) => ({ title: item.title, subtitle: item.description, meta: `${item.progress}% · ${item.status}` })}
    />
  );
}

function SprintsSection({ workspaceId }: { workspaceId: string }) {
  return (
    <GenericCreateList
      title="Sprints"
      load={() => workHubApi.getSprints(workspaceId)}
      create={(values) => workHubApi.createSprint(workspaceId, { name: values.name, goal: values.goal })}
      remove={(item) => workHubApi.deleteSprint(item.id)}
      fields={[{ key: "name", label: "Sprint name" }, { key: "goal", label: "Goal", multiline: true }]}
      render={(item) => ({ title: item.name, subtitle: item.goal, meta: item.status })}
    />
  );
}

function RoadmapSection({ workspaceId, userId }: { workspaceId: string; userId?: string }) {
  const [tab, setTab] = useState<"epics" | "milestones">("epics");
  return (
    <View>
      <ChoiceRow values={["epics", "milestones"]} selected={tab} onSelect={setTab} labels={{ epics: "Epics", milestones: "Milestones" }} />
      {tab === "epics" ? (
        <GenericCreateList
          title="Epics"
          load={() => workHubApi.getEpics(workspaceId)}
          create={(values) => workHubApi.createEpic(workspaceId, { title: values.title, description: values.description, ownerId: userId || "" })}
          remove={(item) => workHubApi.deleteEpic(item.id)}
          fields={[{ key: "title", label: "Epic title" }, { key: "description", label: "Description", multiline: true }]}
          render={(item) => ({ title: item.title, subtitle: item.description, meta: `${item.progress}% · ${item.status}` })}
        />
      ) : (
        <GenericCreateList
          title="Milestones"
          load={() => workHubApi.getMilestones(workspaceId)}
          create={(values) => workHubApi.createMilestone(workspaceId, { title: values.title, date: values.date })}
          remove={(item) => workHubApi.deleteMilestone(item.id)}
          fields={[{ key: "title", label: "Milestone title" }, { key: "date", label: "Date (YYYY-MM-DD)" }]}
          render={(item) => ({ title: item.title, meta: `${formatDate(item.date)} · ${item.status}` })}
        />
      )}
    </View>
  );
}

function AutomationsSection({ workspaceId }: { workspaceId: string }) {
  return (
    <GenericCreateList
      title="Automations"
      load={() => workHubApi.getAutomations(workspaceId)}
      create={(values) => workHubApi.createAutomation(workspaceId, { name: values.name, description: values.description })}
      remove={(item) => workHubApi.deleteAutomation(item.id)}
      fields={[{ key: "name", label: "Rule name" }, { key: "description", label: "Description", multiline: true }]}
      render={(item) => ({ title: item.name, subtitle: item.description, meta: `${item.isEnabled ? "Enabled" : "Paused"} · ${item.triggerCount} runs` })}
    />
  );
}

function DocumentsSection({ workspaceId, userId }: { workspaceId: string; userId?: string }) {
  return (
    <GenericCreateList
      title="Documents"
      load={() => workHubApi.getDocuments(workspaceId)}
      create={(values) => workHubApi.createDocument(workspaceId, { title: values.title, content: values.content, createdById: userId || "" })}
      remove={(item) => workHubApi.deleteDocument(item.id)}
      fields={[{ key: "title", label: "Title" }, { key: "content", label: "Content", multiline: true }]}
      render={(item) => ({ title: item.title, subtitle: item.content.replace(/<[^>]+>/g, " ").slice(0, 120), meta: `${item.viewCount} views` })}
    />
  );
}

function FilesSection({ workspaceId }: { workspaceId: string }) {
  return (
    <GenericCreateList
      title="Files"
      load={() => workHubApi.getWorkspaceFiles(workspaceId)}
      create={(values) => workHubApi.createWorkspaceFolder(workspaceId, values.name)}
      remove={(item) => workHubApi.deleteWorkspaceFile(item.id)}
      fields={[{ key: "name", label: "Folder name" }]}
      render={(item) => ({ title: item.name, meta: `${item.type} · ${formatDate(item.uploadedAt)}` })}
      empty="No files or folders."
    />
  );
}

function LabelsSection({ workspaceId }: { workspaceId: string }) {
  return (
    <GenericCreateList
      title="Labels"
      load={() => workHubApi.getLabels(workspaceId)}
      create={(values) => workHubApi.createLabel(workspaceId, { text: values.text, color: values.color || palette.primary, type: "feature" })}
      remove={(item) => workHubApi.deleteLabel(workspaceId, item.id)}
      fields={[{ key: "text", label: "Label" }, { key: "color", label: "Color hex" }]}
      render={(item) => ({ title: item.text, meta: item.type })}
    />
  );
}

function ActivitySection({ workspaceId }: { workspaceId: string }) {
  return (
    <GenericCreateList
      title="Activity feed"
      load={() => workHubApi.getWorkspaceActivities(workspaceId)}
      render={(item) => ({ title: item.user.name, subtitle: item.description, meta: formatDate(item.timestamp) })}
    />
  );
}

function WorkloadSection({ workspaceId }: { workspaceId: string }) {
  return (
    <GenericCreateList<WorkloadMember & { id: string }>
      title="Workload"
      load={async () => (await workHubApi.getWorkload(workspaceId)).map((item) => ({ ...item, id: item.user.id }))}
      render={(item) => ({
        title: item.user.name,
        subtitle: `${item.inProgressTasks} in progress · ${item.overdueTasks} overdue`,
        meta: `${item.doneTasks}/${item.totalTasks} done`,
      })}
    />
  );
}

function ReportsSection({ workspaceId }: { workspaceId: string }) {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      workHubApi.getReports(workspaceId).then(setData).finally(() => setLoading(false));
    }, [workspaceId]),
  );
  if (loading) return <Loader />;
  if (!data) return <EmptyState title="No report" description="Report data is not available." />;
  return (
    <View style={styles.section}>
      <View style={styles.statsGrid}>
        <Stat label="Total" value={data.period.totalTasks} />
        <Stat label="Completed" value={data.period.completedTasks} tone="success" />
        <Stat label="New" value={data.period.newTasks} />
        <Stat label="Rate" value={`${data.period.completionRate}%`} />
      </View>
      <GenericStaticRows
        title="Board report"
        rows={data.boards.map((board) => ({
          id: board.boardId,
          title: board.boardName,
          subtitle: `${board.completedTasks}/${board.totalTasks} completed`,
        }))}
      />
    </View>
  );
}

function InsightsSection({ stats }: { stats: WorkspaceDashboardStats | null }) {
  const summary = stats?.summary;
  return (
    <View style={styles.section}>
      <View style={styles.panel}>
        <Text style={styles.panelTitle}>AI Insights</Text>
        <Text style={styles.cardText}>
          Mobile summarizes live dashboard data so the team can scan progress quickly.
        </Text>
      </View>
      <View style={styles.statsGrid}>
        <Stat label="Completion" value={`${summary?.completionRate || 0}%`} tone="success" />
        <Stat label="Review" value={summary?.reviewTasks || 0} />
        <Stat label="Todo" value={summary?.todoTasks || 0} />
        <Stat label="Overdue" value={summary?.overdueTasks || 0} tone="danger" />
      </View>
      <GenericStaticRows
        title="7 day trend"
        rows={(stats?.trendLast7Days || []).map((item) => ({
          id: item.date,
          title: formatDate(item.date),
          subtitle: `${item.completed} tasks completed`,
        }))}
      />
    </View>
  );
}

function SettingsSection({ workspace, onChanged }: { workspace: Workspace; onChanged: () => void }) {
  const [name, setName] = useState(workspace.name);
  const [description, setDescription] = useState(workspace.description);
  const save = async () => {
    await workHubApi.updateWorkspace(workspace.id, { name, description });
    onChanged();
  };
  const remove = () => {
    Alert.alert("Delete workspace", `Delete "${workspace.name}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await workHubApi.deleteWorkspace(workspace.id);
          router.replace("/work-hub" as any);
        },
      },
    ]);
  };
  return (
    <View style={styles.formCard}>
      <Field label="Workspace name" value={name} onChangeText={setName} />
      <Field label="Description" value={description} onChangeText={setDescription} multiline />
      <PrimaryButton label="Save changes" onPress={() => void save()} />
      <PrimaryButton label="Delete workspace" tone="danger" onPress={remove} />
    </View>
  );
}

function GenericStaticRows({
  title,
  rows,
}: {
  title: string;
  rows: { id: string; title: string; subtitle?: string }[];
}) {
  return (
    <View style={styles.panel}>
      <Text style={styles.panelTitle}>{title}</Text>
      {rows.length === 0 ? <Text style={styles.emptySmall}>No data.</Text> : null}
      {rows.map((row) => (
        <SmallLine key={row.id} title={row.title} subtitle={row.subtitle} />
      ))}
    </View>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number | string;
  tone?: "success" | "warning" | "danger";
}) {
  const color =
    tone === "success" ? palette.success : tone === "warning" ? palette.warning : tone === "danger" ? palette.danger : palette.primaryDark;
  return (
    <View style={styles.statCard}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function SmallLine({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={styles.smallLine}>
      <Text style={styles.smallLineTitle}>{title}</Text>
      {subtitle ? <Text style={styles.smallLineText}>{subtitle}</Text> : null}
    </View>
  );
}

function Avatar({ name, color }: { name: string; color: string }) {
  return (
    <View style={[styles.avatar, { backgroundColor: color || palette.primary }]}>
      <Text style={styles.avatarText}>{getInitials(name)}</Text>
    </View>
  );
}

function Loader({ compact }: { compact?: boolean }) {
  return (
    <View style={compact ? styles.loaderCompact : styles.loader}>
      <ActivityIndicator color={palette.primary} />
    </View>
  );
}

function ErrorBox({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <View style={styles.errorBox}>
      <Text style={styles.errorText}>{message}</Text>
      <PrimaryButton label="Retry" tone="light" onPress={onRetry} />
    </View>
  );
}

function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyText}>{description}</Text>
      {actionLabel && onAction ? (
        <PrimaryButton label={actionLabel} onPress={onAction} />
      ) : null}
    </View>
  );
}

const styles: Record<string, any> = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.bg },
  root: { flex: 1, backgroundColor: palette.bg },
  scrollContent: { padding: 16, paddingBottom: 36 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 14,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", flex: 1, gap: 10 },
  headerButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  headerButtonText: { color: palette.text, fontSize: 18, fontWeight: "700" },
  headerTitleWrap: { flex: 1 },
  title: { color: palette.text, fontSize: 24, fontWeight: "800" },
  subtitle: { color: palette.subtext, fontSize: 13, marginTop: 2 },
  button: {
    minHeight: 38,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: palette.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonLight: {
    backgroundColor: palette.surfaceAlt,
    borderWidth: 1,
    borderColor: palette.border,
  },
  buttonDanger: { backgroundColor: palette.danger },
  buttonDisabled: { opacity: 0.55 },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  buttonLightText: { color: palette.primaryDark },
  listGap: { gap: 10 },
  workspaceCard: {
    flexDirection: "row",
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
  },
  workspaceAvatar: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  workspaceAvatarText: { color: "#fff", fontWeight: "800" },
  workspaceInfo: { flex: 1, minWidth: 0 },
  cardTitle: { color: palette.text, fontSize: 15, fontWeight: "700" },
  cardMeta: { color: palette.muted, fontSize: 12, marginTop: 3 },
  cardText: { color: palette.subtext, fontSize: 13, lineHeight: 18, marginTop: 5 },
  formCard: {
    gap: 14,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
  },
  field: { gap: 7 },
  fieldLabel: { color: palette.text, fontSize: 13, fontWeight: "700", marginBottom: 7 },
  input: {
    minHeight: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: "#fff",
    color: palette.text,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  inputMultiline: { minHeight: 92, paddingTop: 12, textAlignVertical: "top" },
  choiceRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 },
  choice: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
  },
  choiceActive: { backgroundColor: palette.tint, borderColor: palette.primary },
  choiceText: { color: palette.subtext, fontSize: 12, fontWeight: "700" },
  choiceTextActive: { color: palette.primaryDark },
  section: { gap: 14 },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  statCard: {
    width: "47.5%",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
    padding: 14,
  },
  statValue: { fontSize: 24, fontWeight: "800" },
  statLabel: { color: palette.subtext, fontSize: 12, marginTop: 4 },
  panel: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
    gap: 10,
  },
  panelHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 6,
  },
  panelTitle: { color: palette.text, fontSize: 16, fontWeight: "800" },
  panelSub: { color: palette.muted, fontSize: 12, marginTop: 2 },
  rowCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: "#fff",
  },
  rowMain: { flex: 1, minWidth: 0 },
  rowArrow: { color: palette.muted, fontSize: 16, fontWeight: "800" },
  dot: { width: 8, height: 8, borderRadius: 4 },
  dotLarge: { width: 14, height: 14, borderRadius: 7 },
  inline: { flexDirection: "row", alignItems: "center", gap: 8 },
  countBadge: {
    color: palette.primaryDark,
    backgroundColor: palette.surfaceAlt,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
    fontSize: 11,
    fontWeight: "800",
  },
  taskCard: {
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.bg,
  },
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  tag: {
    color: palette.primaryDark,
    backgroundColor: palette.surfaceAlt,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    fontSize: 11,
    fontWeight: "700",
  },
  taskActions: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 2 },
  miniButton: {
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: palette.surfaceAlt,
    borderWidth: 1,
    borderColor: palette.border,
  },
  miniButtonText: { color: palette.primaryDark, fontSize: 11, fontWeight: "700" },
  miniDanger: {
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  miniDangerText: { color: palette.danger, fontSize: 11, fontWeight: "700" },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#fff", fontWeight: "800", fontSize: 12 },
  smallLine: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  smallLineTitle: { color: palette.text, fontWeight: "700", fontSize: 13 },
  smallLineText: { color: palette.subtext, marginTop: 3, lineHeight: 18, fontSize: 13 },
  emptySmall: { color: palette.muted, textAlign: "center", paddingVertical: 14 },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
    gap: 10,
  },
  emptyTitle: { color: palette.text, fontSize: 18, fontWeight: "800" },
  emptyText: { color: palette.subtext, textAlign: "center", lineHeight: 20 },
  errorBox: {
    gap: 10,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#fecaca",
    backgroundColor: "#fef2f2",
  },
  errorText: { color: palette.danger, fontWeight: "600" },
  loader: { padding: 36, alignItems: "center", justifyContent: "center" },
  loaderCompact: { padding: 14, alignItems: "center", justifyContent: "center" },
  navScroller: { marginBottom: 14 },
  navPill: {
    marginRight: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
  },
  navPillActive: { backgroundColor: palette.primary, borderColor: palette.primary },
  navPillText: { color: palette.subtext, fontSize: 12, fontWeight: "800" },
  navPillTextActive: { color: "#fff" },
  menuButton: {
    height: 38,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: palette.surfaceAlt,
    borderWidth: 1,
    borderColor: palette.border,
    alignItems: "center",
    justifyContent: "center",
  },
  menuButtonText: { color: palette.primaryDark, fontWeight: "800", fontSize: 12 },
  drawerShade: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.28)",
    alignItems: "flex-end",
  },
  workhubDrawer: {
    width: "82%",
    maxWidth: 340,
    height: "100%",
    backgroundColor: palette.surface,
    padding: 18,
    gap: 10,
  },
  drawerTitle: { color: palette.text, fontSize: 19, fontWeight: "800", marginBottom: 4 },
  drawerSection: { gap: 4, marginBottom: 10 },
  sectionLabel: {
    color: palette.muted,
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    marginBottom: 3,
  },
  drawerRow: {
    minHeight: 38,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  drawerRowActive: { backgroundColor: palette.surfaceAlt },
  drawerRowText: { color: palette.text, fontWeight: "700", fontSize: 13 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.35)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: palette.surface,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 18,
    gap: 12,
  },
  modalTitle: { color: palette.text, fontSize: 18, fontWeight: "800" },
  modalActions: { flexDirection: "row", gap: 10, justifyContent: "flex-end", marginTop: 4 },
});
