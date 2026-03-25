import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Zap, BarChart3, Users, ShoppingCart, Package, TrendingUp } from 'lucide-react';
import './LandingPage.css';

const LandingPage = () => {
    const navigate = useNavigate();
    const [scrollY, setScrollY] = useState(0);

    useEffect(() => {
        const handleScroll = () => setScrollY(window.scrollY);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <div className="landing-page">
            {/* Navigation */}
            <nav className="landing-nav">
                <div className="nav-brand">
                    <img src="/ailexity logo.png" alt="Ailexity" className="nav-logo" />
                    <span className="nav-text">Ailexity POS</span>
                </div>
                <div className="nav-buttons">
                    <button className="nav-btn-secondary" onClick={() => navigate('/features')}>
                        Features
                    </button>
                    <button className="nav-btn-secondary" onClick={() => navigate('/how-it-works')}>
                        How It Works
                    </button>
                    <button className="nav-btn-primary" onClick={() => navigate('/login')}>
                        Login
                    </button>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="hero">
                <div className="hero-content">
                    <div className="hero-badge">Powerful. Minimal. Yours.</div>
                    <h1 className="hero-title">
                        Smart <span className="accent">POS System</span> for Your Business
                    </h1>
                    <p className="hero-subtitle">
                        Fast billing, complete inventory control, and real-time insights. Everything you need to grow.
                    </p>
                    <div className="hero-stats">
                        <div className="stat">
                            <div className="stat-number">500+</div>
                            <div className="stat-label">Active Businesses</div>
                        </div>
                        <div className="stat">
                            <div className="stat-number">99.9%</div>
                            <div className="stat-label">Uptime</div>
                        </div>
                        <div className="stat">
                            <div className="stat-number">24/7</div>
                            <div className="stat-label">Support</div>
                        </div>
                    </div>
                    <div className="hero-actions">
                        <button className="btn-large btn-primary" onClick={() => navigate('/login')}>
                            Get Started <ArrowRight size={20} />
                        </button>
                        <button className="btn-large btn-ghost" onClick={() => navigate('/how-it-works')}>
                            Learn More
                        </button>
                    </div>
                </div>
                <div className="hero-graphic">
                    <div className="floating-card card-1">
                        <Zap size={24} className="icon-accent" />
                        <span>Lightning Fast</span>
                    </div>
                    <div className="floating-card card-2">
                        <BarChart3 size={24} className="icon-accent" />
                        <span>Real Analytics</span>
                    </div>
                    <div className="floating-card card-3">
                        <Users size={24} className="icon-accent" />
                        <span>Team Ready</span>
                    </div>
                </div>
            </section>

            {/* Features Preview */}
            <section className="features-preview">
                <h2 className="section-title">Core Features</h2>
                <p className="section-subtitle">Everything built for simplicity and speed</p>
                <div className="features-grid">
                    <div className="feature-item">
                        <div className="feature-icon">
                            <ShoppingCart size={28} />
                        </div>
                        <h3>Fast Billing</h3>
                        <p>Process orders in seconds with an intuitive interface</p>
                    </div>
                    <div className="feature-item">
                        <div className="feature-icon">
                            <Package size={28} />
                        </div>
                        <h3>Inventory</h3>
                        <p>Real-time stock tracking with automatic alerts</p>
                    </div>
                    <div className="feature-item">
                        <div className="feature-icon">
                            <BarChart3 size={28} />
                        </div>
                        <h3>Analytics</h3>
                        <p>Insights that help you make smarter decisions</p>
                    </div>
                    <div className="feature-item">
                        <div className="feature-icon">
                            <Users size={28} />
                        </div>
                        <h3>Team Access</h3>
                        <p>Secure user management and role-based control</p>
                    </div>
                </div>
                <div className="cta-button-container">
                    <button className="btn-large btn-primary" onClick={() => navigate('/features')}>
                        Explore All Features
                    </button>
                </div>
            </section>

            {/* Solution Types */}
            <section className="solutions">
                <h2 className="section-title">Built For Your Business</h2>
                <p className="section-subtitle">Solutions tailored to restaurants and retailers</p>
                <div className="solutions-grid">
                    <div className="solution-card solution-restaurants">
                        <h3>Restaurants</h3>
                        <p className="solution-desc">Manage tables, takeaways, and online orders. Kitchen-ready billing system.</p>
                        <ul className="solution-list">
                            <li>Table Management</li>
                            <li>Multi-order Queues</li>
                            <li>Kitchen Display System</li>
                            <li>Flexible Payments</li>
                        </ul>
                        <button className="btn-ghost" onClick={() => navigate('/login?type=restaurant')}>
                            Explore <ArrowRight size={16} />
                        </button>
                    </div>
                    <div className="solution-card solution-retail">
                        <h3>Retailers</h3>
                        <p className="solution-desc">Complete inventory control, supplier management, and GST billing.</p>
                        <ul className="solution-list">
                            <li>Stock Control</li>
                            <li>Party Ledger</li>
                            <li>GST Invoicing</li>
                            <li>Purchase Management</li>
                        </ul>
                        <button className="btn-ghost" onClick={() => navigate('/login?type=retail')}>
                            Explore <ArrowRight size={16} />
                        </button>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="cta-section">
                <div className="cta-content">
                    <h2>Ready to Transform Your Business?</h2>
                    <p>Join 500+ businesses already using Ailexity POS</p>
                    <button className="btn-large btn-primary" onClick={() => navigate('/login')}>
                        Start Now <ArrowRight size={20} />
                    </button>
                </div>
            </section>

            {/* Footer */}
            <footer className="footer">
                <div className="footer-content">
                    <div className="footer-section">
                        <h4>Ailexity POS</h4>
                        <p>© 2026 All rights reserved</p>
                    </div>
                    <div className="footer-section">
                        <h4>Product</h4>
                        <ul>
                            <li><button onClick={() => navigate('/features')} className="footer-link">Features</button></li>
                            <li><button onClick={() => navigate('/how-it-works')} className="footer-link">How It Works</button></li>
                            <li><a href="https://ailexity.com" target="_blank" rel="noreferrer" className="footer-link">Website</a></li>
                        </ul>
                    </div>
                    <div className="footer-section">
                        <h4>Contact</h4>
                        <ul>
                            <li><a href="mailto:ailexity.info@gmail.com" className="footer-link">Email</a></li>
                            <li><a href="tel:9270587627" className="footer-link">Call</a></li>
                        </ul>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;