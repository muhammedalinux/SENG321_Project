import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../App.css';

function HistoryPage() {
    const [history, setHistory] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        try {
            // Veriyi güvenli çekme
            const rawData = localStorage.getItem('quiz_history');
            const savedHistory = rawData ? JSON.parse(rawData) : [];
            
            // Eğer gelen veri dizi değilse (bozuksa) boş dizi yap
            if (Array.isArray(savedHistory)) {
                setHistory(savedHistory);
            } else {
                setHistory([]);
            }
        } catch (e) {
            console.error("Veri okuma hatası:", e);
            setHistory([]);
        }
    }, []);

    const clearHistory = () => {
        if(window.confirm("Tüm geçmişi silmek istediğine emin misin?")) {
            localStorage.removeItem('quiz_history');
            setHistory([]);
        }
    };

    // Ortalama Başarı Hesaplama (Güvenli Mod)
    const calculateAverage = () => {
        if (!history || history.length === 0) return 0;
        const total = history.reduce((acc, curr) => {
            // Eğer veri bozuksa ve score yoksa 0 kabul et
            const score = curr?.score || 0; 
            return acc + score;
        }, 0);
        return Math.round(total / history.length);
    };

    const averageScore = calculateAverage();

    return (
        <div className="animate-fade" style={{ padding: '40px', maxWidth: '900px', margin: '0 auto', minHeight: '100vh', background: '#f8f9fa' }}>
            
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <div>
                    <h2 style={{ margin: 0, color: '#2c3e50' }}>📊 Gelişim Raporu</h2>
                    <p style={{ margin: '5px 0 0 0', color: '#7f8c8d' }}>Toplam {history.length} sınav tamamlandı.</p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                     {history.length > 0 && (
                        <button onClick={clearHistory} style={{ background: '#e74c3c', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer' }}>
                            🗑️ Temizle
                        </button>
                     )}
                    <button onClick={() => navigate('/dashboard')} className="btn-secondary">← Dashboard</button>
                </div>
            </header>

            {/* GENEL İSTATİSTİK KARTI */}
            {history.length > 0 && (
                <div className="card" style={{ 
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
                    color: 'white', 
                    padding: '30px', 
                    borderRadius: '15px', 
                    marginBottom: '40px', 
                    display: 'flex', 
                    justifyContent: 'space-around', 
                    alignItems: 'center', 
                    boxShadow: '0 10px 20px rgba(118, 75, 162, 0.3)' 
                }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '3rem', fontWeight: 'bold' }}>%{averageScore}</div>
                        <div style={{ opacity: 0.8 }}>Ortalama Başarı</div>
                    </div>
                    <div style={{ width: '1px', height: '60px', background: 'rgba(255,255,255,0.3)' }}></div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '3rem', fontWeight: 'bold' }}>{history.length}</div>
                        <div style={{ opacity: 0.8 }}>Çözülen Quiz</div>
                    </div>
                </div>
            )}

            {/* LİSTE */}
            <div style={{ display: 'grid', gap: '20px' }}>
                {history.map((item, index) => {
                    // Veri Koruması: Eğer item bozuksa veya score yoksa varsayılan değerler kullan
                    if (!item) return null;
                    const score = item.score || 0;
                    const title = item.title || "İsimsiz Sınav";
                    const date = item.date || "-";
                    const correctAnswers = item.correctAnswers || 0;
                    const totalQuestions = item.totalQuestions || 0;

                    return (
                        <div key={index} className="card" style={{ 
                            padding: '25px', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'space-between', 
                            background: 'white',
                            transition: 'transform 0.2s' 
                        }}>
                            
                            {/* Sol Taraf: Bilgi */}
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
                                    <span style={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#2c3e50' }}>
                                        {title}
                                    </span>
                                </div>
                                <div style={{ fontSize: '0.9rem', color: '#95a5a6' }}>📅 {date}</div>
                            </div>

                            {/* Orta Taraf: Görsel Bar */}
                            <div style={{ flex: 1, margin: '0 30px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '5px', color: '#555' }}>
                                    <span>Performans</span>
                                    <span>{correctAnswers} / {totalQuestions} Doğru</span>
                                </div>
                                <div style={{ width: '100%', height: '10px', background: '#ecf0f1', borderRadius: '5px', overflow: 'hidden' }}>
                                    <div style={{ 
                                        width: `${score}%`, 
                                        height: '100%', 
                                        background: score >= 80 ? '#2ecc71' : score >= 50 ? '#f1c40f' : '#e74c3c',
                                        borderRadius: '5px',
                                        transition: 'width 1s ease'
                                    }}></div>
                                </div>
                            </div>

                            {/* Sağ Taraf: Puan */}
                            <div style={{ 
                                width: '60px', height: '60px', 
                                borderRadius: '50%', 
                                border: `3px solid ${score >= 50 ? '#2ecc71' : '#e74c3c'}`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontWeight: 'bold', fontSize: '1.2rem', color: '#2c3e50'
                            }}>
                                {score}
                            </div>

                        </div>
                    );
                })}
            </div>

            {history.length === 0 && (
                <div style={{ textAlign: 'center', color: '#95a5a6', marginTop: '50px' }}>
                    <h3 style={{fontSize:'2rem', marginBottom:'10px'}}>📉 Henüz veri yok</h3>
                    <p>Sınav geçmişiniz temizlendi veya henüz sınav çözmediniz.</p>
                    <button onClick={() => navigate('/dashboard')} className="btn-primary" style={{marginTop:'20px'}}>
                        İlk Sınavını Çöz
                    </button>
                </div>
            )}
        </div>
    );
}

export default HistoryPage;