import { useThemeColors } from "@/hooks/useThemeColors";
import { FontAwesome5 } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const PANEL_WIDTH = SCREEN_WIDTH * 0.88;

//Interfaces
interface Participant {
  id: string;
  name: string;
  avatar: string;
  avatarBg: string;
  isMuted: boolean;
  isVideoOff: boolean;
  isSpeaking?: boolean;
  isHost?: boolean;
  status?: string;
}

interface ChatMessage {
  id: string;
  author: string;
  avatar: string;
  avatarBg: string;
  time: string;
  text: string;
  isSelf?: boolean;
}

// Data mẫu
const PARTICIPANTS: Participant[] = [
  {
    id: "1",
    name: "Phan Phước Hiệp",
    avatar: "PPH",
    avatarBg: "#0052cc",
    isMuted: false,
    isVideoOff: false,
    isHost: true,
    status: "Host",
  },
  {
    id: "2",
    name: "Giang",
    avatar: "G",
    avatarBg: "#8b5cf6",
    isMuted: false,
    isVideoOff: false,
    isSpeaking: true,
    status: "Speaking...",
  },
  {
    id: "3",
    name: "Michael Vũ",
    avatar: "MC",
    avatarBg: "#f59e0b",
    isMuted: true,
    isVideoOff: false,
    status: "Muted",
  },
  {
    id: "4",
    name: "You",
    avatar: "YO",
    avatarBg: "#10b981",
    isMuted: false,
    isVideoOff: false,
    status: "Active",
  },
];

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: "1",
    author: "Phan Phước Hiệp",
    avatar: "PPH",
    avatarBg: "#0052cc",
    time: "2:30 PM",
    text: "Hey everyone! Ready to start the meeting?",
  },
  {
    id: "2",
    author: "Giang",
    avatar: "G",
    avatarBg: "#8b5cf6",
    time: "2:31 PM",
    text: "Yes, let's go through the project updates first",
  },
  {
    id: "3",
    author: "Michael Vũ",
    avatar: "MC",
    avatarBg: "#f59e0b",
    time: "2:32 PM",
    text: "I'll share my screen to show the latest designs",
  },
];

const BG_IMAGE = {
  uri: "https://hoanghamobile.com/tin-tuc/wp-content/uploads/2024/07/anh-sieu-xe.jpg",
};

