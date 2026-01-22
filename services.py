import os
import requests 
import json
import re 
import base64 
import uuid 
from pathlib import Path
from gtts import gTTS
from dotenv import load_dotenv
from moviepy import VideoFileClip 

# .ENV Dosyasını Bul
base_dir = Path(__file__).resolve().parent
env_file = base_dir / ".env"
load_dotenv(dotenv_path=env_file)

class AIService:
    def __init__(self):
        self.api_key = os.getenv("GOOGLE_API_KEY")
        self.models_to_try = [
            "gemini-2.0-flash", "gemini-2.5-flash", "gemini-pro-latest", "gemini-1.5-flash"
        ]

    def _send_request(self, url_template, headers, data):
        if not self.api_key: return {"success": False, "error": "API Key yok."}

        for model in self.models_to_try:
            clean_model = model.replace("models/", "")
            current_url = url_template.format(clean_model)
            try:
                response = requests.post(current_url, headers=headers, json=data)
                if response.status_code == 200:
                    result = response.json()
                    try: return {"success": True, "text": result['candidates'][0]['content']['parts'][0]['text']}
                    except: return {"success": False, "error": "Boş yanıt."}
                elif response.status_code == 404: continue 
                elif response.status_code == 400: return {"success": False, "error": "API Key geçersiz."}
            except Exception as e: continue
        return {"success": False, "error": "Modeller yanıt vermedi."}

    def _call_google_api_text(self, prompt):
        url_template = f"https://generativelanguage.googleapis.com/v1beta/models/{{}}:generateContent?key={self.api_key}"
        headers = {"Content-Type": "application/json"}
        data = { "contents": [{ "parts": [{ "text": prompt }] }] }
        return self._send_request(url_template, headers, data)

    def _call_google_api_audio(self, audio_path, prompt_text):
        url_template = f"https://generativelanguage.googleapis.com/v1beta/models/{{}}:generateContent?key={self.api_key}"
        try:
            with open(audio_path, "rb") as audio_file:
                audio_data = base64.b64encode(audio_file.read()).decode("utf-8")
        except Exception as e: return {"success": False, "error": f"Ses okuma hatası: {e}"}

        headers = {"Content-Type": "application/json"}
        data = {
            "contents": [{
                "parts": [
                    {"text": prompt_text},
                    {"inline_data": {"mime_type": "audio/mp3", "data": audio_data}}
                ]
            }]
        }
        return self._send_request(url_template, headers, data)

    # --- ANA İŞLEMLER ---
    def generate_full_analysis(self, text, length_pref, q_count, difficulty):
        if len(text) > 30000: text = text[:30000]
        
        # GÜNCELLEME: Öğretmen modu (Tutor) ve detaylı açıklama isteği
        prompt = f"""
        You are a helpful AI tutor.
        Task 1: Summarize the text ({length_pref}).
        Task 2: Create {q_count} multiple choice questions ({difficulty}).
        
        IMPORTANT: Output MUST be valid JSON only. No markdown formatting.
        Format: {{ 
            "summary": "...", 
            "quiz": [
                {{ 
                    "text": "Question text...", 
                    "options": ["Option A", "Option B", "Option C", "Option D"], 
                    "correct_answer": "A", 
                    "explanation": "Explain clearly why the correct answer is right. Also briefly explain why the other options are incorrect/distractors." 
                }}
            ] 
        }}
        
        TEXT: {text}
        """
        result = self._call_google_api_text(prompt)
        if result["success"]: return self._clean_json(result["text"])
        return {"error": result["error"]}

    def generate_audio_summary(self, text, custom_prompt, duration, tone):
        try:
            process_text = text[:20000]
            prompt = f"""
            Sen profesyonel bir podcast sunucususun. Görevin aşağıdaki metni {tone} bir tonda dinleyicilere anlatmak.
            ÖNEMLİ KURALLAR:
            1. Asla "Merhaba ben enerjik sunucu" gibi betimlemeler yapma.
            2. Doğrudan konuya gir ve anlat.
            3. Sanki bir radyo programındaymışsın gibi akıcı konuş.
            4. Hedef süre: {duration}.
            
            METİN: {process_text}
            """
            
            api_result = self._call_google_api_text(prompt)
            if not api_result["success"]: return {"success": False, "error": api_result["error"]}

            speech_text = api_result["text"].replace("*", "").replace("#", "")
            
            static_folder = os.path.join(base_dir, "static")
            if not os.path.exists(static_folder): os.makedirs(static_folder)
            unique_filename = f"podcast_{uuid.uuid4().hex[:8]}.mp3"
            save_path = os.path.join(static_folder, unique_filename)
            
            tts = gTTS(text=speech_text, lang='tr')
            tts.save(save_path)
            
            return {"success": True, "audio_url": f"http://127.0.0.1:5000/static/{unique_filename}", "transcript": speech_text}
        except Exception as e: return {"success": False, "error": str(e)}

    def analyze_video(self, video_path):
        try:
            audio_path = os.path.join(base_dir, "static", "temp_video_audio.mp3")
            try:
                video = VideoFileClip(video_path)
                if video.duration > 120: 
                    video = video.subclipped(0, 120)
                video.audio.write_audiofile(audio_path, logger=None)
                video.close()
            except Exception as e:
                return {"success": False, "error": f"Video işleme hatası: {str(e)}"}

            prompt = "Bu videonun/sesin detaylı bir özetini çıkar ve önemli noktaları listele."
            result = self._call_google_api_audio(audio_path, prompt)
            
            if os.path.exists(audio_path): os.remove(audio_path)
            
            if result["success"]: return {"success": True, "summary": result["text"]}
            return result
        except Exception as e: return {"success": False, "error": str(e)}

    def _clean_json(self, text):
        try:
            text = text.strip()
            if "```" in text: text = re.search(r'```(?:json)?(.*?)```', text, re.DOTALL).group(1)
            return json.loads(text)
        except: return {"summary": text, "quiz": []}