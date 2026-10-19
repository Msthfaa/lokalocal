import os
import subprocess
import wave
import lameenc

MODEL_PATH = "scratch/piper_model/id/id_ID/news_tts/medium/id_ID-news_tts-medium.onnx"
OUTPUT_DIR = "web/public/assets/audio/tur"

os.makedirs(OUTPUT_DIR, exist_ok=True)
os.makedirs("scratch/tur_audio_temp", exist_ok=True)

ZONA_TEXTS = [
    {
        "id": "tur-1-sumatera",
        "pulau": "Sumatera",
        "naskah": "Selamat datang di Pulau Sumatera, Gerbang Barat Nusantara. Wilayah ini menyimpan seratus sembilan belas catatan kebudayaan di Sumatera Barat, termasuk seni teater tutur Randai Minangkabau, seni bela diri Silek Harimau Lalok, dan cagar budaya Balai Kaliki."
    },
    {
        "id": "tur-2-jawa",
        "pulau": "Jawa",
        "naskah": "Kita melayang ke Pulau Jawa, episentrum kesenian dan ragam motif adiluhung. Mari saksikan keunikan seni Bantengan Pasuruan, pertunjukan Wayang Kulit Gagrak Porongan, hingga mahakarya Batik Garutan yang penuh filosofi."
    },
    {
        "id": "tur-3-bali-nusa",
        "pulau": "Bali & Nusa Tenggara",
        "naskah": "Kini kita singgah di Kepulauan Bali dan Nusa Tenggara, beranda dewata nan kaya tradisi. Dari kemegahan patung Ogoh-Ogoh, tradisi bunyi Okokan Tabanan, lantunan tembang Gending Ratu Anom, hingga keunikan alat musik Knobe di Nusa Tenggara Timur."
    },
    {
        "id": "tur-4-kalimantan",
        "pulau": "Kalimantan",
        "naskah": "Terbang melintasi rimbunnya Pulau Kalimantan, jantung Borneo pusaka Dayak. Simak kemegahan Rumah Panjang Nanga Siyai, ritus sakral topeng Hudoq Dayak Bahau, petikan Jatung Utang, serta alat tiup Keringut Dayak Punan."
    },
    {
        "id": "tur-5-sulawesi",
        "pulau": "Sulawesi",
        "naskah": "Kita tiba di Pulau Sulawesi, benteng arsitektur adat dan jejak aksara kuno. Menghadirkan aksara Lontaraq Bugis-Makassar, arsitektur bersahaja Balla To Kajang, istana Raja Kulawi, serta busana serat kayu Lembah Bada."
    },
    {
        "id": "tur-6-maluku-papua",
        "pulau": "Maluku & Papua",
        "naskah": "Pemberhentian terakhir di Kepulauan Maluku dan Tanah Papua, bumi cenderawasih kaya rempah. Menampilkan balai musyawarah Sasadu Halmahera, tarian Togal, tabuhan perkusi Kelambut, hingga gerak tari adat Limne suku Ketengban di Papua Pegunungan."
    }
]

print("=== Menghasilkan 6 Narasi Audio Tur Sinematik dengan Piper TTS ===")

total_bytes = 0

for item in ZONA_TEXTS:
    fid = item["id"]
    pulau = item["pulau"]
    text = item["naskah"]
    wav_path = f"scratch/tur_audio_temp/{fid}.wav"
    mp3_path = f"{OUTPUT_DIR}/{fid}.mp3"
    
    print(f"\n[+] Memproses zona: {pulau} ({fid})...")
    
    # 1. Jalankan Piper TTS untuk menghasilkan WAV
    # --length-scale 1.05 untuk tempo tutur santai dan anggun
    cmd = [
        "piper",
        "-m", MODEL_PATH,
        "-f", wav_path,
        "--length-scale", "1.06",
        "--sentence-silence", "0.35"
    ]
    proc = subprocess.run(cmd, input=text.encode("utf-8"), stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    if proc.returncode != 0:
        print(f"Error Piper: {proc.stderr.decode('utf-8')}")
        continue

    # 2. Baca WAV dan encode ke MP3 berkualitas 96kbps via lameenc
    with wave.open(wav_path, "rb") as wf:
        n_channels = wf.getnchannels()
        s_rate = wf.getframerate()
        pcm = wf.readframes(wf.getnframes())

    encoder = lameenc.Encoder()
    encoder.set_bit_rate(96)
    encoder.set_in_sample_rate(s_rate)
    encoder.set_channels(n_channels)
    encoder.set_quality(2)

    mp3_bytes = encoder.encode(pcm) + encoder.flush()

    with open(mp3_path, "wb") as f_out:
        f_out.write(mp3_bytes)

    sz_kb = len(mp3_bytes) / 1024
    total_bytes += len(mp3_bytes)
    print(f"    Berhasil: {mp3_path} ({sz_kb:.1f} KB)")

print(f"\n========================================================")
print(f"Selesai! Total ukuran 6 narasi audio MP3: {total_bytes / 1024:.1f} KB")
print(f"========================================================")
