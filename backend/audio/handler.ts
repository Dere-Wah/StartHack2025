import { WebSocket } from "ws";
import { handleTranscript } from "../openai/assistant";

export async function handleAudioMessage(
  audioData: string,
  username: string,
  convUuid: string,
  websocket: AudioWebSocket
) {
  const payload = {
    username: username,
    data: audioData,
    id: convUuid,
  };
  fetch("http://localhost:8082/audio", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
    .then(async (response) => {
      const data = await response.json();
      if (data.transcription) {
        websocket.send(
          JSON.stringify({
            type: "transcript",
            transcript: data.transcription,
          })
        );
        await handleTranscript(
          data.transcription,
          username,
          convUuid,
          websocket,
          data.user_summary
        );
      }
    })
    .catch((error) => {
      console.error("Failed to send audio:", error);
      websocket.send(
        JSON.stringify({
          type: "error",
          error: "Failed to process audio",
        })
      );
    });
}

export interface AudioWebSocket extends WebSocket {
  isGreeted: boolean;
  type: "identify" | "audio";
}
