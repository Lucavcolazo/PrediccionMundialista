import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Navbar } from './components/Navbar';
import { ProtectedRoute } from './components/ProtectedRoute';
import Home from './pages/Home';
import Groups from './pages/Groups';
import Predictions from './pages/Predictions';
import Leaderboard from './pages/Leaderboard';
import Login from './pages/Login';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
          <Routes>
            {/* Public: Login */}
            <Route path="/login" element={<Login />} />

            {/* Protected routes with Navbar */}
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <Navbar />
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/groups" element={<Groups />} />
                    <Route path="/predictions" element={<Predictions />} />
                    <Route path="/leaderboard" element={<Leaderboard />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </ProtectedRoute>
              }
            />
          </Routes>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}
