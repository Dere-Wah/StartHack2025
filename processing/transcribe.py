import io
import os
from dotenv import load_dotenv
import soundfile as sf
from openai import OpenAI

# Load environment variables
load_dotenv()
OPENAI_KEY = os.getenv('OPENAI_KEY')

def transcribe_audio(rate, reduced_noise, system_prompt):
    """
    Transcribe audio using OpenAI's Whisper API

    Args:
        rate (int): Sample rate of the audio
        reduced_noise (numpy.ndarray): Audio data as numpy array
        system_prompt (str): Optional prompt to guide the transcription

    Returns:
        str: Transcribed text
    """
    # Convert numpy array to in-memory WAV file
    audio_buffer = io.BytesIO()
    sf.write(audio_buffer, reduced_noise, rate, format='WAV')
    audio_buffer.seek(0)

    # Create OpenAI client
    client = OpenAI(api_key=OPENAI_KEY)
    # Transcribe with Whisper
    transcription = client.audio.transcriptions.create(
        model="whisper-1",
        file=("audio.wav", audio_buffer, "audio/wav"),
        prompt=system_prompt,
        language="en"
    )

    return transcription.text