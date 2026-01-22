import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import '../App.css';

function ProfilePage() {
  const navigate = useNavigate();
  const email = localStorage.getItem('user_email');
  
  // İstatistik State'i
  const [stats, setStats] = useState(null);
  
  // Şifre Değiştirme State'leri
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [msg, setMsg] = useState('');

  // Grafik Renkleri (Yeşil ve Kırmızı)
  const COLORS = ['#2ecc71', '#e74c3c'];

  useEffect(() => {
    // Sayfa açılınca istatistikleri çek
    const fetchStats = async () => {
        const res = await fetch('http://localhost:5000/api/profile/stats', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ email })
        });
        const data = await res.json();
        setStats(data);
    };
    if(email) fetchStats();
  }, [email]);

  const handleChangePassword = async () => {
      if (!oldPass || !newPass || !confirmPass) {
          setMsg("Lütfen tüm alanları doldurun.");
          return;
      }
      if (newPass !== confirmPass) {
          setMsg("Yeni şifreler uyuşmuyor!");
          return;
      }

      const res = await fetch('http://localhost:5000/api/profile/password', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ 
              email, 
              old_password: oldPass, 
              new_password: newPass 
          })
      });
      const data = await res.json();
      setMsg(data.message);
      if(data.success) {
          setOldPass(''); setNewPass(''); setConfirmPass('');
      }
  };

  // Grafik verisini hazırla
  const pieData = stats ? [
      { name: 'Doğru', value: stats.total_correct },
      { name: 'Yanlış', value: stats.total_wrong }
  ] : [];

  return (
    <div className="animate-fade" style={{ padding: '40px', maxWidth: '1000px', margin: '0 auto' }}>
      <header style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'30px'}}>
        <div>
            <h2 style={{color:'#2c3e50', marginBottom:'5px'}}>👤 Kullanıcı Profili</h2>
            <p style={{color:'#7f8c8d'}}>{email}</p>
        </div>
        <button onClick={()=>navigate('/dashboard')} className="btn-secondary">← Dashboard</button>
      </header>

      <div className="horizontal-layout" style={{gap:'30px', alignItems:'flex-start'}}>
        
        {/* SOL: İSTATİSTİKLER */}
        <div style={{flex: 1}} className="card">
            <h3>📊 Performans Analizi</h3>
            
            {!stats ? (
                <p>Henüz veri yok. Biraz quiz çözün!</p>
            ) : (
                <>
                    <div style={{display:'flex', gap:'15px', marginBottom:'20px'}}>
                        <div className="stat-box" style={{background:'#e3f2fd', color:'#2980b9'}}>
                            <h4>{stats.total_quizzes}</h4>
                            <span>Toplam Quiz</span>
                        </div>
                        <div className="stat-box" style={{background:'#fff3e0', color:'#d35400'}}>
                            <h4>{stats.average_score}</h4>
                            <span>Ortalama Puan</span>
                        </div>
                    </div>

                    {/* YUVARLAK GRAFİK */}
                    <div style={{height:'250px', width:'100%', fontSize:'0.9rem'}}>
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <p style={{textAlign:'center', marginTop:'-10px', fontSize:'0.9rem', color:'#666'}}>
                        Toplam {stats.total_correct} Doğru / {stats.total_wrong} Yanlış
                    </p>
                </>
            )}
        </div>

        {/* SAĞ: ŞİFRE DEĞİŞTİRME */}
        <div style={{flex: 0.8}} className="card">
            <h3>🔐 Güvenlik Ayarları</h3>
            <div style={{display:'flex', flexDirection:'column', gap:'15px', marginTop:'20px'}}>
                <div>
                    <label style={{fontSize:'0.9rem', color:'#666'}}>Mevcut Şifre</label>
                    <input type="password" class="modern-input" value={oldPass} onChange={(e)=>setOldPass(e.target.value)} />
                </div>
                <div>
                    <label style={{fontSize:'0.9rem', color:'#666'}}>Yeni Şifre</label>
                    <input type="password" class="modern-input" value={newPass} onChange={(e)=>setNewPass(e.target.value)} />
                </div>
                <div>
                    <label style={{fontSize:'0.9rem', color:'#666'}}>Yeni Şifre (Tekrar)</label>
                    <input type="password" class="modern-input" value={confirmPass} onChange={(e)=>setConfirmPass(e.target.value)} />
                </div>

                {msg && <p style={{color: msg.includes('başarı') ? 'green' : 'red', fontSize:'0.9rem'}}>{msg}</p>}

                <button onClick={handleChangePassword} className="btn-primary" style={{marginTop:'10px'}}>
                    Şifreyi Güncelle
                </button>
            </div>
        </div>

      </div>
    </div>
  );
}

export default ProfilePage;