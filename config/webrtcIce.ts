import { getIceRuntimeOptions } from "./connectionSettings";

const parseIceUrls = (value?: string) =>
  (value || "")
    .split(",")
    .map((url) => url.trim())
    .filter(
      (url) =>
        Boolean(url) &&
        (url.startsWith("stun:") ||
          url.startsWith("stuns:") ||
          url.startsWith("turn:") ||
          url.startsWith("turns:")),
    );

export const isStreamVideoEnabled = () =>
  process.env.EXPO_PUBLIC_ENABLE_STREAM_VIDEO === "true";

export const getIceConfiguration = (): RTCConfiguration => {
  const {
    iceUrls,
    iceUsername,
    iceCredential,
    forceRelay,
    allowPublicStun,
  } = getIceRuntimeOptions();

  const iceServers: RTCIceServer[] = [];
  const parsedIceUrls = parseIceUrls(iceUrls);

  if (parsedIceUrls.length > 0) {
    const hasTurn = parsedIceUrls.some(
      (url) => url.startsWith("turn:") || url.startsWith("turns:"),
    );

    iceServers.push({
      urls: parsedIceUrls,
      ...(hasTurn && iceUsername && iceCredential
        ? { username: iceUsername, credential: iceCredential }
        : {}),
    });
  } else if (allowPublicStun) {
    iceServers.push(
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
    );
  } else {
    console.warn(
      "[WebRTC] No ICE servers configured. Calls may only work on the same network.",
    );
  }

  return {
    iceServers,
    iceCandidatePoolSize: 8,
    iceTransportPolicy: forceRelay ? "relay" : "all",
  };
};
