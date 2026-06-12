import { AttachmentAsset } from "@/types/chat";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { Alert } from "react-native";

async function requestCameraPermission(): Promise<boolean> {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== "granted") {
    Alert.alert(
      "Quyền truy cập bị từ chối",
      "Vui lòng cấp quyền truy cập camera trong Cài đặt để sử dụng tính năng này.",
    );
    return false;
  }
  return true;
}

async function requestMediaLibraryPermission(): Promise<boolean> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== "granted") {
    Alert.alert(
      "Quyền truy cập bị từ chối",
      "Vui lòng cấp quyền truy cập thư viện ảnh trong Cài đặt để sử dụng tính năng này.",
    );
    return false;
  }
  return true;
}

/**
 * Mở camera để chụp ảnh hoặc quay video.
 * Trả về AttachmentAsset hoặc null nếu người dùng hủy.
 */
export async function pickFromCamera(
  mediaTypes: "images" | "videos" | "all" = "all",
): Promise<AttachmentAsset[]> {
  const hasPermission = await requestCameraPermission();
  if (!hasPermission) return [];

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes:
      mediaTypes === "images"
        ? ImagePicker.MediaTypeOptions.Images
        : mediaTypes === "videos"
          ? ImagePicker.MediaTypeOptions.Videos
          : ImagePicker.MediaTypeOptions.All,
    allowsEditing: false,
    quality: 0.9,
    videoMaxDuration: 300,
  });

  if (result.canceled || result.assets.length === 0) return [];

  return [toAttachmentAsset(result.assets[0])];
  //   const asset = result.assets[0];
  //   return {
  //     uri: asset.uri,
  //     name: asset.fileName ?? `media_${Date.now()}`,
  //     mimeType:
  //       asset.mimeType ?? (asset.type === "video" ? "video/mp4" : "image/jpeg"),
  //     size: asset.fileSize,
  //     width: asset.width,
  //     height: asset.height,
  //     duration: asset.duration ?? undefined,
  //   };
}

/**
 * Mở thư viện ảnh/video để chọn.
 * Trả về AttachmentAsset hoặc null nếu người dùng hủy.
 */
export async function pickFromGallery(
  mediaTypes: "images" | "videos" | "all" = "all",
): Promise<AttachmentAsset[]> {
  const hasPermission = await requestMediaLibraryPermission();
  if (!hasPermission) return [];

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes:
      mediaTypes === "images"
        ? ImagePicker.MediaTypeOptions.Images
        : mediaTypes === "videos"
          ? ImagePicker.MediaTypeOptions.Videos
          : ImagePicker.MediaTypeOptions.All,
    allowsEditing: false,
    allowsMultipleSelection: true,
    selectionLimit: 10,
    quality: 0.9,
    videoMaxDuration: 300,
  });

  if (result.canceled || result.assets.length === 0) return [];

  return result.assets.map(toAttachmentAsset);
  //   const asset = result.assets[0];
  //   return {
  //     uri: asset.uri,
  //     name: asset.fileName ?? `media_${Date.now()}`,
  //     mimeType:
  //       asset.mimeType ?? (asset.type === "video" ? "video/mp4" : "image/jpeg"),
  //     size: asset.fileSize,
  //     width: asset.width,
  //     height: asset.height,
  //     duration: asset.duration ?? undefined,
  //   };
}

function toAttachmentAsset(
  asset: ImagePicker.ImagePickerAsset,
): AttachmentAsset {
  return {
    uri: asset.uri,
    name: asset.fileName ?? `media_${Date.now()}`,
    mimeType:
      asset.mimeType ?? (asset.type === "video" ? "video/mp4" : "image/jpeg"),
    size: asset.fileSize,
    width: asset.width,
    height: asset.height,
    duration: asset.duration ?? undefined,
  };
}

export async function pickDocument(): Promise<AttachmentAsset[]> {
  const result = await DocumentPicker.getDocumentAsync({
    type: "*/*",
    copyToCacheDirectory: true,
    multiple: false,
  });

  if (result.canceled || result.assets.length === 0) return [];

  return result.assets.map((asset) => ({
    uri: asset.uri,
    name: asset.name,
    mimeType: asset.mimeType ?? "application/octet-stream",
    size: asset.size,
  }));
  //   const asset = result.assets[0];
  //   return {
  //     uri: asset.uri,
  //     name: asset.name,
  //     mimeType: asset.mimeType ?? "application/octet-stream",
  //     size: asset.size,
  //   };
}
