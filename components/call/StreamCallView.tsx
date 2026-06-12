import {
  useOptionalStreamVideoClient,
  useStreamVideoRuntime,
} from "@/context/StreamVideoContext";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

let StreamCallComponent: React.ComponentType<{
  call: unknown;
  children: React.ReactNode;
}> | null = null;
let CallContentComponent: React.ComponentType<{
  layout?: string;
  onHangupCallHandler?: () => Promise<void> | void;
}> | null = null;
let IncomingCallComponent: React.ComponentType | null = null;
let OutgoingCallComponent: React.ComponentType | null = null;
let useSdkCallHook: (() => { isCreatedByMe?: boolean; endCall?: () => Promise<void> } | null) | null =
  null;
let useSdkCallStateHooks: (() => {
  useCallCallingState: () => string;
}) | null = null;
let CallingStateValue: { LEFT?: string; RINGING?: string; JOINING?: string; IDLE?: string } =
  {};

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const sdk = require("@stream-io/video-react-native-sdk");
  StreamCallComponent = sdk.StreamCall;
  CallContentComponent = sdk.CallContent;
  IncomingCallComponent = sdk.IncomingCall;
  OutgoingCallComponent = sdk.OutgoingCall;
  useSdkCallHook = sdk.useCall;
  useSdkCallStateHooks = sdk.useCallStateHooks;
  CallingStateValue = sdk.CallingState || {};
} catch {
  StreamCallComponent = null;
  CallContentComponent = null;
  IncomingCallComponent = null;
  OutgoingCallComponent = null;
  useSdkCallHook = null;
  useSdkCallStateHooks = null;
  CallingStateValue = {};
}

type StreamCallViewProps = {
  conversationId?: string | null;
  callLabel: string;
  mode: "direct" | "group";
  memberIds: string[];
  custom?: Record<string, unknown>;
  onLeave: () => void;
  onBack: () => void;
  fallback: React.ReactNode;
};

const normalizeMemberIds = (memberIds: string[]) => [
  ...new Set(memberIds.map((id) => String(id || "").trim()).filter(Boolean)),
];

function StreamCallBody({ onLeave, onBack }: { onLeave: () => void; onBack: () => void }) {
  const sdkCall = useSdkCallHook?.() || null;
  const stateHooks = useSdkCallStateHooks?.();
  const callingState = stateHooks?.useCallCallingState();
  const isCreatedByMe = Boolean(sdkCall?.isCreatedByMe);

  useEffect(() => {
    if (callingState === CallingStateValue.LEFT) {
      onBack();
    }
  }, [callingState, onBack]);

  if (
    callingState &&
    [CallingStateValue.RINGING, CallingStateValue.JOINING, CallingStateValue.IDLE].includes(
      callingState,
    )
  ) {
    const RingingComponent = isCreatedByMe ? OutgoingCallComponent : IncomingCallComponent;

    if (RingingComponent) {
      return (
        <SafeAreaView className="flex-1 bg-black">
          {React.createElement(RingingComponent)}
        </SafeAreaView>
      );
    }
  }

  if (!CallContentComponent) {
    return null;
  }

  return (
    <SafeAreaView className="flex-1 bg-black" edges={["bottom"]}>
      {React.createElement(CallContentComponent, {
        layout: "spotlight",
        onHangupCallHandler: async () => {
          await sdkCall?.endCall?.();
          onLeave();
        },
      })}
    </SafeAreaView>
  );
}

export default function StreamCallView({
  conversationId,
  callLabel,
  mode,
  memberIds,
  custom,
  onLeave,
  onBack,
  fallback,
}: StreamCallViewProps) {
  const runtime = useStreamVideoRuntime();
  const client = useOptionalStreamVideoClient() as
    | {
        call: (type: string, id: string) => {
          getOrCreate: (payload: Record<string, unknown>) => Promise<unknown>;
          join?: (payload?: Record<string, unknown>) => Promise<unknown>;
        };
      }
    | null;
  const [streamCall, setStreamCall] = useState<unknown | null>(null);
  const [error, setError] = useState<string | null>(null);

  const normalizedMemberIds = useMemo(() => normalizeMemberIds(memberIds), [memberIds]);
  const customJson = useMemo(() => JSON.stringify(custom || {}), [custom]);
  const streamCallId = conversationId ? `orion-${mode}-${conversationId}` : null;

  useEffect(() => {
    let cancelled = false;

    if (!runtime.sdkAvailable || !runtime.clientReady || !client || !streamCallId) {
      setStreamCall(null);
      return;
    }

    const setupCall = async () => {
      try {
        setError(null);
        const nextCall = client.call("default", streamCallId);
        await nextCall.getOrCreate({
          ring: true,
          data: {
            members: normalizedMemberIds.map((userId) => ({ user_id: userId })),
            custom: {
              source: "orion-chat",
              mode,
              ...(customJson ? JSON.parse(customJson) : {}),
            },
          },
        });

        if (!cancelled) {
          setStreamCall(nextCall);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Cannot start Stream call");
          setStreamCall(null);
        }
      }
    };

    void setupCall();

    return () => {
      cancelled = true;
    };
  }, [
    client,
    customJson,
    mode,
    normalizedMemberIds,
    runtime.clientReady,
    runtime.sdkAvailable,
    streamCallId,
  ]);

  if (!runtime.sdkAvailable || !runtime.clientReady || !StreamCallComponent) {
    return <>{fallback}</>;
  }

  if (error || runtime.error) {
    return (
      <SafeAreaView className="flex-1 bg-black">
        <View className="flex-1 items-center justify-center px-8">
          <Ionicons name="alert-circle-outline" size={44} color="#f87171" />
          <Text className="mt-4 text-center text-base text-white">
            {error || runtime.error}
          </Text>
          <TouchableOpacity
            onPress={onBack}
            className="mt-6 rounded-xl bg-emerald-500 px-5 py-3"
          >
            <Text className="font-semibold text-white">Go back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!streamCall) {
    return (
      <SafeAreaView className="flex-1 bg-black">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#34d399" />
          <Text className="mt-3 text-sm text-white/70">{callLabel}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <StreamCallComponent call={streamCall}>
      <StreamCallBody onLeave={onLeave} onBack={onBack} />
    </StreamCallComponent>
  );
}
