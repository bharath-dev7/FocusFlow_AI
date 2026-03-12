import React, { useState, useEffect, useRef } from 'react';
import { Play, RotateCcw } from 'lucide-react';

export default function ReactionGame({ onGamePlayed }) {
    const [gameState, setGameState] = useState('idle'); // idle, waiting, playing, done, early
    const [reactionTime, setReactionTime] = useState(null);
    const startTimeRef = useRef(null);
    const timeoutRef = useRef(null);

    const startGame = () => {
        setGameState('waiting');
        setReactionTime(null);
        clearTimeout(timeoutRef.current);

        // Random wait between 2s and 5s
        const waitTime = Math.floor(Math.random() * 3000) + 2000;

        timeoutRef.current = setTimeout(() => {
            setGameState('playing');
            startTimeRef.current = Date.now();
        }, waitTime);
    };

    const handleClick = () => {
        if (gameState === 'waiting') {
            clearTimeout(timeoutRef.current);
            setGameState('early');
        } else if (gameState === 'playing') {
            const endTime = Date.now();
            const time = endTime - startTimeRef.current;
            setReactionTime(time);
            setGameState('done');
            if (onGamePlayed) onGamePlayed(time);
        } else if (gameState === 'done' || gameState === 'early') {
            startGame();
        }
    };

    useEffect(() => {
        return () => clearTimeout(timeoutRef.current);
    }, []);

    const getBackgroundColor = () => {
        switch (gameState) {
            case 'idle': return 'var(--color-surface)';
            case 'waiting': return '#ef4444'; // Red
            case 'playing': return '#22c55e'; // Green
            case 'done': return 'var(--color-surface)';
            case 'early': return '#f59e0b'; // Yellow/Orange
            default: return 'var(--color-surface)';
        }
    };

    const getTextColor = () => {
        if (gameState === 'waiting' || gameState === 'playing') return 'white';
        return 'var(--color-text)';
    };

    return (
        <div className="card" style={{ padding: 'var(--space-md)', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <h4 style={{ margin: '0 0 var(--space-md) 0' }}>Anti-Drowsiness Reaction Test</h4>
            <p style={{ textAlign: 'center', marginBottom: 'var(--space-md)', color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                Refocus your brain! Wait for green, then click as fast as possible.
            </p>

            <div
                onClick={gameState !== 'idle' ? handleClick : null}
                style={{
                    width: '100%',
                    height: '150px',
                    borderRadius: 'var(--border-radius-lg)',
                    backgroundColor: getBackgroundColor(),
                    color: getTextColor(),
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    cursor: gameState === 'idle' ? 'default' : 'pointer',
                    transition: 'background-color 0.2s',
                    fontWeight: 'bold',
                    fontSize: '1.2rem',
                    userSelect: 'none',
                    boxShadow: 'inset 0 4px 6px rgba(0,0,0,0.1)'
                }}
            >
                {gameState === 'idle' && (
                    <button className="btn btn-primary" onClick={startGame} style={{ gap: '8px', display: 'flex', alignItems: 'center' }}>
                        <Play size={18} /> Start Test
                    </button>
                )}
                {gameState === 'waiting' && 'Wait for Green...'}
                {gameState === 'playing' && 'CLICK NOW!'}
                {gameState === 'early' && 'Too early! Click to try again.'}
                {gameState === 'done' && (
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '2rem', marginBottom: '8px' }}>{reactionTime} ms</div>
                        <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>Click to play again</div>
                    </div>
                )}
            </div>

            {gameState === 'done' && (
                <div style={{ marginTop: 'var(--space-md)', fontSize: '0.9rem', color: reactionTime < 300 ? 'var(--color-success)' : 'var(--color-warning)' }}>
                    {reactionTime < 300 ? 'Great focus!' : 'A bit slow. Try to stay alert!'}
                </div>
            )}
        </div>
    );
}
