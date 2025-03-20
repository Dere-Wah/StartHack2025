from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import base64
import io

from scipy.io import wavfile

from assemblyainew import transcribe_audio_whisper
from noisereducenew import reduce_audio_noise_from_audiofile, save_wav_file
from transcribe import transcribe_audio

app = FastAPI()
origins = ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AudioRequest(BaseModel):
    id: str
    data: str  # Base64 encoded binary audio (.wav)


@app.post("/audio")
async def process_audio(request: AudioRequest):
    try:
        # Decodifica la stringa Base64 in dati binari
        audio_bytes = base64.b64decode(request.data)
        audio_file = io.BytesIO(audio_bytes)

        # Legge il file WAV utilizzando wavfile.read
        rate, data = wavfile.read(audio_file)

        # Restituisce alcuni parametri dell'audio
        rate, reduced_noise = reduce_audio_noise_from_audiofile(rate, data, prop_decrease=0.8)

        transcription = transcribe_audio(
            rate=rate,
            reduced_noise=reduced_noise,
            system_prompt="This is a generic prompt from a user trying to test."
        )

        print(transcription)
        return transcription

    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Errore nell'elaborazione dell'audio: {e}")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("api:app", host="0.0.0.0", port=8082, reload=True)