import CalendarHeader from "@/components/calendar/CalendarHeader";
import EventEditorModal from "@/components/calendar/EventEditorModal";
import ViewModeTabs from "@/components/calendar/ViewModeTabs";
import { calendarApi } from "@/services/api/calendar";
import { CalendarEvent, ParticipantOption, ViewMode } from "@/types/calendar";
import { SafeAreaView } from "react-native-safe-area-context";

import DayView from "@/components/calendar/DayView";
import MonthView from "@/components/calendar/MonthView";
import WeekView from "@/components/calendar/WeekView";
import YearView from "@/components/calendar/YearView";
import FloatingActionButton from "@/components/common/FloatingActionButton";
import { formatDate } from "@/utils/calendar";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function CalendarScreen() {
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [participantOptions, setParticipantOptions] = useState<
    ParticipantOption[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingParticipants, setLoadingParticipants] = useState(false);
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

  const openDateMenu = () => {
    Alert.alert("Calendar actions", "Choose one action", [
      { text: "Cancel", style: "cancel" },
      { text: "Refresh", onPress: () => void loadEvents() },
    ]);
  };

  const getHeaderTitle = () => {
    switch (viewMode) {
      case "day":
        return formatDate(currentDate, "full");
      case "week":
      case "month":
        return formatDate(currentDate, "month");
      case "year":
        return currentDate.getFullYear().toString();
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <CalendarHeader
        title={getHeaderTitle()}
        onSearchPress={() => setShowSearch((prev) => !prev)}
        onMenuPress={openDateMenu}
      />

      {showSearch && (
        <View className="border-b border-gray-200 bg-white px-4 py-3">
          <TextInput
            ref={searchInputRef}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search events, location, description"
            className="rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-base text-gray-900"
            autoCapitalize="none"
            returnKeyType="search"
            onSubmitEditing={() => {
              void loadEvents();
            }}
          />
          <View className="mt-3 flex-row">
            <TouchableOpacity
              onPress={() => {
                setSearchQuery("");
                void loadEvents();
              }}
              className="rounded-lg border border-gray-300 px-3 py-2"
            >
              <Text className="text-sm text-gray-700">Clear</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View className="border-b border-gray-200 bg-white px-4 py-3">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity
            onPress={() => navigateDate("prev")}
            className="h-9 w-9 items-center justify-center rounded-lg border border-gray-300"
          >
            <Ionicons name="chevron-back" size={18} color="#374151" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setCurrentDate(new Date())}
            className="rounded-lg bg-gray-900 px-4 py-2"
          >
            <Text className="text-xs font-semibold uppercase tracking-wider text-white">
              Today
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigateDate("next")}
            className="h-9 w-9 items-center justify-center rounded-lg border border-gray-300"
          >
            <Ionicons name="chevron-forward" size={18} color="#374151" />
          </TouchableOpacity>
        </View>
      </View>

      <ViewModeTabs activeView={viewMode} onChange={setViewMode} />

      {loading && (
        <View className="flex-1 items-center justify-center bg-white">
          <ActivityIndicator size="large" color="#00B14F" />
        </View>
      )}

      {!loading && errorMessage && (
        <View className="mx-4 mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <Text className="text-red-600">{errorMessage}</Text>
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
