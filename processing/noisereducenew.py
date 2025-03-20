from scipy.io import wavfile

import noisereduce as nr
import numpy as np
import scipy.io.wavfile as wav


def reduce_audio_noise(file_path,
                       noise_start: float = 0.0,
                       noise_end: float = 0.5,
                       prop_decrease: float = 0.8,
                       use_adaptive: bool = True,
                       gain: float = 1.0):

    # Carica il file audio
    rate, data = wavfile.read(file_path)

    # Se stereo, prendiamo solo il primo canale
    if data.ndim > 1:
        data = data[:, 0]

    # Normalizza fra -1 ed 1 (assumendo un range originale di int16)
    data = data.astype(np.float32) / 32768.0

    # Stima del rumore
    if use_adaptive:
        noise_level = np.percentile(np.abs(data), 10)
        noise_indices = np.where(np.abs(data) <= noise_level)[0]
        if len(noise_indices) > 0:
            noise_sample = data[noise_indices]
        else:
            noise_sample = data[:int(rate * noise_end)]
    else:
        noise_sample = data[int(rate * noise_start): int(rate * noise_end)]

    # Riduzione del rumore
    reduced_noise = nr.reduce_noise(
        y=data,
        sr=rate,
        y_noise=noise_sample,
        prop_decrease=prop_decrease
    )

    # Applica il guadagno al segnale ridotto
    amplified = reduced_noise * gain
    # Clipping del segnale per evitare superare il range [-1, 1]
    amplified = np.clip(amplified, -1.0, 1.0)

    # Riporta il segnale in formato int16
    final_audio = (amplified * 32767).astype(np.int16)

    return rate, final_audio

def reduce_audio_noise_from_audiofile(rate, data,
                                      noise_start: float = 0.0,
                                      noise_end: float = 0.5,
                                      prop_decrease: float = 0.5,
                                      use_adaptive: bool = True,
                                      gain: float = 1.0):

    # Se stereo, prendiamo solo il primo canale
    if data.ndim > 1:
        data = data[:, 0]

    # Normalizza fra -1 ed 1 (assumendo un range originale di int16)
    data = data.astype(np.float32) / 32768.0

    # Stima del rumore
    if use_adaptive:
        noise_level = np.percentile(np.abs(data), 10)
        noise_indices = np.where(np.abs(data) <= noise_level)[0]
        if len(noise_indices) > 0:
            noise_sample = data[noise_indices]
        else:
            noise_sample = data[:int(rate * noise_end)]
    else:
        noise_sample = data[int(rate * noise_start): int(rate * noise_end)]

    # Riduzione del rumore
    reduced_noise = nr.reduce_noise(
        y=data,
        sr=rate,
        y_noise=noise_sample,
        prop_decrease=prop_decrease
    )

    # Applica il guadagno al segnale ridotto
    amplified = reduced_noise * gain
    # Clipping del segnale per evitare superare il range [-1, 1]
    amplified = np.clip(amplified, -1.0, 1.0)

    # Riporta il segnale in formato int16
    final_audio = (amplified * 32767).astype(np.int16)

    return rate, final_audio

def save_wav_file(rate, reduced_noise):
    wav.write("output.wav", rate, reduced_noise)
    print("Noise-reduced audio saved as 'output.wav'")
    return "output.wav"


