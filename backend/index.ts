import express from "express";
import { WebSocketServer, WebSocket } from "ws";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import cors from "cors";
import type { Conversation } from "./types";
import { conversations } from "./openai/assistant";
import { handleAudioMessage, type AudioWebSocket } from "./audio/handler";

const app = express();
const port = 8081;

app.use(express.json());
app.use(cors());

// Create a WebSocket server with noServer option
const wss = new WebSocketServer({ noServer: true });

// Pool to store all connected WebSocket clients
const websocketPool: Set<AudioWebSocket> = new Set();

// Handle WebSocket connections
wss.on("connection", (ws: WebSocket, request: Request) => {
  console.log("Opening a websocket.");
  const audioWs = ws as AudioWebSocket;
  audioWs.isGreeted = false;

  // Handle messages
  audioWs.on("message", async (message: string) => {
    try {
      const data = JSON.parse(message);

      // Handle initial greeting
      if (!audioWs.isGreeted) {
        if (
          data.greet_type === "identify" ||
          data.greet_type === "greet_audio"
        ) {
          audioWs.isGreeted = true;
          audioWs.type = data.greet_type === "identify" ? "identify" : "audio";
          websocketPool.add(audioWs);
          console.log(`Websocket greeted with type: ${audioWs.type}`);
          audioWs.send(JSON.stringify({ type: "greeting_accepted" }));
          return;
        } else {
          console.log("Invalid greeting message");
          audioWs.close();
          return;
        }
      }

      // Handle messages based on websocket type
      if (audioWs.type === "audio" && data.type === "audio") {
        if (!data.username || !data.id) {
          audioWs.send(
            JSON.stringify({
              type: "error",
              error: "Missing username or conversation ID",
            })
          );
          return;
        }
        await handleAudioMessage(data.data, data.username, data.id, audioWs);
      } else if (audioWs.type === "identify") {
        console.log("Received message from identify websocket:", data);
      }
    } catch (error) {
      console.error("Error processing websocket message:", error);
      audioWs.send(
        JSON.stringify({
          type: "error",
          error: "Failed to process message",
        })
      );
    }
  });

  // Remove the WebSocket from the pool when it closes
  audioWs.on("close", () => {
    console.log("Closing a websocket.");
    websocketPool.delete(audioWs);
  });

  // Handle WebSocket errors
  audioWs.on("error", (error) => {
    console.error("WebSocket error:", error);
    websocketPool.delete(audioWs);
  });
});

// Predefined users for the prototype with clear text passwords
interface User {
  username: string;
  password: string;
}

const users: User[] = [
  { username: "Bobby", password: "password123" },
  { username: "Alice", password: "alicepwd" },
  { username: "Filippo", password: "fil03" },
];

// Define the schema for the login request payload
const loginSchema = z.object({
  username: z.string(),
  password: z.string(),
  id: z.string(),
});

// Login route to validate credentials and broadcast to all WebSocket clients
app.post("/api/login", (req, res) => {
  const parseResult = loginSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: parseResult.error.errors });
    return;
  }
  const { username, password, id } = parseResult.data;

  // Check for a matching user
  const user = users.find(
    (u) => u.username === username && u.password === password
  );
  if (user) {
    const payload = JSON.stringify({ username, id });
    // Broadcast the payload to all connected WebSocket clients
    for (const ws of websocketPool) {
      if (ws.readyState === WebSocket.OPEN && ws.type === "identify") {
        ws.send(payload);
      }
    }
    res.json({ success: true });
  } else {
    res.status(401).json({ success: false, message: "Invalid credentials" });
  }
});

// Default route
app.get("/", (req, res) => {
  res.send("Hello World!");
});

// Start the HTTP server
const server = app.listen(port, () => {
  console.log(`Listening on port ${port}...`);
});

// Upgrade HTTP server to handle WebSocket connections on /api/ws
server.on("upgrade", (request, socket, head) => {
  console.log("Upgrade request for:", request.url);
  if (request.url === "/api/ws") {
    wss.handleUpgrade(request, socket, head, (ws: WebSocket) => {
      wss.emit("connection", ws, request);
    });
  } else {
    socket.destroy();
  }
});
