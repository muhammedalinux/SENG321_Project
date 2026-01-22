import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../App.css';

function DashboardPage() {
  const [text, setText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Parametreler
  const [sLength, setSLength] = useState('medium');
  const [qCount, setQCount] = useState(5);
  const [difficulty, setDifficulty] = useState('orta');

  const navigate = useNavigate();

  const handleLogout = () => {
      localStorage.removeItem('user_token');
      localStorage.removeItem('user_email');
      navigate('/');
  };

  const handleClear = () => {
      if(window.confirm("Çalışma alanını temizlemek istediğinize emin misiniz?")) {
          setText('');
      }
  };

  // ✅ DÜZELTİLMİŞ PDF YÜKLEME
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setText("⏳ PDF okunuyor, lütfen bekleyin...");

    const formData = new FormData();
    formData.append('file', file);

    try {
      // 127.0.0.1 kullanımı önemli!
      const response = await fetch('http://127.0.0.1:5000/api/upload-pdf', {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Sunucu hatası");
      }

      if (data.text) {
        setText(data.text);
      } else {
        setText(""); 
        alert("Hata: Backend boş veri döndürdü.");
      }
    } catch (err) {
      console.error("Upload Hatası:", err);
      setText("");
      alert("PDF Yükleme Hatası: " + err.message);
    }
  };

  // ✅ DÜZELTİLMİŞ ÖZET/QUIZ OLUŞTURMA
  const handleProcess = async () => {
    if (!text || text.trim() === "") {
        alert("Lütfen önce bir metin girin veya PDF yükleyin.");
        return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch('http://127.0.0.1:5000/api/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            text: text, 
            length: sLength,
            question_count: parseInt(qCount),
            difficulty: difficulty 
        }),
      });
      
      const data = await response.json();

      if (!response.ok) {
          throw new Error(data.error || "İşlem başarısız");
      }
      
      // Veri kontrolü ve Yönlendirme
      if (data.summary) {
        navigate('/summary', { 
            state: { 
                summary: data.summary, 
                quiz: data.quiz || [] // Quiz boş gelse bile hata vermesin
            } 
        });
      } else {
        alert("Hata: Özet oluşturulamadı.");
      }

    } catch (err) {
      console.error("Process Hatası:", err);
      alert("İşlem Hatası: " + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="animate-fade" style={{ padding: '40px' }}>
      <header style={{ textAlign: 'center', marginBottom: '60px', position: 'relative' }}>
        <h1 className="main-logo">Academic Studio</h1>
        <p className="slogan">Dashboard</p>
        
        {/* SAĞ ÜST BUTONLAR */}
        <div style={{position:'absolute', top:0, right:0, display:'flex', gap:'10px'}}>
            <button 
              onClick={() => navigate('/podcast')} 
              style={{
                background: '#6f42c1', 
                color: 'white', 
                border: 'none', 
                padding: '10px 15px', 
                borderRadius: '5px', 
                cursor: 'pointer', 
                fontWeight: 'bold'
              }}
            >
                🎙️ Medya Stüdyosu
            </button>

            <button onClick={()=>navigate('/profile')} style={{background:'#8e44ad', color:'white', border:'none', padding:'10px 15px', borderRadius:'5px', cursor:'pointer', fontWeight:'bold'}}>
                Profilim 👤
            </button>
            <button onClick={()=>navigate('/history')} style={{background:'#3498db', color:'white', border:'none', padding:'10px 15px', borderRadius:'5px', cursor:'pointer', fontWeight:'bold'}}>
                Geçmişim 📊
            </button>
            <button onClick={handleLogout} style={{background:'#e74c3c', color:'white', border:'none', padding:'10px 15px', borderRadius:'5px', cursor:'pointer', fontWeight:'bold'}}>
                Çıkış Yap 🚪
            </button>
        </div>
      </header>

      <div className="card workspace-card" style={{ maxWidth: '900px', margin: '0 auto' }}>
          
          {/* PDF YÜKLEME ALANI */}
          <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <label 
                style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    backgroundColor: '#e74c3c',
                    color: 'white',
                    padding: '10px 20px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                }}
            >
                📄 PDF Yükle
                <input 
                    type="file" 
                    accept=".pdf" 
                    onChange={handleFileUpload} 
                    style={{ display: 'none' }} 
                />
            </label>
          </div>

          <textarea 
            className="modern-textarea" 
            value={text} 
            onChange={(e)=>setText(e.target.value)} 
            placeholder="Ders notlarını buraya yapıştırabilir veya yukarıdan PDF yükleyebilirsiniz..." 
            style={{height:'260px'}} 
          />
          
          {/* AYARLAR VE BUTONLAR */}
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:'15px', flexWrap:'wrap'}}>
              <div style={{display:'flex', gap:'10px'}}>
                <select className="modern-select" value={sLength} onChange={(e)=>setSLength(e.target.value)}>
                    <option value="short">Kısa Özet</option>
                    <option value="medium">Orta Özet</option>
                    <option value="long">Uzun Özet</option>
                </select>
                <select className="modern-select" value={qCount} onChange={(e)=>setQCount(e.target.value)}>
                    <option value="3">3 Soru</option>
                    <option value="5">5 Soru</option>
                    <option value="10">10 Soru</option>
                </select>
                <select className="modern-select" value={difficulty} onChange={(e)=>setDifficulty(e.target.value)}>
                    <option value="kolay">Kolay</option>
                    <option value="orta">Orta</option>
                    <option value="zor">Zor</option>
                </select>
              </div>

              <button 
                onClick={handleClear}
                style={{
                    background:'transparent',
                    border:'1px solid #95a5a6',
                    color:'#7f8c8d',
                    padding:'8px 15px',
                    borderRadius:'5px',
                    cursor:'pointer'
                }}
              >
                🗑️ Temizle
              </button>
          </div>

          <button 
            className="btn-primary" 
            style={{width:'100%', marginTop:'20px'}} 
            onClick={handleProcess}
            disabled={!text || isGenerating}
          >
            {isGenerating ? "Yapay Zeka Çalışıyor..." : "Özet Oluştur 📄"}
          </button>
      </div>
    </div>
  );
}

export default DashboardPage;