import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import ActiveStudy from './pages/ActiveStudy';

function App() {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    <Route path="/" element={<Navigate to="/auth" replace />} />
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/dashboard" element={
                        <ProtectedRoute><Dashboard /></ProtectedRoute>
                    } />
                    <Route path="/study" element={
                        <ProtectedRoute><ActiveStudy /></ProtectedRoute>
                    } />
                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default App;
