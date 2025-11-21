// apps/web/lib/socket.ts
import { io, Socket } from "socket.io-client";

declare global {
  var __SCRIBE_SOCKET__: Socket | undefined;
}

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4001";

function createSocket(): Socket {
  // Check if socket already exists
  if (globalThis.__SCRIBE_SOCKET__) {
    console.log("♻️ Reusing existing socket instance");
    return globalThis.__SCRIBE_SOCKET__;
  }

  console.log("🔧 Creating NEW socket with URL:", SOCKET_URL);
  
  const s = io(SOCKET_URL, {
    transports: ["websocket"],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    autoConnect: true,
  });

  s.on("connect", () => {
    console.log("✅ Socket connected with ID:", s.id);
    console.log("🔍 Socket instance reference:", s);
  });

  s.on("disconnect", (reason) => {
    console.log("❌ Socket disconnected. Reason:", reason);
    if (reason === "io server disconnect") {
      console.log("⚠️ Server disconnected us - likely a timeout or server-side issue");
    }
  });

  s.on("connect_error", (error) => {
    console.error("❌ Connection error:", error.message);
  });

  // Store in global
  globalThis.__SCRIBE_SOCKET__ = s;
  
  return s;
}

// Export singleton - this ensures only ONE socket instance exists
export const socket = createSocket();
