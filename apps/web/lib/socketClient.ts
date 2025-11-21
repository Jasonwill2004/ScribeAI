// apps/web/lib/socketClient.ts
import { socket } from "@/lib/socket";

export interface SessionStartResponse {
  success: boolean;
  sessionId?: string;
  timestamp?: string;
  error?: string;
}

export interface AudioChunkResponse {
  success: boolean;
  chunkId?: string;
  chunkIndex?: number;
  sessionId?: string;
  error?: string;
}

export interface SessionResponse {
  success: boolean;
  sessionId?: string;
  error?: string;
}

export interface TranscriptEvent {
  sessionId: string;
  chunkIndex: number;
  text: string;
  timestamp: string;
}

export interface SessionStatusEvent {
  status: "recording" | "paused" | "processing" | "completed";
  sessionId: string;
  timestamp: string;
}

export function startSession(userId: string, title?: string) {
  return new Promise<SessionStartResponse>((resolve) => {
    socket.emit("start_session", { userId, title }, (res) => resolve(res));
  });
}

export function sendAudioChunk(
  sessionId: string,
  chunkIndex: number,
  audioData: ArrayBuffer
) {
  const base64 = arrayBufferToBase64(audioData);

  return new Promise<AudioChunkResponse>((resolve) => {
    socket.emit(
      "audio_chunk",
      { sessionId, chunkIndex, audioData: base64 },
      (res) => resolve(res)
    );
  });
}

export function pauseSession(sessionId: string) {
  return new Promise<SessionResponse>((resolve) => {
    socket.emit("pause", { sessionId }, (res) => resolve(res));
  });
}

export function resumeSession(sessionId: string) {
  return new Promise<SessionResponse>((resolve) => {
    socket.emit("resume", { sessionId }, (res) => resolve(res));
  });
}

export function endSession(sessionId: string) {
  return new Promise<SessionResponse>((resolve) => {
    socket.emit("end_session", { sessionId }, (res) => resolve(res));
  });
}

function arrayBufferToBase64(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
