import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { BookOpen, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Auth() {
    const [isLoginMode, setIsLoginMode] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { login, register, error, setError, token } = useAuth();
    const navigate = useNavigate();

    // If already logged in, redirect cleanly using Navigate component
    if (token) {
        return <Navigate to="/dashboard" replace />;
    }


    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        try {
            if (isLoginMode) {
                await login(email, password);
            } else {
                await register(email, password);
            }
            navigate('/dashboard');
        } catch (err) {
            // Error is already set in AuthContext
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center h-screen" style={{ backgroundColor: 'var(--color-bg)', minHeight: '100vh' }}>
            <div className="card w-full animate-fade-in" style={{ maxWidth: '420px' }}>
                <div className="flex flex-col items-center text-center" style={{ marginBottom: 'var(--space-lg)' }}>
                    <div style={{
                        width: 56, height: 56, borderRadius: '16px',
                        background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-hover))',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        marginBottom: 'var(--space-sm)',
                        boxShadow: '0 8px 24px rgba(99, 102, 241, 0.3)'
                    }}>
                        <BookOpen color="white" size={28} />
                    </div>
                    <h2 style={{ margin: '0 0 4px 0' }}>AI Study Assistant</h2>
                    <p style={{ color: 'var(--color-text-secondary)', margin: 0 }}>
                        {isLoginMode ? 'Sign in to your account' : 'Create a new account'}
                    </p>
                </div>

                {error && (
                    <div style={{
                        padding: '12px 16px', marginBottom: 'var(--space-md)',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--color-alert)',
                        borderRadius: 'var(--border-radius-sm)', fontSize: 'var(--font-size-sm)',
                        border: '1px solid rgba(239, 68, 68, 0.2)'
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="flex flex-col gap-sm">
                    <div>
                        <label style={{ display: 'block', marginBottom: '6px', fontSize: 'var(--font-size-sm)', fontWeight: 500, color: 'var(--color-text-secondary)' }}>
                            Email
                        </label>
                        <input
                            type="email"
                            className="form-input w-full"
                            placeholder="student@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            disabled={isSubmitting}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '6px', fontSize: 'var(--font-size-sm)', fontWeight: 500, color: 'var(--color-text-secondary)' }}>
                            Password
                        </label>
                        <input
                            type="password"
                            className="form-input w-full"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={6}
                            disabled={isSubmitting}
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary w-full"
                        style={{ padding: '14px', marginTop: 'var(--space-xs)', fontSize: '16px' }}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Processing...</>
                        ) : (
                            isLoginMode ? 'Login' : 'Create Account'
                        )}
                    </button>
                </form>

                <div className="text-center" style={{ marginTop: 'var(--space-lg)' }}>
                    <button
                        type="button"
                        className="btn btn-outline w-full"
                        onClick={() => { setIsLoginMode(!isLoginMode); setError(null); }}
                        disabled={isSubmitting}
                    >
                        {isLoginMode ? 'Need an account? Register' : 'Already have an account? Login'}
                    </button>
                </div>
            </div>
        </div>
    );
}
