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
  const iceUrls =
    process.env.EXPO_PUBLIC_ICE_URLS || process.env.EXPO_PUBLIC_TURN_URLS;
  const iceUsername =
    process.env.EXPO_PUBLIC_ICE_USERNAME ||
    process.env.EXPO_PUBLIC_TURN_USERNAME;
  const iceCredential =
    process.env.EXPO_PUBLIC_ICE_CREDENTIAL ||
    process.env.EXPO_PUBLIC_TURN_CREDENTIAL;
  const forceRelay = process.env.EXPO_PUBLIC_FORCE_TURN_RELAY === "true";
  const allowPublicStun =
    process.env.EXPO_PUBLIC_ALLOW_PUBLIC_STUN !== "false";

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
