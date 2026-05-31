import {
  DEFAULT_API_BASE_URL,
  DEFAULT_SOCKET_BASE_URL,
  getConnectionSettingsSnapshot,
  loadConnectionSettings,
  resetConnectionSettings,
  saveConnectionSettings,
  type TurnProvider,
} from "@/config/api";
import { Server, RotateCcw, Save, Wifi } from "lucide-react-native";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const PRIMARY = "#0d9488";
const TEXT = "#1e293b";
const MUTED = "#64748b";
const BORDER = "#e2e8f0";
const BG = "#f5f7fa";

const TURN_OPTIONS: Array<{
  value: TurnProvider;
  title: string;
  subtitle: string;
}> = [
  {
    value: "default",
    title: "Mặc định",
    subtitle: "Dùng cấu hình trong file .env",
  },
  {
    value: "metered",
    title: "Metered",
    subtitle: "Dùng TURN mặc định từ .env",
  },
  {
    value: "coturn",
    title: "Coturn local",
    subtitle: "Nhập IP máy đang chạy coturn",
  },
];

const isValidUrl = (value: string) => {
  if (!value.trim()) return true;

  try {
    const url = new URL(value.trim());
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

export default function MobileConfigScreen() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [apiUrl, setApiUrl] = useState("");
  const [socketUrl, setSocketUrl] = useState("");
  const [turnProvider, setTurnProvider] = useState<TurnProvider>("default");
  const [coturnHost, setCoturnHost] = useState("");

  useEffect(() => {
    void loadConnectionSettings()
      .then((settings) => {
        setApiUrl(settings.apiUrl || "");
        setSocketUrl(settings.socketUrl || "");
        setTurnProvider(settings.turnProvider || "default");
        setCoturnHost(settings.coturnHost || "");
      })
      .finally(() => setLoading(false));
  }, []);

  const effectiveApiUrl = useMemo(
    () => apiUrl.trim() || DEFAULT_API_BASE_URL,
    [apiUrl],
  );
  const effectiveSocketUrl = useMemo(
    () => socketUrl.trim() || DEFAULT_SOCKET_BASE_URL,
    [socketUrl],
  );

  const handleSave = async () => {
    if (!isValidUrl(apiUrl)) {
      Alert.alert("URL không hợp lệ", "API URL phải bắt đầu bằng http/https.");
      return;
    }

    if (!isValidUrl(socketUrl)) {
      Alert.alert(
        "URL không hợp lệ",
        "Socket URL phải bắt đầu bằng http/https.",
      );
      return;
    }

    if (turnProvider === "coturn" && !coturnHost.trim()) {
      Alert.alert("Thiếu IP coturn", "Nhập IP máy đang chạy coturn local.");
      return;
    }

    setSaving(true);
    try {
      await saveConnectionSettings({
        apiUrl,
        socketUrl,
        turnProvider,
        coturnHost: turnProvider === "coturn" ? coturnHost : undefined,
      });
      Alert.alert(
        "Đã lưu cấu hình",
        "Các kết nối mới sẽ dùng cấu hình vừa lưu. Nếu socket đang kết nối sẵn, hãy vào lại màn hình chat/call để reconnect.",
      );
    } catch {
      Alert.alert("lỗi", "Không thể lưu cấu hình. Vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    Alert.alert(
      "Dùng lại mặc định .env",
      "Xóa cấu hình mobile đã lưu và quay về file .env?",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: async () => {
            setSaving(true);
            try {
              await resetConnectionSettings();
              const settings = getConnectionSettingsSnapshot();
              setApiUrl(settings.apiUrl || "");
              setSocketUrl(settings.socketUrl || "");
              setTurnProvider(settings.turnProvider || "default");
              setCoturnHost(settings.coturnHost || "");
            } finally {
              setSaving(false);
            }
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={PRIMARY} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Server size={20} color={PRIMARY} />
            <Text style={styles.sectionTitle}>Link server</Text>
          </View>

          <Text style={styles.label}>API URL</Text>
          <TextInput
            value={apiUrl}
            onChangeText={setApiUrl}
            placeholder={DEFAULT_API_BASE_URL}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            style={styles.input}
          />

          <Text style={styles.label}>Socket URL</Text>
          <TextInput
            value={socketUrl}
            onChangeText={setSocketUrl}
            placeholder={DEFAULT_SOCKET_BASE_URL}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            style={styles.input}
          />

          <View style={styles.summaryBox}>
            <Text style={styles.summaryLabel}>Đang dùng</Text>
            <Text style={styles.summaryValue}>{effectiveApiUrl}</Text>
            <Text style={styles.summaryValue}>{effectiveSocketUrl}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Wifi size={20} color={PRIMARY} />
            <Text style={styles.sectionTitle}>TURN / ICE</Text>
          </View>

          {TURN_OPTIONS.map((option) => {
            const active = turnProvider === option.value;

            return (
              <TouchableOpacity
                key={option.value}
                activeOpacity={0.75}
                onPress={() => setTurnProvider(option.value)}
                style={[styles.option, active && styles.optionActive]}
              >
                <View style={[styles.radio, active && styles.radioActive]}>
                  {active ? <View style={styles.radioDot} /> : null}
                </View>
                <View style={styles.optionText}>
                  <Text style={styles.optionTitle}>{option.title}</Text>
                  <Text style={styles.optionSubtitle}>{option.subtitle}</Text>
                </View>
              </TouchableOpacity>
            );
          })}

          {turnProvider === "coturn" ? (
            <View style={styles.coturnBox}>
              <Text style={styles.label}>IP may chay coturn</Text>
              <TextInput
                value={coturnHost}
                onChangeText={setCoturnHost}
                placeholder="VD: 192.168.1.10"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="numbers-and-punctuation"
                style={styles.input}
              />
              <Text style={styles.helpText}>
                App se tao stun/turn tu IP nay voi port trong .env
                (mac dinh 3478).
              </Text>
            </View>
          ) : null}
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={handleReset}
            disabled={saving}
            style={[styles.button, styles.secondaryButton]}
          >
            <RotateCcw size={18} color={PRIMARY} />
            <Text style={styles.secondaryButtonText}>Mac dinh .env</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.75}
            onPress={handleSave}
            disabled={saving}
            style={[styles.button, styles.primaryButton, saving && styles.disabled]}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Save size={18} color="#fff" />
                <Text style={styles.primaryButtonText}>Lưu</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: BG,
  },
  screen: {
    flex: 1,
    backgroundColor: BG,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
    gap: 16,
  },
  section: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    color: TEXT,
    fontSize: 17,
    fontWeight: "700",
  },
  label: {
    color: TEXT,
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 10,
    paddingHorizontal: 12,
    color: TEXT,
    backgroundColor: "#f8fafc",
    marginBottom: 14,
  },
  summaryBox: {
    borderRadius: 10,
    backgroundColor: "#ecfeff",
    padding: 12,
    gap: 4,
  },
  summaryLabel: {
    color: PRIMARY,
    fontWeight: "700",
    fontSize: 13,
  },
  summaryValue: {
    color: MUTED,
    fontSize: 12,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  optionActive: {
    borderColor: PRIMARY,
    backgroundColor: "#f0fdfa",
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#cbd5e1",
    alignItems: "center",
    justifyContent: "center",
  },
  radioActive: {
    borderColor: PRIMARY,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: PRIMARY,
  },
  optionText: {
    flex: 1,
  },
  optionTitle: {
    color: TEXT,
    fontWeight: "700",
    fontSize: 15,
  },
  optionSubtitle: {
    color: MUTED,
    marginTop: 2,
    fontSize: 12,
  },
  coturnBox: {
    marginTop: 4,
  },
  helpText: {
    color: MUTED,
    fontSize: 12,
    lineHeight: 18,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
  },
  button: {
    minHeight: 48,
    borderRadius: 10,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  primaryButton: {
    backgroundColor: PRIMARY,
  },
  secondaryButton: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: PRIMARY,
  },
  primaryButtonText: {
    color: "#fff",
    fontWeight: "700",
  },
  secondaryButtonText: {
    color: PRIMARY,
    fontWeight: "700",
  },
  disabled: {
    opacity: 0.7,
  },
});
