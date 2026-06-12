import {
  DEFAULT_API_BASE_URL,
  DEFAULT_SOCKET_BASE_URL,
  getConnectionSettingsSnapshot,
  loadConnectionSettings,
  resetConnectionSettings,
  saveConnectionSettings,
  type TurnProvider,
} from "@/config/api";
import { useThemeColors } from "@/hooks/useThemeColors";
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

type ThemeColors = ReturnType<typeof useThemeColors>;

const TURN_OPTIONS: Array<{
  value: TurnProvider;
  title: string;
  subtitle: string;
}> = [
  {
    value: "default",
    title: "Default",
    subtitle: "Use configuration from .env file",
  },
  {
    value: "metered",
    title: "Metered",
    subtitle: "Use default TURN from .env",
  },
  {
    value: "coturn",
    title: "Local Coturn",
    subtitle: "Enter the IP of the machine running coturn",
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
  const colors = useThemeColors();
  const themedStyles = useMemo(() => createStyles(colors), [colors]);
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
      Alert.alert("Invalid URL", "API URL must start with http/https.");
      return;
    }

    if (!isValidUrl(socketUrl)) {
      Alert.alert(
        "Invalid URL",
        "Socket URL must start with http/https.",
      );
      return;
    }

    if (turnProvider === "coturn" && !coturnHost.trim()) {
      Alert.alert("Missing Coturn IP", "Enter the IP of the machine running local coturn.");
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
        "Configuration Saved",
        "New connections will use the saved configuration. If the socket is already connected, please re-enter the chat/call screen to reconnect.",
      );
    } catch {
      Alert.alert("Error", "Could not save configuration. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    Alert.alert(
      "Restore .env Default",
      "Delete saved mobile configuration and revert to the .env file?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
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
      <View style={themedStyles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={themedStyles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={themedStyles.screen}
        contentContainerStyle={themedStyles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={themedStyles.section}>
          <View style={themedStyles.sectionHeader}>
            <Server size={20} color={colors.primary} />
            <Text style={themedStyles.sectionTitle}>Server Links</Text>
          </View>

          <Text style={themedStyles.label}>API URL</Text>
          <TextInput
            value={apiUrl}
            onChangeText={setApiUrl}
            placeholder={DEFAULT_API_BASE_URL}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            style={themedStyles.input}
            placeholderTextColor={colors.textSecondary}
          />

          <Text style={themedStyles.label}>Socket URL</Text>
          <TextInput
            value={socketUrl}
            onChangeText={setSocketUrl}
            placeholder={DEFAULT_SOCKET_BASE_URL}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            style={themedStyles.input}
            placeholderTextColor={colors.textSecondary}
          />

          <View style={themedStyles.summaryBox}>
            <Text style={themedStyles.summaryLabel}>Active Configuration</Text>
            <Text style={themedStyles.summaryValue}>{effectiveApiUrl}</Text>
            <Text style={themedStyles.summaryValue}>{effectiveSocketUrl}</Text>
          </View>
        </View>

        <View style={themedStyles.section}>
          <View style={themedStyles.sectionHeader}>
            <Wifi size={20} color={colors.primary} />
            <Text style={themedStyles.sectionTitle}>TURN / ICE</Text>
          </View>

          {TURN_OPTIONS.map((option) => {
            const active = turnProvider === option.value;

            return (
              <TouchableOpacity
                key={option.value}
                activeOpacity={0.75}
                onPress={() => setTurnProvider(option.value)}
                style={[themedStyles.option, active && themedStyles.optionActive]}
              >
                <View style={[themedStyles.radio, active && themedStyles.radioActive]}>
                  {active ? <View style={themedStyles.radioDot} /> : null}
                </View>
                <View style={themedStyles.optionText}>
                  <Text style={themedStyles.optionTitle}>{option.title}</Text>
                  <Text style={themedStyles.optionSubtitle}>{option.subtitle}</Text>
                </View>
              </TouchableOpacity>
            );
          })}

          {turnProvider === "coturn" ? (
            <View style={themedStyles.coturnBox}>
              <Text style={themedStyles.label}>IP running coturn</Text>
              <TextInput
                value={coturnHost}
                onChangeText={setCoturnHost}
                placeholder="e.g. 192.168.1.10"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="numbers-and-punctuation"
                style={themedStyles.input}
                placeholderTextColor={colors.textSecondary}
              />
              <Text style={themedStyles.helpText}>
                App will generate STUN/TURN using this IP and the port from .env
                (default 3478).
              </Text>
            </View>
          ) : null}
        </View>

        <View style={themedStyles.actions}>
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={handleReset}
            disabled={saving}
            style={[themedStyles.button, themedStyles.secondaryButton]}
          >
            <RotateCcw size={18} color={colors.primary} />
            <Text style={themedStyles.secondaryButtonText}>Default .env</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.75}
            onPress={handleSave}
            disabled={saving}
            style={[themedStyles.button, themedStyles.primaryButton, saving && themedStyles.disabled]}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Save size={18} color="#fff" />
                <Text style={themedStyles.primaryButtonText}>Save</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  flex: {
    flex: 1,
  },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
    gap: 16,
  },
  section: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "700",
  },
  label: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    color: colors.text,
    backgroundColor: colors.backgroundSecondary,
    marginBottom: 14,
  },
  summaryBox: {
    borderRadius: 10,
    backgroundColor: colors.primaryLight,
    padding: 12,
    gap: 4,
  },
  summaryLabel: {
    color: colors.primary,
    fontWeight: "700",
    fontSize: 13,
  },
  summaryValue: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  optionActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  radioActive: {
    borderColor: colors.primary,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  optionText: {
    flex: 1,
  },
  optionTitle: {
    color: colors.text,
    fontWeight: "700",
    fontSize: 15,
  },
  optionSubtitle: {
    color: colors.textSecondary,
    marginTop: 2,
    fontSize: 12,
  },
  coturnBox: {
    marginTop: 4,
  },
  helpText: {
    color: colors.textSecondary,
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
    backgroundColor: colors.primary,
  },
  secondaryButton: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  primaryButtonText: {
    color: "#fff",
    fontWeight: "700",
  },
  secondaryButtonText: {
    color: colors.primary,
    fontWeight: "700",
  },
  disabled: {
    opacity: 0.7,
  },
});
