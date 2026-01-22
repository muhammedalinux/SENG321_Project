import os
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import pdfplumber 
from dotenv import load_dotenv
from services import AIService
from pathlib import Path

# .ENV Dosyasını Bul ve Yükle
base_path = Path(__file__).resolve().parent
env_path = base_path / ".env"
load_dotenv(dotenv_path=env_path)

app = Flask(__name__)
app.config['JSON_AS_ASCII'] = False 
app.config['MAX_CONTENT_LENGTH'] = 500 * 1024 * 1024 
CORS(app) 

UPLOAD_FOLDER = os.path.join(base_path, "uploads")
if not os.path.exists(UPLOAD_FOLDER): os.makedirs(UPLOAD_FOLDER)

# API Key Kontrol
api_key = os.getenv("GOOGLE_API_KEY")
if not api_key: 
    print("❌ UYARI: GOOGLE_API_KEY bulunamadı!")
else:
    print(f"🔑 API Key Yüklendi ({api_key[:5]}...)")

ai_service = AIService()
USERS = []

# --- KULLANICI ROTALARI ---

@app.route('/api/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')
        for user in USERS:
            if user['email'] == email: return jsonify({"success": False, "message": "Zaten kayıtlı."}), 400
        USERS.append({"email": email, "password": password})
        return jsonify({"success": True, "message": "Kayıt başarılı."})
    except Exception as e: return jsonify({"success": False, "message": str(e)}), 500

@app.route('/api/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')
        user = next((u for u in USERS if u['email'] == email and u['password'] == password), None)
        if user: return jsonify({"success": True, "token": "demo", "email": email})
        return jsonify({"success": False, "message": "Hatalı giriş."}), 401
    except Exception as e: return jsonify({"success": False, "message": str(e)}), 500

# --- EKSİK OLAN PROFİL ROTASI (404 HATASINI ÇÖZER) ---
@app.route('/api/profile/stats', methods=['GET', 'POST'])
def get_profile_stats():
    # Frontend bu adresi çağırdığında hata almaması için boş veri dönüyoruz
    return jsonify({
        "success": True, 
        "stats": {
            "total_quizzes": 0,
            "average_score": 0,
            "level": "Başlangıç"
        }
    })

# --- PDF VE MEDYA ROTALARI ---

@app.route("/api/upload-pdf", methods=["POST"])
def upload_pdf():
    try:
        if "file" not in request.files: return jsonify({"error": "Dosya yok"}), 400
        file = request.files["file"]
        if file.filename == '': return jsonify({"error": "Seçim yok"}), 400

        path = os.path.join(UPLOAD_FOLDER, file.filename)
        file.save(path)
        
        full_text = ""
        try:
            with pdfplumber.open(path) as pdf:
                for page in pdf.pages:
                    text = page.extract_text()
                    if text: full_text += text + "\n"
        except Exception as e: return jsonify({"error": "PDF okunamadı."}), 500
        finally:
            if os.path.exists(path): os.remove(path)

        full_text = full_text.strip().replace('\x00', '')
        if not full_text: return jsonify({"error": "PDF boş veya resim içeriyor."}), 400

        return jsonify({"text": full_text})
    except Exception as e: return jsonify({"error": str(e)}), 500

@app.route("/api/upload-video", methods=["POST"])
def upload_video():
    try:
        if "file" not in request.files: return jsonify({"error": "Video yok"}), 400
        file = request.files["file"]
        path = os.path.join(UPLOAD_FOLDER, file.filename)
        file.save(path)
        
        print(f"🎬 Video analiz ediliyor: {file.filename}")
        result = ai_service.analyze_video(path)
        
        if os.path.exists(path): os.remove(path)
        
        if result["success"]:
            return jsonify({"text": result["summary"]})
        else:
            return jsonify({"error": result.get("error", "Bilinmeyen hata")}), 500

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/process", methods=["POST"])
def process_text():
    try:
        data = request.get_json()
        text = data.get("text", "")
        if not text: return jsonify({"error": "Metin yok"}), 400
        
        result = ai_service.generate_full_analysis(
            text, 
            data.get("length", "kısa"), 
            data.get("question_count", 5), 
            data.get("difficulty", "orta")
        )
        return jsonify(result)
    except Exception as e: return jsonify({"error": str(e)}), 500

@app.route('/api/generate-audio', methods=['POST'])
def generate_audio():
    try:
        data = request.json
        result = ai_service.generate_audio_summary(
            data.get('text'), data.get('custom_prompt'), data.get('duration'), data.get('tone')
        )
        return jsonify(result)
    except Exception as e: return jsonify({"success": False, "error": str(e)}), 500

@app.route('/static/<path:filename>')
def serve_static(filename): return send_from_directory('static', filename)

if __name__ == "__main__":
    app.run(debug=True, port=5000, threaded=True)