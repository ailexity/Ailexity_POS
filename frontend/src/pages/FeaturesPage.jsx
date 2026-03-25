import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    ShoppingCart, Package, TrendingUp, Users, BarChart3, 
    Lock, Zap, Clock, HelpCircle, ArrowRight, CheckCircle2 
} from 'lucide-react';
import './FeaturesPage.css';

const FeaturesPage = () => {
    const navigate = useNavigate();

    const restaurants = [
        {
            icon: <Zap size={28} />,
            title: 'Lightning-Fast Billing',
            description: 'Process hundreds of orders per hour with our optimized billing system. Split bills, apply discounts, and manage taxes instantly.'
        },
        {
            icon: <ShoppingCart size={28} />,
            title: 'Multi-Channel Orders',
            description: 'Manage table orders, takeaways, and online orders in one unified queue. No more confusion, everything in one place.'
        },
        {
            icon: <Package size={28} />,
            title: 'Smart Inventory',
            description: 'Track menu items in real-time, get low-stock alerts, and manage suppliers efficiently.'
        },
        {
            icon: <BarChart3 size={28} />,
            title: 'Live Analytics',
            description: 'See your best-selling items, peak hours, and profit margins at a glance. Data-driven decisions made easy.'
        },
        {
            icon: <Users size={28} />,
            title: 'Team Management',
            description: 'Control staff permissions, track who sold what, and monitor daily activities with role-based access.'
        },
        {
            icon: <Clock size={28} />,
            title: 'Real-Time Updates',
            description: 'Orders update instantly across all devices. Kitchen staff gets notifications immediately.'
        }
    ];

    const retail = [
        {
            icon: <Package size={28} />,
            title: 'Real-Time Inventory',
            description: 'Know exactly what\'s in stock, what\'s low, and what needs reordering. Automatic stock adjustments on every sale.'
        },
        {
            icon: <Users size={28} />,
            title: 'Party Ledger',
            description: 'Manage customers and suppliers in one place. Track balances, credit limits, and full transaction history.'
        },
        {
            icon: <ShoppingCart size={28} />,
            title: 'Smart Billing',
            description: 'Generate GST-compliant invoices instantly. Support for multiple payment methods and flexible pricing.'
        },
        {
            icon: <TrendingUp size={28} />,
            title: 'Purchase Management',
            description: 'Track purchases from suppliers, manage stock refills, and control your buying costs intelligently.'
        },
        {
            icon: <BarChart3 size={28} />,
            title: 'Business Insights',
            description: 'Comprehensive reports on profit, losses, sales trends, and inventory movement. Make smarter business decisions.'
        },
        {
            icon: <Lock size={28} />,
            title: 'Secure Data',
            description: 'Your business data is encrypted and secure. Regular backups and complete audit trails.'
        }
    ];

    const commonFeatures = [
        {
            title: 'Cloud-Based',
            description: 'Access your business from anywhere. No installation, no maintenance required.',
            icon: <Zap size={24} />
        },
        {
            title: 'Multi-User',
            description: 'Multiple staff members can work simultaneously with role-based permissions.',
            icon: <Users size={24} />
        },
        {
            title: '24/7 Support',
            description: 'Our support team is always ready to help you get the most out of Ailexity POS.',
            icon: <HelpCircle size={24} />
        },
        {
            title: 'Reliable & Fast',
            description: '99.9% uptime guarantee with lightning-fast performance, even during peak hours.',
            icon: <Clock size={24} />
        }
    ];

    return (
        <div className="features-page">
            {/* Navigation */}
            <nav className="features-nav">
                <div className="nav-brand">
                    <img src="/ailexity logo.png" alt="Ailexity" className="nav-logo" />
                    <span className="nav-text">Ailexity POS</span>
                </div>
                <div className="nav-buttons">
                    <button className="nav-link" onClick={() => navigate('/')}>Home</button>
                    <button className="nav-btn" onClick={() => navigate('/login')}>Login</button>
                </div>
            </nav>

            {/* Hero */}
            <section className="features-hero">
                <div className="features-hero-content">
                    <h1>Powerful Features Built for Your Business</h1>
                    <p>Everything you need to run your business efficiently and grow confidently</p>
                </div>
            </section>

            {/* Restaurant Features */}
            <section className="category-section">
                <div className="section-header">
                    <h2>For Restaurants</h2>
                    <p>Complete solution for service, kitchen, and billing operations</p>
                </div>
                <div className="features-showcase">
                    {restaurants.map((feature, idx) => (
                        <div key={idx} className="feature-showcase-card">
                            <div className="feature-icon-large">{feature.icon}</div>
                            <h3>{feature.title}</h3>
                            <p>{feature.description}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Retail Features */}
            <section className="category-section alt">
                <div className="section-header">
                    <h2>For Retailers</h2>
                    <p>Complete ERP system for inventory, suppliers, and sales</p>
                </div>
                <div className="features-showcase">
                    {retail.map((feature, idx) => (
                        <div key={idx} className="feature-showcase-card">
                            <div className="feature-icon-large">{feature.icon}</div>
                            <h3>{feature.title}</h3>
                            <p>{feature.description}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Common Features */}
            <section className="category-section">
                <div className="section-header">
                    <h2>Available Everywhere</h2>
                    <p>Core features designed to support any business</p>
                </div>
                <div className="common-features-grid">
                    {commonFeatures.map((feature, idx) => (
                        <div key={idx} className="common-feature-card">
                            <div className="common-feature-icon">{feature.icon}</div>
                            <h3>{feature.title}</h3>
                            <p>{feature.description}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Feature Comparison */}
            <section className="features-highlight">
                <h2>Why Choose Ailexity POS?</h2>
                <div className="highlight-grid">
                    <div className="highlight-item">
                        <CheckCircle2 className="check-icon" size={24} />
                        <h4>Lightning Fast</h4>
                        <p>Experience minimal lag even during peak hours with optimized performance</p>
                    </div>
                    <div className="highlight-item">
                        <CheckCircle2 className="check-icon" size={24} />
                        <h4>Easy to Use</h4>
                        <p>Minimal learning curve. Your team can start using it on day one</p>
                    </div>
                    <div className="highlight-item">
                        <CheckCircle2 className="check-icon" size={24} />
                        <h4>Secure</h4>
                        <p>Enterprise-grade security with data encryption and automatic backups</p>
                    </div>
                    <div className="highlight-item">
                        <CheckCircle2 className="check-icon" size={24} />
                        <h4>Affordable</h4>
                        <p>Transparent pricing with no hidden fees. Pay for what you use</p>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="features-cta">
                <h2>Ready to Get Started?</h2>
                <p>Join hundreds of businesses already using Ailexity POS</p>
                <button className="btn-large btn-primary" onClick={() => navigate('/login')}>
                    Start Free Trial <ArrowRight size={20} />
                </button>
            </section>

            {/* Footer */}
            <footer className="features-footer">
                <div className="footer-content">
                    <div className="footer-section">
                        <h4>Ailexity POS</h4>
                        <p>© 2026 All rights reserved</p>
                    </div>
                    <div className="footer-section">
                        <h4>Product</h4>
                        <ul>
                            <li><button onClick={() => navigate('/')} className="footer-link">Home</button></li>
                            <li><button onClick={() => navigate('/how-it-works')} className="footer-link">How It Works</button></li>
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

export default FeaturesPage;