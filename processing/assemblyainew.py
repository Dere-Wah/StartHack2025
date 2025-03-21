import tempfile

import openai as openai
import os
from dotenv import load_dotenv
from openai import OpenAI

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


def is_pertinent(transcribe: str):
    openai.api_key = OPENAI_KEY

    systemprompt = """Respond to the following question only with "TRUE" or "FALSE".
        DO NOT RESPOND, FOR ANY REASON, WITH ANYTHING DIFFERENT.
        If you are not sure about the response just say FALSE"""

    response = openai.chat.completions.create(
        model="gpt-4",
        messages=[
            {"role": "system", "content": systemprompt},
            {"role": "user",
             "content": f'Is the following message be related to a normal conversation between a customer and a waiter?\n\nMessage:\n"{transcribe}"\n\nRESPOND ONLY WITH TRUE or FALSE'}
        ]
    )

    response_text = response.choices[0].message.content.strip().upper()
    return "TRUE" in response_text
