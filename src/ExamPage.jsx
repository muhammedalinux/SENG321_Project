import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import '../App.css';

function ExamPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const { quiz, topicTitle } = location.state || {};

    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [userAnswers, setUserAnswers] = useState({});
    const [showResult, setShowResult] = useState(false);
    const [score, setScore] = useState(0);

    if (!quiz || quiz.length === 0) {
        return <div style={{padding:'40px'}}>Veri yok. <button onClick={()=>navigate('/dashboard')}>Geri Dön</button></div>;
    }

    const handleOptionSelect = (optionLabel) => {
        if (showResult) return;
        setUserAnswers(prev => ({
            ...prev,
            [currentQuestion]: optionLabel
        }));
    };

    const handleNext = () => {
        if (currentQuestion < quiz.length - 1) {
            setCurrentQuestion(currentQuestion + 1);
        } else {
            finishExam();
        }
    };

    const handlePrev = () => {
        if (currentQuestion > 0) {
            setCurrentQuestion(currentQuestion - 1);
        }
    };

    const finishExam = () => {
        let correctCount = 0;
        quiz.forEach((q, index) => {
            const answer = userAnswers[index]; // "A", "B" gibi gelir
            // Backend'den gelen correct_answer bazen "A" bazen "Option A" olabilir. 
            // Garanti olsun diye sadece ilk harfe bakıyoruz.
            if (answer === q.correct_answer.charAt(0)) {
                correctCount++;
            }
        });

        const calculatedScore = Math.round((correctCount / quiz.length) * 100);
        setScore(calculatedScore);
        setShowResult(true);

        // GEÇMİŞE KAYDET
        const resultData = {
            id: Date.now(),
            date: new Date().toLocaleString('tr-TR'),
            title: topicTitle || `Quiz #${Math.floor(Math.random()*1000)}`,
            score: calculatedScore,
            totalQuestions: quiz.length,
            correctAnswers: correctCount,
        };

        const previousHistory = JSON.parse(localStorage.getItem('quiz_history') || "[]");
        previousHistory.unshift(resultData);
        localStorage.setItem('quiz_history', JSON.stringify(previousHistory));
    };

    // Şık Etiketleri (A, B, C, D)
    const labels = ["A", "B", "C", "D"];

    return (
        <div className="animate-fade" style={{ padding: '40px', maxWidth: '800px', margin: '0 auto', minHeight: '100vh', background: '#f4f6f8' }}>
            
            {/* ÜST BİLGİ ÇUBUĞU */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center' }}>
                <h3 style={{ margin: 0, color: '#2c3e50' }}>{topicTitle || "Sınav Modu"}</h3>
                <div style={{ background: '#e0e0e0', padding: '5px 15px', borderRadius: '20px', fontSize: '0.9rem', fontWeight: 'bold' }}>
                    Soru {currentQuestion + 1} / {quiz.length}
                </div>
            </div>

            {/* İLERLEME ÇUBUĞU */}
            <div style={{ width: '100%', height: '8px', background: '#ddd', borderRadius: '4px', marginBottom: '30px' }}>
                <div style={{ 
                    width: `${((currentQuestion + 1) / quiz.length) * 100}%`, 
                    height: '100%', 
                    background: '#3498db', 
                    borderRadius: '4px',
                    transition: 'width 0.3s ease'
                }}></div>
            </div>

            {!showResult ? (
                // --- SORU KARTI ---
                <div className="card" style={{ padding: '40px', background: 'white', borderRadius: '15px', boxShadow: '0 5px 15px rgba(0,0,0,0.05)' }}>
                    <h2 style={{ fontSize: '1.4rem', color: '#2c3e50', marginBottom: '30px', lineHeight: '1.5' }}>
                        {currentQuestion + 1}. {quiz[currentQuestion].text}
                    </h2>

                    <div style={{ display: 'grid', gap: '15px' }}>
                        {quiz[currentQuestion].options.map((opt, index) => {
                            const label = labels[index]; // A, B, C, D
                            const isSelected = userAnswers[currentQuestion] === label;

                            return (
                                <div 
                                    key={index} 
                                    onClick={() => handleOptionSelect(label)}
                                    style={{ 
                                        padding: '15px 20px', 
                                        border: isSelected ? '2px solid #3498db' : '2px solid #eee',
                                        borderRadius: '10px',
                                        cursor: 'pointer',
                                        background: isSelected ? '#f0f9ff' : 'white',
                                        transition: 'all 0.2s',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '15px'
                                    }}
                                >
                                    <div style={{ 
                                        width: '30px', height: '30px', 
                                        background: isSelected ? '#3498db' : '#eee', 
                                        color: isSelected ? 'white' : '#555',
                                        borderRadius: '50%', 
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontWeight: 'bold'
                                    }}>
                                        {label}
                                    </div>
                                    <span style={{ fontSize: '1.1rem', color: '#333' }}>{opt}</span>
                                </div>
                            );
                        })}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '40px' }}>
                        <button 
                            onClick={handlePrev} 
                            disabled={currentQuestion === 0}
                            className="btn-secondary"
                            style={{ opacity: currentQuestion === 0 ? 0.5 : 1 }}
                        >
                            ← Önceki
                        </button>
                        
                        <button 
                            onClick={handleNext}
                            className="btn-primary"
                            style={{ padding: '12px 40px', fontSize: '1.1rem' }}
                        >
                            {currentQuestion === quiz.length - 1 ? "Sınavı Bitir 🏁" : "Sonraki →"}
                        </button>
                    </div>
                </div>
            ) : (
                // --- SONUÇ EKRANI ---
                <div className="animate-fade">
                    <div className="card" style={{ textAlign: 'center', padding: '40px', background: 'white', borderRadius: '15px', marginBottom: '30px' }}>
                        <div style={{ fontSize: '4rem', marginBottom: '10px' }}>
                            {score >= 80 ? '🏆' : score >= 50 ? '🙂' : '😔'}
                        </div>
                        <h1 style={{ color: score >= 50 ? '#27ae60' : '#e74c3c', fontSize: '3rem', margin: 0 }}>{score}</h1>
                        <p style={{ color: '#7f8c8d', fontSize: '1.2rem' }}>Puan</p>
                        
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '20px' }}>
                            <button onClick={() => navigate('/dashboard')} className="btn-secondary">Yeni Konu</button>
                            <button onClick={() => navigate('/history')} className="btn-primary">Geçmişe Git</button>
                        </div>
                    </div>

                    {/* DETAYLI ANALİZ */}
                    <h3 style={{ color: '#2c3e50', marginBottom: '20px' }}>📝 Detaylı Soru Analizi</h3>
                    {quiz.map((q, index) => {
                        const userAnswer = userAnswers[index];
                        const isCorrect = userAnswer === q.correct_answer.charAt(0);

                        return (
                            <div key={index} className="card" style={{ 
                                padding: '25px', 
                                marginBottom: '20px', 
                                borderLeft: isCorrect ? '6px solid #27ae60' : '6px solid #e74c3c',
                                background: 'white'
                            }}>
                                <h4 style={{ margin: '0 0 15px 0', color: '#34495e' }}>{index + 1}. {q.text}</h4>
                                
                                <div style={{ display: 'grid', gap: '8px', marginBottom: '15px' }}>
                                    {q.options.map((opt, i) => {
                                        const label = labels[i];
                                        let style = { padding: '10px', borderRadius: '5px', border: '1px solid #eee', fontSize: '0.95rem' };
                                        
                                        // Doğru şıkkı yeşil yap
                                        if (label === q.correct_answer.charAt(0)) {
                                            style.background = '#d4edda'; style.border = '1px solid #28a745'; style.color = '#155724'; style.fontWeight = 'bold';
                                        }
                                        // Yanlış işaretlenen şıkkı kırmızı yap
                                        else if (userAnswer === label && !isCorrect) {
                                            style.background = '#f8d7da'; style.border = '1px solid #dc3545'; style.color = '#721c24';
                                        }

                                        return (
                                            <div key={i} style={style}>
                                                <strong>{label})</strong> {opt}
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* AÇIKLAMA ALANI */}
                                <div style={{ background: '#fff3cd', padding: '15px', borderRadius: '8px', borderLeft: '4px solid #ffc107', fontSize: '0.9rem', color: '#856404' }}>
                                    <strong>💡 Neden?</strong> {q.explanation || "Bu soru için detaylı açıklama bulunmuyor."}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default ExamPage;