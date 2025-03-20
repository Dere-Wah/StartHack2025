"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Mic, MicOff } from "lucide-react";
import { BACKEND_SERVER } from "../endpoints";
import { useMicVAD } from "@ricky0123/vad-react";
import { KrispNoiseFilter } from "@livekit/krisp-noise-filter";
import { convertWebmToWavBase64 } from "../utils/audioUtils";

export default function InteractPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const username = searchParams.get("username");
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
                id: Date.now().toString(),
                data: wavBase64,
              };
              fetch("http://localhost:8082/audio", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
              })
                .then((response) => {
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
  }, [vad.userSpeaking, isRecording]);

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900">
          Voice Chat Assistant
        </h1>
        <p className="text-gray-600">Welcome, {username}</p>
        <div className="flex items-center justify-center space-x-2">
          {vad.userSpeaking ? (
            <>
              <Mic className="text-green-500" />
              <span className="text-green-500">User is speaking.</span>
            </>
          ) : (
            <>
              <MicOff className="text-red-500" />
              <span className="text-red-500">User is silent.</span>
            </>
          )}
        </div>
        {recordedLength !== null && (
          <div className="mt-4">
            <p>Last sent audio duration: {recordedLength} ms</p>
          </div>
        )}
      </div>
    </div>
  );
}
