import { useState } from 'react';
import { MessageSquare, Sparkles, Zap } from 'lucide-react';
import { chatAPI } from '../api';

export default function Chatbot({ sessionId, onTriggerIntervention }) {
    const [chatMessages, setChatMessages] = useState([{ sender: 'bot', text: 'Ready to optimize your study session! Type "help" to see what I can do.' }]);
    const [inputText, setInputText] = useState('');
    const [isSending, setIsSending] = useState(false);

    const handleChatSubmit = async (e) => {
        e.preventDefault();
        if (!inputText.trim() || isSending) return;

        const userMessage = inputText.trim();
        const newMsgs = [...chatMessages, { sender: 'user', text: userMessage }];
        setChatMessages(newMsgs);
        setInputText('');
        setIsSending(true);

        try {
            const response = await chatAPI.send(userMessage);

            setChatMessages([...newMsgs, { sender: 'bot', text: response.message }]);

            // Handle actions from backend
            if (response.action === 'TRIGGER_EXERCISE') {
                if (onTriggerIntervention) onTriggerIntervention();
            }
            // Future: handle PLAY_MUSIC, SUGGEST_BREAK, etc.
        } catch (err) {
            setChatMessages([...newMsgs, { sender: 'bot', text: 'Sorry, I had trouble processing that. Try again!' }]);
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="card" style={{ flex: '35%', display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--glass-bg)', backdropFilter: 'var(--glass-blur)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-sm)' }}>
                <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                    <MessageSquare size={18} color="var(--color-primary)" /> Study AI
                </h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--color-success)', fontWeight: 600 }}>
                    <Sparkles size={14} /> Active
                </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-md)', padding: 'var(--space-md) 0' }}>
                {chatMessages.map((msg, i) => (
                    <div key={i} style={{ alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%' }} className="animate-fade-in">
                        <div style={{
                            padding: '12px 16px',
                            borderRadius: '18px',
                            borderTopRightRadius: msg.sender === 'user' ? '4px' : '18px',
                            borderTopLeftRadius: msg.sender === 'bot' ? '4px' : '18px',
                            backgroundColor: msg.sender === 'user' ? 'var(--color-primary)' : 'rgba(100, 116, 139, 0.1)',
                            color: msg.sender === 'user' ? 'white' : 'var(--color-text-primary)',
                            fontSize: '14px',
                            boxShadow: msg.sender === 'user' ? '0 4px 12px rgba(99, 102, 241, 0.2)' : 'none',
                            whiteSpace: 'pre-line',
                        }}>
                            {msg.text}
                        </div>
                    </div>
                ))}
                {isSending && (
                    <div style={{ alignSelf: 'flex-start', maxWidth: '85%' }} className="animate-fade-in">
                        <div style={{
                            padding: '12px 16px', borderRadius: '18px', borderTopLeftRadius: '4px',
                            backgroundColor: 'rgba(100, 116, 139, 0.1)', fontSize: '14px',
                            color: 'var(--color-text-secondary)'
                        }}>
                            Thinking...
                        </div>
                    </div>
                )}
            </div>

            <form onSubmit={handleChatSubmit} style={{ display: 'flex', gap: 'var(--space-xs)', paddingTop: 'var(--space-sm)', borderTop: '1px solid var(--color-border)' }}>
                <input
                    type="text"
                    className="form-input flex"
                    style={{ flex: 1, height: '44px' }}
                    placeholder="Ask Study AI..."
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    disabled={isSending}
                />
                <button type="submit" className="btn btn-primary" style={{ width: '44px', height: '44px', padding: 0, borderRadius: '50%' }} disabled={isSending}>
                    <Zap size={18} fill="white" />
                </button>
            </form>
        </div>
    );
}
