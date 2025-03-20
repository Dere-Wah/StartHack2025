"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Mic, MicOff } from "lucide-react";
import { BACKEND_SERVER, PYTHON_SERVER, WS_SERVER } from "../endpoints";
import { useMicVAD } from "@ricky0123/vad-react";
import { convertWebmToWavBase64 } from "../utils/audioUtils";
import { v4 as uuidv4 } from "uuid";
import type { Conversation } from "../types/conversation";

interface MessageDelta {
  type: string;
  delta: {
    text: string;
    messageId: string;
  };
}

interface TranscriptMessage {
  type: string;
  transcript: string;
}

export default function InteractPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const username = searchParams.get("username");
  const [convUuid, setConvUuid] = useState(
    searchParams.get("uuid") || uuidv4()
  );
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const currentMessageIdRef = useRef<string | null>(null);
  const lastDeltaTextRef = useRef<string>("");

  const vad = useMicVAD({
    onSpeechEnd: (audio: Float32Array) => {
      console.log("User stopped talking");
    },
  });

  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordedLength, setRecordedLength] = useState<number | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const pauseTimerRef = useRef<NodeJS.Timeout | null>(null);
  const recordingStartRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation?.messages]);

  // WebSocket connection setup
  useEffect(() => {
    if (!username) {
      router.push("/");
      return;
    }

    // Initialize WebSocket connection
    wsRef.current = new WebSocket(WS_SERVER + "/api/ws");

    wsRef.current.onopen = () => {
      console.log("WebSocket connected");
      // Send initial greeting message
      if (wsRef.current) {
        wsRef.current.send(
          JSON.stringify({
            greet_type: "greet_audio",
            uuid: convUuid,
            username: username,
          })
        );
      }
    };

    wsRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === "assistant_response") {
        const messageData = data as MessageDelta;
        setConversation((prev) => {
          if (!prev) {
            currentMessageIdRef.current = messageData.delta.messageId;
            lastDeltaTextRef.current = messageData.delta.text;
            return {
              id: convUuid,
              username: username,
              messages: [
                {
                  role: "assistant",
                  content: messageData.delta.text,
                  timestamp: new Date().toISOString(),
                },
              ],
            };
          }

          // If this is a new message (different messageId)
          if (currentMessageIdRef.current !== messageData.delta.messageId) {
            currentMessageIdRef.current = messageData.delta.messageId;
            lastDeltaTextRef.current = messageData.delta.text;
            return {
              ...prev,
              messages: [
                ...prev.messages,
                {
                  role: "assistant",
                  content: messageData.delta.text,
                  timestamp: new Date().toISOString(),
                },
              ],
            };
          }

          // Update the last message by appending the new text
          const updatedMessages = [...prev.messages];
          const lastMessage = updatedMessages[updatedMessages.length - 1];
          if (lastMessage && lastMessage.role === "assistant") {
            // Only append if this is new text
            if (messageData.delta.text !== lastDeltaTextRef.current) {
              lastMessage.content =
                lastMessage.content + messageData.delta.text;
              lastDeltaTextRef.current = messageData.delta.text;
            }
          }

          return {
            ...prev,
            messages: updatedMessages,
          };
        });
      } else if (data.type === "transcript") {
        const transcriptData = data as TranscriptMessage;
        setConversation((prev) => {
          if (!prev) {
            return {
              id: convUuid,
              username: username,
              messages: [
                {
                  role: "transcript",
                  content: transcriptData.transcript,
                  timestamp: new Date().toISOString(),
                },
              ],
            };
          }

          return {
            ...prev,
            messages: [
              ...prev.messages,
              {
                role: "transcript",
                content: transcriptData.transcript,
                timestamp: new Date().toISOString(),
              },
            ],
          };
        });
      }
    };

    wsRef.current.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    wsRef.current.onclose = () => {
      console.log("WebSocket connection closed");
    };

    // Request microphone access
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        streamRef.current = stream;
      })
      .catch((err) => {
        console.error("Error accessing microphone:", err);
      });

    // Cleanup function
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [username, router, convUuid]);

  useEffect(() => {
    // Check for CONVERSATION_END in the latest assistant message
    const messages = conversation?.messages || [];
    const lastMessage = messages[messages.length - 1];

    if (
      lastMessage?.role === "assistant" &&
      lastMessage.content &&
      lastMessage.content.includes("CONVERSATION_END")
    ) {
      // Stop all audio tracks and close WebSocket
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (wsRef.current) {
        wsRef.current.close();
      }

      // Send conversation for analysis
      const conversationJson = JSON.stringify({
        id: conversation?.id,
        username: conversation?.username,
        messages: conversation?.messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp,
        })),
      });
      router.push("/finalize");
      fetch(`${PYTHON_SERVER}/analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          final_json: conversationJson,
          username: username,
          id: convUuid,
        }),
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.json();
        })
        .then(() => {})
        .catch((error) => {
          console.error("Failed to send conversation for analysis:", error);
          router.push("/finalize"); // Still redirect even if analysis fails
        });
    }
  }, [conversation, router]);

  useEffect(() => {
    if (vad.userSpeaking) {
      // Clear any pause timer if it exists
      if (pauseTimerRef.current) {
        clearTimeout(pauseTimerRef.current);
        pauseTimerRef.current = null;
      }

      // Start recording if not already recording and stream is ready
      if (!isRecording && streamRef.current) {
        audioChunksRef.current = [];
        mediaRecorderRef.current = new MediaRecorder(streamRef.current);
        recordingStartRef.current = Date.now();

        mediaRecorderRef.current.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorderRef.current.onstop = async () => {
          if (recordingStartRef.current === null) return;
          const recordingEnd = Date.now();
          const duration = recordingEnd - recordingStartRef.current;

          // Only consider valid recordings longer than 0.1s
          if (duration > 100) {
            const webmBlob = new Blob(audioChunksRef.current, {
              type: "audio/webm",
            });
            try {
              // Convert the WebM blob to a WAV file as base64
              const wavBase64 = await convertWebmToWavBase64(webmBlob);

              // Send audio data through WebSocket
              if (
                wsRef.current &&
                wsRef.current.readyState === WebSocket.OPEN
              ) {
                wsRef.current.send(
                  JSON.stringify({
                    type: "audio",
                    data: wavBase64,
                    username: username,
                    id: convUuid,
                  })
                );
              }

              setRecordedLength(duration);
            } catch (error) {
              console.error("Error converting audio:", error);
            }
          } else {
            console.log("Recording too short, discarded");
          }
        };

        mediaRecorderRef.current.start();
        setIsRecording(true);
        console.log("Started recording");
      }
    } else {
      // User not speaking. Start a pause timer if recording is active.
      if (isRecording && !pauseTimerRef.current) {
        pauseTimerRef.current = setTimeout(() => {
          if (
            mediaRecorderRef.current &&
            mediaRecorderRef.current.state !== "inactive"
          ) {
            mediaRecorderRef.current.stop();
            console.log("Stopped recording due to pause");
          }
          setIsRecording(false);
          pauseTimerRef.current = null;
        }, 500); // Pause threshold set to 500ms
      }
    }
  }, [vad.userSpeaking, isRecording]);

  if (!username) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white flex flex-col items-center p-4">
      <div className="max-w-2xl w-full space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">
            Voice Chat Assistant
          </h1>
          <p className="text-gray-600">Welcome, {username}</p>
        </div>

        {/* Conversation Display */}
        <div className="bg-gray-50 rounded-lg p-4 h-[60vh] overflow-y-auto">
          <div className="space-y-4">
            {conversation?.messages
              .filter(
                (message) =>
                  message.role !== "system" &&
                  !(
                    message.role === "assistant" &&
                    message.content &&
                    message.content.includes("CONVERSATION_END")
                  )
              )
              .map((message, index) => (
                <div
                  key={index}
                  className={`flex ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-4 ${
                      message.role === "user"
                        ? "bg-black text-white"
                        : message.role === "transcript"
                        ? "bg-blue-100 text-gray-900"
                        : "bg-gray-200 text-gray-900"
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <p className="text-xs mt-1 opacity-70">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Recording Status */}
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-white p-4 rounded-full shadow-lg">
          <div className="flex items-center justify-center space-x-2">
            {vad.userSpeaking ? (
              <>
                <Mic className="text-green-500 animate-pulse" />
                <span className="text-green-500">Listening...</span>
              </>
            ) : (
              <>
                <MicOff className="text-gray-400" />
                <span className="text-gray-400">Waiting for speech...</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
