import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Eye, EyeOff, ArrowLeft, X, Send } from 'lucide-react';
import './Login.css';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(true);
    const [showPassword, setShowPassword] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showRequestModal, setShowRequestModal] = useState(false);
    const [requestForm, setRequestForm] = useState({ 
        name: '', 
        email: '', 
        phone: '', 
        message: 'Hello,\n\nI am interested in accessing the Ailexity POS system for my business. I would like to request access to explore the features and capabilities of your platform.\n\nPlease review my request and grant me access at your earliest convenience.\n\nThank you!' 
    });
    const [requestSubmitting, setRequestSubmitting] = useState(false);
    const [requestSuccess, setRequestSuccess] = useState(false);

    useEffect(() => {
        const storedRememberMe = localStorage.getItem('remember_me');
        if (storedRememberMe === 'false') {
            setRememberMe(false);
        }
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const result = await login(username, password, rememberMe);
            if (result.success) {
                navigate('/app');
            } else {
                setError(result.error || 'Invalid credentials');
            }
        } catch (err) {
            setError('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            {/* Navigation */}
            <nav className="login-nav">
                <div className="nav-brand">
                    <img src="/ailexity logo.png" alt="Ailexity" className="nav-logo" />
                    <span className="nav-brand-text">Ailexity POS</span>
                </div>
                {/* <button className="nav-back-btn" onClick={() => navigate('/')}>
                    <ArrowLeft size={18} />
                    Back
                </button> */}
            </nav>

            {/* Login Form */}
            <div className="login-container">
                <div className="login-card">
                    <h1 className="login-title">Welcome Back</h1>
                    <p className="login-subtitle">Sign in to access your POS dashboard</p>

                    <form onSubmit={handleSubmit} className="login-form">
                        <div className="form-group">
                            <label htmlFor="username" className="form-label">Username</label>
                            <input
                                id="username"
                                className="form-input"
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Enter your username"
                                autoFocus
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="password" className="form-label">Password</label>
                            <div className="password-input-wrapper">
                                <input
                                    id="password"
                                    className="form-input"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter your password"
                                    required
                                />
                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() => setShowPassword(!showPassword)}
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <div className="login-meta-row">
                            <label className="remember-me">
                                <input
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                />
                                <span>Remember me</span>
                            </label>
                            <button 
                                type="button" 
                                className="link-btn" 
                                onClick={() => setError('Please contact your administrator to reset password.')}
                            >
                                Forgot password?
                            </button>
                        </div>

                        {error && (
                            <div className="error-message">
                                <AlertCircle size={16} />
                                {error}
                            </div>
                        )}

                        <button type="submit" className="login-btn" disabled={loading}>
                            {loading ? 'Signing in...' : 'Sign In'}
                        </button>

                        <button
                            type="button"
                            className="login-secondary-btn"
                            onClick={() => setShowRequestModal(true)}
                        >
                            Request Access
                        </button>
                    </form>

                    <p className="login-footer-text">
                        Need help? Contact your manager or administrator.
                    </p>
                </div>
            </div>

            {/* Request Access Modal */}
            {showRequestModal && (
                <div className="access-modal-overlay" onClick={() => setShowRequestModal(false)}>
                    <div className="access-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="access-modal-header">
                            <h2>Request Access to Ailexity POS</h2>
                            <button 
                                className="modal-close-btn" 
                                onClick={() => setShowRequestModal(false)}
                                aria-label="Close"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {requestSuccess ? (
                            <div className="access-success">
                                <div className="success-icon">✓</div>
                                <h3>Request Submitted Successfully!</h3>
                                <p>We'll review your request and get back to you soon.</p>
                                <button 
                                    className="access-submit-btn" 
                                    onClick={() => {
                                        setShowRequestModal(false);
                                        setRequestSuccess(false);
                                        setRequestForm({ 
                                            name: '', 
                                            email: '', 
                                            phone: '', 
                                            message: 'Hello,\n\nI am interested in accessing the Ailexity POS system for my business. I would like to request access to explore the features and capabilities of your platform.\n\nPlease review my request and grant me access at your earliest convenience.\n\nThank you!' 
                                        });
                                    }}
                                >
                                    Close
                                </button>
                            </div>
                        ) : (
                            <form 
                                action="https://api.web3forms.com/submit" 
                                method="POST"
                                onSubmit={async (e) => {
                                    e.preventDefault();
                                    setRequestSubmitting(true);
                                    
                                    try {
                                        const formData = new FormData(e.target);
                                        const response = await fetch('https://api.web3forms.com/submit', {
                                            method: 'POST',
                                            body: formData
                                        });
                                        
                                        if (response.ok) {
                                            setRequestSuccess(true);
                                        } else {
                                            alert('Failed to submit request. Please try again.');
                                        }
                                    } catch (error) {
                                        alert('An error occurred. Please try again.');
                                    } finally {
                                        setRequestSubmitting(false);
                                    }
                                }}
                            >
                                <input type="hidden" name="access_key" value="a655a672-86f1-47d9-85c1-8d91f7119712" />
                                <input type="hidden" name="subject" value="New POS Access Request" />
                                <input type="hidden" name="from_name" value="Ailexity POS Request Form" />

                                <div className="access-form-group">
                                    <label htmlFor="request-name" className="access-label">Full Name *</label>
                                    <input
                                        id="request-name"
                                        type="text"
                                        name="name"
                                        className="access-input"
                                        placeholder="Enter your full name"
                                        value={requestForm.name}
                                        onChange={(e) => setRequestForm({...requestForm, name: e.target.value})}
                                        required
                                    />
                                </div>

                                <div className="access-form-group">
                                    <label htmlFor="request-email" className="access-label">Email Address *</label>
                                    <input
                                        id="request-email"
                                        type="email"
                                        name="email"
                                        className="access-input"
                                        placeholder="your.email@example.com"
                                        value={requestForm.email}
                                        onChange={(e) => setRequestForm({...requestForm, email: e.target.value})}
                                        required
                                    />
                                </div>

                                <div className="access-form-group">
                                    <label htmlFor="request-phone" className="access-label">Phone Number</label>
                                    <input
                                        id="request-phone"
                                        type="tel"
                                        name="phone"
                                        className="access-input"
                                        placeholder="+91 XXXXX XXXXX"
                                        value={requestForm.phone}
                                        onChange={(e) => setRequestForm({...requestForm, phone: e.target.value})}
                                    />
                                </div>

                                <div className="access-form-group">
                                    <label htmlFor="request-message" className="access-label">Business Details *</label>
                                    <textarea
                                        id="request-message"
                                        name="message"
                                        className="access-textarea"
                                        placeholder="Tell us about your business and why you need access to Ailexity POS..."
                                        rows="4"
                                        value={requestForm.message}
                                        onChange={(e) => setRequestForm({...requestForm, message: e.target.value})}
                                        required
                                    ></textarea>
                                </div>

                                <button 
                                    type="submit" 
                                    className="access-submit-btn"
                                    disabled={requestSubmitting}
                                >
                                    {requestSubmitting ? (
                                        'Submitting...'
                                    ) : (
                                        <>
                                            <Send size={18} />
                                            Submit Request
                                        </>
                                    )}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Login;
