import React, { useState } from 'react';

export default function PodcastGenerator() {
  const [text, setText] = useState("");
  const [customPrompt, setCustomPrompt] = useState("");
  const [duration, setDuration] = useState("kısa");
  const [tone, setTone] = useState("enerjik");
  
  const [loadingAudio, setLoadingAudio] = useState(false);
  const [loadingVideo, setLoadingVideo] = useState(false);
  const [audioResult, setAudioResult] = useState(null); // URL ve Transcript tutar
  
  // --- PDF YÜKLEME ---
  const handlePdfUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setText("⏳ PDF okunuyor, lütfen bekleyin...");
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      // 127.0.0.1 kullanıyoruz (Daha kararlı)
      const res = await fetch('http://127.0.0.1:5000/api/upload-pdf', { method: 'POST', body: formData });
      const data = await res.json();
      
      // Backend { "text": "..." } dönüyor. success boolean'ı yok.
      if (data.text) {
        setText(data.text);
      } else { 
        alert("PDF Hatası: " + (data.error || "Metin okunamadı")); 
        setText(""); 
      }
    } catch (err) { 
        alert("Sunucu hatası! Backend açık mı?"); 
        setText(""); 
    }
  };

  // --- VİDEO YÜKLEME ---
  const handleVideoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setLoadingVideo(true);
    setText("⏳ Video analiz ediliyor (Bu işlem videonun uzunluğuna göre 1-2 dakika sürebilir)...");
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const res = await fetch('http://127.0.0.1:5000/api/upload-video', { method: 'POST', body: formData });
      const data = await res.json();
      
      // Backend video özetini de { "text": "..." } içinde gönderiyor
      if (data.text) {
        setText(data.text);
      } else { 
        alert("Video Hatası: " + (data.error || "Video işlenemedi")); 
        setText(""); 
      }
    } catch (err) { 
        alert("Video sunucu hatası! FFMPEG yüklü mü?"); 
        setText(""); 
    } finally { 
        setLoadingVideo(false); 
    }
  };

  // --- SES OLUŞTURMA ---
  const handleGenerateAudio = async () => {
    if (!text) return alert("Lütfen önce metin girin veya dosya yükleyin!");
    
    setLoadingAudio(true);
    setAudioResult(null); // Önceki sonucu temizle

    try {
      const res = await fetch("http://127.0.0.1:5000/api/generate-audio", {
        method: "POST", 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
            text, 
            custom_prompt: customPrompt, 
            duration, 
            tone 
        })
      });
      const data = await res.json();
      
      if (data.success) {
        // Cache sorununu önlemek için timestamp ekliyoruz
        setAudioResult({
            url: `${data.audio_url}?t=${Date.now()}`,
            transcript: data.transcript
        });
      } else {
        alert("PODCAST HATASI: " + data.error);
      }
    } catch (err) { 
        alert("Bağlantı Hatası! Sunucu açık mı?"); 
    } finally { 
        setLoadingAudio(false); 
    }
  };

  return (
    <div className="podcast-container animate-fade">
      <div className="podcast-card">
        <h2 className="podcast-header">🎙️ Medya & Video Stüdyosu</h2>

        {/* Yükleme Alanları (Grid Yapısı) */}
        <div className="upload-grid">
          
          {/* PDF Kutusu */}
          <div className="upload-area">
            <span className="upload-icon">📄</span>
            <h5 className="upload-title">PDF / Not Yükle</h5>
            <input 
              type="file" 
              accept=".pdf,.txt" 
              onChange={handlePdfUpload} 
              id="pdfUpload" 
              style={{ display: 'none' }}
            />
            <label htmlFor="pdfUpload" className="custom-file-btn">
              Dosya Seç
            </label>
          </div>

          {/* Video Kutusu */}
          <div className="upload-area">
            <span className="upload-icon">🎥</span>
            <h5 className="upload-title">Ders Videosu Yükle</h5>
            <input 
              type="file" 
              accept="video/*" 
              onChange={handleVideoUpload} 
              id="videoUpload"
              disabled={loadingVideo}
              style={{ display: 'none' }}
            />
            <label htmlFor="videoUpload" className={`custom-file-btn ${loadingVideo ? 'disabled' : ''}`}>
              {loadingVideo ? "Analiz Ediliyor..." : "Video Seç"}
            </label>
          </div>

        </div>
        
        {/* Metin Alanı */}
        <div style={{ marginBottom: '30px' }}>
          <textarea
            className="custom-textarea"
            rows="6"
            placeholder="Video özeti veya PDF içeriğini buraya yükleyin lütfen..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          ></textarea>
        </div>

        {/* Ayarlar Kutusu */}
        <div className="settings-box">
          <div className="settings-title">🎛️ Podcast Ayarları</div>
          <div className="settings-grid">
            <select className="custom-select" value={tone} onChange={(e) => setTone(e.target.value)}>
              <option value="Eğlenceli">Enerjik (YouTuber)</option>
              <option value="Ciddi">Ciddi (Akademik)</option>
              <option value="Sohbet">Sohbet (Arkadaş)</option>
            </select>
            
            <select className="custom-select" value={duration} onChange={(e) => setDuration(e.target.value)}>
              <option value="Kısa (2 dk)">Kısa Özet</option>
              <option value="Orta (5 dk)">Orta Detay</option>
              <option value="Uzun (10 dk)">Uzun & Detaylı</option>
            </select>
          </div>
          <input
            type="text"
            className="custom-input"
            placeholder="✨ Özel İstek (Örn: Bunu 5 yaşında çocuğa anlatır gibi anlat)"
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
          />
        </div>

        {/* Üret Butonu */}
        <button
          className="generate-btn"
          onClick={handleGenerateAudio}
          disabled={loadingAudio || !text}
        >
          {loadingAudio ? "🎙️ Hazırlanıyor..." : "🎧 Podcast Üret"}
        </button>

        {/* Player ve Sonuç */}
        {audioResult && (
          <div className="audio-result animate-fade">
            <h5 style={{fontWeight:'bold', marginBottom:'15px', color:'#27ae60'}}>✅ Podcast Hazır!</h5>
            
            <audio controls style={{width:'100%', borderRadius:'30px', marginBottom:'15px'}}>
              <source src={audioResult.url} type="audio/mpeg" />
              Tarayıcınız ses oynatmayı desteklemiyor.
            </audio>
            
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <a href={audioResult.url} download="podcast.mp3" style={{color:'#27ae60', textDecoration:'none', fontWeight:'bold', border:'1px solid #27ae60', padding:'5px 15px', borderRadius:'20px'}}>
                    ⬇️ İndir
                </a>
                <span style={{fontSize:'0.8rem', color:'#888'}}>AI tarafından üretildi</span>
            </div>
            
            {/* Transkript Alanı (İsteğe bağlı görünürlük) */}
            <details style={{marginTop:'15px', textAlign:'left', color:'#555', fontSize:'0.9rem', cursor:'pointer'}}>
                <summary>Transkripti Göster</summary>
                <p style={{marginTop:'10px', lineHeight:'1.5', padding:'10px', background:'#f9f9f9', borderRadius:'5px'}}>
                    {audioResult.transcript}
                </p>
            </details>
          </div>
        )}
      </div>
    </div>
  );
}