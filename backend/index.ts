import express from "express";
import { WebSocketServer, WebSocket } from "ws";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import cors from "cors";
import type { Conversation, Conversations } from "./types";
import { generateAssistantResponse } from "./openai/assistant";

const app = express();
const port = 8081;

app.use(express.json());
app.use(cors());

// Create a WebSocket server with noServer option
const wss = new WebSocketServer({ noServer: true });

// Pool to store all connected WebSocket clients
const websocketPool: Set<WebSocket> = new Set();

// Store for conversations
const conversations: Conversations = {};

// Handle WebSocket connections
wss.on("connection", (ws: WebSocket, request: Request) => {
  console.log("Opening a websocket.");
  // Add the new WebSocket connection to the pool
  websocketPool.add(ws);

  // Remove the WebSocket from the pool when it closes
  ws.on("close", () => {
    console.log("Closing a websocket.");
    websocketPool.delete(ws);
  });

  // Ignore messages from the client
  ws.on("message", (message) => {
    console.log(message);
    // No processing needed per requirements
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

// Define the schema for the assistant request payload
const convoSchema = z.object({
  username: z.string(),
  id: z.string(),
  message: z.string(),
});

// Assistant route to handle conversation messages
app.post("/api/assistant", async (req, res) => {
  const parseResult = convoSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: parseResult.error.errors });
    return;
  }

  const { username, id, message } = parseResult.data;

  // Initialize conversation if it doesn't exist
  if (!conversations[id]) {
    conversations[id] = {
      id,
      username,
      messages: [],
    };
  }

  // Add user message to conversation
  conversations[id].messages.push({
    role: "user",
    content: message,
    timestamp: new Date().toISOString(),
  });

  try {
    // Generate assistant response
    const assistantResponse = await generateAssistantResponse(
      conversations[id]
    );

    // Add assistant response to conversation
    conversations[id].messages.push({
      role: "assistant",
      content: assistantResponse,
      timestamp: new Date().toISOString(),
    });

    // Return the full conversation
    res.json(conversations[id]);
  } catch (error) {
    console.error("Error in assistant endpoint:", error);
    res.status(500).json({ error: "Failed to process assistant response" });
  }
});

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
      if (ws.readyState === WebSocket.OPEN) {
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

// Upgrade HTTP server to handle WebSocket connections on /api/auth
server.on("upgrade", (request, socket, head) => {
  if (request.url === "/api/auth") {
    wss.handleUpgrade(request, socket, head, (ws: WebSocket) => {
      wss.emit("connection", ws, request);
    });
  } else {
    socket.destroy();
  }
});
