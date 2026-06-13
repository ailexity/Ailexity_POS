import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Zap, BarChart3, Users, ShoppingCart, Package, Menu, X } from 'lucide-react';
import './LandingPage.css';

const LandingPage = () => {
    const navigate = useNavigate();
    const [bannerVisible, setBannerVisible] = useState(true);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const tabData = [
        {
            id: "01",
            title: "Smart Billing & Checkout",
            subtitle: "From single scan to full systems",
            label: "FEATURE 01",
            cardTitle: "Smart Billing & Checkout",
            cardDesc: "From single scan to multi-counter checkout — built for production.",
            themeColor: "#f97316",
            themeBg: "#fffaf7",
            themeBorder: "#ffd8c4",
            themeHighlight: "#fff0e8",
            themeFade: "rgba(249, 115, 22, 0.05)",
            icon: ShoppingCart,
            flow: [
                { icon: "📋", title: "SCAN ITEM", desc: "Barcode · Manual" },
                { arrow: "MAP" },
                { icon: "🧠", title: "GENERATE BILL", desc: "Taxes · Discounts", iconColor: "#db2777" },
                { arrow: "BUILD" },
                { icon: "⚙️", title: "COLLECT", desc: "Cash · UPI · Card", iconColor: "#6b7280" },
                { arrow: "DEPLOY" },
                { icon: "🚀", title: "LIVE IN SYSTEM", desc: "Monitored · Updated", highlight: true }
            ],
            bullets: [
                "Multi-counter orchestration and queue design",
                "Barcode intelligence and auto-fetch pipelines",
                "GST systems, discount integration, loyalty agents",
                "Human-in-the-loop gates on every refund decision"
            ],
            tags: ["FAST BILLING", "GST READY", "AUTOMATION"],
            outcomeValue: "10x",
            outcomeDesc: "reduction in customer wait time on high-volume retail checkout workflows"
        },
        {
            id: "02",
            title: "Inventory Management",
            subtitle: "Real-time, built AI-first",
            label: "FEATURE 02",
            cardTitle: "Inventory Management",
            cardDesc: "Complete oversight of your stock from supplier to shelf.",
            themeColor: "#10b981",
            themeBg: "#f0fdf4",
            themeBorder: "#a7f3d0",
            themeHighlight: "#d1fae5",
            themeFade: "rgba(16, 185, 129, 0.05)",
            icon: Package,
            flow: [
                { icon: "📦", title: "RECEIVE", desc: "Vendors · POs" },
                { arrow: "LOG" },
                { icon: "🏷️", title: "ORGANIZE", desc: "Categories · Batches", iconColor: "#8b5cf6" },
                { arrow: "TRACK" },
                { icon: "📉", title: "MONITOR", desc: "Alerts · Expiry", iconColor: "#eab308" },
                { arrow: "SYNC" },
                { icon: "🔄", title: "AUTO-REORDER", desc: "Seamless Supply", highlight: true }
            ],
            bullets: [
                "Real-time stock deductions across all locations",
                "Low inventory alerts and predictive restocking",
                "Multiple warehouse tracking and intra-transfers",
                "Expiry date management for perishable goods"
            ],
            tags: ["REAL-TIME", "LOW STOCK ALERTS", "BATCH TRACKING"],
            outcomeValue: "0%",
            outcomeDesc: "stockouts during peak business seasons with automated alert pipelines"
        },
        {
            id: "03",
            title: "Ledger & Analytics",
            subtitle: "Take what exists. Make it intelligent.",
            label: "FEATURE 03",
            cardTitle: "Ledger & Analytics",
            cardDesc: "Transform raw transaction data into actionable business intelligence.",
            themeColor: "#3b82f6",
            themeBg: "#eff6ff",
            themeBorder: "#bfdbfe",
            themeHighlight: "#dbeafe",
            themeFade: "rgba(59, 130, 246, 0.05)",
            icon: BarChart3,
            flow: [
                { icon: "🧾", title: "COLLECT", desc: "Sales · Expenses" },
                { arrow: "EXTRACT" },
                { icon: "📊", title: "ANALYZE", desc: "Trends · Margins", iconColor: "#0ea5e9" },
                { arrow: "BUILD" },
                { icon: "📑", title: "GENERATE", desc: "Daily · Monthly", iconColor: "#8b5cf6" },
                { arrow: "DEPLOY" },
                { icon: "💡", title: "INSIGHTS", desc: "Growth · Strategy", highlight: true }
            ],
            bullets: [
                "Comprehensive income statements and balance sheets",
                "Supplier ledger management with automatic reconciliation",
                "Custom date range reporting and visual dashboards",
                "Export capabilities to Excel, PDF, and accounting software"
            ],
            tags: ["ANALYTICS", "LEDGER", "EXPORTS", "REPORTS"],
            outcomeValue: "100%",
            outcomeDesc: "visibility across all your financial transactions and historical data"
        }
    ];

    const [activeTab, setActiveTab] = useState(0);
    const activeData = tabData[activeTab];
    const ActiveIcon = activeData.icon;

    return (
        <div className="landing-page">
            {/* Background Pattern */}
            <div className="bg-pattern"></div>

            {/* Top Banner */}
            {bannerVisible && (
                <div className="top-banner">
                    <div className="banner-content">
                        <span>📍 Tower-21, Joyville Hadapsar Annexe Shewalewadi Pune, Maharashtra - 412307</span>
                        <button className="banner-link" onClick={() => navigate('/login')}>Schedule a Meeting →</button>
                    </div>
                    <button className="banner-close" onClick={() => setBannerVisible(false)}>×</button>
                </div>
            )}

            {/* Navigation */}
            <nav className={`landing-nav ${!bannerVisible ? 'no-banner' : ''}`}>
                <div className="nav-brand" onClick={() => navigate('/')}>
                    <img src="/ailexity logo.png" alt="Logo" className="nav-logo" />
                </div>
                
                <div className={`nav-links ${mobileMenuOpen ? 'mobile-open' : ''}`}>
                    <span className="nav-link active">Home</span>
                    <span className="nav-link" onClick={() => navigate('/features')}>Features</span>
                    <span className="nav-link" onClick={() => navigate('/how-it-works')}>Working</span>
                    <span className="nav-link">Industries <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg" style={{marginLeft: '4px'}}><path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg></span>
                    <span className="nav-link" onClick={() => navigate('/how-it-works')}>Case Studies</span>
                </div>

                <div className="nav-actions">
                    <div className="nav-buttons">
                        <button className="btn-teal" onClick={() => navigate('/login')}>
                            Get Started →
                        </button>
                    </div>
                    <button className="mobile-menu-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                        {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="hero">
                <div className="hero-content">
                    <div className="hero-pill">
                        <span className="pill-dot"></span> AI-NATIVE POS SYSTEM
                    </div>
                    
                    <h1 className="hero-title">
                        Transform your business with<br/>
                        <span className="hero-highlight">Smart + Fast</span> team
                    </h1>
                    
                    <p className="hero-subtitle">
                        We partner with ambitious teams to build complex POS systems into production.<br/>
                        Deep expertise. AI-native delivery. 10x speed.
                    </p>
                    
                    <div className="hero-cta-wrapper">
                        <button className="btn-teal btn-large" onClick={() => navigate('/login')}>
                            Get Started →
                        </button>
                    </div>
                </div>

                {/* Stats Section */}
                <div className="hero-stats-row">
                    <div className="stat-line">
                        <span className="stat-number">100+</span> <span className="stat-text">Engineers</span>
                    </div>
                    <div className="stat-divider"></div>
                    <div className="stat-line">
                        <span className="stat-number">80+</span> <span className="stat-text">Products Shipped</span>
                    </div>
                    <div className="stat-divider"></div>
                    <div className="stat-line">
                        <span className="stat-number">5+</span> <span className="stat-text">Years Building</span>
                    </div>
                    <div className="stat-divider"></div>
                    <div className="stat-line">
                        <span className="stat-number">3</span> <span className="stat-text">Continents Served</span>
                    </div>
                </div>

                {/* Process Tabs */}
                <div className="process-tabs">
                    <div className="process-tab">
                        <span className="tab-num">01</span>
                        <span className="tab-name">DISCOVER</span>
                    </div>
                    <div className="process-tab">
                        <span className="tab-num">02</span>
                        <span className="tab-name">ARCHITECT</span>
                    </div>
                    <div className="process-tab">
                        <span className="tab-num">03</span>
                        <span className="tab-name">BUILD</span>
                    </div>
                    <div className="process-tab">
                        <span className="tab-num">04</span>
                        <span className="tab-name">TEST</span>
                    </div>
                    <div className="process-tab">
                        <span className="tab-num">05</span>
                        <span className="tab-name">SHIP</span>
                    </div>
                </div>
            </section>

            {/* What We Do Section */}
            <div className="section-white">
                <section className="what-we-do">
                    <div className="wwd-header">
                        <div className="hero-pill wwd-pill">
                            <span className="pill-dot"></span> WHAT WE DO
                        </div>
                        <h2 className="wwd-title">Three ways we work<br/>with you.</h2>
                        <p className="wwd-subtitle">
                            Every feature is designed for speed, stability, and growth. No complicated setups for basic workflows.
                        </p>
                    </div>

                    <div className="wwd-content" style={{
                        '--theme-primary': activeData.themeColor,
                        '--theme-bg': activeData.themeBg,
                        '--theme-border': activeData.themeBorder,
                        '--theme-highlight': activeData.themeHighlight,
                        '--theme-fade': activeData.themeFade
                    }}>
                        {/* Left sidebar */}
                        <div className="wwd-tabs">
                            {tabData.map((tab, idx) => (
                                <div 
                                    key={tab.id} 
                                    className={`wwd-tab ${activeTab === idx ? 'active' : ''}`}
                                    onClick={() => setActiveTab(idx)}
                                >
                                    <div className={`wwd-tab-num ${activeTab === idx ? 'active-bg' : ''}`}>{tab.id}</div>
                                    <div className={`wwd-tab-text ${activeTab !== idx ? 'muted' : ''}`}>
                                        <h4>{tab.title}</h4>
                                        <p>{tab.subtitle}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Right content card */}
                        <div className="wwd-expanded-card">
                            <div className="wwd-card-header">
                                <div className="wwd-card-icon">
                                    <ActiveIcon size={24} color="#fff" />
                                </div>
                                <div className="wwd-card-title-area">
                                    <span className="wwd-service-label">{activeData.label}</span>
                                    <h3>{activeData.cardTitle}</h3>
                                    <p>{activeData.cardDesc}</p>
                                </div>
                            </div>

                            <div className="wwd-card-flow">
                                {activeData.flow.map((step, idx) => (
                                    step.arrow ? (
                                        <div key={idx} className="flow-arrow"><span className="arrow-text">{step.arrow} &rarr;</span></div>
                                    ) : (
                                        <div key={idx} className="flow-step">
                                            <div className={`flow-box ${step.highlight ? 'highlight-box' : ''}`}>
                                                <span className="flow-icon" style={{color: step.iconColor || 'inherit'}}>{step.icon}</span>
                                                <strong>{step.title}</strong>
                                                <small>{step.desc}</small>
                                            </div>
                                        </div>
                                    )
                                ))}
                            </div>

                            <div className="wwd-card-footer">
                                <div className="wwd-bullets">
                                    <ul>
                                        {activeData.bullets.map((bullet, idx) => (
                                            <li key={idx}><span className="check">✔</span> {bullet}</li>
                                        ))}
                                    </ul>
                                    <div className="wwd-tags">
                                        {activeData.tags.map((tag, idx) => (
                                            <span key={idx}>{tag}</span>
                                        ))}
                                    </div>
                                </div>
                                <div className="wwd-outcome-area">
                                    <div className="wwd-outcome-box">
                                        <span className="outcome-label">RECENT OUTCOME</span>
                                        <span className="outcome-value">{activeData.outcomeValue}</span>
                                        <span className="outcome-desc">{activeData.outcomeDesc}</span>
                                    </div>
                                    <a href="#" className="explore-link">Explore this feature &rarr;</a>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </div>

            {/* Integration Section */}
            <div className="section-integrations">
                <div className="integration-content">
                    <div className="integration-text">
                        <div className="hero-pill wwd-pill" style={{backgroundColor: 'white'}}>
                            <span className="pill-dot"></span> SEAMLESS CONNECTIVITY
                        </div>
                        <h2>Plug and Play. No friction.</h2>
                        <p>We hook natively into the software and hardware stacks you're already using. Stop worrying about compatibility and start running your store.</p>
                        <div className="integration-list">
                            <div className="int-item"><span style={{color: '#6366f1'}}>🔌</span> Stripe & Razorpay</div>
                            <div className="int-item"><span style={{color: '#22c55e'}}>🖨️</span> Epson thermal printers</div>
                            <div className="int-item"><span style={{color: '#eab308'}}>🪪</span> Zebra barcode scanners</div>
                            <div className="int-item"><span style={{color: '#06b6d4'}}>☁️</span> Tally & QuickBooks</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Final CTA */}
            <div className="section-dark">
                <section className="final-cta">
                    <h2>Ready to upgrade your workflow?</h2>
                    <p>Join hundreds of leading retailers and restaurants pushing their business forward with Ailexity POS.</p>
                    <button className="btn-teal btn-large" onClick={() => navigate('/login')}>
                        Start Your Free Trial →
                    </button>
                </section>
            </div>

            {/* Footer */}
            <footer className="site-footer">
                <div className="footer-content">
                    <div className="footer-section">
                        <div style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px'}}>
                            <img src="/ailexity logo.png" alt="Ailexity" style={{height: '32px', filter: 'brightness(0) invert(1)'}} />
                            <span style={{fontSize: '24px', fontWeight: '700', color: 'white', letterSpacing: '-0.5px'}}>Ailexity</span>
                        </div>
                        <p>Next-generation POS system powered by intelligent workflows and AI.</p>
                    </div>
                    <div className="footer-section">
                        <h4>Platform</h4>
                        <ul>
                            <li onClick={() => navigate('/features')}>Features</li>
                            <li onClick={() => navigate('/how-it-works')}>Working</li>
                            <li>Hardware Supported</li>
                        </ul>
                    </div>
                    <div className="footer-section">
                        <h4>Company</h4>
                        <ul>
                            <li>About Us</li>
                            <li>Contact Support</li>
                            <li>System Status</li>
                        </ul>
                    </div>
                </div>
                <div className="footer-bottom">
                    <p>© 2026 Ailexity POS. All rights reserved. | Built for Scale.</p>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;