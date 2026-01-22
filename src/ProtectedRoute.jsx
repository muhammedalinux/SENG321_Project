import React from 'react';
import { Navigate } from 'react-router-dom';

function ProtectedRoute({ children }) {
    // Tarayıcı hafızasında bilet (token) var mı?
    const isAuthenticated = localStorage.getItem('user_token');

    // Bilet varsa sayfayı göster, yoksa Giriş'e şutla.
    return isAuthenticated ? children : <Navigate to="/" replace />;
}

export default ProtectedRoute;