import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Music } from 'lucide-react';
import Timer from '../components/Timer';
import CameraPreview from '../components/CameraPreview';
import Chatbot from '../components/Chatbot';
import InterventionModal from '../components/InterventionModal';
import PomodoroTimer from '../components/PomodoroTimer';
import ReactionGame from '../components/ReactionGame';
import { SessionProvider, useSession } from '../context/SessionContext';

function ActiveStudyInner() {
    const [showExerciseModal, setShowExerciseModal] = useState(false);
    const navigate = useNavigate();
    const { sessionId, startSession, endSession, trackEvent } = useSession();

    const [videoUrl, setVideoUrl] = useState('jfKfPfyJRdk'); // Default Lofi Girl
    const [topic, setTopic] = useState('');
    const [isStarting, setIsStarting] = useState(true);

    // Start session on mount
    useEffect(() => {
        const init = async () => {
            try {
                await startSession();
            } catch (err) {
                console.error('Failed to start session:', err);
                navigate('/dashboard');
            } finally {
                setIsStarting(false);
            }
        };
        init();
    }, []);

    const handleEndSession = async () => {
        await endSession();
        navigate('/dashboard');
    };

    const handleDetection = (type) => {
        if (type === 'fatigue') {
            trackEvent('fatigue_detected');
        } else if (type === 'distraction') {
            trackEvent('distraction_detected');
        }
        setShowExerciseModal(true);
    };

    const handleSuggestMusic = () => {
        const lowerTopic = topic.toLowerCase();
        if (lowerTopic.includes('lofi') || lowerTopic.includes('chill')) setVideoUrl('jfKfPfyJRdk');
        else if (lowerTopic.includes('classical') || lowerTopic.includes('piano')) setVideoUrl('4Tr0otuiQuU');
        else if (lowerTopic.includes('nature') || lowerTopic.includes('rain')) setVideoUrl('eKFTSSKCzWA');
        else if (lowerTopic.includes('synthwave') || lowerTopic.includes('retro')) setVideoUrl('4xDzrJKXOOY');
        else setVideoUrl('jfKfPfyJRdk');
    };

    if (isStarting) {
        return (
            <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--color-bg)' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{
                        width: 48, height: 48, border: '3px solid var(--color-border)',
                        borderTopColor: 'var(--color-primary)', borderRadius: '50%',
                        animation: 'spin 0.8s linear infinite', margin: '0 auto 16px'
                    }} />
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: '18px' }}>Initializing study session...</p>
                </div>
            </div>
        );
    }

    return (
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--color-bg)' }}>
            {/* Top Navigation */}
            <header className="flex justify-between items-center" style={{ padding: 'var(--space-md) var(--space-xl)', backgroundColor: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(10px)', borderBottom: '1px solid var(--color-border)' }}>
                <div className="flex items-center gap-sm">
                    <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: 'var(--color-success)', boxShadow: '0 0 8px var(--color-success)' }}></div>
                    <h3 style={{ margin: 0, fontWeight: 700, letterSpacing: '-0.02em' }}>Deep Work Active</h3>
                    <Timer />
                </div>
                <div>
                    <button className="btn btn-danger" onClick={handleEndSession}>End Session</button>
                </div>
            </header>

            {/* Main Study Area */}
            <main style={{ flex: 1, display: 'flex', padding: 'var(--space-lg)', gap: 'var(--space-lg)', overflow: 'hidden' }}>

                {/* Left Column (Music & Camera) */}
                <div style={{ flex: '65%', display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)', overflowY: 'auto', paddingRight: '4px' }}>

                    {/* Widgets row */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-lg)' }}>
                        <PomodoroTimer onCycleComplete={() => trackEvent('pomodoro_completed')} />
                        <ReactionGame onGamePlayed={(time) => trackEvent('reaction_game_played', { reaction_time_ms: time })} />
                    </div>

                    <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '450px' }}>
                        <h4 className="flex items-center gap-xs" style={{ marginBottom: 'var(--space-md)' }}>
                            <Music size={20} color="var(--color-primary)" /> Study Focus Player
                        </h4>
                        <div style={{ flex: 1, backgroundColor: '#000', borderRadius: 'var(--border-radius-md)', overflow: 'hidden', boxShadow: 'inset 0 0 20px rgba(0,0,0,0.5)' }}>
                            <iframe
                                width="100%"
                                height="100%"
                                src={`https://www.youtube.com/embed/${videoUrl}?autoplay=1&mute=1`}
                                title="YouTube video player"
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                allowFullScreen
                            ></iframe>
                        </div>
                        <div className="flex gap-sm" style={{ marginTop: 'var(--space-md)' }}>
                            <input
                                type="text"
                                className="form-input flex"
                                style={{ flex: 1 }}
                                placeholder="What are you studying? (e.g. classical, lofi, rain)..."
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                            />
                            <button className="btn btn-primary" onClick={handleSuggestMusic}>Change Vibe</button>
                        </div>
                    </div>

                    {/* AI-Powered Vigilance Monitor */}
                    <CameraPreview onDetection={handleDetection} />

                </div>

                {/* Right Column (Chatbot) */}
                <Chatbot
                    sessionId={sessionId}
                    onTriggerIntervention={() => setShowExerciseModal(true)}
                />

            </main>

            {/* Exercise Modal Overlay */}
            {showExerciseModal && (
                <InterventionModal
                    sessionId={sessionId}
                    onClose={() => setShowExerciseModal(false)}
                />
            )}
        </div>
    );
}

// Wrap with SessionProvider
export default function ActiveStudy() {
    return (
        <SessionProvider>
            <ActiveStudyInner />
        </SessionProvider>
    );
}
