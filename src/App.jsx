import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';
import HistoryPage from './pages/HistoryPage';
import SummaryPage from './pages/SummaryPage';
import PodcastGenerator from './PodcastGenerator';
import ProtectedRoute from './ProtectedRoute';
import './App.css';

function App() {
  // Dark Mode State
  const [darkMode, setDarkMode] = useState(false);

  // Dark Mode'u Body'ye uygula
  useEffect(() => {
    if (darkMode) document.body.classList.add('dark-mode');
    else document.body.classList.remove('dark-mode');
  }, [darkMode]);

  return (
    <Router>
      {/* 🌙 DARK MODE BUTONU (HER SAYFADA GÖRÜNSÜN) */}
      <div style={{ position: 'fixed', bottom: '20px', left: '20px', zIndex: 1000 }}>
        <button 
          onClick={() => setDarkMode(!darkMode)}
          style={{
            background: darkMode ? '#fff' : '#333',
            color: darkMode ? '#333' : '#fff',
            border: 'none',
            borderRadius: '50%',
            width: '50px',
            height: '50px',
            fontSize: '24px',
            cursor: 'pointer',
            boxShadow: '0 4px 10px rgba(0,0,0,0.3)'
          }}
        >
          {darkMode ? '☀️' : '🌙'}
        </button>
      </div>

      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/history" element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />
        <Route path="/summary" element={<ProtectedRoute><SummaryPage /></ProtectedRoute>} />
        <Route path="/podcast" element={<ProtectedRoute><PodcastGenerator /></ProtectedRoute>} />
      </Routes>
    </Router>
  );
}

export default App;