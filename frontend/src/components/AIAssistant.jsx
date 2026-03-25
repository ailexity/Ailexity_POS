import React, { useState, useEffect, useRef } from 'react';
import {
    MessageCircle,
    Send,
    Sparkles,
    Loader,
    X,
    HelpCircle,
    BarChart3,
    Bot,
    Clock3,
    Lightbulb,
    Copy,
    Check
} from 'lucide-react';
import api from '../api';

const AIAssistant = () => {
    const [greeting, setGreeting] = useState('');
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [aiAvailable, setAiAvailable] = useState(true);
    const [showExamples, setShowExamples] = useState(false);
    const [examples, setExamples] = useState([]);
    const [isTyping, setIsTyping] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [copiedIndex, setCopiedIndex] = useState(null);
    const [isCompact, setIsCompact] = useState(false);
    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null);

    const quickPrompts = [
        'What are today\'s sales insights?',
        'Which items are performing best?',
        'Give me a short business summary',
        'Any alerts I should check now?'
    ];

    useEffect(() => {
        fetchGreeting();
        fetchExamples();
        checkAIStatus();
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        const onKeyDown = (event) => {
            if (event.key === 'Escape' && isChatOpen) {
                setIsChatOpen(false);
            }
        };

        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [isChatOpen]);

    const scrollToBottom = () => {
        if (messagesEndRef.current) messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    };

    const fetchGreeting = async () => {
        try {
            const response = await api.get('/ai/greeting');
            setGreeting(response.data.greeting);
            setAiAvailable(response.data.ai_available);
        } catch (error) {
            console.error('Error fetching greeting:', error);
            setGreeting('Hello! How can I help you today? 👋');
        }
    };

    const fetchExamples = async () => {
        try {
            const response = await api.get('/ai/examples');
            setExamples(response.data.examples);
        } catch (error) {
            console.error('Error fetching examples:', error);
        }
    };

    const checkAIStatus = async () => {
        try {
            const response = await api.get('/ai/status');
            setAiAvailable(response.data.available && response.data.initialized);
        } catch (error) {
            console.error('Error checking AI status:', error);
            setAiAvailable(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!inputMessage.trim() || isLoading) return;

        const userMessage = inputMessage.trim();
        setInputMessage('');

        setMessages(prev => [...prev, { type: 'user', content: userMessage, timestamp: new Date() }]);
        setIsLoading(true);
        setIsTyping(true);

        try {
            const response = await api.post('/ai/query', {
                message: userMessage,
                show_details: false
            });

            setTimeout(() => {
                setIsTyping(false);
                setMessages(prev => [...prev, {
                    type: 'ai',
                    content: response.data.response,
                    intent: response.data.intent,
                    confidence: response.data.confidence,
                    timestamp: new Date()
                }]);
            }, 300);
        } catch (error) {
            console.error('Error querying AI:', error);
            setIsTyping(false);
            const errorMessage = error.response?.data?.detail || 'Sorry, I encountered an error. Please try again.';
            setMessages(prev => [...prev, {
                type: 'ai',
                content: errorMessage,
                isError: true,
                timestamp: new Date()
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleExampleClick = (example) => {
        setInputMessage(example);
        setShowExamples(false);
    };

    const clearChat = () => {
        setMessages([]);
    };

    const handleQuickPrompt = (prompt) => {
        setInputMessage(prompt);
    };

    const handleCopy = async (index, text) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedIndex(index);
            setTimeout(() => setCopiedIndex(null), 1400);
        } catch (error) {
            console.error('Copy failed:', error);
        }
    };

    const formatTime = (dateValue) => {
        return new Date(dateValue).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const toggleChat = () => {
        setIsChatOpen(!isChatOpen);
    };

    return (
        <div className="ai-chat-root">
            <button
                onClick={toggleChat}
                className={`ai-chat-trigger ${isChatOpen ? 'is-open' : ''}`}
                aria-expanded={isChatOpen}
                aria-label="Open AI assistant"
            >
                <MessageCircle size={20} />
                <span className="text-sm whitespace-nowrap">Chat with AI</span>
            </button>

            {isChatOpen && (
                <div className={`ai-chat-panel ${isCompact ? 'is-compact' : ''}`}>
                    <div className="ai-chat-header">
                        <div className="ai-chat-title-wrap">
                            <div className="ai-chat-logo">
                                <Sparkles size={18} />
                            </div>
                            <div>
                                <h2 className="ai-chat-title">AI Assistant</h2>
                                <p className="ai-chat-subtitle">Interactive business insights</p>
                            </div>
                        </div>
                        <div className="ai-chat-header-actions">
                            <button
                                onClick={() => setIsCompact((prev) => !prev)}
                                className="ai-chat-icon-btn"
                                title={isCompact ? 'Expand' : 'Compact'}
                                aria-label={isCompact ? 'Expand assistant' : 'Compact assistant'}
                            >
                                <BarChart3 size={16} />
                            </button>
                            <button onClick={toggleChat} className="ai-chat-icon-btn" title="Close" aria-label="Close assistant">
                                <X size={18} />
                            </button>
                        </div>
                    </div>

                    <div className="ai-chat-content">
                        <div className="ai-chat-top-cards">
                            <div className="ai-chat-pill">
                                <Clock3 size={13} />
                                <span>{messages.length === 0 ? 'Ready now' : `${messages.length} messages`}</span>
                            </div>
                            <div className={`ai-chat-pill ${aiAvailable ? 'is-online' : 'is-offline'}`}>
                                <span className="ai-chat-pill-dot" />
                                <span>{aiAvailable ? 'AI Online' : 'AI Offline'}</span>
                            </div>
                        </div>

                        <div className="ai-chat-greeting-card">
                            <div className="ai-chat-greeting-icon">
                                <Bot size={17} />
                            </div>
                            <p>{greeting}</p>
                        </div>

                        {messages.length > 0 && (
                            <div className="ai-chat-conversation-wrap">
                                <div className="ai-chat-conversation-head">
                                    <h3>Conversation</h3>
                                    <button onClick={clearChat} className="ai-chat-clear-btn">
                                        <X size={12} />
                                        <span>Clear</span>
                                    </button>
                                </div>

                                <div ref={messagesContainerRef} className="ai-chat-messages custom-scrollbar">
                                    {messages.map((msg, index) => (
                                        <div key={index} className={`ai-chat-row ${msg.type === 'user' ? 'is-user' : 'is-ai'}`}>
                                            <div className={`ai-chat-bubble ${msg.type === 'user' ? 'is-user' : msg.isError ? 'is-error' : 'is-ai'}`}>
                                                {msg.type === 'ai' && !msg.isError && (
                                                    <div className="ai-chat-bubble-head">
                                                        <Bot size={13} />
                                                        <span>Assistant</span>
                                                        <button
                                                            type="button"
                                                            className="ai-chat-copy-btn"
                                                            onClick={() => handleCopy(index, msg.content)}
                                                            title="Copy reply"
                                                        >
                                                            {copiedIndex === index ? <Check size={12} /> : <Copy size={12} />}
                                                        </button>
                                                    </div>
                                                )}
                                                <p>{msg.content}</p>
                                                {msg.timestamp && <small>{formatTime(msg.timestamp)}</small>}
                                            </div>
                                        </div>
                                    ))}

                                    {isTyping && (
                                        <div className="ai-chat-row is-ai">
                                            <div className="ai-chat-bubble is-ai">
                                                <div className="ai-chat-typing">
                                                    <span />
                                                    <span />
                                                    <span />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div ref={messagesEndRef} />
                                </div>
                            </div>
                        )}

                        {messages.length === 0 && (
                            <div className="ai-chat-empty-state">
                                <button
                                    onClick={() => setShowExamples((prev) => !prev)}
                                    className="ai-chat-examples-toggle"
                                >
                                    <HelpCircle size={15} />
                                    <span>{showExamples ? 'Hide examples' : 'Show examples'}</span>
                                </button>

                                {showExamples && examples.length > 0 && (
                                    <div className="ai-chat-example-list">
                                        {examples.slice(0, 4).map((example, index) => (
                                            <button
                                                key={index}
                                                onClick={() => handleExampleClick(example)}
                                                className="ai-chat-example-btn"
                                            >
                                                <Lightbulb size={14} />
                                                <span>{example}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}

                                <div className="ai-chat-quick-prompts">
                                    {quickPrompts.map((prompt) => (
                                        <button
                                            key={prompt}
                                            type="button"
                                            className="ai-chat-prompt-chip"
                                            onClick={() => handleQuickPrompt(prompt)}
                                        >
                                            {prompt}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {!isCompact && aiAvailable ? (
                            <form onSubmit={handleSubmit} className="ai-chat-composer">
                                <div className="ai-chat-input-wrap">
                                    <input
                                        type="text"
                                        value={inputMessage}
                                        onChange={(event) => setInputMessage(event.target.value)}
                                        placeholder="Ask for trends, sales, items, or alerts..."
                                        disabled={isLoading}
                                        maxLength={280}
                                    />

                                    <button
                                        type="submit"
                                        disabled={isLoading || !inputMessage.trim()}
                                        className="ai-chat-send-btn"
                                        aria-label="Send message"
                                    >
                                        {isLoading ? <Loader size={17} className="ai-chat-spin" /> : <Send size={17} />}
                                    </button>
                                </div>

                                <div className="ai-chat-composer-meta">
                                    <span>Press Enter to send</span>
                                    <span>{inputMessage.length}/280</span>
                                </div>
                            </form>
                        ) : !aiAvailable ? (
                            <div className="ai-chat-offline-box">AI assistant is being configured...</div>
                        ) : (
                            <div className="ai-chat-offline-box">Compact mode enabled</div>
                        )}
                    </div>
                </div>
            )}

        </div>
    );
};

export default AIAssistant;
