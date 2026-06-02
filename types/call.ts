import type { MediaStream } from "@stream-io/react-native-webrtc";

export interface CallUser {
  id: string;
  name: string;
  avatar?: string;
}

export type CallType = "video" | "audio";

export type CallStatus =
  | "idle"
  | "calling"
  | "ringing"
  | "connected"
  | "ended"
  | "rejected"
  | "failed";

export interface CallState {
  callId: string | null;
  conversationId: string | null;
  callType: CallType;
  status: CallStatus;
  isInitiator: boolean;
  isCaller: boolean;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  otherUser: CallUser | null;
  error: string | null;
  startTime: number | null;
  incomingVideoUpgradeRequest?: boolean;
  isRequestingVideoUpgrade?: boolean;
  isRemoteVideoEnabled?: boolean;
  isRemoteAudioEnabled?: boolean;
}

export interface IncomingCallData {
  callId: string;
  callerId: string;
  conversationId: string;
  callType: CallType;
  callerName?: string;
  callerAvatar?: string;
}

export interface CallOfferData {
  callId: string;
  offer: RTCSessionDescriptionInit;
  callerId: string;
}

export interface CallAnswerData {
  callId: string;
  answer: RTCSessionDescriptionInit;
  receiverId: string;
}

export interface IceCandidateData {
  callId: string;
  candidate: RTCIceCandidateInit;
  fromUserId: string;
}

// Group Call Types
export type CallMode = "1-1" | "group";

export interface GroupCallParticipant extends CallUser {
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  isSpeaking?: boolean;
  isHost?: boolean;
  joinedAt?: number;
  stream?: MediaStream;
}

export interface GroupCallState {
  callId: string | null;
  conversationId: string | null;
  callType: CallType;
  callMode: CallMode;
  status: CallStatus;
  isInitiator: boolean;
  isCaller: boolean;
  isHost: boolean;
  localStream: MediaStream | null;
  participants: GroupCallParticipant[];
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  error: string | null;
  startTime: number | null;
  activeParticipantId?: string;
}

export interface GroupIncomingCallData extends IncomingCallData {
  participants?: Array<{ id: string; name: string; isHost: boolean, avatar?: string }>;
  participantIds?: string[];
  participantCount: number;
  isGroupCall: true;
  initiatorId?: string;
  initiatorName?: string;
  initiatorAvatar?: string;
}

export interface GroupCallOfferData extends CallOfferData {
  targetUserId: string;
}

export interface GroupCallAnswerData extends CallAnswerData {
  responderId: string;
  targetUserId: string;
}

export interface GroupCallIceCandidateData extends IceCandidateData {
  targetUserId: string;
}

export interface GroupParticipantJoinedData {
  callId: string;
  userId: string;
  userName?: string;
  userAvatar?: string;
  isHost?: boolean;
  participants?: Array<{ id: string; name?: string; avatar?: string }>;
}

export interface GroupParticipantLeftData {
  callId: string;
  userId: string;
}
