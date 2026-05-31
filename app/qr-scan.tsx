import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  BarcodeScanningResult,
  CameraView,
  useCameraPermissions,
} from "expo-camera";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  Alert,
  Linking,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const PRIMARY = "#006275";

function extractQrLoginToken(rawValue: string) {
  const value = rawValue.trim();
  if (!value) return "";

  try {
    const url = new URL(value);
    const token = url.searchParams.get("token") || url.searchParams.get("qrToken");
    if (
      token &&
      (url.protocol === "orionchatmobile:" ||
        url.pathname.includes("qr-login") ||
        url.hostname.includes("qr-login"))
    ) {
      return token;
    }
  } catch {
    // Plain token fallback for development QR values.
  }

  return value.length >= 20 && !value.includes(" ") ? value : "";
}

export default function QrScanScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  const handleBarcodeScanned = useCallback(
    (result: BarcodeScanningResult) => {
      if (scanned) return;

      const token = extractQrLoginToken(result.data || "");
      if (!token) {
        setScanned(true);
        Alert.alert(
          "QR không hợp lệ",
          "Mã này không phải mã đăng nhập Orion Chat web.",
          [{ text: "Quét lại", onPress: () => setScanned(false) }],
        );
        return;
      }

      setScanned(true);
      router.replace({ pathname: "/qr-login", params: { token } });
    },
    [router, scanned],
  );

  const openSettings = () => {
    void Linking.openSettings();
  };

  if (!permission) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Text>Đang kiểm tra quyền camera...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#fff",
          paddingTop: Math.max(insets.top, 20),
          paddingHorizontal: 24,
          justifyContent: "center",
        }}
      >
        <MaterialCommunityIcons
          name="camera-outline"
          size={54}
          color={PRIMARY}
          style={{ alignSelf: "center", marginBottom: 18 }}
        />
        <Text
          style={{
            color: "#111827",
            fontSize: 22,
            fontWeight: "800",
            textAlign: "center",
          }}
        >
          Cần quyền camera
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
          Orion Chat cần camera để quét mã QR đăng nhập web.
        </Text>
        <TouchableOpacity
          onPress={permission.canAskAgain ? requestPermission : openSettings}
          activeOpacity={0.8}
          style={{
            marginTop: 26,
            minHeight: 48,
            borderRadius: 24,
            backgroundColor: PRIMARY,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ color: "#fff", fontSize: 16, fontWeight: "800" }}>
            {permission.canAskAgain ? "Cấp quyền camera" : "Mở cài đặt"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ marginTop: 16, alignItems: "center" }}
        >
          <Text style={{ color: "#6b7280", fontWeight: "700" }}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <CameraView
        style={{ flex: 1 }}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
      />

      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 0,
          bottom: 0,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <View
          style={{
            width: 250,
            height: 250,
            borderWidth: 3,
            borderColor: "#fff",
            borderRadius: 18,
            backgroundColor: "transparent",
          }}
        />
      </View>

      <View
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 0,
          paddingTop: Math.max(insets.top, Platform.OS === "ios" ? 44 : 20),
          paddingHorizontal: 16,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.75}
          style={{
            width: 42,
            height: 42,
            borderRadius: 21,
            backgroundColor: "rgba(0,0,0,0.45)",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <MaterialCommunityIcons name="arrow-left" size={25} color="#fff" />
        </TouchableOpacity>
        <Text style={{ color: "#fff", fontSize: 17, fontWeight: "800" }}>
          Quét QR đăng nhập
        </Text>
        <View style={{ width: 42 }} />
      </View>

      <View
        style={{
          position: "absolute",
          left: 24,
          right: 24,
          bottom: Math.max(insets.bottom + 26, 40),
          borderRadius: 16,
          backgroundColor: "rgba(0,0,0,0.55)",
          padding: 16,
        }}
      >
        <Text
          style={{
            color: "#fff",
            fontSize: 15,
            fontWeight: "800",
            textAlign: "center",
          }}
        >
          Đưa mã QR trên web vào khung
        </Text>
        <Text
          style={{
            color: "rgba(255,255,255,0.78)",
            fontSize: 13,
            lineHeight: 19,
            textAlign: "center",
            marginTop: 6,
          }}
        >
          Sau khi quét, bạn sẽ xác nhận để đăng nhập web bằng tài khoản mobile
          này.
        </Text>
      </View>
    </View>
  );
}
