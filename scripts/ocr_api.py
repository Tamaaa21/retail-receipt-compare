import os
import uuid
from flask import Flask, request, jsonify
from flask_cors import CORS
import cv2
import pytesseract
import numpy as np
from PIL import Image
import io
import logging
from datetime import datetime

# --- Konfigurasi ---
app = Flask(__name__)
CORS(app)

# Setup logging yang lebih detail
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Direktori untuk menyimpan gambar sementara (untuk debugging)
# Buat folder ini jika belum ada
DEBUG_IMAGE_DIR = "debug_images"
if not os.path.exists(DEBUG_IMAGE_DIR):
    os.makedirs(DEBUG_IMAGE_DIR)

# --- Fungsi Preprocessing yang Lebih Modular dan Canggih ---

def get_grayscale(image):
    """Mengubah gambar menjadi grayscale."""
    return cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

def upscale_image(image, factor=2):
    """Memperbesar gambar jika terlalu kecil."""
    if image.shape[1] < 300: # Jika lebar kurang dari 300px
        width = int(image.shape[1] * factor)
        height = int(image.shape[0] * factor)
        dim = (width, height)
        # INTER_CUBIC bagus untuk memperbesar
        return cv2.resize(image, dim, interpolation=cv2.INTER_CUBIC)
    return image

def remove_noise(image):
    """Menghilangkan noise dengan bilateral filter."""
    return cv2.bilateralFilter(image, 9, 75, 75)

def threshold_image(image):
    """Menerapkan adaptive thresholding."""
    return cv2.adaptiveThreshold(image, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                                         cv2.THRESH_BINARY, 11, 2)

def deskew(image):
    """Meluruskan gambar yang miring."""
    coords = np.column_stack(np.where(image > 0))
    angle = cv2.minAreaRect(coords)[-1]
    
    # Koreksi sudut
    if angle < -45:
        angle = -(90 + angle)
    else:
        angle = -angle
        
    (h, w) = image.shape[:2]
    center = (w // 2, h // 2)
    M = cv2.getRotationMatrix2D(center, angle, 1.0)
    rotated = cv2.warpAffine(image, M, (w, h),
                             flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
    return rotated

def preprocess_image(image, save_debug=False, filename="debug"):
    """
    Pipeline preprocessing gambar yang komprehensif.
    """
    # 1. Grayscale
    gray = get_grayscale(image)
    
    # 2. Upscale jika perlu
    gray = upscale_image(gray)
    
    # 3. Remove Noise
    denoised = remove_noise(gray)
    
    # 4. Thresholding
    thresh = threshold_image(denoised)
    
    # 5. Deskewing (Meluruskan)
    deskewed = deskew(thresh)
    
    # (Opsional) Simpan gambar hasil untuk debugging
    if save_debug:
        debug_filename = f"{filename}_{uuid.uuid4().hex}.png"
        debug_path = os.path.join(DEBUG_IMAGE_DIR, debug_filename)
        cv2.imwrite(debug_path, deskewed)
        logger.info(f"Gambar debug disimpan di: {debug_path}")
        
    return deskewed

# --- Endpoint API ---

@app.route("/api/ocr", methods=["POST"])
def ocr():
    """
    Endpoint OCR yang ditingkatkan.
    Menerima file gambar dan mengembalikan teks yang diekstrak.
    """
    try:
        if "file" not in request.files:
            return jsonify({"error": "No file uploaded"}), 400

        file = request.files["file"]
        if file.filename == "":
            return jsonify({"error": "No file selected"}), 400

        # Baca gambar dari request
        img_bytes = file.read()
        np_img = np.frombuffer(img_bytes, np.uint8)
        img = cv2.imdecode(np_img, cv2.IMREAD_COLOR)

        if img is None:
            return jsonify({"error": "Invalid image file or corrupted"}), 400

        # Preprocessing gambar
        # Aktifkan save_debug=True jika ingin melihat hasil preprocessing
        processed_img = preprocess_image(img, save_debug=False, filename=file.filename)

        # Konfigurasi Tesseract yang lebih baik
        # --psm 6: Assume a single uniform block of text.
        # --psm 3: Fully automatic page segmentation, but no OSD. (Lebih umum)
        # --psm 11: Sparse text. Find as much text as possible in no particular order.
        # Kita coba PSM 3 sebagai default yang lebih fleksibel.
        custom_config = r'--oem 3 --psm 3 -c tessedit_char_whitelist=0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ.,-:()/?! '
        
        # Gunakan bahasa Indonesia dan Inggris
        text = pytesseract.image_to_string(processed_img, config=custom_config, lang='ind+eng')

        # Hapus whitespace yang tidak perlu
        extracted_text = text.strip()

        logger.info(f"OCR berhasil untuk file: {file.filename}")
        return jsonify({
            "status": "success",
            "text": extracted_text,
            "filename": file.filename
        })

    except pytesseract.TesseractNotFoundError:
        logger.error("Error: Tesseract tidak ditemukan. Pastikan Tesseract sudah terinstall dan di PATH.")
        return jsonify({"error": "Tesseract OCR engine not found on the server."}), 500
    except Exception as e:
        logger.error(f"Error OCR: {str(e)}", exc_info=True) # exc_info=True untuk traceback lengkap
        return jsonify({"error": f"OCR failed: {str(e)}"}), 500

@app.route("/health", methods=["GET"])
def health():
    """Health check endpoint."""
    return jsonify({"status": "ok", "timestamp": datetime.now().isoformat()}), 200

if __name__ == "__main__":
    # Pastikan path ke tesseract executable sudah benar jika tidak ada di PATH
    # Contoh untuk Windows: pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
    # Contoh untuk Linux/macOS: biasanya sudah otomatis di PATH
    
    logger.info("Starting OCR API server on http://0.0.0.0:5000")
    app.run(host="0.0.0.0", port=5000, debug=False)