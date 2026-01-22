import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import '../App.css';

function QuizPage() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Dashboard veya Summary sayfasından gelen verileri al
  const questions = location.state?.questions || [];
  // Konu başlığı olarak kullanmak için özeti de alıyoruz (Yoksa "Genel Konu" yazar)
  const summaryText = location.state?.summary || "Genel Çalışma"; 

  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({}); // {0: "A", 1: "B"}
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [advice, setAdvice] = useState('');
  const [loadingAdvice, setLoadingAdvice] = useState(false);

  // Sorular yüklenmediyse geri gönder
  if (questions.length === 0) {
    return <div style={{padding:'40px'}}>Soru bulunamadı. Lütfen Dashboard'dan başlayın. <button onClick={()=>navigate('/dashboard')}>Dashboard'a Dön</button></div>;
  }

  const currentQuestion = questions[currentQIndex];

  const handleOptionSelect = (option) => {
    setUserAnswers({ ...userAnswers, [currentQIndex]: option });
  };

  const handleNext = () => {
    if (currentQIndex < questions.length - 1) {
      setCurrentQIndex(currentQIndex + 1);
    } else {
      finishQuiz();
    }
  };

  // --- VERİTABANINA KAYDETME FONKSİYONU ---
  // ✅ GÜNCELLEME: correctCount ve totalQs parametrelerini de alıyor
  const saveToHistory = async (finalScore, finalAdvice, correctCount, totalQs) => {
      const userEmail = localStorage.getItem('user_email');
      if (!userEmail) return; // Kullanıcı girişi yoksa kaydetme

      // Konu başlığı çok uzunsa kısaltalım
      const topicTitle = summaryText.length > 40 ? summaryText.substring(0, 40) + "..." : summaryText;

      try {
          await fetch('http://localhost:5000/api/history/save', {
              method: 'POST',
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify({
                  email: userEmail,
                  score: finalScore,
                  correct_count: correctCount, // ✅ EKLENDİ: İstatistik için
                  total_questions: totalQs,    // ✅ EKLENDİ: İstatistik için
                  topic: topicTitle,
                  advice: finalAdvice
              })
          });
          console.log("Geçmiş kaydedildi!");
      } catch (error) {
          console.error("Geçmiş kaydetme hatası:", error);
      }
  };

  const finishQuiz = async () => {
    // 1. Puanı Hesapla
    let correctCount = 0;
    let wrongQs = [];
    questions.forEach((q, idx) => {
        if (userAnswers[idx] === q.correct_answer) {
            correctCount++;
        } else {
            wrongQs.push(q.text);
        }
    });

    const calculatedScore = Math.round((correctCount / questions.length) * 100);
    const totalQuestions = questions.length;

    setScore(calculatedScore);
    setShowResult(true);

    let finalAdvice = "";

    // 2. Tavsiye Al ve Kaydet
    if (wrongQs.length > 0) {
        setLoadingAdvice(true);
        try {
            const res = await fetch('http://localhost:5000/api/evaluate', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ wrong_questions: wrongQs })
            });
            const data = await res.json();
            finalAdvice = data.advice;
            setAdvice(finalAdvice);
        } catch(e) { 
            finalAdvice = "Tavsiye alınamadı.";
            setAdvice(finalAdvice); 
        } finally { 
            setLoadingAdvice(false);
            // ✅ GÜNCELLEME: İstatistik verilerini de gönderiyoruz
            saveToHistory(calculatedScore, finalAdvice, correctCount, totalQuestions);
        }
    } else {
        finalAdvice = "Mükemmel! Hatanız yok. 🌟";
        setAdvice(finalAdvice);
        // ✅ GÜNCELLEME: İstatistik verilerini de gönderiyoruz
        saveToHistory(calculatedScore, finalAdvice, correctCount, totalQuestions);
    }
  };

  if (showResult) {
    return (
      <div className="animate-fade" style={{ padding: '40px', textAlign:'center', maxWidth:'600px', margin:'0 auto' }}>
        <div className="card">
            <h1>Sonuç</h1>
            <div style={{fontSize:'4rem', fontWeight:'bold', color: score >= 50 ? 'green' : 'red'}}>
                {score}
            </div>
            <p>Puan</p>
            
            <hr style={{margin:'20px 0', opacity:0.2}}/>
            
            <h3>🤖 AI Tavsiyesi:</h3>
            {loadingAdvice ? (
                <p>Analiz ediliyor...</p>
            ) : (
                <p style={{fontStyle:'italic', color:'#555', lineHeight:'1.6'}}>{advice}</p>
            )}

            <button onClick={()=>navigate('/dashboard')} className="btn-primary" style={{marginTop:'30px'}}>
                Yeni Konu Çalış
            </button>
            
            {/* Geçmişe gitmek için ek buton */}
            <button onClick={()=>navigate('/history')} className="btn-secondary" style={{marginTop:'10px', marginLeft:'10px', background:'#3498db', color:'white'}}>
                Geçmişimi Gör 📊
            </button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade" style={{ padding: '40px', maxWidth:'800px', margin:'0 auto' }}>
      <div className="card">
        <div style={{display:'flex', justifyContent:'space-between', marginBottom:'20px', opacity:0.6}}>
            <span>Soru {currentQIndex + 1} / {questions.length}</span>
            <span>Academic Quiz</span>
        </div>

        <h3 style={{fontSize:'1.4rem', marginBottom:'30px'}}>{currentQuestion.text}</h3>

        <div style={{display:'flex', flexDirection:'column', gap:'10px'}}>
            {currentQuestion.options.map((opt, idx) => (
                <button 
                    key={idx}
                    onClick={() => handleOptionSelect(opt)}
                    className="modern-select"
                    style={{
                        textAlign:'left', 
                        padding:'15px', 
                        cursor:'pointer',
                        background: userAnswers[currentQIndex] === opt ? '#e3f2fd' : 'white',
                        border: userAnswers[currentQIndex] === opt ? '2px solid #2196f3' : '1px solid #ddd'
                    }}
                >
                    {opt}
                </button>
            ))}
        </div>

        <div style={{marginTop:'30px', textAlign:'right'}}>
            <button 
                className="btn-primary" 
                onClick={handleNext}
                disabled={!userAnswers[currentQIndex]}
            >
                {currentQIndex === questions.length - 1 ? "Sınavı Bitir" : "Sonraki Soru →"}
            </button>
        </div>
      </div>
    </div>
  );
}

export default QuizPage;