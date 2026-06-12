import { confirmQrLogin } from "@/services/api/auth";
import { tokenUtils } from "@/utils/tokenUtils";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const PRIMARY = "#006275";

export default function QrLoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ token?: string; qrToken?: string }>();
  const qrToken = useMemo(
    () => String(params.token || params.qrToken || "").trim(),
    [params.qrToken, params.token],
  );
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    void tokenUtils.getToken().then((token) => {
      if (!active) return;
      setIsAuthenticated(!!token);
      setCheckingAuth(false);
    });

    return () => {
      active = false;
    };
  }, []);

  const handleConfirm = async () => {
    if (!qrToken) {
      Alert.alert("Invalid QR Code", "Please scan the QR code on the web again.");
      return;
    }

    setSubmitting(true);
    try {
      await confirmQrLogin(qrToken);
      Alert.alert(
        "Web Login Successful",
        "The web browser will automatically redirect to Orion Chat.",
        [
          {
            text: "OK",
            onPress: () => router.replace("/(tabs)"),
          },
        ],
      );
    } catch (error) {
      Alert.alert(
        "Unable to log in via QR",
        error instanceof Error ? error.message : "Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#fff",
        paddingTop: Math.max(insets.top, 20),
        paddingHorizontal: 24,
      }}
    >
      <TouchableOpacity
        onPress={() => router.back()}
        hitSlop={12}
        style={{ alignSelf: "flex-start", paddingVertical: 12 }}
      >
        <MaterialCommunityIcons name="arrow-left" size={26} color="#111827" />
      </TouchableOpacity>

      <View style={{ flex: 1, justifyContent: "center", paddingBottom: 80 }}>
        <View
          style={{
            width: 76,
            height: 76,
            borderRadius: 38,
            backgroundColor: "#e0f2f1",
            alignItems: "center",
            justifyContent: "center",
            alignSelf: "center",
            marginBottom: 22,
          }}
        >
          <MaterialCommunityIcons name="qrcode-scan" size={38} color={PRIMARY} />
        </View>

        <Text
          style={{
            color: "#111827",
            fontSize: 24,
            fontWeight: "800",
            textAlign: "center",
          }}
        >
          Log In to Web via QR
        </Text>
        <Text
          style={{
            color: "#6b7280",
            fontSize: 14,
            lineHeight: 21,
            textAlign: "center",
            marginTop: 10,
          }}
        >
          Confirm to log in to Orion Chat on the web browser using the account currently logged in on this phone.
        </Text>

        {checkingAuth ? (
          <View style={{ marginTop: 30 }}>
            <ActivityIndicator color={PRIMARY} />
          </View>
        ) : !isAuthenticated ? (
          <View
            style={{
              marginTop: 26,
              borderRadius: 10,
              backgroundColor: "#fef2f2",
              padding: 14,
            }}
          >
            <Text style={{ color: "#b91c1c", textAlign: "center" }}>
              You need to log in on the mobile app before confirming the QR code.
            </Text>
          </View>
        ) : !qrToken ? (
          <View
            style={{
              marginTop: 26,
              borderRadius: 10,
              backgroundColor: "#fffbeb",
              padding: 14,
            }}
          >
            <Text style={{ color: "#92400e", textAlign: "center" }}>
              Invalid QR code or token is missing.
            </Text>
          </View>
        ) : (
          <TouchableOpacity
            onPress={handleConfirm}
            disabled={submitting}
            activeOpacity={0.8}
            style={{
              marginTop: 30,
              minHeight: 48,
              borderRadius: 24,
              backgroundColor: PRIMARY,
              alignItems: "center",
              justifyContent: "center",
              opacity: submitting ? 0.7 : 1,
            }}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={{ color: "#fff", fontSize: 16, fontWeight: "800" }}>
                Confirm Login
              </Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
