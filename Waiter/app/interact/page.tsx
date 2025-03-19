"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Mic, MicOff } from "lucide-react";
import { BACKEND_SERVER } from "../endpoints";

export default function InteractPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const username = searchParams.get("username");
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string>("");
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const silenceTimeout = useRef<NodeJS.Timeout | null>(null);
  const audioChunks = useRef<Blob[]>([]);

  useEffect(() => {
    if (!username) {
      router.push("/");
      return;
    }

    // Request microphone permission and setup
    setupAudioRecording();
  }, [username, router]);

  const setupAudioRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);

      mediaRecorder.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.current.push(event.data);
        }
      };

      mediaRecorder.current.onstop = async () => {
        const audioBlob = new Blob(audioChunks.current, { type: "audio/wav" });
        audioChunks.current = [];
        await sendAudioToServer(audioBlob);
      };

      // Setup audio analysis for silence detection
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyzer = audioContext.createAnalyser();
      analyzer.fftSize = 2048;
      source.connect(analyzer);

      const bufferLength = analyzer.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const checkSilence = () => {
        if (!isListening) return;

        analyzer.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / bufferLength;

        if (average < 10) {
          // Silence threshold
          if (!silenceTimeout.current) {
            silenceTimeout.current = setTimeout(() => {
              stopListening();
            }, 1500); // Stop after 1.5s of silence
          }
        } else {
          if (silenceTimeout.current) {
            clearTimeout(silenceTimeout.current);
            silenceTimeout.current = null;
          }
        }

        requestAnimationFrame(checkSilence);
      };

      setIsListening(true);
      mediaRecorder.current.start();
      checkSilence();
    } catch (err) {
      setError("Microphone access denied or not available");
      console.error("Error accessing microphone:", err);
    }
  };

  const stopListening = () => {
    if (mediaRecorder.current?.state === "recording") {
      mediaRecorder.current.stop();
      setIsListening(false);
      if (silenceTimeout.current) {
        clearTimeout(silenceTimeout.current);
        silenceTimeout.current = null;
      }
    }
  };

  const startListening = () => {
    audioChunks.current = [];
    setIsListening(true);
    if (mediaRecorder.current?.state === "inactive") {
      mediaRecorder.current.start();
    }
  };

  const sendAudioToServer = async (audioBlob: Blob) => {
    try {
      const formData = new FormData();
      formData.append("audio", audioBlob);
      formData.append("username", username || "");

      const response = await fetch(`${BACKEND_SERVER}/audio`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to send audio");
      }

      console.log("received"); // As requested in the prototype
    } catch (err) {
      console.error("Error sending audio:", err);
      setError("Failed to send audio to server");
    }
  };

  if (!username) {
    return null; // Router will handle redirect
  }

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900">
          Voice Chat Assistant
        </h1>
        <p className="text-gray-600">Welcome, {username}</p>

        {error && (
          <div className="bg-red-50 p-4 rounded-lg">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        <div className="relative">
          <button
            onClick={isListening ? stopListening : startListening}
            className={`w-20 h-20 rounded-full flex items-center justify-center transition-colors ${
              isListening
                ? "bg-red-500 hover:bg-red-600"
                : "bg-black hover:bg-gray-800"
            }`}
          >
            {isListening ? (
              <MicOff className="w-8 h-8 text-white" />
            ) : (
              <Mic className="w-8 h-8 text-white" />
            )}
          </button>
          {isListening && (
            <div className="absolute -bottom-8 w-full text-center">
              <p className="text-sm text-gray-500">Listening...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
