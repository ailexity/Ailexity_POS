import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle2, ChevronDown } from 'lucide-react';
import './HowItWorks.css';

const HowItWorks = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('restaurants');
    const [expandedFaq, setExpandedFaq] = useState(null);

    const restaurantSteps = [
        {
            step: '1',
            title: 'Setup Your Business',
            description: 'Create your account and set up your restaurant profile. Add your menu items with categories, pricing, and descriptions.',
            details: ['Create restaurant profile', 'Add menu categories', 'Set item prices & descriptions', 'Configure tax settings']
        },
        {
            step: '2',
            title: 'Add Your Team',
            description: 'Invite staff members with different roles. Control what each person can access and modify.',
            details: ['Invite staff members', 'Assign roles (admin, cashier, etc.)', 'Set permissions', 'Enable notifications']
        },
        {
            step: '3',
            title: 'Start Taking Orders',
            description: 'Use the POS system to take orders from customers. Manage tables, takeaways, and online orders seamlessly.',
            details: ['Create customer orders', 'Manage table assignments', 'Handle takeaway orders', 'Track online orders']
        },
        {
            step: '4',
            title: 'Process Payments',
            description: 'Accept multiple payment methods. Generate bills instantly and manage refunds as needed.',
            details: ['Accept cash payments', 'Process card/UPI payments', 'Split bills', 'Apply discounts']
        },
        {
            step: '5',
            title: 'Monitor Analytics',
            description: 'View real-time reports on sales, popular items, peak hours, and revenue trends.',
            details: ['Check daily sales', 'Analyze best-selling items', 'Identify peak hours', 'Track staff performance']
        }
    ];

    const retailSteps = [
        {
            step: '1',
            title: 'Add Your Products',
            description: 'Create your product catalog with details like name, SKU, price, quantity, and GST category.',
            details: ['Add product information', 'Set pricing & GST', 'Create product categories', 'Define reorder quantities']
        },
        {
            step: '2',
            title: 'Manage Parties',
            description: 'Add customers and suppliers to your party ledger. Track their contact info, balances, and credit limits.',
            details: ['Add customers', 'Add suppliers', 'Set credit limits', 'Track contact info']
        },
        {
            step: '3',
            title: 'Create Invoices',
            description: 'Generate professional GST-compliant invoices when selling to customers or distributing stock.',
            details: ['Select products', 'Set quantities', 'Add discounts', 'Generate invoice']
        },
        {
            step: '4',
            title: 'Manage Purchases',
            description: 'Track purchases from suppliers. Stock updates automatically, and you can manage supplier payments.',
            details: ['Record purchases', 'Update inventory', 'Track expenses', 'Manage supplier balances']
        },
        {
            step: '5',
            title: 'Monitor & Grow',
            description: 'Use dashboards and reports to understand your business. Make data-driven decisions for growth.',
            details: ['View profit/loss', 'Analyze stock movement', 'Track sales trends', 'Plan inventory']
        }
    ];

    const faqs = [
        {
            question: 'How much does Ailexity POS cost?',
            answer: 'We offer flexible pricing based on your business needs. Start with our free trial to explore all features, then choose a plan that works for you.'
        },
        {
            question: 'Is my data secure?',
            answer: 'Yes! All data is encrypted and stored securely. We perform regular backups and follow industry-standard security practices.'
        },
        {
            question: 'Can I use it offline?',
            answer: 'Our system is cloud-based for best performance. However, you can continue taking orders offline, and they will sync when you reconnect.'
        },
        {
            question: 'How long does setup take?',
            answer: 'Basic setup takes about 30 minutes. You can start taking orders immediately and refine details over time.'
        },
        {
            question: 'Do you provide training?',
            answer: 'Yes! We offer comprehensive onboarding and have a support team available 24/7 to help you and your staff.'
        },
        {
            question: 'Can I integrate with other tools?',
            answer: 'We support integrations with popular accounting software, payment gateways, and other business tools.'
        }
    ];

    const steps = activeTab === 'restaurants' ? restaurantSteps : retailSteps;

    return (
        <div className="how-it-works-page">
            {/* Navigation */}
            <nav className="how-nav">
                <div className="nav-brand">
                    <img src="/ailexity logo.png" alt="Ailexity" className="nav-logo" />
                    <span className="nav-text">Ailexity POS</span>
                </div>
                <div className="nav-buttons">
                    <button className="nav-link" onClick={() => navigate('/')}>Home</button>
                    <button className="nav-link" onClick={() => navigate('/features')}>Features</button>
                    <button className="nav-btn" onClick={() => navigate('/login')}>Login</button>
                </div>
            </nav>

            {/* Hero */}
            <section className="how-hero">
                <h1>How Ailexity POS Works</h1>
                <p>Simple, intuitive process to transform your business operations</p>
            </section>

            {/* Tab Selection */}
            <section className="how-tabs">
                <div className="tab-buttons">
                    <button 
                        className={`tab-btn ${activeTab === 'restaurants' ? 'active' : ''}`}
                        onClick={() => setActiveTab('restaurants')}
                    >
                        For Restaurants
                    </button>
                    <button 
                        className={`tab-btn ${activeTab === 'retail' ? 'active' : ''}`}
                        onClick={() => setActiveTab('retail')}
                    >
                        For Retailers
                    </button>
                </div>
            </section>

            {/* Steps */}
            <section className="how-steps">
                <div className="steps-container">
                    {steps.map((step, idx) => (
                        <div key={idx} className="step-card">
                            <div className="step-number">{step.step}</div>
                            <div className="step-content">
                                <h3>{step.title}</h3>
                                <p className="step-description">{step.description}</p>
                                <ul className="step-details">
                                    {step.details.map((detail, i) => (
                                        <li key={i}>
                                            <CheckCircle2 size={18} />
                                            <span>{detail}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Timeline Visualization */}
            <section className="timeline-section">
                <h2>Your Success Timeline</h2>
                <div className="timeline">
                    <div className="timeline-item">
                        <div className="timeline-marker">Day 1</div>
                        <div className="timeline-content">
                            <h4>Setup & Training</h4>
                            <p>Get your system ready and train your team</p>
                        </div>
                    </div>
                    <div className="timeline-arrow">→</div>
                    <div className="timeline-item">
                        <div className="timeline-marker">Week 1</div>
                        <div className="timeline-content">
                            <h4>First Orders</h4>
                            <p>Start taking orders and processing sales</p>
                        </div>
                    </div>
                    <div className="timeline-arrow">→</div>
                    <div className="timeline-item">
                        <div className="timeline-marker">Month 1</div>
                        <div className="timeline-content">
                            <h4>Optimization</h4>
                            <p>Analyze data and optimize your workflow</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* FAQs */}
            <section className="faq-section">
                <h2>Frequently Asked Questions</h2>
                <div className="faq-container">
                    {faqs.map((faq, idx) => (
                        <div key={idx} className="faq-item">
                            <button 
                                className="faq-question"
                                onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                            >
                                <span>{faq.question}</span>
                                <ChevronDown 
                                    size={20} 
                                    className={`faq-icon ${expandedFaq === idx ? 'open' : ''}`}
                                />
                            </button>
                            {expandedFaq === idx && (
                                <div className="faq-answer">
                                    {faq.answer}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </section>

            {/* CTA */}
            <section className="how-cta">
                <div className="cta-content">
                    <h2>Ready to Get Started?</h2>
                    <p>Join 500+ businesses that trust Ailexity POS</p>
                    <button className="btn-large btn-primary" onClick={() => navigate('/login')}>
                        Start Your Free Trial <ArrowRight size={20} />
                    </button>
                </div>
            </section>

            {/* Footer */}
            <footer className="how-footer">
                <div className="footer-content">
                    <div className="footer-section">
                        <h4>Ailexity POS</h4>
                        <p>© 2026 All rights reserved</p>
                    </div>
                    <div className="footer-section">
                        <h4>Product</h4>
                        <ul>
                            <li><button onClick={() => navigate('/')} className="footer-link">Home</button></li>
                            <li><button onClick={() => navigate('/features')} className="footer-link">Features</button></li>
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

export default HowItWorks;