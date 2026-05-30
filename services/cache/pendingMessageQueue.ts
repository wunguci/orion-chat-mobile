import AsyncStorage from "@react-native-async-storage/async-storage";

const PENDING_MESSAGES_KEY = "chat:pending_text_messages";

export type PendingTextMessage = {
  clientMessageId: string;
  conversationId: string;
  userId: string;
  content: string;
  createdAt: string;
  retryCount: number;
  status: "pending" | "sending" | "failed";
};

/**
 * Đọc toàn bộ danh sách pending messages từ AsyncStorage.
 * Trả về mảng rỗng nếu chưa có dữ liệu hoặc dữ liệu bị lỗi (JSON malformed).
 */
async function getAllPendingMessages(): Promise<PendingTextMessage[]> {
  const raw = await AsyncStorage.getItem(PENDING_MESSAGES_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Ghi đè toàn bộ danh sách pending messages vào AsyncStorage.
 * Đây là nguồn dữ liệu duy nhất (single source of truth) cho pending messages.
 */
async function saveAllPendingMessages(messages: PendingTextMessage[]) {
  await AsyncStorage.setItem(PENDING_MESSAGES_KEY, JSON.stringify(messages));
}

/**
 * Thêm một tin nhắn mới vào hàng chờ.
 * Nếu tin nhắn đã tồn tại (trùng clientMessageId) -> cập nhật thay vì thêm mới.
 * Dùng khi user bấm "Gửi" -> tạo record local trước khi call API.
 *
 * @param message - Tin nhắn cần thêm hoặc cập nhật
 */
export async function enqueuePendingTextMessage(message: PendingTextMessage) {
  const current = await getAllPendingMessages();
  const exists = current.some(
    (item) => item.clientMessageId === message.clientMessageId,
  );

  if (exists) {
    await saveAllPendingMessages(
      current.map((item) =>
        item.clientMessageId === message.clientMessageId
          ? { ...item, ...message }
          : item,
      ),
    );
    return;
  }

  await saveAllPendingMessages([...current, message]);
}

/**
 * Lấy danh sách tin nhắn đang chờ gửi của một cuộc hội thoại cụ thể.
 * Dùng để hiển thị optimistic UI hoặc retry khi mở lại conversation.
 *
 * @param userId         - Chỉ lấy tin nhắn của user này
 * @param conversationId - Chỉ lấy tin nhắn trong conversation này
 * @returns Danh sách tin nhắn có status "pending" hoặc "failed"
 */
export async function getPendingTextMessagesByConversation(
  userId: string,
  conversationId: string,
): Promise<PendingTextMessage[]> {
  const current = await getAllPendingMessages();

  return current.filter(
    (item) => item.userId === userId && item.conversationId === conversationId,
    //&& item.status !== "sending"
  );
}

/**
 * Xóa một tin nhắn khỏi hàng chờ sau khi gửi thành công.
 * Gọi hàm này khi API trả về response thành công.
 *
 * @param clientMessageId - ID của tin nhắn cần xóa
 */
export async function removePendingTextMessage(clientMessageId: string) {
  const current = await getAllPendingMessages();
  await saveAllPendingMessages(
    current.filter((item) => item.clientMessageId !== clientMessageId),
  );
}

/**
 * Đánh dấu một tin nhắn là thất bại và tăng số lần retry.
 * Gọi hàm này khi API call bị lỗi (timeout, network error, server error...).
 * Tin nhắn sẽ ở lại hàng chờ với status "failed" để user có thể retry thủ công
 * hoặc app tự retry sau.
 *
 * @param clientMessageId - ID của tin nhắn cần đánh dấu thất bại
 */
export async function markPendingTextMessageFailed(clientMessageId: string) {
  const current = await getAllPendingMessages();

  await saveAllPendingMessages(
    current.map((item) =>
      item.clientMessageId === clientMessageId
        ? {
            ...item,
            status: "failed",
            retryCount: item.retryCount + 1,
          }
        : item,
    ),
  );
}
