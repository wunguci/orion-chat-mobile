import AsyncStorage from "@react-native-async-storage/async-storage";

const key = (userId: string, name: string) => `chat:${userId}:${name}`;

export async function saveConversationsToCache(
  userId: string,
  conversations: unknown,
) {
  await AsyncStorage.setItem(
    key(userId, "conversations"),
    JSON.stringify(conversations),
  );
}

export async function getConversationsCache<T>(userId: string): Promise<T[]> {
  const raw = await AsyncStorage.getItem(key(userId, "conversations"));
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export async function saveMessages(
  userId: string,
  conversationId: string,
  messages: unknown,
) {
  await AsyncStorage.setItem(
    key(userId, `messages:${conversationId}`),
    JSON.stringify(messages),
  );
}

export async function getMessagesCache<T>(
  userId: string,
  conversationId: string,
): Promise<T[]> {
  const raw = await AsyncStorage.getItem(
    key(userId, `messages:${conversationId}`),
  );
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}
