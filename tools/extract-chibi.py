import os
from PIL import Image, ImageChops

SRC_PATH = r"C:\Users\Tyoo\.gemini\antigravity\brain\851aacc5-0564-4983-9567-f17c419af95a\.user_uploaded\media_1792416275740_d7b65fd4.jpg"
OUT_DIR = r"c:\Users\Tyoo\Documents\Lomba Programming\lokalokal\web\public\assets\chibi"
os.makedirs(OUT_DIR, exist_ok=True)

img = Image.open(SRC_PATH).convert("RGBA")
W, H = img.size

# Karakter berdasarkan kolom (0 s.d. 7) dengan batas presisi bebas bocor
KARAKTER = [
    {"id": "bali_pria", "nama": "Bli Dewa", "daerah": "Bali", "x0": 10, "x1": 125},
    {"id": "minang", "nama": "Uni Minang", "daerah": "Sumatera Barat", "x0": 130, "x1": 255},
    {"id": "batak", "nama": "Uda Batak", "daerah": "Sumatera Utara", "x0": 260, "x1": 378},
    {"id": "jawa", "nama": "Mas Bejo", "daerah": "Jawa", "x0": 382, "x1": 495},
    {"id": "bali_wanita", "nama": "Ni Luh", "daerah": "Bali", "x0": 498, "x1": 622},
    {"id": "papua", "nama": "Pace Papua", "daerah": "Papua", "x0": 624, "x1": 755},
    {"id": "aceh", "nama": "Cut Kak", "daerah": "Aceh", "x0": 758, "x1": 875},
    {"id": "bugis", "nama": "Daeng Bugis", "daerah": "Sulawesi Selatan", "x0": 878, "x1": 1005},
]

# Baris ekspresi (Y0, Y1) dengan margin presisi di atas teks label
BARIS = [
    {"ekspresi_list": ["netral"] * 8, "y0": 15, "y1": 172},
    {"ekspresi_list": ["senang"] * 8, "y0": 205, "y1": 332},
    {"ekspresi_list": ["kaget", "kaget", "marah", "marah", "sedih", "sedih", "sedih", "sedih"], "y0": 358, "y1": 454},
    {"ekspresi_list": ["pikir", "pikir", "malu", "malu", "semangat", "semangat", "senyum", "senyum"], "y0": 478, "y1": 570},
    {"ekspresi_list": ["belakang"] * 8, "y0": 595, "y1": 668},
]

def make_transparent(cropped):
    """Mengubah warna putih latar belakang menjadi transparan dengan anti-aliasing halus"""
    # Gunakan getdata untuk memproses piksel
    datas = cropped.getdata()
    new_data = []
    for item in datas:
        r, g, b, a = item
        bright = (r + g + b) / 3.0
        # Jika hampir putih murni (> 242), buat transparan 100%
        if r > 242 and g > 242 and b > 242:
            # Gradasi halus pada tepi 240 - 255
            alpha = max(0, int(255 - (bright - 240) * 17)) if bright >= 240 else 255
            new_data.append((r, g, b, alpha))
        else:
            new_data.append((r, g, b, 255))
    cropped.putdata(new_data)
    
    # Auto-trim transparent borders
    bg = Image.new(cropped.mode, cropped.size, (0, 0, 0, 0))
    diff = ImageChops.difference(cropped, bg)
    bbox = diff.getbbox()
    if bbox:
        cropped = cropped.crop(bbox)
    return cropped

count = 0
for r_idx, b_info in enumerate(BARIS):
    y0, y1 = b_info["y0"], b_info["y1"]
    for c_idx, k_info in enumerate(KARAKTER):
        x0, x1 = k_info["x0"], k_info["x1"]
        ekspresi = b_info["ekspresi_list"][c_idx]
        
        box = (x0, y0, x1, y1)
        sub = img.crop(box)
        sub_trans = make_transparent(sub)
        
        out_name = f"{k_info['id']}_{ekspresi}.png"
        out_path = os.path.join(OUT_DIR, out_name)
        sub_trans.save(out_path, "PNG")
        count += 1

# Potong juga slogan penutup di pojok kanan bawah baris 5 (Y murni tanpa label "Senyum")
slogan_crop = img.crop((760, 600, 1005, 678))
slogan_trans = make_transparent(slogan_crop)
slogan_trans.save(os.path.join(OUT_DIR, "slogan_bhinneka.png"), "PNG")

# Potong barisan chibi tampak belakang berjejer (Row 5 kol 0 s.d. 7)
barisan_belakang_crop = img.crop((15, 595, 755, 672))
barisan_belakang_trans = make_transparent(barisan_belakang_crop)
barisan_belakang_trans.save(os.path.join(OUT_DIR, "barisan_nusantara_belakang.png"), "PNG")

print(f"Selesai mengekstrak {count} variasi karakter chibi + banner penutup ke {OUT_DIR}")
