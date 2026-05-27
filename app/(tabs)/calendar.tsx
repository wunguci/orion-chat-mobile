import EventEditorModal from "@/components/calendar/EventEditorModal";
import ViewModeTabs from "@/components/calendar/ViewModeTabs";
import { whColors } from "@/constants/tailwindColors";
import { calendarApi } from "@/services/api/calendar";
import { CalendarEvent, ParticipantOption, ViewMode } from "@/types/calendar";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import DayView from "@/components/calendar/DayView";
import MonthView from "@/components/calendar/MonthView";
import WeekView from "@/components/calendar/WeekView";
import YearView from "@/components/calendar/YearView";
import FloatingActionButton from "@/components/common/FloatingActionButton";
import { formatDate } from "@/utils/calendar";
import { Ionicons } from "@expo/vector-icons";
import { Menu } from "lucide-react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useSlideMenu } from "@/context/SlideMenuContext";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Alert,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function CalendarScreen() {
  const { openMenu } = useSlideMenu();
  const insets = useSafeAreaInsets();
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [pendingInvites, setPendingInvites] = useState<CalendarEvent[]>([]);
  const [participantOptions, setParticipantOptions] = useState<
    ParticipantOption[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingParticipants, setLoadingParticipants] = useState(false);
  const [showPendingInvites, setShowPendingInvites] = useState(false);
  const searchInputRef = useRef<TextInput | null>(null);
  const [editorState, setEditorState] = useState<{
    open: boolean;
    existingEvent?: CalendarEvent;
    initialDate?: Date;
  }>({ open: false });

  const loadEvents = useCallback(async () => {
    setLoading(true);
    try {
      setErrorMessage(null);
      const rows = await calendarApi.getEvents({
        view: viewMode,
        date: currentDate.toISOString(),
        q: searchQuery,
      });
      setEvents(rows);
      const invites = await calendarApi.getPendingInvites();
      setPendingInvites(invites);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Cannot load calendar events";
      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  }, [viewMode, currentDate, searchQuery]);

  useFocusEffect(
    useCallback(() => {
      void loadEvents();
      return undefined;
    }, [loadEvents]),
  );

  useEffect(() => {
    if (!showSearch) return;
    const timer = setTimeout(() => {
      searchInputRef.current?.focus();
    }, 80);

    return () => clearTimeout(timer);
  }, [showSearch]);

  const loadParticipantOptions = useCallback(async () => {
    if (participantOptions.length > 0) return;

    setLoadingParticipants(true);
    try {
      const options = await calendarApi.getParticipantOptions();
      setParticipantOptions(options);
    } catch (error) {
      console.error("Failed to load participant options", error);
    } finally {
      setLoadingParticipants(false);
    }
  }, [participantOptions.length]);

  useEffect(() => {
    if (pendingInvites.length === 0) {
      setShowPendingInvites(false);
    }
  }, [pendingInvites.length]);

  const handleEventPress = (event: CalendarEvent) => {
    void loadParticipantOptions();
    setEditorState({
      open: true,
      existingEvent: event,
      initialDate: new Date(event.start),
    });
  };

  const handleAddEvent = () => {
    void loadParticipantOptions();
    setEditorState({
      open: true,
      existingEvent: undefined,
      initialDate: new Date(currentDate),
    });
  };

  const handleCreateAtDate = (date: Date) => {
    void loadParticipantOptions();
    setEditorState({
      open: true,
      existingEvent: undefined,
      initialDate: new Date(date),
    });
  };

  const handleMonthPress = (month: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), month, 1));
    setViewMode("month");
  };

  const navigateDate = (direction: "prev" | "next") => {
    const next = new Date(currentDate);
    if (viewMode === "day") {
      next.setDate(currentDate.getDate() + (direction === "next" ? 1 : -1));
    } else if (viewMode === "week") {
      next.setDate(currentDate.getDate() + (direction === "next" ? 7 : -7));
    } else if (viewMode === "month") {
      next.setMonth(currentDate.getMonth() + (direction === "next" ? 1 : -1));
    } else {
      next.setFullYear(
        currentDate.getFullYear() + (direction === "next" ? 1 : -1),
      );
    }
    setCurrentDate(next);
  };

  const handleSaveEvent = async (payload: Partial<CalendarEvent>) => {
    try {
      if (payload.id) {
        const updated = await calendarApi.updateEvent(payload.id, payload);
        setEvents((prev) =>
          prev.map((event) => (event.id === updated.id ? updated : event)),
        );
      } else {
        const created = await calendarApi.createEvent(payload);
        setEvents((prev) => [created, ...prev]);
      }

      setEditorState({
        open: false,
        existingEvent: undefined,
        initialDate: undefined,
      });
      await loadEvents();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Cannot save calendar event";
      Alert.alert("Save failed", message);
    }
  };

  const handleInviteResponse = async (
    eventId: string,
    status: "accepted" | "declined",
  ) => {
    try {
      await calendarApi.respondToInvite(eventId, status);
      await loadEvents();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Cannot respond to invite";
      Alert.alert("Invite response", message);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      await calendarApi.deleteEvent(eventId);
      setEditorState({
        open: false,
        existingEvent: undefined,
        initialDate: undefined,
      });
      setEvents((prev) => prev.filter((event) => event.id !== eventId));
      await loadEvents();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Cannot delete calendar event";
      Alert.alert("Delete failed", message);
    }
  };

  const openDateMenu = useCallback(() => {
    Alert.alert("Calendar actions", "Choose one action", [
      { text: "Cancel", style: "cancel" },
      { text: "Refresh", onPress: () => void loadEvents() },
    ]);
  }, [loadEvents]);

  const getHeaderTitle = useCallback(() => {
    switch (viewMode) {
      case "day":
        return formatDate(currentDate, "full");
      case "week":
      case "month":
        return formatDate(currentDate, "month");
      case "year":
        return currentDate.getFullYear().toString();
    }
  }, [currentDate, viewMode]);

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: "#fff" }}
      edges={[]}
    >
      {/* ── Custom header ── */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 12,
          paddingTop: insets.top + 10,
          paddingBottom: 10,
          backgroundColor: "#fff",
          borderBottomWidth: 1,
          borderBottomColor: whColors.borderLight,
        }}
      >
        {/* Left: hamburger */}
        <TouchableOpacity
          onPress={openMenu}
          activeOpacity={0.7}
          style={{
            width: 38,
            height: 38,
            borderRadius: 10,
            backgroundColor: whColors.bgHeavy,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Menu size={20} color={whColors.primary} strokeWidth={2.5} />
        </TouchableOpacity>

        {/* Center: prev / TODAY / next */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <TouchableOpacity
            onPress={() => navigateDate("prev")}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: whColors.bgMedium,
              borderWidth: 1,
              borderColor: whColors.borderLight,
            }}
          >
            <Ionicons name="chevron-back" size={16} color={whColors.textPrimary} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setCurrentDate(new Date())}
            style={{
              backgroundColor: "#1f2937",
              borderRadius: 8,
              paddingHorizontal: 12,
              paddingVertical: 6,
            }}
          >
            <Text style={{ color: "#fff", fontSize: 11, fontWeight: "700", letterSpacing: 0.8 }}>
              TODAY
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigateDate("next")}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: whColors.bgMedium,
              borderWidth: 1,
              borderColor: whColors.borderLight,
            }}
          >
            <Ionicons name="chevron-forward" size={16} color={whColors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Right: search + menu */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <TouchableOpacity
            onPress={() => setShowSearch((prev) => !prev)}
            style={{
              width: 34,
              height: 34,
              borderRadius: 9,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: whColors.bgMedium,
              borderWidth: 1,
              borderColor: whColors.borderLight,
            }}
            activeOpacity={0.8}
          >
            <Ionicons
              name={showSearch ? "close" : "search"}
              size={17}
              color={whColors.primary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={openDateMenu}
            style={{
              width: 34,
              height: 34,
              borderRadius: 9,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: whColors.bgMedium,
              borderWidth: 1,
              borderColor: whColors.borderLight,
            }}
            activeOpacity={0.8}
          >
            <Ionicons name="ellipsis-vertical" size={16} color={whColors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {showSearch && (
        <View style={{ borderBottomWidth: 1, borderBottomColor: "#e5e7eb", backgroundColor: "#fff", padding: 12 }}>
          <TextInput
            ref={searchInputRef}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search events, location, description"
            style={{
              borderWidth: 1,
              borderColor: "#d1d5db",
              borderRadius: 12,
              backgroundColor: "#f9fafb",
              paddingHorizontal: 16,
              paddingVertical: 10,
              fontSize: 14,
              color: "#111827",
            }}
            autoCapitalize="none"
            returnKeyType="search"
            onSubmitEditing={() => { void loadEvents(); }}
          />
          <View style={{ marginTop: 10, flexDirection: "row" }}>
            <TouchableOpacity
              onPress={() => { setSearchQuery(""); void loadEvents(); }}
              style={{ borderWidth: 1, borderColor: "#d1d5db", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7 }}
            >
              <Text style={{ fontSize: 13, color: "#374151" }}>Clear</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <ViewModeTabs activeView={viewMode} onChange={setViewMode} />

      {loading && (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#fff" }}>
          <ActivityIndicator size="large" color={whColors.primary} />
        </View>
      )}

      {!loading && errorMessage && (
        <View style={{ margin: 16, borderWidth: 1, borderColor: "#fecaca", backgroundColor: "#fef2f2", borderRadius: 12, padding: 12 }}>
          <Text style={{ color: "#dc2626" }}>{errorMessage}</Text>
        </View>
      )}

      {!loading && !errorMessage && pendingInvites.length > 0 && (
        <View style={{ margin: 16, borderWidth: 1, borderColor: "#e5e7eb", backgroundColor: "#fff", borderRadius: 16, padding: 12 }}>
          <TouchableOpacity
            onPress={() => setShowPendingInvites((prev) => !prev)}
            style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}
            activeOpacity={0.8}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Text style={{ fontSize: 13, fontWeight: "600", color: "#1f2937" }}>
                Pending event invites
              </Text>
              <View style={{ backgroundColor: "#f3f4f6", borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2 }}>
                <Text style={{ fontSize: 11, fontWeight: "600", color: "#4b5563" }}>
                  {pendingInvites.length}
                </Text>
              </View>
            </View>
            <Ionicons
              name={showPendingInvites ? "chevron-up" : "chevron-down"}
              size={16}
              color="#6B7280"
            />
          </TouchableOpacity>

          {showPendingInvites && (
            <View style={{ marginTop: 12, gap: 8 }}>
              {pendingInvites.map((invite) => (
                <View
                  key={invite.id}
                  style={{ borderWidth: 1, borderColor: "#e5e7eb", backgroundColor: "#f9fafb", borderRadius: 12, padding: 12 }}
                >
                  <Text numberOfLines={1} style={{ fontSize: 13, fontWeight: "600", color: "#1e293b" }}>
                    {invite.title}
                  </Text>
                  <Text numberOfLines={1} style={{ marginTop: 3, fontSize: 11, color: "#6b7280" }}>
                    {new Date(invite.start).toLocaleString()}
                  </Text>
                  <View style={{ marginTop: 10, flexDirection: "row", justifyContent: "flex-end", gap: 8 }}>
                    <TouchableOpacity
                      onPress={() => void handleInviteResponse(invite.id, "declined")}
                      style={{ borderWidth: 1, borderColor: "#d1d5db", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 }}
                    >
                      <Text style={{ fontSize: 12, fontWeight: "600", color: "#4b5563" }}>Decline</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => void handleInviteResponse(invite.id, "accepted")}
                      style={{ backgroundColor: whColors.primary, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 }}
                    >
                      <Text style={{ fontSize: 12, fontWeight: "600", color: "#fff" }}>Accept</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {!loading && !errorMessage && viewMode === "day" && (
        <DayView
          date={currentDate}
          events={events}
          onEventPress={handleEventPress}
          onCreateAtDate={handleCreateAtDate}
        />
      )}

      {!loading && !errorMessage && viewMode === "week" && (
        <WeekView
          date={currentDate}
          events={events}
          onEventPress={handleEventPress}
          onCreateAtDate={handleCreateAtDate}
        />
      )}

      {!loading && !errorMessage && viewMode === "month" && (
        <MonthView
          initialDate={currentDate}
          events={events}
          onEventPress={handleEventPress}
          onMonthChange={setCurrentDate}
          showMonthNavigation={false}
          onCreateAtDate={handleCreateAtDate}
        />
      )}

      {!loading && !errorMessage && viewMode === "year" && (
        <YearView
          year={currentDate.getFullYear()}
          events={events}
          onMonthPress={handleMonthPress}
        />
      )}

      <EventEditorModal
        visible={editorState.open}
        initialDate={editorState.initialDate || currentDate}
        existingEvent={editorState.existingEvent}
        participantOptions={participantOptions}
        loadingParticipants={loadingParticipants}
        onClose={() =>
          setEditorState({
            open: false,
            existingEvent: undefined,
            initialDate: undefined,
          })
        }
        onSave={handleSaveEvent}
        onDelete={handleDeleteEvent}
      />

      <FloatingActionButton onPress={handleAddEvent} />
    </SafeAreaView>
  );
}
