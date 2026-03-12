import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Settings } from 'lucide-react';

export default function PomodoroTimer({ onCycleComplete }) {
    const [workMinutes, setWorkMinutes] = useState(25);
    const [breakMinutes, setBreakMinutes] = useState(5);

    const [timeLeft, setTimeLeft] = useState(workMinutes * 60);
    const [isActive, setIsActive] = useState(false);
    const [isWorkSession, setIsWorkSession] = useState(true);
    const [showSettings, setShowSettings] = useState(false);

    useEffect(() => {
        setTimeLeft(isWorkSession ? workMinutes * 60 : breakMinutes * 60);
    }, [workMinutes, breakMinutes, isWorkSession]);

    useEffect(() => {
        let interval = null;
        if (isActive && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft((time) => time - 1);
            }, 1000);
        } else if (isActive && timeLeft === 0) {
            // Switch modes
            if (isWorkSession && onCycleComplete) onCycleComplete();
            setIsWorkSession(!isWorkSession);
            setIsActive(false);
        } else {
            clearInterval(interval);
        }
        return () => clearInterval(interval);
    }, [isActive, timeLeft, isWorkSession]);

    const toggleTimer = () => setIsActive(!isActive);

    const resetTimer = () => {
        setIsActive(false);
        setIsWorkSession(true);
        setTimeLeft(workMinutes * 60);
    };

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <div className="card" style={{ padding: 'var(--space-md)', width: '280px', display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: 'var(--color-surface)', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: 'var(--space-sm)' }}>
                <h4 style={{ margin: 0, color: isWorkSession ? 'var(--color-primary)' : 'var(--color-success)' }}>
                    {isWorkSession ? 'Focus' : 'Break'}
                </h4>
                <button onClick={() => setShowSettings(!showSettings)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}>
                    <Settings size={18} />
                </button>
            </div>

            {showSettings ? (
                <div style={{ width: '100%', marginBottom: 'var(--space-sm)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <label style={{ fontSize: '12px' }}>Focus (min):</label>
                        <input
                            type="number"
                            value={workMinutes}
                            onChange={(e) => setWorkMinutes(Math.max(1, parseInt(e.target.value) || 1))}
                            style={{ width: '60px', padding: '4px', borderRadius: '4px', border: '1px solid var(--color-border)' }}
                            min="1"
                        />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <label style={{ fontSize: '12px' }}>Break (min):</label>
                        <input
                            type="number"
                            value={breakMinutes}
                            onChange={(e) => setBreakMinutes(Math.max(1, parseInt(e.target.value) || 1))}
                            style={{ width: '60px', padding: '4px', borderRadius: '4px', border: '1px solid var(--color-border)' }}
                            min="1"
                        />
                    </div>
                </div>
            ) : null}

            <div style={{ fontSize: '3rem', fontWeight: 'bold', fontFamily: 'monospace', margin: 'var(--space-md) 0', color: 'var(--color-text)' }}>
                {formatTime(timeLeft)}
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
                <button
                    onClick={toggleTimer}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        padding: '8px 16px', borderRadius: '20px',
                        backgroundColor: isActive ? 'var(--color-border)' : 'var(--color-primary)',
                        color: isActive ? 'var(--color-text)' : 'white',
                        border: 'none', cursor: 'pointer', fontWeight: 'bold'
                    }}
                >
                    {isActive ? <Pause size={18} /> : <Play size={18} />}
                    {isActive ? 'Pause' : 'Start'}
                </button>
                <button
                    onClick={resetTimer}
                    style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        padding: '8px', borderRadius: '50%',
                        backgroundColor: 'var(--color-border)', color: 'var(--color-text-secondary)',
                        border: 'none', cursor: 'pointer'
                    }}
                    title="Reset"
                >
                    <RotateCcw size={18} />
                </button>
            </div>
        </div>
    );
}
