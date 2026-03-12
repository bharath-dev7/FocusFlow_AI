import { useState, useEffect } from 'react';
import { AlertCircle, Activity, Loader2 } from 'lucide-react';
import { chatAPI, exercisesAPI } from '../api';

export default function InterventionModal({ sessionId, onClose }) {
    const [suggestion, setSuggestion] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [exerciseId, setExerciseId] = useState(null);

    // Fetch a real intervention suggestion from the backend
    useEffect(() => {
        const fetchSuggestion = async () => {
            try {
                const data = await chatAPI.getIntervention('fatigue');
                setSuggestion(data.suggestion_text);
            } catch (err) {
                setSuggestion('Do 15 squats to get your blood flowing!');
            } finally {
                setIsLoading(false);
            }
        };
        fetchSuggestion();
    }, []);

    const handleStartExercise = async () => {
        if (!sessionId) {
            onClose();
            return;
        }
        try {
            const data = await exercisesAPI.start(sessionId, 'squats');
            setExerciseId(data.id);
            // For now, auto-complete after clicking Start
            setTimeout(async () => {
                try {
                    await exercisesAPI.complete(data.id, 15);
                } catch (err) {
                    console.error('Failed to complete exercise:', err);
                }
                onClose();
            }, 1000);
        } catch (err) {
            console.error('Failed to start exercise:', err);
            onClose();
        }
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.8)',
            backdropFilter: 'blur(8px)',
            zIndex: 9999,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 'var(--space-md)'
        }}>
            <div className="card animate-fade-in" style={{
                maxWidth: '600px',
                width: '100%',
                textAlign: 'center',
                padding: 'var(--space-xl) var(--space-lg)',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                border: '1px solid rgba(255,255,255,0.1)'
            }}>
                <div style={{
                    width: '64px', height: '64px', backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    borderRadius: '50%', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', margin: '0 auto var(--space-md)'
                }}>
                    <AlertCircle size={32} color="var(--color-alert)" />
                </div>

                <h2 style={{ fontSize: '32px', marginBottom: 'var(--space-xs)' }}>Focus Alert</h2>

                <div style={{
                    margin: '0 auto var(--space-xl)',
                    padding: 'var(--space-lg)',
                    backgroundColor: 'rgba(99, 102, 241, 0.05)',
                    borderRadius: 'var(--border-radius-md)',
                    border: '1px dashed var(--color-primary)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '12px',
                    minHeight: '100px',
                    justifyContent: 'center',
                }}>
                    {isLoading ? (
                        <Loader2 size={32} color="var(--color-primary)" style={{ animation: 'spin 1s linear infinite' }} />
                    ) : (
                        <>
                            <Activity size={40} color="var(--color-primary)" />
                            <p style={{ margin: 0, fontSize: '18px', lineHeight: 1.5, color: 'var(--color-text-primary)' }}>
                                {suggestion}
                            </p>
                        </>
                    )}
                </div>

                <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'center' }}>
                    <button className="btn btn-outline" style={{ padding: '12px 24px' }} onClick={onClose}>Skip for now</button>
                    <button className="btn btn-primary" style={{ padding: '12px 32px', fontSize: '16px' }} onClick={handleStartExercise}>
                        Start Exercise
                    </button>
                </div>
            </div>
        </div>
    );
}
