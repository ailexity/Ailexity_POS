import React, { useState, useEffect } from 'react';
import api from '../api';
import { X, Bell, AlertTriangle, CheckCircle, Info, XCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const AlertPopup = () => {
    const [alerts, setAlerts] = useState([]);
    const { user } = useAuth();

    useEffect(() => {
        if (user && user.role !== 'sysadmin') {
            fetchAlerts();
            // Poll for new alerts every 30 seconds
            const interval = setInterval(fetchAlerts, 30000);
            return () => clearInterval(interval);
        }
    }, [user]);

    const fetchAlerts = async () => {
        try {
            const response = await api.get('/alerts/my-alerts');
            setAlerts(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            console.error('Error fetching alerts:', error);
            setAlerts([]);
        }
    };

    const dismissAlert = async (alertId) => {
        try {
            await api.post(`/alerts/${alertId}/dismiss`);
            setAlerts(prev => prev.filter(a => a.id !== alertId));
        } catch (error) {
            console.error('Error dismissing alert:', error);
            // Still remove from UI even if API fails
            setAlerts(prev => prev.filter(a => a.id !== alertId));
        }
    };

    const getTypeStyles = (type) => {
        switch (type) {
            case 'success':
                return {
                    bg: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    icon: <CheckCircle size={20} />,
                    border: '#059669'
                };
            case 'warning':
                return {
                    bg: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    icon: <AlertTriangle size={20} />,
                    border: '#d97706'
                };
            case 'error':
                return {
                    bg: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                    icon: <XCircle size={20} />,
                    border: '#dc2626'
                };
            default: // info
                return {
                    bg: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                    icon: <Info size={20} />,
                    border: '#4f46e5'
                };
        }
    };

    if (alerts.length === 0 || !user || user.role === 'sysadmin') {
        return null;
    }

    return (
        <div style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            maxWidth: '380px',
            width: '100%'
        }}>
            {alerts.slice(0, 3).map((alert, index) => {
                const typeStyles = getTypeStyles(alert.type);
                
                return (
                    <div
                        key={alert.id}
                        style={{
                            background: 'white',
                            boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
                            overflow: 'hidden',
                            animation: 'slideInRight 0.3s ease-out',
                            animationDelay: `${index * 0.1}s`,
                            animationFillMode: 'both'
                        }}
                    >
                        {/* Colored top bar */}
                        <div style={{
                            height: '4px',
                            background: typeStyles.bg
                        }} />
                        
                        <div style={{ padding: '16px' }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: '12px'
                            }}>
                                {/* Icon */}
                                <div style={{
                                    width: '40px',
                                    height: '40px',
                                    background: typeStyles.bg,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'white',
                                    flexShrink: 0
                                }}>
                                    {typeStyles.icon}
                                </div>
                                
                                {/* Content */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'flex-start',
                                        marginBottom: '4px'
                                    }}>
                                        <h4 style={{
                                            fontSize: '15px',
                                            fontWeight: '600',
                                            color: '#1e293b',
                                            margin: 0,
                                            lineHeight: '1.3'
                                        }}>
                                            {alert.title}
                                        </h4>
                                        <button
                                            onClick={() => dismissAlert(alert.id)}
                                            style={{
                                                background: 'transparent',
                                                border: 'none',
                                                padding: '2px',
                                                cursor: 'pointer',
                                                color: '#94a3b8',
                                                marginLeft: '8px',
                                                flexShrink: 0
                                            }}
                                            title="Dismiss"
                                        >
                                            <X size={18} />
                                        </button>
                                    </div>
                                    <p style={{
                                        fontSize: '13px',
                                        color: '#64748b',
                                        margin: 0,
                                        lineHeight: '1.5'
                                    }}>
                                        {alert.content}
                                    </p>
                                    <p style={{
                                        fontSize: '11px',
                                        color: '#94a3b8',
                                        margin: '8px 0 0',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px'
                                    }}>
                                        <Bell size={10} />
                                        {new Date(alert.created_at).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}
            
            {alerts.length > 3 && (
                <div style={{
                    background: 'rgba(0,0,0,0.7)',
                    color: 'white',
                    padding: '8px 16px',
                    fontSize: '12px',
                    textAlign: 'center'
                }}>
                    +{alerts.length - 3} more notifications
                </div>
            )}

            <style>{`
                @keyframes slideInRight {
                    from {
                        opacity: 0;
                        transform: translateX(100%);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }
            `}</style>
        </div>
    );
};

export default AlertPopup;
