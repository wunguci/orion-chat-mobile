import type {
  CalendarEvent,
  Participant,
  ParticipantOption,
} from "@/types/calendar";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface EventEditorModalProps {
  visible: boolean;
  initialDate: Date;
  existingEvent?: CalendarEvent | null;
  participantOptions: ParticipantOption[];
  loadingParticipants: boolean;
  onClose: () => void;
  onSave: (payload: Partial<CalendarEvent>) => Promise<void> | void;
  onDelete?: (id: string) => Promise<void> | void;
}

const COLOR_OPTIONS = [
  "#008080",
  "#06b6d4",
  "#ec4899",
  "#8b5cf6",
  "#3b82f6",
  "#10b981",
  "#f97316",
  "#ef4444",
];

type PickerTarget = "start" | "end";
type PickerMode = "date" | "time";

const formatDateLabel = (value: Date) =>
  value.toLocaleDateString("vi-VN", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

const formatTimeLabel = (value: Date) =>
  value.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });

const participantKey = (item: { type: "friend" | "group"; id: string }) =>
  `${item.type}:${item.id}`;

export default function EventEditorModal({
  visible,
  initialDate,
  existingEvent,
  participantOptions,
  loadingParticipants,
  onClose,
  onSave,
  onDelete,
}: EventEditorModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [startDate, setStartDate] = useState(new Date(initialDate));
  const [endDate, setEndDate] = useState(new Date(initialDate));
  const [color, setColor] = useState("#008080");
  const [notificationMinutes, setNotificationMinutes] = useState("30");
  const [selectedParticipantKeys, setSelectedParticipantKeys] = useState<
    string[]
  >([]);
  const [submitting, setSubmitting] = useState(false);
  const [pickerState, setPickerState] = useState<{
    target: PickerTarget;
    mode: PickerMode;
  } | null>(null);

  useEffect(() => {
    if (!visible) return;

    if (existingEvent) {
      setTitle(existingEvent.title || "");
      setDescription(existingEvent.description || "");
      setLocation(existingEvent.location || "");
      setStartDate(new Date(existingEvent.start));
      setEndDate(new Date(existingEvent.end));
      setColor(existingEvent.color || "#008080");
      setNotificationMinutes(String(existingEvent.notificationMinutes ?? 30));
      setSelectedParticipantKeys(
        (existingEvent.participants || []).map((participant) =>
          participantKey(participant),
        ),
      );
      return;
    }

    const defaultStart = new Date(initialDate);
    defaultStart.setSeconds(0, 0);
    if (defaultStart.getMinutes() > 0) {
      defaultStart.setHours(defaultStart.getHours() + 1, 0, 0, 0);
    } else {
      defaultStart.setMinutes(0, 0, 0);
    }

    const defaultEnd = new Date(defaultStart);
    defaultEnd.setHours(defaultStart.getHours() + 1);

    setTitle("");
    setDescription("");
    setLocation("");
    setStartDate(defaultStart);
    setEndDate(defaultEnd);
    setColor("#008080");
    setNotificationMinutes("30");
    setSelectedParticipantKeys([]);
    setPickerState(null);
  }, [visible, existingEvent, initialDate]);

  const optionMap = useMemo(() => {
    const map = new Map<string, ParticipantOption>();
    participantOptions.forEach((option) => {
      map.set(participantKey(option), option);
    });
    return map;
  }, [participantOptions]);

  const selectedParticipants = useMemo<Participant[]>(() => {
    return selectedParticipantKeys
      .map((key) => {
        const option = optionMap.get(key);
        if (!option) return null;

        return {
          id: option.id,
          type: option.type,
          name: option.name,
          avatar:
            option.avatarUrl || "https://picsum.photos/seed/calendar-user/120",
          userId: option.type === "friend" ? option.id : undefined,
          groupId: option.type === "group" ? option.id : undefined,
        };
      })
      .filter((item): item is Participant => !!item);
  }, [optionMap, selectedParticipantKeys]);

  const toggleParticipant = (option: ParticipantOption) => {
    const key = participantKey(option);
    setSelectedParticipantKeys((prev) =>
      prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key],
    );
  };

  const handleSave = async () => {
    if (endDate <= startDate) {
      Alert.alert("Invalid time", "End time must be after start time.");
      return;
    }

    setSubmitting(true);
    try {
      await onSave({
        id: existingEvent?.id,
        title: title.trim() || "Untitled event",
        description: description.trim(),
        location: location.trim(),
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        color,
        category: existingEvent?.category || "personal",
        recurrence: existingEvent?.recurrence || "none",
        notificationMinutes:
          Number.parseInt(notificationMinutes || "30", 10) || 30,
        isAllDay: existingEvent?.isAllDay ?? false,
        participants: selectedParticipants,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const updatePickerDate = (next: Date) => {
    if (!pickerState) return;
    const source = pickerState.target === "start" ? startDate : endDate;
    const merged = new Date(source);

    if (pickerState.mode === "date") {
      merged.setFullYear(next.getFullYear(), next.getMonth(), next.getDate());
    } else {
      merged.setHours(next.getHours(), next.getMinutes(), 0, 0);
    }

    if (pickerState.target === "start") {
      setStartDate(merged);
      if (merged >= endDate) {
        const nextEnd = new Date(merged);
        nextEnd.setHours(merged.getHours() + 1);
        setEndDate(nextEnd);
      }
    } else {
      setEndDate(merged);
    }
  };

  const openPicker = (target: PickerTarget, mode: PickerMode) => {
    setPickerState({ target, mode });
  };

  const closePicker = () => setPickerState(null);

  const renderDateTimeField = (
    label: string,
    target: PickerTarget,
    value: Date,
  ) => (
    <View className="mb-3 rounded-xl border border-gray-200 bg-gray-50 px-3 py-3">
      <Text className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
        {label}
      </Text>
      <View className="flex-row gap-2">
        <TouchableOpacity
          className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2"
          onPress={() => openPicker(target, "date")}
        >
          <Text className="text-sm font-medium text-gray-900">
            {formatDateLabel(value)}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="w-28 rounded-lg border border-gray-300 bg-white px-3 py-2"
          onPress={() => openPicker(target, "time")}
        >
          <Text className="text-sm font-medium text-gray-900 text-center">
            {formatTimeLabel(value)}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const handleDelete = () => {
    if (!existingEvent?.id || !onDelete) return;
    Alert.alert("Delete event", "This action cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await onDelete(existingEvent.id);
        },
      },
    ]);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/40 justify-end">
        <View className="max-h-[90%] rounded-t-3xl bg-white px-5 pt-4 pb-8">
          <View className="mb-4 h-1.5 w-12 self-center rounded-full bg-gray-300" />

          <View className="mb-4 flex-row items-center justify-between">
            <Text className="text-xl font-semibold text-gray-900">
              {existingEvent ? "Edit event" : "Create event"}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Text className="text-base font-medium text-gray-500">Close</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Text className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
              Title
            </Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="Untitled event"
              className="mb-4 rounded-xl border border-gray-300 px-4 py-3 text-base text-gray-900"
            />

            <Text className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
              Date time
            </Text>
            {renderDateTimeField("Start", "start", startDate)}
            {renderDateTimeField("End", "end", endDate)}

            <Text className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
              Location
            </Text>
            <TextInput
              value={location}
              onChangeText={setLocation}
              placeholder="Optional location"
              className="mb-4 rounded-xl border border-gray-300 px-4 py-3 text-base text-gray-900"
            />

            <Text className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
              Description
            </Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Optional description"
              multiline
              className="mb-4 min-h-[84px] rounded-xl border border-gray-300 px-4 py-3 text-base text-gray-900"
              textAlignVertical="top"
            />

            <Text className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
              Color
            </Text>
            <View className="mb-4 flex-row flex-wrap gap-2">
              {COLOR_OPTIONS.map((value) => {
                const active = color.toLowerCase() === value;
                return (
                  <TouchableOpacity
                    key={value}
                    onPress={() => setColor(value)}
                    className="h-8 w-8 items-center justify-center rounded-full border"
                    style={{
                      borderColor: active ? "#111827" : "#d1d5db",
                      backgroundColor: value,
                    }}
                  >
                    {active ? (
                      <View className="h-2 w-2 rounded-full bg-white" />
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
              Notification (minutes)
            </Text>
            <TextInput
              value={notificationMinutes}
              onChangeText={setNotificationMinutes}
              keyboardType="number-pad"
              className="mb-4 rounded-xl border border-gray-300 px-4 py-3 text-base text-gray-900"
            />

            <Text className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
              Participants
            </Text>
            {loadingParticipants ? (
              <View className="mb-6 items-center py-4">
                <ActivityIndicator color="#00B14F" />
              </View>
            ) : (
              <View className="mb-6 flex-row flex-wrap gap-2">
                {participantOptions.length === 0 ? (
                  <Text className="text-sm text-gray-500">
                    No participant options
                  </Text>
                ) : (
                  participantOptions.map((option) => {
                    const key = participantKey(option);
                    const active = selectedParticipantKeys.includes(key);
                    return (
                      <TouchableOpacity
                        key={key}
                        onPress={() => toggleParticipant(option)}
                        className={`rounded-full border px-3 py-2 ${
                          active
                            ? "border-teal-600 bg-teal-50"
                            : "border-gray-300 bg-white"
                        }`}
                      >
                        <Text
                          className={`${active ? "text-teal-700" : "text-gray-700"}`}
                        >
                          {option.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })
                )}
              </View>
            )}

            <TouchableOpacity
              onPress={() => {
                void handleSave();
              }}
              disabled={submitting}
              className="mb-3 rounded-xl bg-teal-600 px-4 py-3"
            >
              <Text className="text-center text-base font-semibold text-white">
                {submitting ? "Saving..." : "Save event"}
              </Text>
            </TouchableOpacity>

            {existingEvent?.id && onDelete ? (
              <TouchableOpacity
                onPress={handleDelete}
                disabled={submitting}
                className="rounded-xl border border-red-300 px-4 py-3"
              >
                <Text className="text-center text-base font-semibold text-red-600">
                  Delete event
                </Text>
              </TouchableOpacity>
            ) : null}
          </ScrollView>

          {pickerState ? (
            <DateTimePicker
              value={pickerState.target === "start" ? startDate : endDate}
              mode={pickerState.mode}
              is24Hour
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={(event, selectedDate) => {
                if (Platform.OS !== "ios") {
                  closePicker();
                }

                if (event.type === "dismissed" || !selectedDate) {
                  return;
                }

                updatePickerDate(selectedDate);
              }}
            />
          ) : null}
        </View>
      </View>
    </Modal>
  );
}
