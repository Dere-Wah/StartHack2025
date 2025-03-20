import io
import tempfile

import assemblyai as aai
import openai as openai
import os
from dotenv import load_dotenv

load_dotenv()

OPENAI_KEY = os.getenv('OPENAI_KEY')

def transcribe_audio_whisper(file_path: str):
    """
    Trascrive un file audio utilizzando l'API Whisper di OpenAI con la nuova interfaccia.

    Parameters:
        file_path (str): Il percorso al file audio (supportato da Whisper).
        language (str): La lingua del file audio (default "it").

    Returns:
        dict: Il risultato della trascrizione ottenuto dall'API Whisper.
    """
    openai.api_key = r''

    audio_file = open(file_path, "rb")
    transcription = openai.audio.transcriptions.create(
        model="whisper-1",
        file=audio_file,
        #response_format='verbose_json'
    )
    return transcription

def transcribe_audio_whisper_stream(audio_bytes: bytes, language: str = "it"):
    """
    Trascrive un audio utilizzando l'API Whisper di OpenAI con la nuova interfaccia,
    prendendo in input direttamente lo stream di byte dell'audio (.wav).

    Parameters:
        audio_bytes (bytes): Sequenza di byte che rappresenta il file audio (.wav).
        language (str): La lingua del file audio. Default "it".

    Returns:
        dict: Il risultato della trascrizione ottenuto dall'API Whisper.
    """
    openai.api_key = OPENAI_KEY

    with tempfile.NamedTemporaryFile(suffix=".wav") as tmp:
        tmp.write(audio_bytes)
        tmp.seek(0)
        # Passa una tupla (nome, file, content-type) per garantire la compatibilità con l'upload
        file_tuple = ("audio.wav", tmp, "audio/wav")
        transcription = openai.audio.transcriptions.create(
            model="whisper-1",
            file=file_tuple,
            language=language
            # response_format='verbose_json'
        )

    return transcription