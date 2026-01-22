import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../App.css';

function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // ✅ localhost YERİNE 127.0.0.1
      const response = await fetch('http://127.0.0.1:5000/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success) {
        alert("Kayıt başarılı! Şimdi giriş yapabilirsin.");
        navigate('/'); // Giriş sayfasına yönlendir
      } else {
        alert("Hata: " + data.message);
      }
    } catch (error) {
      alert("Sunucuya bağlanılamadı!");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // ✅ KESİN ORTALAMA STİLİ
    <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        background: '#fdfbf7'
    }}>
      <div className="card" style={{ maxWidth: '400px', width: '90%', textAlign: 'center', padding: '40px' }}>
        <h1 className="main-logo" style={{ fontSize: '2.5rem', marginBottom: '10px' }}>Academic Studio</h1>
        <p className="slogan">Yeni Hesap Oluştur</p>

        <form onSubmit={handleRegister} style={{ marginTop: '30px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div>
            <label className="field-label-small" style={{textAlign:'left', display:'block'}}>E-POSTA ADRESİ</label>
            <input 
              type="email" 
              className="modern-input" 
              placeholder="ornek@ogrenci.edu.tr"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="field-label-small" style={{textAlign:'left', display:'block'}}>ŞİFRE BELİRLE</label>
            <input 
              type="password" 
              className="modern-input" 
              placeholder="••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn-primary" disabled={isLoading} style={{ marginTop: '10px' }}>
            {isLoading ? "Kaydediliyor..." : "Kayıt Ol ✨"}
          </button>
        </form>

        <p style={{ marginTop: '20px', fontSize: '14px', opacity: 0.7 }}>
          Zaten hesabın var mı? <span onClick={() => navigate('/')} style={{ color: '#e67e22', cursor: 'pointer', fontWeight: 'bold' }}>Giriş Yap</span>
        </p>
      </div>
    </div>
  );
}

export default RegisterPage;