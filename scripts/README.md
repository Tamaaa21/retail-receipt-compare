# Python OCR API dengan Tesseract

Backend OCR menggunakan **Tesseract** (open-source OCR engine) untuk membaca teks dari gambar nota/struk retail.

## Instalasi

### 1. Install Tesseract OCR (System-level)

**Windows:**
- Download installer dari: https://github.com/UB-Mannheim/tesseract/wiki
- Jalankan installer (default path: `C:\Program Files\Tesseract-OCR`)
- Atau gunakan Chocolatey: `choco install tesseract`

**macOS:**
\`\`\`bash
brew install tesseract
\`\`\`

**Linux (Ubuntu/Debian):**
\`\`\`bash
sudo apt-get install tesseract-ocr
sudo apt-get install libtesseract-dev
\`\`\`

### 2. Install Python Dependencies

\`\`\`bash
pip install flask flask-cors opencv-python pytesseract pillow numpy
\`\`\`

### 3. Konfigurasi Path Tesseract (Windows saja)

Jika Tesseract tidak terdeteksi otomatis, edit `ocr_api.py` dan tambahkan di awal file:
\`\`\`python
import pytesseract
pytesseract.pytesseract.pytesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
\`\`\`

## Menjalankan Server

\`\`\`bash
python scripts/ocr_api.py
\`\`\`

Server akan berjalan di `http://localhost:5000`

## Konfigurasi di v0

1. Buka sidebar **Vars** di v0
2. Tambahkan environment variable:
   - **Key:** `OCR_API_URL`
   - **Value:** `http://localhost:5000`

## Fitur

- ✅ Preprocessing gambar otomatis (grayscale, denoise, threshold, morphological operations)
- ✅ Support bahasa Indonesia + English (`lang='ind+eng'`)
- ✅ Adaptive thresholding untuk pencahayaan tidak merata
- ✅ Error handling dan logging
- ✅ Health check endpoint (`/health`)
- ✅ CORS enabled untuk frontend

## Testing

Cek apakah server berjalan:
\`\`\`bash
curl http://localhost:5000/health
\`\`\`

Upload gambar untuk OCR:
\`\`\`bash
curl -X POST -F "file=@nota.jpg" http://localhost:5000/api/ocr
\`\`\`

## Troubleshooting

**Error: "tesseract is not installed"**
- Pastikan Tesseract sudah diinstall di sistem
- Cek path di `pytesseract_cmd` jika perlu

**OCR hasil jelek**
- Pastikan gambar cukup jelas dan terang
- Coba rotate/crop gambar agar teks lebih horizontal
- Tingkatkan resolusi gambar jika terlalu kecil

**CORS error di frontend**
- Pastikan `flask-cors` sudah diinstall
- Cek bahwa `OCR_API_URL` di Vars sudah benar
