import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Activity,
    AlertTriangle,
    ArrowDown,
    ArrowUp,
    BarChart3,
    Clock,
    CreditCard,
    DollarSign,
    FileText,
    LayoutDashboard,
    Package,
    ShoppingCart,
    Target,
    TrendingUp,
    Users,
    WalletCards,
    Zap
} from 'lucide-react';
import api from '../api';
import AIAssistant from '../components/AIAssistant';
import PageLoader from '../components/PageLoader';

const emptyStats = {
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
};

const emptyStockInsights = {
    monthBuyValue: 0,
    monthUsageValue: 0,
    monthNetCost: 0,
    todayBuyValue: 0,
    todayUsageValue: 0
};

const emptyPartyInsights = {
    totalReceivable: 0,
    totalPayable: 0,
    overdueCount: 0,
    overdueReceivable: 0,
    topParties: [],
    topProducts: []
};

const Dashboard = () => {
    const navigate = useNavigate();
    const [businessType, setBusinessType] = useState('restaurant');
    const [stats, setStats] = useState(emptyStats);
    const [loading, setLoading] = useState(true);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [monthlyTarget, setMonthlyTarget] = useState(0);
    const [stockInsights, setStockInsights] = useState(emptyStockInsights);
    const [partyInsights, setPartyInsights] = useState(emptyPartyInsights);

    useEffect(() => {
        fetchStats();

        const timeInterval = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        const statsInterval = setInterval(() => {
            fetchStats();
        }, 30000);

        return () => {
            clearInterval(timeInterval);
            clearInterval(statsInterval);
        };
    }, []);

    const fetchStats = async () => {
        setLoading(true);
        try {
            const [
                stockRes,
                userRes,
                partySummaryRes,
                dueAlertsRes,
                statsRes,
                invoicesRes,
                itemsRes,
                topProductsRes
            ] = await Promise.allSettled([
                api.get('/raw-stock/insights'),
                api.get('/users/me'),
                api.get('/parties/summaries/all'),
                api.get('/parties/dues/alerts', { params: { days: 0 } }),
                api.get('/invoices/statistics'),
                api.get('/invoices/', { params: { limit: 10 } }),
                api.get('/items/'),
                api.get('/invoices/top-products', { params: { limit: 5 } })
            ]);

            if (stockRes.status === 'fulfilled') {
                setStockInsights(stockRes.value.data || emptyStockInsights);
            } else {
                console.error('Error fetching stock insights:', stockRes.reason);
                setStockInsights(emptyStockInsights);
            }

            if (userRes.status === 'fulfilled') {
                const userData = userRes.value.data || {};
                if (userData.monthly_target) {
                    setMonthlyTarget(userData.monthly_target);
                }
                const bt = String(userData?.business_type || '').toLowerCase();
                setBusinessType(bt.includes('retail') ? 'retailer' : 'restaurant');
            } else {
                console.error('Error fetching user settings:', userRes.reason);
            }

            const summaries = partySummaryRes.status === 'fulfilled' && Array.isArray(partySummaryRes.value.data)
                ? partySummaryRes.value.data
                : [];
            const dues = dueAlertsRes.status === 'fulfilled' && Array.isArray(dueAlertsRes.value.data)
                ? dueAlertsRes.value.data
                : [];

            if (partySummaryRes.status !== 'fulfilled') {
                console.error('Error fetching party summaries:', partySummaryRes.reason);
            }
            if (dueAlertsRes.status !== 'fulfilled') {
                console.error('Error fetching party dues alerts:', dueAlertsRes.reason);
            }

            const totalReceivable = summaries.reduce((sum, s) => sum + Number(s.total_receivable || 0), 0);
            const totalPayable = summaries.reduce((sum, s) => sum + Number(s.total_payable || 0), 0);
            const overdueReceivable = summaries.reduce((sum, s) => sum + Number(s.overdue_receivable || 0), 0);
            const topParties = summaries
                .slice()
                .sort((a, b) => (Number(b.total_receivable || 0) + Number(b.total_payable || 0)) - (Number(a.total_receivable || 0) + Number(a.total_payable || 0)))
                .slice(0, 5);

            const topProducts = topProductsRes.status === 'fulfilled' && Array.isArray(topProductsRes.value.data)
                ? topProductsRes.value.data
                : [];
            if (topProductsRes.status !== 'fulfilled') {
                console.error('Error fetching top products:', topProductsRes.reason);
            }

            setPartyInsights({
                totalReceivable,
                totalPayable,
                overdueCount: dues.length,
                overdueReceivable,
                topParties,
                topProducts,
            });

            if (statsRes.status === 'fulfilled') {
                const statsData = statsRes.value.data || {};
                const items = itemsRes.status === 'fulfilled' && Array.isArray(itemsRes.value.data)
                    ? itemsRes.value.data
                    : [];

                if (itemsRes.status !== 'fulfilled') {
                    console.error('Error fetching item list:', itemsRes.reason);
                }

                const categoryMap = {};
                items.forEach(item => {
                    const category = item.category || 'Uncategorized';
                    categoryMap[category] = (categoryMap[category] || 0) + 1;
                });
                const topCategories = Object.entries(categoryMap)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5)
                    .map(([name, count]) => ({ name, count }));

                setStats({
                    totalRevenue: statsData.totalRevenue || 0,
                    totalOrders: statsData.totalOrders || 0,
                    totalItems: statsData.totalItems || 0,
                    avgOrderValue: statsData.avgOrderValue || 0,
                    todayRevenue: statsData.todayRevenue || 0,
                    todayOrders: statsData.todayOrders || 0,
                    todayProfit: statsData.todayProfit || 0,
                    yesterdayRevenue: statsData.yesterdayRevenue || 0,
                    yesterdayOrders: statsData.yesterdayOrders || 0,
                    weekRevenue: statsData.weekRevenue || 0,
                    weekOrders: statsData.weekOrders || 0,
                    monthRevenue: statsData.monthRevenue || 0,
                    monthOrders: statsData.monthOrders || 0,
                    monthProfit: statsData.monthProfit || 0,
                    lowStockItems: statsData.lowStockItems || 0,
                    topCategories,
                    recentInvoices: invoicesRes.status === 'fulfilled' && Array.isArray(invoicesRes.value.data)
                        ? invoicesRes.value.data
                        : [],
                    hourlyData: Array.isArray(statsData.hourlyData) ? statsData.hourlyData : Array(24).fill(0),
                    paymentModes: statsData.paymentModes || {}
                });
            } else {
                console.error('Error fetching statistics:', statsRes.reason);
                setStats(emptyStats);
            }
        } catch (e) {
            console.error('Error fetching stats:', e);
        } finally {
            setLoading(false);
        }
    };

    const calculateTrend = (current, previous) => {
        if (previous === 0) return { trend: current > 0 ? 'up' : null, value: current > 0 ? '+100%' : '0%' };
        const change = ((current - previous) / previous) * 100;
        return {
            trend: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral',
            value: `${change > 0 ? '+' : ''}${change.toFixed(1)}%`
        };
    };

    const formatCurrency = (amount = 0) => {
        const value = Number(amount) || 0;
        if (value >= 100000) return `₹${(value / 100000).toFixed(2)}L`;
        if (value >= 1000) return `₹${(value / 1000).toFixed(1)}K`;
        return `₹${value.toFixed(0)}`;
    };

    const getGreeting = () => {
        const hour = currentTime.getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 17) return 'Good Afternoon';
        return 'Good Evening';
    };

    const todayTrend = calculateTrend(stats.todayRevenue, stats.yesterdayRevenue);
    const orderTrend = calculateTrend(stats.todayOrders, stats.yesterdayOrders);
    const effectiveMonthlyTarget = monthlyTarget > 0 ? monthlyTarget : (stats.avgOrderValue * 30 * 10);
    const targetProgress = effectiveMonthlyTarget > 0 ? Math.min((stats.monthRevenue / effectiveMonthlyTarget) * 100, 100) : 0;
    const isRetailer = businessType === 'retailer';

    const paymentTotal = Object.values(stats.paymentModes || {}).reduce((sum, value) => sum + Number(value || 0), 0);
    const topPaymentModes = Object.entries(stats.paymentModes || {})
        .sort((a, b) => Number(b[1] || 0) - Number(a[1] || 0))
        .slice(0, 4);

    const actionTiles = [
        {
            label: 'Quick billing',
            title: 'Start a sale',
            icon: ShoppingCart,
            to: '/pos'
        },
        {
            label: 'Records',
            title: isRetailer ? 'View invoices' : 'View history',
            icon: FileText,
            to: '/history'
        },
        {
            label: 'Inventory',
            title: isRetailer ? 'Open stock' : 'Manage inventory',
            icon: Package,
            to: isRetailer ? '/stock' : '/items'
        },
        {
            label: isRetailer ? 'Credit partners' : 'Order funnel',
            title: isRetailer ? 'Open parties' : 'Online orders',
            icon: isRetailer ? Users : Activity,
            to: isRetailer ? '/parties' : '/orders'
        }
    ];

    if (loading && stats.totalOrders === 0) {
        return (
            <div className="page-container with-mobile-branding-offset">
                <PageLoader message="Loading dashboard..." />
            </div>
        );
    }

    return (
        <div className="page-container with-mobile-branding-offset dashboard-page">
            <div className="mobile-branding-bar">
                <span>Ailexity POS Powered by Ailexity</span>
            </div>

            <section className="dashboard-hero">
                <div className="dashboard-hero-main">
                    <div className="dashboard-title-row">
                        <div className="dashboard-header-icon">
                            <LayoutDashboard size={22} />
                        </div>
                        <div>
                            <p className="dashboard-eyebrow">{isRetailer ? 'Retail command center' : 'Restaurant command center'}</p>
                            <h1 className="dashboard-title">{getGreeting()}!</h1>
                            <p className="dashboard-subtitle">
                                {currentTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                            </p>
                        </div>
                    </div>

                    <div className="dashboard-hero-copy">
                        <p>
                            {isRetailer
                                ? 'Monitor sales, stock movement, receivables, and ledger exposure from one focused view.'
                                : 'Keep billing, sales activity, inventory alerts, and order flow visible without jumping screens.'}
                        </p>
                    </div>
                </div>

                <div className="dashboard-hero-side">
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
            </section>

            <main className="content-area dashboard-content">
                <section className="dashboard-kpi-grid">
                    <KpiCard
                        tone="teal"
                        icon={DollarSign}
                        label="Today's Revenue"
                        value={formatCurrency(stats.todayRevenue)}
                        trend={todayTrend}
                        helper={`${stats.todayOrders} orders today`}
                    />
                    <KpiCard
                        tone="orange"
                        icon={ShoppingCart}
                        label="Today's Orders"
                        value={stats.todayOrders.toLocaleString()}
                        trend={orderTrend}
                        helper={`Yesterday ${stats.yesterdayOrders}`}
                    />
                    <KpiCard
                        tone="blue"
                        icon={BarChart3}
                        label="Week Revenue"
                        value={formatCurrency(stats.weekRevenue)}
                        helper={`${stats.weekOrders} orders this week`}
                    />
                    <KpiCard
                        tone="green"
                        icon={TrendingUp}
                        label="Today's Profit"
                        value={formatCurrency(stats.todayProfit)}
                        helper={`Month profit ${formatCurrency(stats.monthProfit)}`}
                    />
                </section>

                <section className="dashboard-action-grid">
                    {actionTiles.map((tile) => {
                        const Icon = tile.icon;
                        return (
                            <button key={tile.to} type="button" className="dashboard-action-card" onClick={() => navigate(tile.to)}>
                                <span>
                                    <span className="dashboard-action-label">{tile.label}</span>
                                    <span className="dashboard-action-title">{tile.title}</span>
                                </span>
                                <Icon size={22} />
                            </button>
                        );
                    })}
                </section>

                {isRetailer && (
                    <section className="dashboard-card dashboard-retail-health">
                        <SectionHeader
                            icon={WalletCards}
                            title="Retail Financial Health"
                            subtitle="Live party ledger aggregation"
                            tone="blue"
                        />
                        <div className="dashboard-mini-stat-grid">
                            <MiniStat label="Receivable" value={formatCurrency(partyInsights.totalReceivable)} tone="green" />
                            <MiniStat label="Payable" value={formatCurrency(partyInsights.totalPayable)} tone="orange" />
                            <MiniStat label="Overdue Entries" value={partyInsights.overdueCount} tone="red" />
                            <MiniStat label="Overdue Receivable" value={formatCurrency(partyInsights.overdueReceivable)} tone="blue" />
                        </div>
                        <div className="dashboard-list-grid">
                            <InsightList
                                title="Top Parties by Exposure"
                                emptyText="No party financial data yet."
                                items={partyInsights.topParties.map((party) => ({
                                    id: party.party_id,
                                    title: party.party_name,
                                    meta: `Rec ${formatCurrency(party.total_receivable)} | Pay ${formatCurrency(party.total_payable)}`
                                }))}
                            />
                            <InsightList
                                title="Top Selling Products"
                                emptyText="No product movement data yet."
                                items={partyInsights.topProducts.map((product) => ({
                                    id: product.name,
                                    title: product.name,
                                    meta: `Qty ${product.qty} | ${formatCurrency(product.value)}`
                                }))}
                            />
                        </div>
                    </section>
                )}

                <section className="dashboard-grid">
                    <div className="dashboard-column">
                        <section className="dashboard-card">
                            <SectionHeader icon={Activity} title="Today's Activity" subtitle="Sales across 2-hour intervals" tone="teal" badge="Live" />
                            <MiniBarChart data={stats.hourlyData} />
                            <div className="dashboard-chart-axis">
                                <span>12AM</span>
                                <span>6AM</span>
                                <span>12PM</span>
                                <span>6PM</span>
                                <span>12AM</span>
                            </div>
                            <div className="dashboard-compare-grid">
                                <CompareTile label="Today" value={formatCurrency(stats.todayRevenue)} helper={`${stats.todayOrders} orders`} trend={todayTrend} tone="green" />
                                <CompareTile label="Yesterday" value={formatCurrency(stats.yesterdayRevenue)} helper={`${stats.yesterdayOrders} orders`} tone="slate" />
                            </div>
                        </section>

                        <section className="dashboard-card">
                            <SectionHeader icon={BarChart3} title="Performance Overview" subtitle="All-time business metrics" tone="blue" />
                            <div className="dashboard-metrics-grid">
                                <MetricTile icon={DollarSign} label="Total Revenue" value={formatCurrency(stats.totalRevenue)} tone="orange" />
                                <MetricTile icon={ShoppingCart} label="Total Orders" value={stats.totalOrders.toLocaleString()} tone="blue" />
                                <MetricTile icon={CreditCard} label="Avg Order" value={formatCurrency(stats.avgOrderValue)} tone="green" />
                                <MetricTile icon={Package} label="Active Items" value={stats.totalItems.toLocaleString()} tone="purple" />
                            </div>
                        </section>
                    </div>

                    <div className="dashboard-column">
                        <section className="dashboard-card dashboard-target-card">
                            <SectionHeader icon={Target} title="Monthly Progress" subtitle="Target vs achieved" tone="green" />
                            <ProgressRing progress={targetProgress} />
                            <p className="dashboard-target-value">{targetProgress.toFixed(0)}%</p>
                            <p className="dashboard-target-copy">
                                <strong>{formatCurrency(stats.monthRevenue)}</strong> of {formatCurrency(effectiveMonthlyTarget)} target
                            </p>
                            {monthlyTarget === 0 && <p className="dashboard-target-note">Set your target in Settings</p>}
                        </section>

                        <section className="dashboard-card">
                            <SectionHeader icon={AlertTriangle} title="Alerts & Insights" subtitle="Items that need attention" tone="orange" />
                            <div className="dashboard-alert-stack">
                                {stats.lowStockItems > 0 ? (
                                    <AlertRow tone="red" icon={Package} title="Low Stock Warning" copy={`${stats.lowStockItems} item${stats.lowStockItems > 1 ? 's' : ''} below 10 units`} />
                                ) : (
                                    <AlertRow tone="green" icon={Package} title="Stock Healthy" copy="All items well stocked" />
                                )}

                                {todayTrend.trend === 'up' && (
                                    <AlertRow tone="green" icon={TrendingUp} title="Sales Growing" copy={`${todayTrend.value} vs yesterday`} />
                                )}
                                {todayTrend.trend === 'down' && (
                                    <AlertRow tone="orange" icon={TrendingUp} title="Sales Down Today" copy={`${todayTrend.value} from yesterday`} />
                                )}
                                {!todayTrend.trend && stats.todayRevenue === 0 && (
                                    <AlertRow tone="slate" icon={Activity} title="No Sales Today" copy="Start taking orders to see activity" />
                                )}

                                <div className="dashboard-stock-insight">
                                    <p>Stock Cost Insights</p>
                                    <span>Buy Month: {formatCurrency(stockInsights.monthBuyValue)}</span>
                                    <span>Usage Exit: {formatCurrency(stockInsights.monthUsageValue)}</span>
                                    <strong>Net Stock Cost: {formatCurrency(stockInsights.monthNetCost)}</strong>
                                </div>
                            </div>
                        </section>
                    </div>
                </section>

                <section className="dashboard-bottom-grid">
                    <SummaryCard icon={DollarSign} label="Daily Average Revenue" value={`₹${stats.monthOrders > 0 ? (stats.monthRevenue / new Date().getDate()).toFixed(0) : '0'}`} tone="green" />
                    <SummaryCard icon={Users} label="Orders Per Day" value={stats.monthOrders > 0 ? (stats.monthOrders / new Date().getDate()).toFixed(1) : '0'} tone="blue" />
                    <SummaryCard icon={Zap} label="Week Share of Month" value={`${stats.weekOrders > 0 ? '+' + ((stats.weekRevenue / Math.max(stats.monthRevenue || 1, 1)) * 100).toFixed(0) : '0'}%`} tone="purple" />
                </section>

                <section className="dashboard-card dashboard-wide-insights">
                    <SectionHeader icon={CreditCard} title="Payment Mix" subtitle="Recent payment mode distribution" tone="purple" />
                    {topPaymentModes.length === 0 ? (
                        <p className="dashboard-empty-text">No payment data yet.</p>
                    ) : (
                        <div className="dashboard-payment-list">
                            {topPaymentModes.map(([mode, amount]) => {
                                const pct = paymentTotal > 0 ? (Number(amount || 0) / paymentTotal) * 100 : 0;
                                return (
                                    <div key={mode} className="dashboard-payment-row">
                                        <div>
                                            <strong>{mode}</strong>
                                            <span>{formatCurrency(amount)}</span>
                                        </div>
                                        <div className="dashboard-payment-track">
                                            <span style={{ width: `${Math.max(pct, 4)}%` }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
};

const KpiCard = ({ icon: Icon, label, value, helper, trend, tone }) => (
    <article className={`dashboard-kpi-card tone-${tone}`}>
        <div className="dashboard-kpi-top">
            <span className="dashboard-kpi-icon"><Icon size={20} /></span>
            {trend?.trend && (
                <span className={`trend-badge ${trend.trend === 'up' ? 'trend-up' : trend.trend === 'down' ? 'trend-down' : ''}`}>
                    {trend.trend === 'down' ? <ArrowDown size={13} /> : <ArrowUp size={13} />}
                    {trend.value}
                </span>
            )}
        </div>
        <p className="dashboard-kpi-label">{label}</p>
        <p className="dashboard-kpi-value">{value}</p>
        <p className="dashboard-kpi-helper">{helper}</p>
    </article>
);

const SectionHeader = ({ icon: Icon, title, subtitle, tone, badge }) => (
    <div className="dashboard-section-header">
        <span className={`dashboard-section-icon tone-${tone}`}><Icon size={20} /></span>
        <div>
            <h2>{title}</h2>
            <p>{subtitle}</p>
        </div>
        {badge && <span className="dashboard-live-badge"><Zap size={13} />{badge}</span>}
    </div>
);

const MiniBarChart = ({ data }) => {
    const chartData = data && data.length >= 24 ? data : Array(24).fill(0);
    const combinedData = [];
    for (let i = 0; i < 24; i += 2) {
        combinedData.push((Number(chartData[i]) || 0) + (Number(chartData[i + 1]) || 0));
    }
    const max = Math.max(...combinedData, 1);
    const hasData = combinedData.some(value => value > 0);

    return (
        <div className="dashboard-mini-chart">
            {combinedData.map((value, index) => (
                <span
                    key={index}
                    style={{ height: value > 0 ? `${Math.max((value / max) * 100, 10)}%` : '8px' }}
                    title={`₹${value.toFixed(0)}`}
                />
            ))}
            {!hasData && <p>No sales today yet</p>}
        </div>
    );
};

const ProgressRing = ({ progress }) => {
    const size = 132;
    const strokeWidth = 10;
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (progress / 100) * circumference;

    return (
        <svg className="dashboard-progress-ring" width={size} height={size}>
            <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e2e8f0" strokeWidth={strokeWidth} />
            <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="#108a85"
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                strokeLinecap="round"
            />
        </svg>
    );
};

const CompareTile = ({ label, value, helper, trend, tone }) => (
    <div className={`dashboard-compare-tile tone-${tone}`}>
        <div>
            <span>{label}</span>
            {trend?.trend === 'up' && <small><ArrowUp size={12} />{trend.value}</small>}
            {trend?.trend === 'down' && <small><ArrowDown size={12} />{trend.value}</small>}
        </div>
        <strong>{value}</strong>
        <p>{helper}</p>
    </div>
);

const MetricTile = ({ icon: Icon, label, value, tone }) => (
    <div className={`dashboard-metric-tile tone-${tone}`}>
        <Icon size={22} />
        <strong>{value}</strong>
        <span>{label}</span>
    </div>
);

const AlertRow = ({ icon: Icon, title, copy, tone }) => (
    <div className={`dashboard-alert-row tone-${tone}`}>
        <span><Icon size={18} /></span>
        <div>
            <strong>{title}</strong>
            <p>{copy}</p>
        </div>
    </div>
);

const MiniStat = ({ label, value, tone }) => (
    <div className={`dashboard-mini-stat tone-${tone}`}>
        <span>{label}</span>
        <strong>{value}</strong>
    </div>
);

const InsightList = ({ title, emptyText, items }) => (
    <div className="dashboard-insight-list">
        <h3>{title}</h3>
        {items.length === 0 ? (
            <p className="dashboard-empty-text">{emptyText}</p>
        ) : (
            items.map((item) => (
                <div key={item.id || item.title} className="dashboard-list-row">
                    <strong>{item.title}</strong>
                    <span>{item.meta}</span>
                </div>
            ))
        )}
    </div>
);

const SummaryCard = ({ icon: Icon, label, value, tone }) => (
    <article className={`dashboard-summary-card tone-${tone}`}>
        <Icon size={26} />
        <span>{label}</span>
        <strong>{value}</strong>
    </article>
);

export default Dashboard;
