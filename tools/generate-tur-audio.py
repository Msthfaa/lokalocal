import asyncio
import os
import socket
import aiohttp
import edge_tts

OUTPUT_DIR = "web/public/assets/audio/tur"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Karakter vokal: id-ID-GadisNeural (Suara wanita muda Indonesia, ramah, hangat, intonasi mendongeng alami)
VOICE = "id-ID-GadisNeural"
RATE = "-3%"   # Sedikit lebih santai agar ritme artikulasi anggun dan jelas
PITCH = "+1Hz" # Timbre cerah bersahabat

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
        "naskah": "Kita tiba di Pulau Sulawesi, benteng arsitektur adat dan jejak aksara kuno. Menghadirkan aksara Lontaraq Bugis Makassar, arsitektur bersahaja Balla To Kajang, istana Raja Kulawi, serta busana serat kayu Lembah Bada."
    },
    {
        "id": "tur-6-maluku-papua",
        "pulau": "Maluku & Papua",
        "naskah": "Pemberhentian terakhir di Kepulauan Maluku dan Tanah Papua, bumi cenderawasih kaya rempah. Menampilkan balai musyawarah Sasadu Halmahera, tarian Togal, tabuhan perkusi Kelambut, hingga gerak tari adat Limne suku Ketengban di Papua Pegunungan."
    }
]

async def generate_all():
    print("=== Menghasilkan 6 Audio Narasi Tur Sinematik dengan Azure Neural TTS (id-ID-GadisNeural) ===")
    total_bytes = 0
    for item in ZONA_TEXTS:
        fid = item["id"]
        pulau = item["pulau"]
        naskah = item["naskah"]
        mp3_path = os.path.join(OUTPUT_DIR, f"{fid}.mp3")

        print(f"\n[+] Memproses zona: {pulau} ({fid})...")
        connector = aiohttp.TCPConnector(family=socket.AF_INET)
        communicate = edge_tts.Communicate(naskah, VOICE, rate=RATE, pitch=PITCH, connector=connector)
        await communicate.save(mp3_path)

        sz = os.path.getsize(mp3_path)
        total_bytes += sz
        print(f"    Berhasil tersimpan: {mp3_path} ({sz / 1024:.1f} KB)")

    print("\n========================================================")
    print(f"Selesai! Seluruh 6 audio narasi tersimpan di {OUTPUT_DIR}")
    print(f"Total ukuran: {total_bytes / 1024:.1f} KB")
    print("========================================================")

if __name__ == "__main__":
    asyncio.run(generate_all())
