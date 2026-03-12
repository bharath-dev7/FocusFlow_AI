import { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import { sessionsAPI, eventsAPI } from '../api';

const SessionContext = createContext(null);

const BATCH_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

export function SessionProvider({ children }) {
    const [sessionId, setSessionId] = useState(null);
    const [isSessionActive, setIsSessionActive] = useState(false);
    const [sessionStartTime, setSessionStartTime] = useState(null);

    // Aggregated counters (tracked locally, sent on session end)
    const countersRef = useRef({
        totalDistractions: 0,
        totalFatigueEvents: 0,
        pomodoroCyclesCompleted: 0,
    });

    // Event buffer for batch sending
    const eventBufferRef = useRef([]);
    const batchIntervalRef = useRef(null);

    const flushEvents = useCallback(async () => {
        if (!sessionId || eventBufferRef.current.length === 0) return;

        const eventsToSend = [...eventBufferRef.current];
        eventBufferRef.current = [];

        try {
            await eventsAPI.batch(sessionId, eventsToSend);
        } catch (err) {
            console.error('Failed to flush events:', err);
            // Re-add events to buffer on failure
            eventBufferRef.current = [...eventsToSend, ...eventBufferRef.current];
        }
    }, [sessionId]);

    const startSession = async () => {
        try {
            const data = await sessionsAPI.start();
            setSessionId(data.id);
            setIsSessionActive(true);
            setSessionStartTime(Date.now());
            countersRef.current = {
                totalDistractions: 0,
                totalFatigueEvents: 0,
                pomodoroCyclesCompleted: 0,
            };
            eventBufferRef.current = [];

            // Start batch flush interval
            batchIntervalRef.current = setInterval(flushEvents, BATCH_INTERVAL_MS);

            return data.id;
        } catch (err) {
            console.error('Failed to start session:', err);
            throw err;
        }
    };

    const endSession = async () => {
        if (!sessionId) return;

        // Flush any remaining events
        await flushEvents();

        // Clear interval
        if (batchIntervalRef.current) {
            clearInterval(batchIntervalRef.current);
            batchIntervalRef.current = null;
        }

        const durationSeconds = Math.floor((Date.now() - sessionStartTime) / 1000);
        const focusMinutes = Math.round(durationSeconds / 60 * 10) / 10; // rough estimate

        try {
            await sessionsAPI.end(sessionId, {
                duration_seconds: Math.min(durationSeconds, 43200), // Cap at 12h
                total_distractions: countersRef.current.totalDistractions,
                total_fatigue_events: countersRef.current.totalFatigueEvents,
                total_focus_minutes: focusMinutes,
                pomodoro_cycles_completed: countersRef.current.pomodoroCyclesCompleted,
            });
        } catch (err) {
            console.error('Failed to end session:', err);
        }

        setSessionId(null);
        setIsSessionActive(false);
        setSessionStartTime(null);
    };

    /**
     * Track a detection event. Buffers locally and increments counters.
     */
    const trackEvent = (eventType, eventData = null) => {
        // Increment counters
        if (eventType === 'fatigue_detected') {
            countersRef.current.totalFatigueEvents += 1;
        } else if (eventType === 'distraction_detected') {
            countersRef.current.totalDistractions += 1;
        } else if (eventType === 'pomodoro_completed') {
            countersRef.current.pomodoroCyclesCompleted += 1;
        }

        // Buffer event for batch sending
        eventBufferRef.current.push({
            event_type: eventType,
            event_data: eventData,
            timestamp: new Date().toISOString(),
        });
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (batchIntervalRef.current) {
                clearInterval(batchIntervalRef.current);
            }
        };
    }, []);

    return (
        <SessionContext.Provider value={{
            sessionId, isSessionActive,
            startSession, endSession, trackEvent,
            counters: countersRef.current,
        }}>
            {children}
        </SessionContext.Provider>
    );
}

export function useSession() {
    const context = useContext(SessionContext);
    if (!context) throw new Error('useSession must be used within a SessionProvider');
    return context;
}
