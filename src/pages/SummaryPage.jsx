import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import { saveAs } from 'file-saver';
import '../App.css';

function SummaryPage() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const { summary, quiz } = location.state || {};

  // --- STATE ---
  const [showQuiz, setShowQuiz] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0); // Hangi sorudayız?
  const [userAnswers, setUserAnswers] = useState({}); // Cevaplar: {0: "A", 1: "E"}
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);

  // Veri kontrolü
  useEffect(() => {
    if (!summary) {
        // Boşsa işlem yapma
    }
  }, [summary]);

  if (!summary) {
      return (
        <div style={{padding:'40px', textAlign:'center'}}>
            <h3>⚠️ Veri bulunamadı.</h3>
            <p>Lütfen Dashboard'dan tekrar yükleme yapın.</p>
            <button onClick={()=>navigate('/dashboard')} className="btn-primary">Dashboard'a Dön</button>
        </div>
      );
  }

  // ŞIKLAR (E şıkkı otomatik eklenecek)
  const OPTION_LABELS = ["A", "B", "C", "D"];

  // --- CEVAP SEÇME ---
  const handleOptionSelect = (optionLabel) => {
    setUserAnswers(prev => ({
        ...prev,
        [currentQuestion]: optionLabel
    }));
  };

  // --- SAYFALANDIRMA (İleri/Geri) ---
  const handleNext = () => {
    if (currentQuestion < quiz.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrev = () => {
    if (currentQuestion > 0) {
        setCurrentQuestion(currentQuestion - 1);
    }
  };

  // --- TESTİ BİTİRME KONTROLÜ ---
  const finishQuiz = () => {
    // Boş soru kontrolü
    const answeredCount = Object.keys(userAnswers).length;
    if (answeredCount < quiz.length) {
        const missing = quiz.length - answeredCount;
        alert(`⚠️ Hala boş bıraktığın ${missing} soru var! Emin değilsen lütfen "Bilmiyorum" (E) seçeneğini işaretle.`);
        return; 
    }

    // Puanlama
    let correctCount = 0;
    quiz.forEach((q, i) => {
        const correctLetter = q.correct_answer.charAt(0).toUpperCase();
        const userLetter = (userAnswers[i] || "").charAt(0).toUpperCase();
        // E şıkkı (Bilmiyorum) puan getirmez ama yanlış gibi de sayılmaz (analiz için ayrılır)
        if (userLetter !== "E" && userLetter === correctLetter) {
            correctCount++;
        }
    });

    const calculatedScore = Math.round((correctCount / quiz.length) * 100);
    setScore(calculatedScore);
    
    // Geçmişe Kaydet
    saveToHistory(calculatedScore, correctCount);
    
    setShowResult(true);
    // Sonuçları görmek için yukarı kaydır
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const saveToHistory = (s, c) => {
    const historyItem = {
        title: summary.split('.')[0].substring(0, 40) + "...",
        date: new Date().toLocaleString('tr-TR'),
        score: s,
        totalQuestions: quiz.length,
        correctAnswers: c
    };
    const saved = JSON.parse(localStorage.getItem('quiz_history') || "[]");
    saved.unshift(historyItem);
    localStorage.setItem('quiz_history', JSON.stringify(saved));
  };

  // --- ÇALIŞMA LİSTESİ OLUŞTURMA (NotebookLM Mantığı) ---
  const getStudyPlan = () => {
    const unknown = []; // Bilmiyorum dedikleri
    const wrong = [];   // Yanlış yaptıkları

    quiz.forEach((q, i) => {
        const userAns = userAnswers[i];
        const correct = q.correct_answer.charAt(0).toUpperCase();

        if (userAns === "E") {
            unknown.push({ index: i + 1, text: q.text });
        } else if (userAns !== correct) {
            wrong.push({ index: i + 1, text: q.text });
        }
    });

    return { unknown, wrong };
  };

  // --- İNDİRME ---
  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16); doc.text("Ders Özeti", 10, 15);
    doc.setFontSize(11); doc.text(doc.splitTextToSize(summary, 190), 10, 25);
    doc.save("ozet.pdf");
  };

  const downloadWord = () => {
      const doc = new Document({
          sections: [{ children: [ new Paragraph({ children: [new TextRun({ text: summary })] }) ] }]
      });
      Packer.toBlob(doc).then(blob => saveAs(blob, "ozet.docx"));
  };

  return (
    <div className="animate-fade" style={{ padding: '40px', maxWidth: '900px', margin: '0 auto' }}>
      
      {/* BAŞLIK */}
      <header style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'30px'}}>
        <h2 style={{color:'#2c3e50', margin:0}}>📝 Ders Çalışma Alanı</h2>
        <div style={{display:'flex', gap:'10px'}}>
             <button onClick={()=>navigate('/dashboard')} className="btn-secondary">← Yeni Analiz</button>
        </div>
      </header>

      {/* ÖZET KARTI (Test başlamadıysa ve sonuç yoksa görünür) */}
      {!showQuiz && !showResult && (
        <>
            <div className="card summary-paper" style={{minHeight:'300px', whiteSpace: 'pre-line', lineHeight: '1.8', fontSize:'1.1rem', marginBottom:'30px'}}>
                {summary}
            </div>
            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
                <button onClick={downloadPDF} className="btn-secondary" style={{backgroundColor:'#e74c3c', color:'white'}}>📥 PDF</button>
                <button onClick={downloadWord} className="btn-secondary" style={{backgroundColor:'#2980b9', color:'white'}}>📄 Word</button>
                <button 
                    onClick={() => setShowQuiz(true)}
                    className="btn-primary"
                    style={{ backgroundColor: '#8e44ad', padding: '15px 40px', fontSize: '1.1rem' }}
                >
                    🎯 Testi Başlat
                </button>
            </div>
        </>
      )}

      {/* --- QUİZ MODU (TEK SORU SİSTEMİ) --- */}
      {showQuiz && !showResult && (
        <div className="animate-fade" style={{ marginTop: '20px' }}>
            {/* İlerleme Çubuğu */}
            <div style={{marginBottom:'10px', display:'flex', justifyContent:'space-between', color:'#7f8c8d', fontSize:'0.9rem'}}>
                <span>Soru {currentQuestion + 1} / {quiz.length}</span>
                <span>Tamamlanan: {Math.round(((currentQuestion)/quiz.length)*100)}%</span>
            </div>
            <div style={{height:'8px', background:'#eee', borderRadius:'4px', marginBottom:'30px', overflow:'hidden'}}>
                <div style={{width:`${((currentQuestion + 1)/quiz.length)*100}%`, height:'100%', background:'#8e44ad', transition:'width 0.3s'}}></div>
            </div>

            <div className="card" style={{ padding: '30px', borderLeft: '5px solid #9b59b6' }}>
                <h3 style={{ color: '#2c3e50', marginBottom: '25px', lineHeight:'1.4' }}>
                    {quiz[currentQuestion].text}
                </h3>

                <div style={{ display: 'grid', gap: '15px' }}>
                    {/* A, B, C, D Şıkları */}
                    {quiz[currentQuestion].options.map((opt, i) => {
                        const label = OPTION_LABELS[i]; // A, B, C, D
                        const isSelected = userAnswers[currentQuestion] === label;
                        return (
                            <div 
                                key={i}
                                onClick={() => handleOptionSelect(label)}
                                style={{
                                    padding: '15px', border: isSelected ? '2px solid #8e44ad' : '1px solid #eee',
                                    borderRadius: '10px', background: isSelected ? '#f3e5f5' : 'white',
                                    cursor: 'pointer', display: 'flex', gap: '10px', alignItems:'center', transition:'all 0.2s'
                                }}
                            >
                                <div style={{
                                    width:'30px', height:'30px', 
                                    background: isSelected?'#8e44ad':'#eee', 
                                    color:isSelected?'white':'#555', 
                                    borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'bold'
                                }}>
                                    {label}
                                </div>
                                {opt}
                            </div>
                        );
                    })}

                    {/* E Şıkkı - Bilmiyorum (ÖZEL) */}
                    <div 
                        onClick={() => handleOptionSelect("E")}
                        style={{
                            padding: '15px', border: userAnswers[currentQuestion] === "E" ? '2px solid #f39c12' : '1px solid #eee',
                            borderRadius: '10px', background: userAnswers[currentQuestion] === "E" ? '#fef9e7' : 'white',
                            cursor: 'pointer', display: 'flex', gap: '10px', alignItems:'center', marginTop:'10px'
                        }}
                    >
                        <div style={{width:'30px', height:'30px', background: userAnswers[currentQuestion]==="E"?'#f39c12':'#eee', color:userAnswers[currentQuestion]==="E"?'white':'#555', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'bold'}}>E</div>
                        <span style={{fontStyle:'italic', color:'#7f8c8d'}}>Bu konuyu bilmiyorum / Emin değilim</span>
                    </div>
                </div>
            </div>

            {/* Navigasyon Butonları */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '30px' }}>
                <button 
                    onClick={handlePrev} 
                    disabled={currentQuestion === 0}
                    className="btn-secondary"
                    style={{opacity: currentQuestion===0 ? 0.5 : 1}}
                >
                    ⬅️ Önceki Soru
                </button>

                {currentQuestion === quiz.length - 1 ? (
                    <button 
                        onClick={finishQuiz}
                        className="btn-primary"
                        style={{ background: '#27ae60' }}
                    >
                        ✅ Testi Bitir
                    </button>
                ) : (
                    <button 
                        onClick={handleNext}
                        className="btn-primary"
                    >
                        Sonraki Soru ➡️
                    </button>
                )}
            </div>
        </div>
      )}

      {/* --- SONUÇ VE ÇALIŞMA PLANI --- */}
      {showResult && (
        <div className="animate-fade">
            
            {/* Skor Kartı */}
            <div style={{textAlign:'center', padding:'30px', background: score>=50?'#d4edda':'#f8d7da', borderRadius:'15px', color: score>=50?'#155724':'#721c24', marginBottom:'30px'}}>
                <h1 style={{margin:0, fontSize:'3rem'}}>{score}</h1>
                <p>PUAN</p>
            </div>

            {/* 🔥 AKILLI ÇALIŞMA LİSTESİ (NotebookLM Tarzı) */}
            <div className="card" style={{borderLeft:'5px solid #e67e22', padding:'25px', marginBottom:'30px', background:'#fff'}}>
                <h3 style={{color:'#d35400', marginTop:0}}>🚀 Kişisel Çalışma Planın</h3>
                <p style={{color:'#7f8c8d', fontSize:'0.9rem'}}>Yapay zeka performansına göre öncelik listesi hazırladı:</p>
                
                {(() => {
                    const plan = getStudyPlan();
                    if (plan.unknown.length === 0 && plan.wrong.length === 0) 
                        return <p style={{color:'#27ae60', fontWeight:'bold', marginTop:'15px'}}>Harika! Hiç eksiğin görünmüyor. 🎉</p>;
                    
                    return (
                        <div style={{display:'flex', flexDirection:'column', gap:'15px', marginTop:'15px'}}>
                            {/* Öncelik 1: Bilmedikleri */}
                            {plan.unknown.length > 0 && (
                                <div style={{background:'#fef9e7', padding:'15px', borderRadius:'10px', border:'1px solid #f39c12'}}>
                                    <strong style={{color:'#d35400'}}>🔥 Öncelik 1: Tamamen Bilinmeyen Konular</strong>
                                    <ul style={{margin:'10px 0 0 20px', color:'#555'}}>
                                        {plan.unknown.map((item, i) => <li key={i}>Soru {item.index}: {item.text}</li>)}
                                    </ul>
                                </div>
                            )}

                            {/* Öncelik 2: Yanlış Yaptıkları */}
                            {plan.wrong.length > 0 && (
                                <div style={{background:'#fdecec', padding:'15px', borderRadius:'10px', border:'1px solid #e74c3c'}}>
                                    <strong style={{color:'#c0392b'}}>⚠️ Öncelik 2: Yanlış Anlaşılan Konular</strong>
                                    <ul style={{margin:'10px 0 0 20px', color:'#555'}}>
                                        {plan.wrong.map((item, i) => <li key={i}>Soru {item.index}: {item.text}</li>)}
                                    </ul>
                                </div>
                            )}
                        </div>
                    );
                })()}
            </div>

            {/* DETAYLI ANALİZ (Açıklamalı) */}
            <h3 style={{color:'#2c3e50'}}>📝 Detaylı Soru Analizi</h3>
            {quiz.map((q, index) => {
                const correctLetter = q.correct_answer.charAt(0).toUpperCase();
                const userLetter = (userAnswers[index] || "").charAt(0).toUpperCase();
                const isUnknown = userLetter === "E";
                const isCorrect = userLetter === correctLetter;

                return (
                    <div key={index} className="card" style={{marginBottom:'20px', padding:'25px', borderLeft: isCorrect?'5px solid #2ecc71':(isUnknown?'5px solid #f39c12':'5px solid #e74c3c')}}>
                        <h4 style={{color:'#2c3e50', marginBottom:'15px'}}>
                            {index+1}. {q.text} 
                            {isUnknown && <span style={{fontSize:'0.8rem', background:'#f39c12', color:'white', padding:'2px 8px', borderRadius:'5px', marginLeft:'10px'}}>Bilmiyorum</span>}
                        </h4>
                        
                        <div style={{marginBottom:'15px'}}>
                            {q.options.map((opt, i) => {
                                const lbl = OPTION_LABELS[i];
                                let color = '#555';
                                let bg = 'transparent';
                                let border = '1px solid #eee';

                                if (lbl === correctLetter) {
                                    bg = '#d4edda'; border = '1px solid #28a745'; color = '#155724'; // Doğru
                                } else if (userLetter === lbl && !isCorrect) {
                                    bg = '#f8d7da'; border = '1px solid #dc3545'; color = '#721c24'; // Yanlış
                                }

                                return (
                                    <div key={i} style={{padding:'8px 12px', background:bg, border:border, borderRadius:'5px', marginBottom:'5px', color:color, fontSize:'0.95rem'}}>
                                        <strong>{lbl})</strong> {opt}
                                    </div>
                                )
                            })}
                        </div>

                        {/* YAPAY ZEKA AÇIKLAMASI */}
                        <div style={{background:'#f8f9fa', padding:'15px', borderRadius:'8px', fontSize:'0.9rem', color:'#444', fontStyle:'italic'}}>
                            <strong>💡 Neden?</strong> <br/>
                            {q.explanation || "Açıklama mevcut değil."}
                        </div>
                    </div>
                );
            })}
            
            <div style={{textAlign:'center', marginTop:'30px'}}>
                <button onClick={()=>window.location.reload()} className="btn-secondary">Yeni Analiz Yap</button>
            </div>
        </div>
      )}

    </div>
  );
}

export default SummaryPage;