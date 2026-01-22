import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../App.css';

function LoginPage() {
  const navigate = useNavigate();
  
  // Mod değişimi için state (Login mi? Register mı?)
  const [isLoginMode, setIsLoginMode] = useState(true);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const handleSubmit = async () => {
    if(!email || !password) {
        alert("Lütfen tüm alanları doldurun.");
        return;
    }

    setLoading(true);
    
    // Hangi adrese gideceğiz?
    const endpoint = isLoginMode ? '/api/login' : '/api/register';
    
    // 🚨 DÜZELTME 1: localhost yerine 127.0.0.1 (Bağlantı sorununu çözer)
    const apiUrl = `http://127.0.0.1:5000${endpoint}`;

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });
        const data = await response.json();
        
        if (data.success) {
            if (isLoginMode) {
                // Giriş Başarılıysa
                localStorage.setItem('user_token', 'logged_in');
                localStorage.setItem('user_email', email); // Quiz geçmişi için gerekli
                
                navigate('/dashboard');
            } else {
                // Kayıt Başarılıysa -> Giriş moduna geç
                alert(data.message || "Kayıt başarılı! Şimdi giriş yapabilirsiniz.");
                setIsLoginMode(true); 
                setPassword(''); 
            }
        } else {
            alert(data.message || "İşlem başarısız!");
        }
    } catch (error) {
        alert("Sunucuya bağlanılamadı! Backend (Python) açık mı?");
    } finally {
        setLoading(false);
    }
  };

  return (
    // 🚨 DÜZELTME 2: 'quiz-wrapper' sildik. Yerine Flexbox ile tam ortalama yaptık.
    <div className="animate-fade" style={{
        minHeight: '100vh',         // Tüm ekranı kapla
        display: 'flex',            // Esnek kutu modeli
        justifyContent: 'center',   // Yatayda ortala
        alignItems: 'center',       // Dikeyde ortala
        background: '#fdfbf7'       // Göz yormayan arka plan rengi
    }}>
      <div className="card" style={{ maxWidth: '450px', width: '90%', textAlign: 'center', padding: '40px' }}>
        <header style={{ marginBottom: '30px' }}>
          <h1 className="main-logo" style={{fontSize:'2.8rem', marginBottom:'10px'}}>Academic Studio</h1>
          <p className="slogan">Master your lectures with AI precision</p>
        </header>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <h2 style={{color:'#2c3e50', fontSize:'1.5rem'}}>
            {isLoginMode ? 'Giriş Yap' : 'Kayıt Ol'}
          </h2>

          <input 
            type="email" 
            placeholder="E-posta Adresi" 
            className="modern-input" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input 
            type="password" 
            placeholder="Şifre" 
            className="modern-input" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          
          <button 
            onClick={handleSubmit} 
            className="btn-primary" 
            style={{marginTop:'10px'}}
            disabled={loading}
          >
            {loading ? 'İşleniyor...' : (isLoginMode ? 'Giriş Yap 🚀' : 'Kayıt Ol ✨')}
          </button>

          {/* Mod Değiştirme Linki */}
          <div style={{marginTop:'15px', fontSize:'0.9rem', color:'#666'}}>
            {isLoginMode ? "Hesabın yok mu? " : "Zaten hesabın var mı? "}
            <span 
                style={{color:'#e67e22', fontWeight:'bold', cursor:'pointer', textDecoration:'underline'}}
                onClick={() => {
                    setIsLoginMode(!isLoginMode);
                    setEmail('');
                    setPassword('');
                }}
            >
                {isLoginMode ? "Hemen Kayıt Ol" : "Giriş Yap"}
            </span>
          </div>

        </div>
      </div>
    </div>
  );
}

export default LoginPage;