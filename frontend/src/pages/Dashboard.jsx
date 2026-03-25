import React, { useEffect, useState } from 'react';
import api from '../api';
import { DollarSign, ShoppingCart, ShoppingBag, TrendingUp, Package, LayoutDashboard, Calendar, ArrowUp, ArrowDown, Clock, Users, CreditCard, AlertTriangle, Activity, Target, Zap, BarChart3 } from 'lucide-react';
import AIAssistant from '../components/AIAssistant';
import PageLoader from '../components/PageLoader';

const Dashboard = () => {
    const [businessType, setBusinessType] = useState('restaurant');
    const [stats, setStats] = useState({
        totalRevenue: 0,
        totalOrders: 0,
        totalItems: 0,
        avgOrderValue: 0,
        todayRevenue: 0,
        todayOrders: 0,
        todayProfit: 0,
        yesterdayRevenue: 0,
        yesterdayOrders: 0,
        weekRevenue: 0,
        weekOrders: 0,
        monthRevenue: 0,
        monthOrders: 0,
        monthProfit: 0,
        lowStockItems: 0,
        topCategories: [],
        recentInvoices: [],
        hourlyData: Array(24).fill(0),
        paymentModes: {}
    });
    const [loading, setLoading] = useState(true);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [monthlyTarget, setMonthlyTarget] = useState(0);
    const [stockInsights, setStockInsights] = useState({
        monthBuyValue: 0,
        monthUsageValue: 0,
        monthNetCost: 0,
        todayBuyValue: 0,
        todayUsageValue: 0
    });
    const [partyInsights, setPartyInsights] = useState({
        totalReceivable: 0,
        totalPayable: 0,
        overdueCount: 0,
        overdueReceivable: 0,
        topParties: [],
        topProducts: []
    });

    useEffect(() => {
        fetchStats();

        // Update time every second
        const timeInterval = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        // Auto-refresh stats every 30 seconds
        const statsInterval = setInterval(() => {
            fetchStats();
        }, 30000);

        return () => {
            clearInterval(timeInterval);
            clearInterval(statsInterval);
        };
    }, []);

    const fetchStats = async () => {
        try {
            setLoading(true);
            try {
                const stockRes = await api.get('/raw-stock/insights');
                setStockInsights(stockRes.data || {
                    monthBuyValue: 0,
                    monthUsageValue: 0,
                    monthNetCost: 0,
                    todayBuyValue: 0,
                    todayUsageValue: 0
                });
            } catch (stockError) {
                console.error('Error fetching stock insights:', stockError);
                setStockInsights({
                    monthBuyValue: 0,
                    monthUsageValue: 0,
                    monthNetCost: 0,
                    todayBuyValue: 0,
                    todayUsageValue: 0
                });
            }
            
            // Fetch user settings to get monthly target
            try {
                const userRes = await api.get('/users/me');
                if (userRes.data.monthly_target) {
                    setMonthlyTarget(userRes.data.monthly_target);
                }
                const bt = String(userRes.data?.business_type || '').toLowerCase();
                setBusinessType(bt.includes('retail') ? 'retailer' : 'restaurant');
            } catch (e) {
                console.error('Error fetching user settings:', e);
            }

            try {
                const [partySummaryRes, dueAlertsRes] = await Promise.all([
                    api.get('/parties/summaries/all'),
                    api.get('/parties/dues/alerts', { params: { days: 0 } })
                ]);
                const summaries = Array.isArray(partySummaryRes.data) ? partySummaryRes.data : [];
                const dues = Array.isArray(dueAlertsRes.data) ? dueAlertsRes.data : [];

                const totalReceivable = summaries.reduce((sum, s) => sum + Number(s.total_receivable || 0), 0);
                const totalPayable = summaries.reduce((sum, s) => sum + Number(s.total_payable || 0), 0);
                const overdueReceivable = summaries.reduce((sum, s) => sum + Number(s.overdue_receivable || 0), 0);
                const topParties = summaries
                    .slice()
                    .sort((a, b) => (Number(b.total_receivable || 0) + Number(b.total_payable || 0)) - (Number(a.total_receivable || 0) + Number(a.total_payable || 0)))
                    .slice(0, 5);

                let topProducts = [];
                try {
                    const invoicesAggRes = await api.get('/invoices/', { params: { limit: 1000 } });
                    const invoiceRows = Array.isArray(invoicesAggRes.data) ? invoicesAggRes.data : [];
                    const productMap = new Map();
                    invoiceRows.forEach((inv) => {
                        (inv.items || []).forEach((item) => {
                            const key = String(item.item_name || '').trim();
                            if (!key) return;
                            const prev = productMap.get(key) || { name: key, qty: 0, value: 0 };
                            const qty = Number(item.quantity || 0);
                            const value = Number(item.total_price || (Number(item.unit_price || 0) * qty));
                            productMap.set(key, {
                                name: key,
                                qty: prev.qty + qty,
                                value: prev.value + value,
                            });
                        });
                    });
                    topProducts = Array.from(productMap.values())
                        .sort((a, b) => b.qty - a.qty)
                        .slice(0, 5);
                } catch (prodError) {
                    console.error('Error fetching top products:', prodError);
                }

                setPartyInsights({
                    totalReceivable,
                    totalPayable,
                    overdueCount: dues.length,
                    overdueReceivable,
                    topParties,
                    topProducts,
                });
            } catch (partyError) {
                if (partyError?.response?.status !== 404) {
                    console.error('Error fetching party insights:', partyError);
                }
                setPartyInsights({
                    totalReceivable: 0,
                    totalPayable: 0,
                    overdueCount: 0,
                    overdueReceivable: 0,
                    topParties: [],
                    topProducts: []
                });
            }
            
            // Fetch statistics from optimized endpoint
            try {
                const statsRes = await api.get('/invoices/statistics');
                const statsData = statsRes.data;
                
                // Fetch recent invoices for display
                const invoicesRes = await api.get('/invoices/?limit=10');
                const recentInvoices = invoicesRes.data;
                
                // Fetch items for categories
                const itemsRes = await api.get('/items/');
                const items = itemsRes.data;
                
                // Calculate top categories
                const categoryMap = {};
                items.forEach(item => {
                    categoryMap[item.category] = (categoryMap[item.category] || 0) + 1;
                });
                const topCategories = Object.entries(categoryMap)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5)
                    .map(([name, count]) => ({ name, count }));

            setStats({
                totalRevenue: statsData.totalRevenue,
                totalOrders: statsData.totalOrders,
                totalItems: statsData.totalItems,
                avgOrderValue: statsData.avgOrderValue,
                todayRevenue: statsData.todayRevenue,
                todayOrders: statsData.todayOrders,
                todayProfit: statsData.todayProfit || 0,
                yesterdayRevenue: statsData.yesterdayRevenue,
                yesterdayOrders: statsData.yesterdayOrders,
                weekRevenue: statsData.weekRevenue,
                weekOrders: statsData.weekOrders,
                monthRevenue: statsData.monthRevenue,
                monthOrders: statsData.monthOrders,
                monthProfit: statsData.monthProfit || 0,
                lowStockItems: statsData.lowStockItems,
                topCategories,
                recentInvoices,
                hourlyData: statsData.hourlyData,
                paymentModes: statsData.paymentModes
            });
            } catch (statsError) {
                console.error('Error fetching statistics:', statsError);
                console.error('Stats error response:', statsError.response?.data);
                // Set default empty stats on error
                setStats({
                    totalRevenue: 0,
                    totalOrders: 0,
                    totalItems: 0,
                    avgOrderValue: 0,
                    todayRevenue: 0,
                    todayOrders: 0,
                    yesterdayRevenue: 0,
                    yesterdayOrders: 0,
                    weekRevenue: 0,
                    weekOrders: 0,
                    monthRevenue: 0,
                    monthOrders: 0,
                    lowStockItems: 0,
                    topCategories: [],
                    recentInvoices: [],
                    hourlyData: Array(24).fill(0),
                    paymentModes: {}
                });
            }
        } catch (e) {
            console.error('Error fetching stats:', e);
        } finally {
            setLoading(false);
        }
    };

    const calculateTrend = (current, previous) => {
        if (previous === 0) return { trend: current > 0 ? 'up' : null, value: current > 0 ? '+100%' : '—' };
        const change = ((current - previous) / previous) * 100;
        return {
            trend: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral',
            value: `${change > 0 ? '+' : ''}${change.toFixed(1)}%`
        };
    };

    const todayTrend = calculateTrend(stats.todayRevenue, stats.yesterdayRevenue);
    const orderTrend = calculateTrend(stats.todayOrders, stats.yesterdayOrders);

    const formatCurrency = (amount) => {
        if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)}L`;
        if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
        return `₹${amount.toFixed(2)}`;
    };

    const getGreeting = () => {
        const hour = currentTime.getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 17) return 'Good Afternoon';
        return 'Good Evening';
    };

    // Simple bar chart component - 12 bars for 24 hours (2-hour intervals)
    const MiniBarChart = ({ data, maxHeight = 40 }) => {
        // Ensure we have valid data
        const chartData = data && data.length >= 24 ? data : Array(24).fill(0);
        
        // Combine into 2-hour intervals (12 bars total)
        const combinedData = [];
        for (let i = 0; i < 24; i += 2) {
            combinedData.push(chartData[i] + chartData[i + 1]);
        }
        
        const max = Math.max(...combinedData, 1);
        const hasData = combinedData.some(v => v > 0);
        
        // Labels for 2-hour intervals
        const labels = ['12AM', '2AM', '4AM', '6AM', '8AM', '10AM', '12PM', '2PM', '4PM', '6PM', '8PM', '10PM'];
        
        return (
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: maxHeight, position: 'relative' }}>
                {combinedData.map((value, i) => (
                    <div
                        key={i}
                        style={{
                            flex: 1,
                            height: value > 0 ? `${Math.max((value / max) * 100, 10)}%` : '8px',
                            minHeight: '8px',
                            background: value > 0 
                                ? 'linear-gradient(180deg, #8b5cf6 0%, #6366f1 100%)' 
                                : '#e2e8f0',
                            borderRadius: '2px 2px 0 0',
                            transition: 'height 0.3s ease'
                        }}
                        title={`${labels[i]} - ${labels[i + 1] || '12AM'}: ₹${value.toFixed(0)}`}
                    />
                ))}
                {!hasData && (
                    <div style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        fontSize: '12px',
                        color: '#94a3b8',
                        whiteSpace: 'nowrap'
                    }}>
                        No sales today yet
                    </div>
                )}
            </div>
        );
    };

    // Progress ring component
    const ProgressRing = ({ progress, size = 60, strokeWidth = 6, color = '#6366f1' }) => {
        const radius = (size - strokeWidth) / 2;
        const circumference = radius * 2 * Math.PI;
        const offset = circumference - (progress / 100) * circumference;
        
        return (
            <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="#e2e8f0"
                    strokeWidth={strokeWidth}
                />
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={color}
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                />
            </svg>
        );
    };

    // Calculate target progress using user-defined target or fallback to estimate
    const effectiveMonthlyTarget = monthlyTarget > 0 ? monthlyTarget : (stats.avgOrderValue * 30 * 10);
    const targetProgress = effectiveMonthlyTarget > 0 ? Math.min((stats.monthRevenue / effectiveMonthlyTarget) * 100, 100) : 0;

    if (loading && stats.totalOrders === 0) {
        return (
            <div className="page-container with-mobile-branding-offset">
                <PageLoader message="Loading dashboard..." />
            </div>
        );
    }

    return (
        <div className="page-container with-mobile-branding-offset" style={{ background: '#fafafa' }}>
            {/* Mobile-only branding bar */}
            <div className="mobile-branding-bar">
                <span>Ailexity POS Powered by Ailexity</span>
            </div>

            {/* Modern Header */}
            <div className="dashboard-header">
                <div className="dashboard-header-top">
                    <div className="dashboard-greeting">
                        <div className="dashboard-title-row">
                            <div className="dashboard-header-icon">
                                <LayoutDashboard size={22} />
                            </div>
                            <div>
                                <h1 className="dashboard-title">{getGreeting()}!</h1>
                                <p className="dashboard-subtitle">
                                    {currentTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                </p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="dashboard-header-actions">
                        <div className="dashboard-time">
                            <div className="dashboard-time-row">
                                <Clock size={16} />
                                <span className="dashboard-time-value">
                                    {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                </span>
                            </div>
                        </div>
                        <AIAssistant />
                    </div>
                </div>

                {/* Quick Stats Bar */}
                <div className="dashboard-quick-stats">
                    <div className="dashboard-quick-card is-revenue">
                        <div className="dashboard-quick-row">
                            <div>
                                <p className="dashboard-quick-label">Today's Revenue</p>
                                <p className="dashboard-quick-value">{formatCurrency(stats.todayRevenue)}</p>
                            </div>
                            {todayTrend.trend && (
                                <div className={`trend-badge ${todayTrend.trend === 'up' ? 'trend-up' : 'trend-down'}`}>
                                    {todayTrend.trend === 'up' ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                                    {todayTrend.value}
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="dashboard-quick-card is-orders">
                        <p className="dashboard-quick-label">Today's Orders</p>
                        <p className="dashboard-quick-value">{stats.todayOrders}</p>
                    </div>
                    <div className="dashboard-quick-card is-week">
                        <p className="dashboard-quick-label">Week Revenue</p>
                        <p className="dashboard-quick-value">{formatCurrency(stats.weekRevenue)}</p>
                    </div>
                    <div className="dashboard-quick-card is-profit">
                        <p className="dashboard-quick-label">Today's Profit</p>
                        <p className="dashboard-quick-value">{formatCurrency(stats.todayProfit)}</p>
                    </div>
                </div>
            </div>

            <div className="content-area" style={{ padding: 0 }}>
                {/* Mobile Quick Stats */}
                <div className="dashboard-quick-stats-mobile">
                    <div className="dashboard-quick-card is-revenue">
                        <div className="dashboard-quick-row">
                            <div>
                                <p className="dashboard-quick-label">Today's Revenue</p>
                                <p className="dashboard-quick-value">{formatCurrency(stats.todayRevenue)}</p>
                            </div>
                            {todayTrend.trend && (
                                <div className={`trend-badge ${todayTrend.trend === 'up' ? 'trend-up' : 'trend-down'}`}>
                                    {todayTrend.trend === 'up' ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                                    {todayTrend.value}
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="dashboard-quick-card is-orders">
                        <p className="dashboard-quick-label">Today's Orders</p>
                        <p className="dashboard-quick-value">{stats.todayOrders}</p>
                    </div>
                    <div className="dashboard-quick-card is-week">
                        <p className="dashboard-quick-label">Week Revenue</p>
                        <p className="dashboard-quick-value">{formatCurrency(stats.weekRevenue)}</p>
                    </div>
                    <div className="dashboard-quick-card is-profit">
                        <p className="dashboard-quick-label">Today's Profit</p>
                        <p className="dashboard-quick-value">{formatCurrency(stats.todayProfit)}</p>
                    </div>
                </div>

                {/* Mobile Quick Insights */}
                <div className="dashboard-quick-insights">
                    <h2>Quick Insights</h2>
                    <div className="dashboard-quick-insights-grid">
                        <div className="dashboard-quick-insights-card">
                            <p>Average Order</p>
                            <p>{formatCurrency(stats.avgOrderValue)}</p>
                        </div>
                        <div className="dashboard-quick-insights-card">
                            <p>Low Stock Items</p>
                            <p>{stats.lowStockItems}</p>
                        </div>
                        <div className="dashboard-quick-insights-card">
                            <p>Total Orders</p>
                            <p>{stats.totalOrders.toLocaleString()}</p>
                        </div>
                        <div className="dashboard-quick-insights-card">
                            <p>Monthly Progress</p>
                            <p>{targetProgress.toFixed(0)}%</p>
                        </div>
                        <div className="dashboard-quick-insights-card">
                            <p>Stock Buy (Today)</p>
                            <p>{formatCurrency(stockInsights.todayBuyValue)}</p>
                        </div>
                        <div className="dashboard-quick-insights-card">
                            <p>Stock Used Cost (Today)</p>
                            <p>{formatCurrency(stockInsights.todayUsageValue)}</p>
                        </div>
                        {businessType === 'retailer' && (
                            <div className="dashboard-quick-insights-card">
                                <p>Outstanding Receivable</p>
                                <p>{formatCurrency(partyInsights.totalReceivable)}</p>
                            </div>
                        )}
                        {businessType === 'retailer' && (
                            <div className="dashboard-quick-insights-card">
                                <p>Outstanding Payable</p>
                                <p>{formatCurrency(partyInsights.totalPayable)}</p>
                            </div>
                        )}
                    </div>
                </div>

                {businessType === 'retailer' && (
                    <div className="dashboard-card" style={{ background: 'white', padding: '20px', marginBottom: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                            <h2 style={{ margin: 0, fontSize: '18px' }}>Retail Financial Health</h2>
                            <span className="text-xs text-muted">Live party ledger aggregation</span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(160px, 1fr))', gap: '12px', marginBottom: '14px' }}>
                            <div style={{ background: '#ecfdf3', border: '1px solid #86efac', padding: '12px' }}>
                                <p className="text-xs" style={{ color: '#166534' }}>Total Receivable</p>
                                <p style={{ fontWeight: 700, color: '#14532d' }}>{formatCurrency(partyInsights.totalReceivable)}</p>
                            </div>
                            <div style={{ background: '#fff7ed', border: '1px solid #fdba74', padding: '12px' }}>
                                <p className="text-xs" style={{ color: '#9a3412' }}>Total Payable</p>
                                <p style={{ fontWeight: 700, color: '#7c2d12' }}>{formatCurrency(partyInsights.totalPayable)}</p>
                            </div>
                            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '12px' }}>
                                <p className="text-xs" style={{ color: '#991b1b' }}>Overdue Entries</p>
                                <p style={{ fontWeight: 700, color: '#7f1d1d' }}>{partyInsights.overdueCount}</p>
                            </div>
                            <div style={{ background: '#eef2ff', border: '1px solid #c7d2fe', padding: '12px' }}>
                                <p className="text-xs" style={{ color: '#3730a3' }}>Overdue Receivable</p>
                                <p style={{ fontWeight: 700, color: '#312e81' }}>{formatCurrency(partyInsights.overdueReceivable)}</p>
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <div>
                                <p className="text-sm" style={{ fontWeight: 600, marginBottom: '8px' }}>Top Parties by Exposure</p>
                                {partyInsights.topParties.length === 0 ? (
                                    <p className="text-muted text-sm">No party financial data yet.</p>
                                ) : (
                                    <div style={{ display: 'grid', gap: '8px' }}>
                                        {partyInsights.topParties.map((p) => (
                                            <div key={p.party_id} style={{ display: 'flex', justifyContent: 'space-between', background: '#f8fafc', border: '1px solid #e2e8f0', padding: '10px' }}>
                                                <span style={{ fontWeight: 600 }}>{p.party_name}</span>
                                                <span className="text-sm">Rec {formatCurrency(p.total_receivable)} | Pay {formatCurrency(p.total_payable)}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div>
                                <p className="text-sm" style={{ fontWeight: 600, marginBottom: '8px' }}>Top Selling Products</p>
                                {partyInsights.topProducts.length === 0 ? (
                                    <p className="text-muted text-sm">No product movement data yet.</p>
                                ) : (
                                    <div style={{ display: 'grid', gap: '8px' }}>
                                        {partyInsights.topProducts.map((p) => (
                                            <div key={p.name} style={{ display: 'flex', justifyContent: 'space-between', background: '#f8fafc', border: '1px solid #e2e8f0', padding: '10px' }}>
                                                <span style={{ fontWeight: 600 }}>{p.name}</span>
                                                <span className="text-sm">Qty {p.qty} | {formatCurrency(p.value)}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Main Dashboard Grid */}
                <div className="dashboard-main-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginBottom: '24px' }}>
                    
                    {/* Left Column */}
                    <div className="dashboard-left-col" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        
                        {/* Today's Activity Card */}
                        <div className="dashboard-card" style={{
                            background: 'white',
                            borderRadius: '0',
                            padding: '24px',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.1)'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{
                                        width: '40px',
                                        height: '40px',
                                        background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                                        borderRadius: '0',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        <Activity size={20} color="white" />
                                    </div>
                                    <div>
                                        <h3 style={{ fontSize: '16px', fontWeight: '600', margin: 0 }}>Today's Activity</h3>
                                        <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>Sales throughout the day (24 hours)</p>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Zap size={14} color="#f59e0b" />
                                    <span style={{ fontSize: '12px', color: '#64748b' }}>Live</span>
                                </div>
                            </div>
                            
                            {/* Hourly Sales Chart */}
                            <div style={{ marginBottom: '16px' }}>
                                <MiniBarChart data={stats.hourlyData} maxHeight={80} />
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '10px', color: '#94a3b8' }}>
                                    <span>12AM</span>
                                    <span>6AM</span>
                                    <span>12PM</span>
                                    <span>6PM</span>
                                    <span>12AM</span>
                                </div>
                            </div>
                            
                            {/* Today vs Yesterday Comparison */}
                            <div className="dashboard-compare-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div style={{ background: '#f0fdf4', borderRadius: '0', padding: '16px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                                        <span style={{ fontSize: '12px', color: '#166534', fontWeight: '500' }}>Today</span>
                                        {todayTrend.trend === 'up' && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#16a34a', fontSize: '12px' }}>
                                                <ArrowUp size={12} />
                                                {todayTrend.value}
                                            </div>
                                        )}
                                    </div>
                                    <p style={{ fontSize: '24px', fontWeight: '700', color: '#15803d', margin: 0 }}>
                                        ₹{stats.todayRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                                    </p>
                                    <p style={{ fontSize: '12px', color: '#22c55e', marginTop: '4px' }}>{stats.todayOrders} orders</p>
                                </div>
                                <div style={{ background: '#f8fafc', borderRadius: '0', padding: '16px' }}>
                                    <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '500' }}>Yesterday</span>
                                    <p style={{ fontSize: '24px', fontWeight: '700', color: '#475569', margin: '8px 0 0' }}>
                                        ₹{stats.yesterdayRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                                    </p>
                                    <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>{stats.yesterdayOrders} orders</p>
                                </div>
                            </div>
                        </div>

                        {/* Performance Metrics */}
                        <div className="dashboard-card" style={{
                            background: 'white',
                            borderRadius: '0',
                            padding: '24px',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.1)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                                <div style={{
                                    width: '40px',
                                    height: '40px',
                                    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                                    borderRadius: '0',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <BarChart3 size={20} color="white" />
                                </div>
                                <div>
                                    <h3 style={{ fontSize: '16px', fontWeight: '600', margin: 0 }}>Performance Overview</h3>
                                    <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>All-time business metrics</p>
                                </div>
                            </div>

                            <div className="dashboard-metrics-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                                <div style={{ textAlign: 'center', padding: '16px', background: '#fef3c7', borderRadius: '0' }}>
                                    <DollarSign size={24} style={{ color: '#d97706', marginBottom: '8px' }} />
                                    <p style={{ fontSize: '20px', fontWeight: '700', color: '#92400e', margin: 0 }}>
                                        {formatCurrency(stats.totalRevenue)}
                                    </p>
                                    <p style={{ fontSize: '11px', color: '#a16207', marginTop: '4px' }}>Total Revenue</p>
                                </div>
                                <div style={{ textAlign: 'center', padding: '16px', background: '#dbeafe', borderRadius: '0' }}>
                                    <ShoppingBag size={24} style={{ color: '#2563eb', marginBottom: '8px' }} />
                                    <p style={{ fontSize: '20px', fontWeight: '700', color: '#1e40af', margin: 0 }}>
                                        {stats.totalOrders.toLocaleString()}
                                    </p>
                                    <p style={{ fontSize: '11px', color: '#3b82f6', marginTop: '4px' }}>Total Orders</p>
                                </div>
                                <div style={{ textAlign: 'center', padding: '16px', background: '#dcfce7', borderRadius: '0' }}>
                                    <CreditCard size={24} style={{ color: '#16a34a', marginBottom: '8px' }} />
                                    <p style={{ fontSize: '20px', fontWeight: '700', color: '#166534', margin: 0 }}>
                                        ₹{stats.avgOrderValue.toFixed(0)}
                                    </p>
                                    <p style={{ fontSize: '11px', color: '#22c55e', marginTop: '4px' }}>Avg Order</p>
                                </div>
                                <div style={{ textAlign: 'center', padding: '16px', background: '#f3e8ff', borderRadius: '0' }}>
                                    <Package size={24} style={{ color: '#9333ea', marginBottom: '8px' }} />
                                    <p style={{ fontSize: '20px', fontWeight: '700', color: '#7c3aed', margin: 0 }}>
                                        {stats.totalItems}
                                    </p>
                                    <p style={{ fontSize: '11px', color: '#a855f7', marginTop: '4px' }}>Active Items</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="dashboard-right-col" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        
                        {/* Monthly Target */}
                        <div className="dashboard-card" style={{
                            background: 'white',
                            borderRadius: '0',
                            padding: '24px',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.1)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                                <div style={{
                                    width: '40px',
                                    height: '40px',
                                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                    borderRadius: '0',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <Target size={20} color="white" />
                                </div>
                                <div>
                                    <h3 style={{ fontSize: '16px', fontWeight: '600', margin: 0 }}>Monthly Progress</h3>
                                    <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>Target vs Achieved</p>
                                </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                                <div style={{ position: 'relative' }}>
                                    <ProgressRing progress={targetProgress} size={120} strokeWidth={10} color="#10b981" />
                                    <div style={{
                                        position: 'absolute',
                                        top: '50%',
                                        left: '50%',
                                        transform: 'translate(-50%, -50%) rotate(0deg)',
                                        textAlign: 'center'
                                    }}>
                                        <p style={{ fontSize: '24px', fontWeight: '700', color: '#059669', margin: 0 }}>
                                            {targetProgress.toFixed(0)}%
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div style={{ textAlign: 'center' }}>
                                <p style={{ fontSize: '14px', color: '#64748b' }}>
                                    <span style={{ fontWeight: '600', color: '#10b981' }}>{formatCurrency(stats.monthRevenue)}</span>
                                    {' of '}{formatCurrency(effectiveMonthlyTarget)} target
                                </p>
                                {monthlyTarget === 0 && (
                                    <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
                                        Set your target in Settings
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Alerts & Insights */}
                        <div className="dashboard-card" style={{
                            background: 'white',
                            borderRadius: '0',
                            padding: '24px',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.1)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                                <div style={{
                                    width: '40px',
                                    height: '40px',
                                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                                    borderRadius: '0',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <AlertTriangle size={20} color="white" />
                                </div>
                                <div>
                                    <h3 style={{ fontSize: '16px', fontWeight: '600', margin: 0 }}>Alerts & Insights</h3>
                                    <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>Things that need attention</p>
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {/* Low Stock Alert */}
                                {stats.lowStockItems > 0 ? (
                                    <div style={{
                                        background: '#fef2f2',
                                        border: '1px solid #fecaca',
                                        borderRadius: '0',
                                        padding: '14px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px'
                                    }}>
                                        <div style={{
                                            width: '36px',
                                            height: '36px',
                                            background: '#fee2e2',
                                            borderRadius: '0',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}>
                                            <Package size={18} color="#dc2626" />
                                        </div>
                                        <div>
                                            <p style={{ fontSize: '13px', fontWeight: '600', color: '#991b1b', margin: 0 }}>
                                                Low Stock Warning
                                            </p>
                                            <p style={{ fontSize: '12px', color: '#b91c1c', margin: 0 }}>
                                                {stats.lowStockItems} item{stats.lowStockItems > 1 ? 's' : ''} below 10 units
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <div style={{
                                        background: '#f0fdf4',
                                        border: '1px solid #bbf7d0',
                                        borderRadius: '0',
                                        padding: '14px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px'
                                    }}>
                                        <div style={{
                                            width: '36px',
                                            height: '36px',
                                            background: '#dcfce7',
                                            borderRadius: '0',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}>
                                            <Package size={18} color="#16a34a" />
                                        </div>
                                        <div>
                                            <p style={{ fontSize: '13px', fontWeight: '600', color: '#166534', margin: 0 }}>
                                                Stock Healthy
                                            </p>
                                            <p style={{ fontSize: '12px', color: '#22c55e', margin: 0 }}>
                                                All items well stocked
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Sales Trend Alerts */}
                                {todayTrend.trend === 'up' && (
                                    <div style={{
                                        background: '#f0fdf4',
                                        border: '1px solid #bbf7d0',
                                        borderRadius: '0',
                                        padding: '14px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px'
                                    }}>
                                        <div style={{
                                            width: '36px',
                                            height: '36px',
                                            background: '#dcfce7',
                                            borderRadius: '0',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}>
                                            <TrendingUp size={18} color="#16a34a" />
                                        </div>
                                        <div>
                                            <p style={{ fontSize: '13px', fontWeight: '600', color: '#166534', margin: 0 }}>
                                                Sales Growing
                                            </p>
                                            <p style={{ fontSize: '12px', color: '#22c55e', margin: 0 }}>
                                                {todayTrend.value} vs yesterday
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {todayTrend.trend === 'down' && (
                                    <div style={{
                                        background: '#fffbeb',
                                        border: '1px solid #fde68a',
                                        borderRadius: '0',
                                        padding: '14px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px'
                                    }}>
                                        <div style={{
                                            width: '36px',
                                            height: '36px',
                                            background: '#fef3c7',
                                            borderRadius: '0',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}>
                                            <TrendingUp size={18} color="#d97706" style={{ transform: 'rotate(180deg)' }} />
                                        </div>
                                        <div>
                                            <p style={{ fontSize: '13px', fontWeight: '600', color: '#92400e', margin: 0 }}>
                                                Sales Down Today
                                            </p>
                                            <p style={{ fontSize: '12px', color: '#d97706', margin: 0 }}>
                                                {todayTrend.value} from yesterday
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* No Activity Alert - when no trend (both today and yesterday are 0) */}
                                {!todayTrend.trend && stats.todayRevenue === 0 && (
                                    <div style={{
                                        background: '#f8fafc',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '0',
                                        padding: '14px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px'
                                    }}>
                                        <div style={{
                                            width: '36px',
                                            height: '36px',
                                            background: '#f1f5f9',
                                            borderRadius: '0',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}>
                                            <Activity size={18} color="#64748b" />
                                        </div>
                                        <div>
                                            <p style={{ fontSize: '13px', fontWeight: '600', color: '#475569', margin: 0 }}>
                                                No Sales Today
                                            </p>
                                            <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>
                                                Start taking orders to see activity
                                            </p>
                                        </div>
                                    </div>
                                )}

                                <div style={{
                                    background: '#eef2ff',
                                    border: '1px solid #c7d2fe',
                                    borderRadius: '0',
                                    padding: '14px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '6px'
                                }}>
                                    <p style={{ fontSize: '13px', fontWeight: '700', color: '#3730a3', margin: 0 }}>
                                        Stock Cost Insights
                                    </p>
                                    <p style={{ fontSize: '12px', color: '#4338ca', margin: 0 }}>
                                        Buy (Month): {formatCurrency(stockInsights.monthBuyValue)}
                                    </p>
                                    <p style={{ fontSize: '12px', color: '#4338ca', margin: 0 }}>
                                        Usage Exit (Month): {formatCurrency(stockInsights.monthUsageValue)}
                                    </p>
                                    <p style={{ fontSize: '12px', color: '#312e81', margin: 0, fontWeight: 700 }}>
                                        Net Stock Cost: {formatCurrency(stockInsights.monthNetCost)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Row - Quick Stats */}
                <div className="dashboard-bottom-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
                    <div className="dashboard-stat-card" style={{
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        borderRadius: '0',
                        padding: '24px',
                        color: 'white',
                        position: 'relative',
                        overflow: 'hidden'
                    }}>
                        <div style={{
                            position: 'absolute',
                            top: '-20px',
                            right: '-20px',
                            width: '100px',
                            height: '100px',
                            background: 'rgba(255,255,255,0.1)',
                            borderRadius: '0'
                        }} />
                        <DollarSign size={28} style={{ opacity: 0.8, marginBottom: '12px' }} />
                        <p style={{ fontSize: '12px', opacity: 0.8, marginBottom: '4px' }}>Daily Average Revenue</p>
                        <p style={{ fontSize: '28px', fontWeight: '700', margin: 0 }}>
                            ₹{stats.monthOrders > 0 ? (stats.monthRevenue / new Date().getDate()).toFixed(0) : '0'}
                        </p>
                    </div>

                    <div className="dashboard-stat-card" style={{
                        background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                        borderRadius: '0',
                        padding: '24px',
                        color: 'white',
                        position: 'relative',
                        overflow: 'hidden'
                    }}>
                        <div style={{
                            position: 'absolute',
                            top: '-20px',
                            right: '-20px',
                            width: '100px',
                            height: '100px',
                            background: 'rgba(255,255,255,0.1)',
                            borderRadius: '0'
                        }} />
                        <Users size={28} style={{ opacity: 0.8, marginBottom: '12px' }} />
                        <p style={{ fontSize: '12px', opacity: 0.8, marginBottom: '4px' }}>Orders Per Day (This Month)</p>
                        <p style={{ fontSize: '28px', fontWeight: '700', margin: 0 }}>
                            {stats.monthOrders > 0 ? (stats.monthOrders / new Date().getDate()).toFixed(1) : '0'}
                        </p>
                    </div>

                    <div className="dashboard-stat-card" style={{
                        background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                        borderRadius: '0',
                        padding: '24px',
                        color: 'white',
                        position: 'relative',
                        overflow: 'hidden'
                    }}>
                        <div style={{
                            position: 'absolute',
                            top: '-20px',
                            right: '-20px',
                            width: '100px',
                            height: '100px',
                            background: 'rgba(255,255,255,0.1)',
                            borderRadius: '0'
                        }} />
                        <TrendingUp size={28} style={{ opacity: 0.8, marginBottom: '12px' }} />
                        <p style={{ fontSize: '12px', opacity: 0.8, marginBottom: '4px' }}>Week Growth</p>
                        <p style={{ fontSize: '28px', fontWeight: '700', margin: 0 }}>
                            {stats.weekOrders > 0 ? '+' + ((stats.weekRevenue / Math.max(stats.monthRevenue || 1, 1)) * 100).toFixed(0) : '0'}%
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
