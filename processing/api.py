from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import base64
import io
import requests  # Changed to requests library

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
    username: str
    data: str  # Base64 encoded binary audio (.wav)

@app.post("/audio")
async def process_audio(request: AudioRequest):
    try:
        # Decode Base64 string to binary data
        audio_bytes = base64.b64decode(request.data)
        audio_file = io.BytesIO(audio_bytes)

        # Read WAV file using wavfile.read
        rate, data = wavfile.read(audio_file)

        # Process audio to reduce noise
        rate, reduced_noise = reduce_audio_noise_from_audiofile(rate, data, prop_decrease=0.8)

        # Transcribe the audio
        transcription = transcribe_audio(
            rate=rate,
            reduced_noise=reduced_noise,
            system_prompt="This is a generic prompt from a user trying to test."
        )

        # Send transcription to external API using requests
        api_response = requests.post(
            "https://waiter-api.derewah.dev/api/assistant",
            json={
                "username": request.username,
                "id": request.id,  # Use the provided id from the request
                "message": transcription,
                "user_summary": "The user usually orders pizza and coca cola. Also has an allergy for gluten."
            }
        )
        api_response.raise_for_status()  # Raise exception for HTTP errors

        # Return the JSON response from the external API
        return api_response.json()

    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error processing audio: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api:app", host="0.0.0.0", port=8082, reload=True)