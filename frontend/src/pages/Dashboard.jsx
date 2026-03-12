import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, LogOut, Clock, Activity, History, Zap, Target, TrendingUp, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { analyticsAPI } from '../api';
import AnalyticsChart from '../components/AnalyticsChart';

export default function Dashboard() {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [analytics, setAnalytics] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const data = await analyticsAPI.dashboard();
                setAnalytics(data);
            } catch (err) {
                console.error('Failed to fetch analytics:', err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchAnalytics();
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/auth');
    };

    const handleStartStudy = () => {
        navigate('/study');
    };

    // Build chart data from real sessions (focus minutes or duration)
    const focusData = analytics?.sessions
        ? analytics.sessions.slice().reverse().map(s => Math.round(s.duration_seconds / 60))
        : [];

    // Format seconds into human-readable duration
    const formatDuration = (totalMinutes) => {
        if (totalMinutes < 60) return `${Math.round(totalMinutes)}m`;
        const h = Math.floor(totalMinutes / 60);
        const m = Math.round(totalMinutes % 60);
        return m > 0 ? `${h}h ${m}m` : `${h}h`;
    };

    const formatSessionDate = (dateStr) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now - date;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return `Today, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        if (diffDays === 1) return `Yesterday, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' }) + `, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', paddingBottom: 'var(--space-xl)' }}>
            <header className="animate-fade-in" style={{
                backgroundColor: 'rgba(255,255,255,0.8)',
                backdropFilter: 'blur(10px)',
                borderBottom: '1px solid var(--color-border)',
                padding: '0 var(--space-lg)',
                position: 'sticky',
                top: 0,
                zIndex: 100
            }}>
                <div style={{ maxWidth: '1100px', margin: '0 auto', height: '72px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div className="flex items-center gap-sm">
                        <div style={{ width: 32, height: 32, backgroundColor: 'var(--color-primary)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Zap size={20} color="white" />
                        </div>
                        <h2 style={{ margin: 0, fontSize: 'var(--font-size-lg)', fontWeight: 700 }}>AI Study Assistant</h2>
                    </div>
                    <div className="flex items-center gap-sm">
                        {user && <span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>{user.email}</span>}
                        <button className="btn btn-outline" onClick={handleLogout}>
                            <LogOut size={16} /> Logout
                        </button>
                    </div>
                </div>
            </header>

            <main className="container flex-col animate-fade-in" style={{ gap: 'var(--space-lg)', marginTop: 'var(--space-lg)' }}>

                {/* Hero / Start Session */}
                <div className="glass-card text-center" style={{ padding: 'var(--space-xl) var(--space-md)', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(168, 85, 247, 0.05) 100%)', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <h1 style={{ fontSize: '40px', marginBottom: 'var(--space-sm)', color: 'var(--color-text-primary)' }}>
                            Welcome back{user ? `, ${user.email.split('@')[0]}` : ''}
                        </h1>
                        <p style={{ maxWidth: '600px', margin: '0 auto var(--space-lg)', fontSize: '18px' }}>
                            {analytics && analytics.total_sessions > 0
                                ? `You've completed ${analytics.total_sessions} sessions totaling ${analytics.total_study_hours}h of deep work.`
                                : 'Ready to start your first study session? Let\'s get focused!'
                            }
                        </p>
                        <button
                            className="btn btn-primary"
                            onClick={handleStartStudy}
                            style={{ fontSize: '18px', padding: '16px 40px', borderRadius: '40px' }}
                        >
                            <Play size={20} fill="white" /> Start Deep Work Session
                        </button>
                    </div>
                </div>

                {/* Stats Grid */}
                {isLoading ? (
                    <div className="flex items-center justify-center" style={{ padding: 'var(--space-xl)' }}>
                        <Loader2 size={32} color="var(--color-primary)" style={{ animation: 'spin 1s linear infinite' }} />
                    </div>
                ) : (
                    <>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-md)' }}>
                            <div className="card">
                                <div className="flex items-center gap-sm" style={{ marginBottom: '12px' }}>
                                    <Clock size={20} color="var(--color-primary)" />
                                    <span style={{ color: 'var(--color-text-secondary)', fontWeight: 500 }}>Total Study Time</span>
                                </div>
                                <div style={{ fontSize: '32px', fontWeight: 700 }}>{analytics?.total_study_hours || 0}h</div>
                                <div style={{ color: 'var(--color-text-secondary)', fontSize: '14px', marginTop: '4px' }}>
                                    {analytics?.total_sessions || 0} sessions completed
                                </div>
                            </div>
                            <div className="card">
                                <div className="flex items-center gap-sm" style={{ marginBottom: '12px' }}>
                                    <Target size={20} color="#8B5CF6" />
                                    <span style={{ color: 'var(--color-text-secondary)', fontWeight: 500 }}>Avg Session</span>
                                </div>
                                <div style={{ fontSize: '32px', fontWeight: 700 }}>
                                    {analytics?.avg_session_minutes ? formatDuration(analytics.avg_session_minutes) : '0m'}
                                </div>
                                <div style={{ color: 'var(--color-text-secondary)', fontSize: '14px', marginTop: '4px' }}>
                                    {analytics?.total_pomodoro_cycles || 0} pomodoro cycles
                                </div>
                            </div>
                            <div className="card">
                                <div className="flex items-center gap-sm" style={{ marginBottom: '12px' }}>
                                    <Activity size={20} color="#EC4899" />
                                    <span style={{ color: 'var(--color-text-secondary)', fontWeight: 500 }}>Vigilance Events</span>
                                </div>
                                <div style={{ fontSize: '32px', fontWeight: 700 }}>
                                    {(analytics?.total_fatigue_events || 0) + (analytics?.total_distractions || 0)}
                                </div>
                                <div style={{ color: 'var(--color-text-secondary)', fontSize: '14px', marginTop: '4px' }}>
                                    {analytics?.total_exercises_done || 0} exercises completed
                                </div>
                            </div>
                        </div>

                        {/* Analytics Section */}
                        {focusData.length > 1 && (
                            <div className="card" style={{ padding: 'var(--space-lg)' }}>
                                <div className="flex justify-between items-center" style={{ marginBottom: 'var(--space-lg)' }}>
                                    <h3 className="flex items-center gap-sm" style={{ margin: 0 }}>
                                        <TrendingUp size={24} color="var(--color-primary)" /> Session Duration Trends
                                    </h3>
                                    <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                                        Last {focusData.length} sessions (minutes)
                                    </span>
                                </div>
                                <AnalyticsChart data={focusData} height={200} />
                            </div>
                        )}

                        {/* Recent Sessions List */}
                        {analytics?.sessions && analytics.sessions.length > 0 && (
                            <div>
                                <h3 className="flex items-center gap-sm" style={{ marginBottom: 'var(--space-md)' }}>
                                    <History size={22} color="var(--color-primary)" /> Deep Work History
                                </h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                                    {analytics.sessions.slice(0, 10).map((session) => (
                                        <div key={session.id} className="card flex justify-between items-center" style={{ padding: 'var(--space-md) var(--space-lg)' }}>
                                            <div>
                                                <div style={{ fontWeight: 600, fontSize: '16px' }}>{formatSessionDate(session.start_time)}</div>
                                                <div style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                                                    Duration: {formatDuration(session.duration_seconds / 60)}
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', gap: 'var(--space-xl)', alignItems: 'center' }}>
                                                <div className="text-center">
                                                    <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Focus</div>
                                                    <div style={{ fontWeight: 600, color: 'var(--color-success)' }}>
                                                        {session.total_focus_minutes ? `${Math.round(session.total_focus_minutes)}m` : '-'}
                                                    </div>
                                                </div>
                                                <div className="text-center">
                                                    <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Alerts</div>
                                                    <div style={{ fontWeight: 600, color: (session.total_distractions + session.total_fatigue_events) > 0 ? 'var(--color-alert)' : 'var(--color-text-primary)' }}>
                                                        {session.total_distractions + session.total_fatigue_events}
                                                    </div>
                                                </div>
                                                <div className="text-center">
                                                    <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Pomodoros</div>
                                                    <div style={{ fontWeight: 600, color: 'var(--color-primary)' }}>
                                                        {session.pomodoro_cycles_completed}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Empty State */}
                        {analytics?.sessions?.length === 0 && (
                            <div className="card text-center" style={{ padding: 'var(--space-xl)' }}>
                                <p style={{ fontSize: '18px', color: 'var(--color-text-secondary)', margin: 0 }}>
                                    No study sessions yet. Start your first one! 🚀
                                </p>
                            </div>
                        )}
                    </>
                )}

            </main>
        </div>
    );
}
