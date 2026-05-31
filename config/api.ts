export {
  API_BASE_URL,
  API_BASE_URL as default,
  DEFAULT_API_BASE_URL,
  DEFAULT_SOCKET_BASE_URL,
  SOCKET_BASE_URL,
  applyConnectionSettings,
  getConnectionSettingsSnapshot,
  getSocketNamespaceUrl,
  loadConnectionSettings,
  resetConnectionSettings,
  saveConnectionSettings,
  type MobileConnectionSettings,
  type TurnProvider,
} from "./connectionSettings";

export const API_REQUEST_TIMEOUT_MS = 15000;

export async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit = {},
  timeoutMs = API_REQUEST_TIMEOUT_MS,
): Promise<Response> {
  if (init.signal) {
    return fetch(input, init);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(
        "Khong the ket noi toi server sau 15 giay. Kiem tra API URL va ket noi mang.",
      );
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}