//Utils
function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
    .toString()
    .padStart(2, "0");
  const m = Math.floor((seconds % 3600) / 60)
    .toString()
    .padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${h}:${m}:${s}`;
}

function AvatarCircle({
  letters,
  bg,
  size = 36,
  textSize = 13,
  bordered,
}: {
  letters: string;
  bg: string;
  size?: number;
  textSize?: number;
  bordered?: boolean;
}) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: bg,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: bordered ? 2 : 0,
        borderColor: "rgba(255,255,255,0.6)",
      }}
    >
      <Text style={{ color: "#fff", fontWeight: "700", fontSize: textSize }}>
        {letters}
      </Text>
    </View>
  );
}

function PrimaryBtn({
  onPress,
  icon,
  label,
  danger,
  active,
  large,
}: {
  onPress: () => void;
  icon: string;
  label: string;
  danger?: boolean;
  active?: boolean;
  large?: boolean;
}) {
  const colors = useThemeColors();
  const size = large ? 64 : 52;
  const iconSize = large ? 22 : 18;
  let bg = "rgba(255,255,255,0.15)";
  if (active) bg = colors.orangePrimary;
  if (danger) bg = colors.error;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={{ alignItems: "center", gap: 6 }}
    >
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: bg,
          alignItems: "center",
          justifyContent: "center",
          borderWidth: active || danger ? 0 : 1.5,
          borderColor: "rgba(255,255,255,0.25)",
        }}
      >
        <FontAwesome5 name={icon} size={iconSize} color="#fff" />
      </View>
      <Text
        style={{
          color: "rgba(255,255,255,0.75)",
          fontSize: 10,
          fontWeight: "500",
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function SecondaryBtn({
  onPress,
  icon,
  label,
  active,
  badge,
}: {
  onPress: () => void;
  icon: string;
  label: string;
  active?: boolean;
  badge?: number;
}) {
  const colors = useThemeColors();
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={{ alignItems: "center", gap: 5, position: "relative" }}
    >
      <View
        style={{
          width: 42,
          height: 42,
          borderRadius: 12,
          backgroundColor: active
            ? "rgba(238,101,43,0.25)"
            : "rgba(255,255,255,0.1)",
          alignItems: "center",
          justifyContent: "center",
          borderWidth: 1,
          borderColor: active
            ? "rgba(238,101,43,0.55)"
            : "rgba(255,255,255,0.15)",
        }}
      >
        <FontAwesome5
          name={icon}
          size={15}
          color={active ? colors.orangePrimary : "rgba(255,255,255,0.85)"}
        />
        {badge !== undefined && (
          <View
            style={{
              position: "absolute",
              top: -4,
              right: -4,
              width: 16,
              height: 16,
              borderRadius: 8,
              backgroundColor: colors.success,
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1.5,
              borderColor: "#000",
            }}
          >
            <Text style={{ color: "#fff", fontSize: 8, fontWeight: "700" }}>
              {badge}
            </Text>
          </View>
        )}
      </View>
      <Text style={{ color: "rgba(255,255,255,0.55)", fontSize: 9 }}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export default function VideoCallScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();

  // State
  const [micEnabled, setMicEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [recording, setRecording] = useState(false);
  const [currentView, setCurrentView] = useState<"1-1" | "grid">("1-1");
  const [chatOpen, setChatOpen] = useState(false);
  const [participantsOpen, setParticipantsOpen] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [elapsed, setElapsed] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);

  // Refs
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const chatScrollRef = useRef<ScrollView>(null);

  const chatX = useSharedValue(PANEL_WIDTH);
  const participantsX = useSharedValue(PANEL_WIDTH);
  const overlayOpacity = useSharedValue(0);
  const recPulse = useSharedValue(1);
  const toastOpacity = useSharedValue(0);
  const controlsOpacity = useSharedValue(1);

  useEffect(() => {
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const resetHide = () => {
    setControlsVisible(true);
    controlsOpacity.value = withTiming(1, { duration: 200 });
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      if (!chatOpen && !participantsOpen) {
        controlsOpacity.value = withTiming(0, { duration: 400 });
        setControlsVisible(false);
      }
    }, 4000);
  };

  useEffect(() => {
    resetHide();
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [chatOpen, participantsOpen]);

  useEffect(() => {
    if (recording) {
      recPulse.value = withRepeat(
        withSequence(
          withTiming(0.3, { duration: 600 }),
          withTiming(1, { duration: 600 }),
        ),
        -1,
        false,
      );
    } else {
      recPulse.value = withTiming(1);
    }
  }, [recording]);

  const openPanel = (panel: "chat" | "participants") => {
    if (panel === "chat") {
      setChatOpen(true);
      setParticipantsOpen(false);
      chatX.value = withTiming(0, { duration: 300 });
      participantsX.value = withTiming(PANEL_WIDTH, { duration: 300 });
    } else {
      setParticipantsOpen(true);
      setChatOpen(false);
      participantsX.value = withTiming(0, { duration: 300 });
      chatX.value = withTiming(PANEL_WIDTH, { duration: 300 });
    }
    overlayOpacity.value = withTiming(0.6, { duration: 300 });
  };

  const closePanel = () => {
    chatX.value = withTiming(PANEL_WIDTH, { duration: 300 });
    participantsX.value = withTiming(PANEL_WIDTH, { duration: 300 });
    overlayOpacity.value = withTiming(0, { duration: 300 });
    setTimeout(() => {
      setChatOpen(false);
      setParticipantsOpen(false);
    }, 310);
  };

  const togglePanel = (panel: "chat" | "participants") => {
    const isOpen = panel === "chat" ? chatOpen : participantsOpen;
    if (isOpen) closePanel();
    else openPanel(panel);
  };

  const showToast = (msg: string) => {
    setToast(msg);
    toastOpacity.value = withTiming(1, { duration: 200 });
    setTimeout(() => {
      toastOpacity.value = withTiming(0, { duration: 300 });
      setTimeout(() => setToast(null), 310);
    }, 2500);
  };

  const sendMessage = () => {
    if (!chatInput.trim()) return;
    const msg: ChatMessage = {
      id: Date.now().toString(),
      author: "You",
      avatar: "YO",
      avatarBg: "#10b981",
      time: new Date().toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      }),
      text: chatInput.trim(),
      isSelf: true,
    };
    setMessages((prev) => [...prev, msg]);
    setChatInput("");
    setTimeout(
      () => chatScrollRef.current?.scrollToEnd({ animated: true }),
      100,
    );
  };

  const chatStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: chatX.value }],
  }));
  const participantsStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: participantsX.value }],
  }));
  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));
  const recDotStyle = useAnimatedStyle(() => ({ opacity: recPulse.value }));
  const toastStyle = useAnimatedStyle(() => ({ opacity: toastOpacity.value }));
  const ctrlStyle = useAnimatedStyle(() => ({
    opacity: controlsOpacity.value,
  }));

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />

      <TouchableOpacity
        activeOpacity={1}
        onPress={resetHide}
        style={{ flex: 1 }}
      >
        {currentView === "1-1" ? (
          <View style={{ flex: 1 }}>
            <Image
              source={BG_IMAGE}
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
              }}
              resizeMode="cover"
            />

            <View
              style={{
                position: "absolute",
                top: insets.top + 72,
                left: 16,
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
                backgroundColor: "rgba(0,0,0,0.65)",
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.12)",
              }}
            >
              <View style={{ position: "relative" }}>
                <AvatarCircle letters="SJ" bg={colors.graySecondary} size={34} />
                <View
                  style={{
                    position: "absolute",
                    bottom: 0,
                    right: -1,
                    width: 10,
                    height: 10,
                    borderRadius: 5,
                    backgroundColor: colors.success,
                    borderWidth: 1.5,
                    borderColor: "rgba(0,0,0,0.65)",
                  }}
                />
              </View>
              <View>
                <Text
                  style={{ color: "#fff", fontWeight: "700", fontSize: 13 }}
                >
                  PPH
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 4,
                    marginTop: 1,
                  }}
                >
                  <View
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: colors.success,
                    }}
                  />
                  <Text
                    style={{ color: "rgba(255,255,255,0.65)", fontSize: 11 }}
                  >
                    Đang nói...
                  </Text>
                </View>
              </View>
              <View style={{ flexDirection: "row", gap: 5, marginLeft: 4 }}>
                <View
                  style={{
                    backgroundColor: "rgba(34,197,94,0.2)",
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: "rgba(34,197,94,0.35)",
                  }}
                >
                  <FontAwesome5 name="microphone" size={10} color="#4ade80" />
                </View>
                <View
                  style={{
                    backgroundColor: "rgba(238,101,43,0.15)",
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: "rgba(238,101,43,0.35)",
                  }}
                >
                  <FontAwesome5 name="video" size={10} color={colors.orangePrimary} />
                </View>
              </View>
            </View>
            <View
              style={{
                position: "absolute",
                bottom: 160,
                right: 16,
                width: 110,
                height: 150,
                borderRadius: 18,
                overflow: "hidden",
                borderWidth: 2,
                borderColor: "rgba(255,255,255,0.35)",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.4,
                shadowRadius: 8,
                elevation: 8,
              }}
            >
              <Image
                source={BG_IMAGE}
                style={{ width: "100%", height: "100%" }}
                resizeMode="cover"
              />
              <View
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  paddingHorizontal: 8,
                  paddingVertical: 6,
                  backgroundColor: "rgba(0,0,0,0.6)",
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <View
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: colors.success,
                  }}
                />
                <Text style={{ color: "#fff", fontSize: 9, fontWeight: "600" }}>
                  Bạn (Host)
                </Text>
              </View>
            </View>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={{
              flexGrow: 1,
              paddingHorizontal: 12,
              paddingTop: insets.top + 68,
              paddingBottom: 155,
            }}
          >
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
              {PARTICIPANTS.map((p) => (
                <View
                  key={p.id}
                  style={{
                    width: (SCREEN_WIDTH - 34) / 2,
                    height: (SCREEN_HEIGHT - 180) / 2,
                    borderRadius: 18,
                    overflow: "hidden",
                    borderWidth: 2,
                    borderColor: p.isSpeaking
                      ? colors.success
                      : "rgba(255,255,255,0.12)",
                    shadowColor: p.isSpeaking ? colors.success : "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: p.isSpeaking ? 0.6 : 0.3,
                    shadowRadius: p.isSpeaking ? 8 : 4,
                    elevation: 4,
                  }}
                >
                  <Image
                    source={BG_IMAGE}
                    style={{ width: "100%", height: "100%" }}
                    resizeMode="cover"
                  />
                  {p.isHost && (
                    <View
                      style={{
                        position: "absolute",
                        top: 8,
                        right: 8,
                        backgroundColor: colors.orangePrimary,
                        paddingHorizontal: 6,
                        paddingVertical: 3,
                        borderRadius: 6,
                      }}
                    >
                      <Text
                        style={{
                          color: "#fff",
                          fontSize: 9,
                          fontWeight: "700",
                        }}
                      >
                        HOST
                      </Text>
                    </View>
                  )}
                  <View
                    style={{
                      position: "absolute",
                      bottom: 0,
                      left: 0,
                      right: 0,
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      paddingHorizontal: 10,
                      paddingVertical: 8,
                      backgroundColor: "rgba(0,0,0,0.7)",
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 7,
                        flex: 1,
                      }}
                    >
                      <AvatarCircle
                        letters={p.avatar}
                        bg={p.avatarBg}
                        size={24}
                        textSize={9}
                      />
                      <Text
                        style={{
                          color: "#fff",
                          fontSize: 11,
                          fontWeight: "600",
                        }}
                        numberOfLines={1}
                      >
                        {p.name}
                      </Text>
                    </View>
                    <View style={{ flexDirection: "row", gap: 5 }}>
                      <FontAwesome5
                        name={p.isMuted ? "microphone-slash" : "microphone"}
                        size={10}
                        color={p.isMuted ? colors.error : "rgba(255,255,255,0.7)"}
                      />
                      <FontAwesome5
                        name="video"
                        size={10}
                        color="rgba(255,255,255,0.7)"
                      />
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>
        )}
      </TouchableOpacity>

      {/* ── Top bar ── */}
      <Animated.View
        style={[
          {
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            paddingTop: insets.top + 10,
            paddingHorizontal: 16,
            paddingBottom: 12,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            backgroundColor: "rgba(0,0,0,0.45)",
          },
          ctrlStyle,
        ]}
        pointerEvents={controlsVisible ? "auto" : "none"}
      >
        <View style={{ flex: 1, gap: 4 }}>
          <Text
            style={{ color: "#fff", fontWeight: "700", fontSize: 14 }}
            numberOfLines={1}
          >
            Meeting with Phan Phước Hiệp
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 5 }}
            >
              <FontAwesome5
                name="clock"
                size={9}
                color="rgba(255,255,255,0.6)"
              />
              <Text
                style={{
                  color: "rgba(255,255,255,0.8)",
                  fontSize: 12,
                  fontWeight: "500",
                  fontVariant: ["tabular-nums"],
                }}
              >
                {formatDuration(elapsed)}
              </Text>
            </View>
            {recording && (
              <Animated.View
                style={[
                  {
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 5,
                    backgroundColor: "rgba(239,68,68,0.25)",
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                    borderRadius: 20,
                    borderWidth: 1,
                    borderColor: "rgba(239,68,68,0.5)",
                  },
                  recDotStyle,
                ]}
              >
                <View
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: colors.error,
                  }}
                />
                <Text
                  style={{ color: colors.error, fontSize: 10, fontWeight: "700" }}
                >
                  REC
                </Text>
              </Animated.View>
            )}
          </View>
        </View>

        <View
          style={{
            flexDirection: "row",
            backgroundColor: "rgba(255,255,255,0.1)",
            borderRadius: 12,
            padding: 3,
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.15)",
          }}
        >
          <TouchableOpacity
            onPress={() => setCurrentView("1-1")}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 9,
              backgroundColor:
                currentView === "1-1" ? colors.orangePrimary : "transparent",
              flexDirection: "row",
              alignItems: "center",
              gap: 5,
            }}
          >
            <FontAwesome5 name="user" size={10} color="#fff" />
            <Text style={{ color: "#fff", fontSize: 11, fontWeight: "600" }}>
              1-1
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setCurrentView("grid")}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 9,
              backgroundColor:
                currentView === "grid" ? colors.orangePrimary : "transparent",
              flexDirection: "row",
              alignItems: "center",
              gap: 5,
            }}
          >
            <FontAwesome5 name="th" size={10} color="#fff" />
            <Text style={{ color: "#fff", fontSize: 11, fontWeight: "600" }}>
              Grid
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      <Animated.View
        style={[
          {
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            paddingBottom: insets.bottom + 16,
            backgroundColor: "rgba(0,0,0,0.75)",
            borderTopWidth: 1,
            borderTopColor: "rgba(255,255,255,0.08)",
          },
          ctrlStyle,
        ]}
        pointerEvents={controlsVisible ? "auto" : "none"}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-around",
            alignItems: "center",
            paddingHorizontal: 24,
            paddingTop: 14,
            paddingBottom: 10,
            borderBottomWidth: 1,
            borderBottomColor: "rgba(255,255,255,0.08)",
          }}
        >
          <SecondaryBtn
            onPress={() => showToast("Screen sharing started")}
            icon="desktop"
            label="Share"
          />
          <SecondaryBtn
            onPress={() => {
              const next = !recording;
              setRecording(next);
              showToast(next ? "Recording started" : "Recording stopped");
            }}
            icon="circle"
            label={recording ? "Stop" : "Record"}
            active={recording}
          />
          <SecondaryBtn
            onPress={() => togglePanel("participants")}
            icon="users"
            label="People"
            active={participantsOpen}
            badge={PARTICIPANTS.length}
          />
          <SecondaryBtn
            onPress={() => togglePanel("chat")}
            icon="comment-alt"
            label="Chat"
            active={chatOpen}
          />
          <SecondaryBtn
            onPress={() => showToast("You raised your hand ✋")}
            icon="hand-paper"
            label="Raise Hand"
          />
        </View>

        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "flex-end",
            paddingHorizontal: 32,
            paddingTop: 14,
            gap: 28,
          }}
        >
          <PrimaryBtn
            onPress={() => setMicEnabled((v) => !v)}
            icon={micEnabled ? "microphone" : "microphone-slash"}
            label={micEnabled ? "Mute" : "Unmute"}
            danger={!micEnabled}
          />
          <PrimaryBtn
            onPress={() => router.back()}
            icon="phone-slash"
            label="End Call"
            danger
            large
          />
          <PrimaryBtn
            onPress={() => setVideoEnabled((v) => !v)}
            icon={videoEnabled ? "video" : "video-slash"}
            label={videoEnabled ? "Stop Video" : "Start Video"}
            danger={!videoEnabled}
          />
        </View>
      </Animated.View>

      <Animated.View
        style={[
          { position: "absolute", inset: 0, backgroundColor: "#000" },
          overlayStyle,
        ]}
        pointerEvents={chatOpen || participantsOpen ? "auto" : "none"}
      >
        <TouchableOpacity style={{ flex: 1 }} onPress={closePanel} />
      </Animated.View>

      <Animated.View
        style={[
          {
            position: "absolute",
            top: 0,
            bottom: 0,
            right: 0,
            width: PANEL_WIDTH,
            backgroundColor: "#0f172a",
            borderLeftWidth: 1,
            borderLeftColor: "rgba(255,255,255,0.1)",
            zIndex: 200,
          },
          chatStyle,
        ]}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View
            style={{
              paddingTop: insets.top + 14,
              paddingHorizontal: 20,
              paddingBottom: 14,
              borderBottomWidth: 1,
              borderBottomColor: "rgba(255,255,255,0.08)",
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
            }}
          >
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                backgroundColor: "rgba(238,101,43,0.12)",
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 1,
                borderColor: "rgba(238,101,43,0.35)",
              }}
            >
              <FontAwesome5 name="comment-alt" size={15} color={colors.orangePrimary} />
            </View>
            <Text
              style={{
                color: "#fff",
                fontSize: 16,
                fontWeight: "700",
                flex: 1,
              }}
            >
              Tin nhắn
            </Text>
            <TouchableOpacity
              onPress={closePanel}
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                backgroundColor: "rgba(255,255,255,0.07)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <FontAwesome5
                name="times"
                size={14}
                color="rgba(255,255,255,0.6)"
              />
            </TouchableOpacity>
          </View>

          {/* Messages */}
          <ScrollView
            ref={chatScrollRef}
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 16, gap: 14 }}
            onContentSizeChange={() =>
              chatScrollRef.current?.scrollToEnd({ animated: false })
            }
          >
            {messages.map((msg) => (
              <View
                key={msg.id}
                style={{
                  flexDirection: msg.isSelf ? "row-reverse" : "row",
                  gap: 10,
                  alignItems: "flex-end",
                }}
              >
                {!msg.isSelf && (
                  <AvatarCircle
                    letters={msg.avatar}
                    bg={msg.avatarBg}
                    size={34}
                    textSize={12}
                  />
                )}
                <View style={{ maxWidth: "75%", gap: 4 }}>
                  {!msg.isSelf && (
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 6,
                        paddingHorizontal: 4,
                      }}
                    >
                      <Text
                        style={{
                          color: "#fff",
                          fontSize: 12,
                          fontWeight: "600",
                        }}
                      >
                        {msg.author}
                      </Text>
                      <Text
                        style={{
                          color: "rgba(255,255,255,0.35)",
                          fontSize: 10,
                        }}
                      >
                        {msg.time}
                      </Text>
                    </View>
                  )}
                  <View
                    style={{
                      backgroundColor: msg.isSelf
                        ? colors.orangePrimary
                        : "rgba(255,255,255,0.08)",
                      borderRadius: 16,
                      borderBottomRightRadius: msg.isSelf ? 4 : 16,
                      borderBottomLeftRadius: msg.isSelf ? 16 : 4,
                      paddingHorizontal: 14,
                      paddingVertical: 10,
                      borderWidth: msg.isSelf ? 0 : 1,
                      borderColor: "rgba(255,255,255,0.08)",
                    }}
                  >
                    <Text
                      style={{ color: "#fff", fontSize: 13, lineHeight: 19 }}
                    >
                      {msg.text}
                    </Text>
                  </View>
                  {msg.isSelf && (
                    <Text
                      style={{
                        color: "rgba(255,255,255,0.35)",
                        fontSize: 10,
                        textAlign: "right",
                        paddingRight: 4,
                      }}
                    >
                      {msg.time}
                    </Text>
                  )}
                </View>
              </View>
            ))}
          </ScrollView>

          {/* Input */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "flex-end",
              gap: 10,
              padding: 14,
              borderTopWidth: 1,
              borderTopColor: "rgba(255,255,255,0.08)",
              backgroundColor: "rgba(255,255,255,0.03)",
            }}
          >
            <TextInput
              value={chatInput}
              onChangeText={setChatInput}
              placeholder="Nhập tin nhắn..."
              placeholderTextColor="rgba(255,255,255,0.3)"
              multiline
              style={{
                flex: 1,
                backgroundColor: "rgba(255,255,255,0.07)",
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.12)",
                borderRadius: 14,
                paddingHorizontal: 14,
                paddingVertical: 10,
                color: "#fff",
                fontSize: 13,
                maxHeight: 100,
              }}
              onSubmitEditing={sendMessage}
              blurOnSubmit={false}
            />
            <TouchableOpacity
              onPress={sendMessage}
              style={{
                width: 44,
                height: 44,
                borderRadius: 13,
                backgroundColor: chatInput.trim()
                  ? colors.orangePrimary
                  : "rgba(255,255,255,0.1)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <FontAwesome5
                name="paper-plane"
                size={15}
                color={chatInput.trim() ? "#fff" : colors.graySecondary}
              />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Animated.View>

      {/* ── Participants panel ── */}
      <Animated.View
        style={[
          {
            position: "absolute",
            top: 0,
            bottom: 0,
            right: 0,
            width: PANEL_WIDTH,
            backgroundColor: "#0f172a",
            borderLeftWidth: 1,
            borderLeftColor: "rgba(255,255,255,0.1)",
            zIndex: 200,
          },
          participantsStyle,
        ]}
      >
        {/* Header */}
        <View
          style={{
            paddingTop: insets.top + 14,
            paddingHorizontal: 20,
            paddingBottom: 14,
            borderBottomWidth: 1,
            borderBottomColor: "rgba(255,255,255,0.08)",
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
          }}
        >
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              backgroundColor: "rgba(238,101,43,0.12)",
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1,
              borderColor: "rgba(238,101,43,0.35)",
            }}
          >
            <FontAwesome5 name="users" size={14} color={colors.orangePrimary} />
          </View>
          <Text
            style={{ color: "#fff", fontSize: 16, fontWeight: "700", flex: 1 }}
          >
            Thành viên ({PARTICIPANTS.length})
          </Text>
          <TouchableOpacity
            onPress={closePanel}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              backgroundColor: "rgba(255,255,255,0.07)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <FontAwesome5
              name="times"
              size={14}
              color="rgba(255,255,255,0.6)"
            />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={{ padding: 16, gap: 10 }}>
          {PARTICIPANTS.map((p) => (
            <View
              key={p.id}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                padding: 14,
                backgroundColor: "rgba(255,255,255,0.04)",
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.07)",
                borderRadius: 16,
              }}
            >
              <View style={{ position: "relative" }}>
                <AvatarCircle
                  letters={p.avatar}
                  bg={p.avatarBg}
                  size={42}
                  textSize={14}
                />
                {p.isSpeaking && (
                  <View
                    style={{
                      position: "absolute",
                      bottom: -1,
                      right: -1,
                      width: 12,
                      height: 12,
                      borderRadius: 6,
                      backgroundColor: colors.success,
                      borderWidth: 2,
                      borderColor: "#0f172a",
                    }}
                  />
                )}
              </View>
              <View style={{ flex: 1 }}>
                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
                >
                  <Text
                    style={{ color: "#fff", fontSize: 13, fontWeight: "700" }}
                  >
                    {p.name}
                  </Text>
                  {p.isHost && (
                    <View
                      style={{
                        backgroundColor: colors.orangePrimary,
                        paddingHorizontal: 6,
                        paddingVertical: 2,
                        borderRadius: 6,
                      }}
                    >
                      <Text
                        style={{
                          color: "#fff",
                          fontSize: 9,
                          fontWeight: "700",
                        }}
                      >
                        HOST
                      </Text>
                    </View>
                  )}
                </View>
                <Text
                  style={{
                    color: "rgba(255,255,255,0.45)",
                    fontSize: 11,
                    marginTop: 2,
                  }}
                >
                  {p.status}
                </Text>
              </View>
              <View style={{ flexDirection: "row", gap: 6 }}>
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 9,
                    backgroundColor: p.isMuted
                      ? "rgba(239,68,68,0.15)"
                      : "rgba(255,255,255,0.07)",
                    alignItems: "center",
                    justifyContent: "center",
                    borderWidth: 1,
                    borderColor: p.isMuted
                      ? "rgba(239,68,68,0.3)"
                      : "rgba(255,255,255,0.1)",
                  }}
                >
                  <FontAwesome5
                    name={p.isMuted ? "microphone-slash" : "microphone"}
                    size={12}
                    color={p.isMuted ? colors.error : "rgba(255,255,255,0.6)"}
                  />
                </View>
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 9,
                    backgroundColor: "rgba(255,255,255,0.07)",
                    alignItems: "center",
                    justifyContent: "center",
                    borderWidth: 1,
                    borderColor: "rgba(255,255,255,0.1)",
                  }}
                >
                  <FontAwesome5
                    name="video"
                    size={12}
                    color="rgba(255,255,255,0.6)"
                  />
                </View>
              </View>
            </View>
          ))}
        </ScrollView>
      </Animated.View>

      {/* ── Toast notification ── */}
      {toast && (
        <Animated.View
          style={[
            {
              position: "absolute",
              bottom: insets.bottom + 150,
              alignSelf: "center",
              paddingHorizontal: 18,
              paddingVertical: 11,
              backgroundColor: "rgba(15,23,42,0.95)",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.12)",
              borderRadius: 24,
              zIndex: 300,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 8,
            },
            toastStyle,
          ]}
        >
          <Text style={{ color: "#fff", fontSize: 13, fontWeight: "500" }}>
            {toast}
          </Text>
        </Animated.View>
      )}
    </View>
  );
}
