import { streamVideoApi } from "@/services/api/streamVideo";
import { useAuth } from "@/hooks/useAuth";
import { isStreamVideoEnabled } from "@/config/webrtcIce";
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

let StreamVideoComponent: React.ComponentType<{
  client: unknown;
  children?: React.ReactNode;
}> | null = null;
let StreamVideoClientCtor: any = null;

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const sdk = require("@stream-io/video-react-native-sdk");
  StreamVideoComponent = sdk.StreamVideo;
  StreamVideoClientCtor = sdk.StreamVideoClient;
} catch {
  StreamVideoComponent = null;
  StreamVideoClientCtor = null;
}

type StreamVideoRuntime = {
  sdkAvailable: boolean;
  clientReady: boolean;
  client: unknown | null;
  error: string | null;
};

const StreamVideoRuntimeContext = createContext<StreamVideoRuntime>({
  sdkAvailable: Boolean(StreamVideoComponent && StreamVideoClientCtor),
  clientReady: false,
  client: null,
  error: null,
});

export const useStreamVideoRuntime = () => useContext(StreamVideoRuntimeContext);

export const useOptionalStreamVideoClient = () => {
  return useContext(StreamVideoRuntimeContext).client;
};

export function StreamVideoProvider({ children }: { children: React.ReactNode }) {
  const { state } = useAuth();
  const enabled = isStreamVideoEnabled();
  const [client, setClient] = useState<unknown | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sdkAvailable =
    enabled && Boolean(StreamVideoComponent && StreamVideoClientCtor);
  const user = state.user;

  useEffect(() => {
    let cancelled = false;

    if (!sdkAvailable || !state.isAuthenticated || !user?.userId) {
      setClient(null);
      setError(null);
      return;
    }

    const setup = async () => {
      try {
        setError(null);
        const tokenResponse = await streamVideoApi.getToken({
          userId: user.userId,
          name: user.fullName || user.phoneNumber || "User",
          image: user.avatarUrl,
        });

        if (cancelled) {
          return;
        }

        const streamClient = StreamVideoClientCtor.getOrCreateInstance({
          apiKey: tokenResponse.apiKey,
          user: {
            id: tokenResponse.user.id,
            name: tokenResponse.user.name || user.fullName || "User",
            image: tokenResponse.user.image || user.avatarUrl,
          },
          tokenProvider: async () => {
            const fresh = await streamVideoApi.getToken({
              userId: user.userId,
              name: user.fullName || user.phoneNumber || "User",
              image: user.avatarUrl,
            });
            return fresh.token;
          },
        });

        setClient(streamClient);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Cannot initialize Stream video");
        setClient(null);
      }
    };

    void setup();

    return () => {
      cancelled = true;
    };
  }, [sdkAvailable, state.isAuthenticated, user?.userId, user?.fullName, user?.phoneNumber, user?.avatarUrl]);

  useEffect(() => {
    return () => {
      const disconnect = (client as { disconnectUser?: () => Promise<void> } | null)
        ?.disconnectUser;
      if (disconnect) {
        void disconnect.call(client);
      }
    };
  }, [client]);

  const runtime = useMemo(
    () => ({
      sdkAvailable,
      clientReady: Boolean(client),
      client,
      error,
    }),
    [client, error, sdkAvailable],
  );

  if (!sdkAvailable || !state.isAuthenticated || !user?.userId) {
    return (
      <StreamVideoRuntimeContext.Provider value={runtime}>
        {children}
      </StreamVideoRuntimeContext.Provider>
    );
  }

  const videoTree = StreamVideoComponent
    ? client
      ? React.createElement(StreamVideoComponent, { client }, children)
      : children
    : children;

  return (
    <StreamVideoRuntimeContext.Provider value={runtime}>
      {videoTree}
    </StreamVideoRuntimeContext.Provider>
  );
}
