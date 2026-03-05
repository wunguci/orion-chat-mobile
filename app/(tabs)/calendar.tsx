import CalendarHeader from "@/components/calendar/CalendarHeader";
import ViewModeTabs from "@/components/calendar/ViewModeTabs";
import { CalendarEvent, ViewMode } from "@/types/calendar";
import { SafeAreaView } from "react-native-safe-area-context";

import DayView from "@/components/calendar/DayView";
import MonthView from "@/components/calendar/MonthView";
import WeekView from "@/components/calendar/WeekView";
import YearView from "@/components/calendar/YearView";
import FloatingActionButton from "@/components/common/FloatingActionButton";
import { formatDate } from "@/utils/calendar";
import { useState } from "react";

const MOCK_EVENTS: CalendarEvent[] = [
  {
    id: "1",
    title: "TKPM Sync",
    startTime: new Date(2026, 1, 26, 9, 0),
    endTime: new Date(2026, 1, 26, 10, 30),
    location: "Room A",
    color: "cyan",
    isActive: true,
    participants: [
      { id: "1", name: "User 1", avatar: "https://i.pravatar.cc/150?img=1" },
      { id: "2", name: "User 2", avatar: "https://i.pravatar.cc/150?img=2" },
    ],
  },
  {
    id: "2",
    title: "CNM Planning",
    startTime: new Date(2026, 1, 26, 13, 0),
    endTime: new Date(2026, 1, 26, 14, 0),
    location: "Room B",
    color: "pink",
    participants: [],
  },
  {
    id: "3",
    title: "Design Review Session",
    startTime: new Date(2026, 1, 26, 9, 0),
    endTime: new Date(2026, 1, 26, 10, 0),
    location: "Conference Room 2B",
    color: "cyan",
    participants: [],
  },
  {
    id: "4",
    title: "Client Briefing",
    startTime: new Date(2026, 1, 26, 14, 30),
    endTime: new Date(2026, 1, 26, 15, 30),
    location: "Office",
    color: "purple",
    participants: [],
  },
  {
    id: "5",
    title: "Team Standup",
    startTime: new Date(2026, 1, 27, 10, 0),
    endTime: new Date(2026, 1, 27, 10, 30),
    location: "Main Hall",
    color: "blue",
    participants: [],
  },
];

export default function CalendarScreen() {
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [currentDate, setCurrentDate] = useState(new Date());

  const handleEventPress = (event: CalendarEvent) => {
    console.log("Event pressed: ", event);
    // Navigate to event details or show a modal
  };

  const handleAddEvent = () => {
    console.log("Add Event");
    // Navigate to event creation screen or show a modal
  };

  const handleMonthPress = (month: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), month, 1));
    setViewMode("month");
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
        onSearchPress={() => console.log("Search")}
        onMenuPress={() => console.log("Menu")}
      />

      <ViewModeTabs activeView={viewMode} onChange={setViewMode} />

      {viewMode === "day" && (
        <DayView
          date={currentDate}
          events={MOCK_EVENTS}
          onEventPress={handleEventPress}
        />
      )}

      {viewMode === "week" && (
        <WeekView
          date={currentDate}
          events={MOCK_EVENTS}
          onEventPress={handleEventPress}
        />
      )}

      {viewMode === "month" && (
        <MonthView
          initialDate={currentDate}
          events={MOCK_EVENTS}
          onEventPress={handleEventPress}
        />
      )}

      {viewMode === "year" && (
        <YearView
          year={currentDate.getFullYear()}
          events={MOCK_EVENTS}
          onMonthPress={handleMonthPress}
        />
      )}

      <FloatingActionButton onPress={handleAddEvent} />
    </SafeAreaView>
  );
}
