/**
 * Centralized API client for the AI Study Assistant.
 * All backend communication flows through these helpers.
 *
 * VITE_API_URL is set in Vercel environment variables (points to Render backend).
 * Falls back to localhost:8000 for local development.
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

/**
 * Core fetch wrapper — auto-attaches JWT and handles errors.
 */
async function request(endpoint, options = {}) {
    const token = localStorage.getItem('access_token');
    const headers = {
        ...options.headers,
    };

    // Attach JWT if we have one (skip for FormData — browser sets Content-Type)
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    // Default to JSON content type unless it's FormData
    if (!(options.body instanceof FormData) && !headers['Content-Type']) {
        headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers,
    });

    // Auto-logout on 401
    if (response.status === 401) {
        localStorage.removeItem('access_token');
        window.location.href = '/auth';
        throw new Error('Session expired. Please log in again.');
    }

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Request failed (${response.status})`);
    }

    return response.json();
}

// ---- Convenience Methods ---- //

export function apiGet(endpoint) {
    return request(endpoint, { method: 'GET' });
}

export function apiPost(endpoint, body) {
    return request(endpoint, {
        method: 'POST',
        body: JSON.stringify(body),
    });
}

/**
 * OAuth2 login requires form-encoded body, not JSON.
 */
export function apiFormPost(endpoint, formData) {
    const urlEncoded = new URLSearchParams();
    for (const [key, value] of Object.entries(formData)) {
        urlEncoded.append(key, value);
    }
    return request(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: urlEncoded.toString(),
    });
}

// ---- Auth API ---- //
export const authAPI = {
    register: (email, password) => apiPost('/auth/register', { email, password }),
    login: (email, password) => apiFormPost('/auth/login', { username: email, password }),
    me: () => apiGet('/auth/me'),
};

// ---- Sessions API ---- //
export const sessionsAPI = {
    start: () => apiPost('/sessions/start', {}),
    end: (sessionId, data) => apiPost(`/sessions/${sessionId}/end`, data),
    history: (limit = 20) => apiGet(`/sessions/history?limit=${limit}`),
};

// ---- Events API ---- //
export const eventsAPI = {
    batch: (sessionId, events) => apiPost('/events/batch', { session_id: sessionId, events }),
    single: (sessionId, event) => apiPost(`/events/single?session_id=${sessionId}`, event),
};

// ---- Chat API ---- //
export const chatAPI = {
    send: (message) => apiPost('/chat/', { message }),
    getIntervention: (category) => apiGet(`/chat/intervention/${category}`),
};

// ---- Exercises API ---- //
export const exercisesAPI = {
    start: (sessionId, exerciseType) => apiPost('/exercises/start', { session_id: sessionId, exercise_type: exerciseType }),
    complete: (exerciseId, repetitionCount) => apiPost(`/exercises/${exerciseId}/complete`, { repetition_count: repetitionCount }),
};

// ---- Analytics API ---- //
export const analyticsAPI = {
    dashboard: () => apiGet('/analytics/dashboard'),
};
