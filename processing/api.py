import json
import sqlite3

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import base64
import io
import requests  # Changed to requests library

from scipy.io import wavfile

from assemblyainew import transcribe_audio_whisper, is_pertinent
from database import getSummary, initialize_database, get_latest_summaries, getRecap
from noisereducenew import reduce_audio_noise_from_audiofile, save_wav_file
from summary import generate_summary
from transcribe import transcribe_audio
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

origins = ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

initialize_database()

class AudioRequest(BaseModel):
    id: str
    username: str
    data: str  # Base64 encoded binary audio (.wav)


class AnalyzeConversation(BaseModel):
    final_json: str
    username: str
    id: str



@app.post("/analyze")
async def analyze_json(request: AnalyzeConversation):
    try:
        generate_summary(request.username, request.id, request.final_json)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error processing audio: {str(e)}")


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
            system_prompt=""
        )
        summaries = getRecap(request.username)
        print(summaries)
        result = {"transcription": transcription, "user_summary": summaries}

        if is_pertinent(transcription):
            return result
        else:
            print("Ignoring useless conversation")
            return {"transcription": None}


    except Exception as e:
        print(e)
        raise HTTPException(status_code=400, detail=f"Error processing audio: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api:app", host="0.0.0.0", port=8082, reload=True)





