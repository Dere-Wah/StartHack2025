"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Mic, MicOff } from "lucide-react";
import { BACKEND_SERVER } from "../endpoints";
import { useMicVAD } from "@ricky0123/vad-react";
import { KrispNoiseFilter } from "@livekit/krisp-noise-filter";
import { convertWebmToWavBase64 } from "../utils/audioUtils";
import { v4 as uuidv4 } from "uuid";
import type { Conversation } from "../types/conversation";

export default function InteractPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const username = searchParams.get("username");
  const [convUuid, setConvUuid] = useState(
    searchParams.get("uuid") || uuidv4()
  );
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (!username) {
      router.push("/");
      return;
    }

    // Request microphone access
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        streamRef.current = stream;
      })
      .catch((err) => {
        console.error("Error accessing microphone:", err);
      });

    // Clean up stream on unmount
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [username, router]);

  useEffect(() => {
    // Check for CONVERSATION_END in the latest assistant message
    const messages = conversation?.messages || [];
    const lastMessage = messages[messages.length - 1];

    if (
      lastMessage?.role === "assistant" &&
      lastMessage.content.includes("CONVERSATION_END")
    ) {
      // Stop all audio tracks
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
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

      fetch("http://localhost:8082/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          final_json: conversationJson,
        }),
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.json();
        })
        .then(() => {
          router.push("/finalize");
        })
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
              const payload = {
                id: convUuid,
                username: username,
                data: wavBase64,
              };
              fetch("http://localhost:8082/audio", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
              })
                .then(async (response) => {
                  if (!response.ok) {
                    throw new Error("Network response was not ok");
                  }
                  const data: Conversation = await response.json();
                  setConversation(data);
                  console.log("Audio sent. Duration:", duration, "ms");
                  setRecordedLength(duration);
                })
                .catch((error) => {
                  console.error("Failed to send audio:", error);
                  setRecordedLength(duration);
                });
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
  }, [vad.userSpeaking, isRecording, convUuid, username]);

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
