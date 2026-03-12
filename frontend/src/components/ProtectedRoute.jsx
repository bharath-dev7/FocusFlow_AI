import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
    const { token, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                height: '100vh', backgroundColor: 'var(--color-bg)'
            }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{
                        width: 40, height: 40, border: '3px solid var(--color-border)',
                        borderTopColor: 'var(--color-primary)', borderRadius: '50%',
                        animation: 'spin 0.8s linear infinite', margin: '0 auto 16px'
                    }} />
                    <p style={{ color: 'var(--color-text-secondary)' }}>Loading...</p>
                </div>
            </div>
        );
    }

    if (!token) {
        return <Navigate to="/auth" replace />;
    }

    return children;
}
