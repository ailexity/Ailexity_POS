"""
Analytics Engine Service
Advanced analytics and business intelligence for restaurant operations
"""

import json
from typing import Dict, List, Tuple, Any, Optional
from collections import Counter, defaultdict
from datetime import datetime, timedelta
import logging
import statistics

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class AnalyticsEngine:
    """
    Comprehensive analytics engine for restaurant business intelligence
    """
    
    def __init__(self):
        """Initialize analytics engine with tracking capabilities"""
        self.interaction_logs = []
        self.sales_history = []
        self.metrics = defaultdict(list)
        self.predictions = {}
        logger.info("AnalyticsEngine initialized")
    
    def log_interaction(self, user_input: str, predicted_intent: str, 
                       confidence: float, response: str, user_id: Optional[str] = None):
        """
        Log user interaction for analysis
        
        Args:
            user_input: User's input text
            predicted_intent: Model's predicted intent
            confidence: Confidence score
            response: Generated response
            user_id: Optional user identifier
        """
        interaction = {
            'timestamp': datetime.now().isoformat(),
            'user_input': user_input,
            'predicted_intent': predicted_intent,
            'confidence': confidence,
            'response': response,
            'user_id': user_id
        }
        self.interaction_logs.append(interaction)
        self.metrics['confidence'].append(confidence)
        self.metrics['intent'].append(predicted_intent)
        
        logger.debug(f"Logged interaction: {predicted_intent} (confidence: {confidence:.3f})")
    
    def log_sales_data(self, date: datetime, sales: float, orders: int, **kwargs):
        """
        Log daily sales data
        
        Args:
            date: Date of sales
            sales: Total sales amount
            orders: Number of orders
            **kwargs: Additional metrics
        """
        sales_entry = {
            'date': date.strftime('%Y-%m-%d'),
            'sales': sales,
            'orders': orders,
            'timestamp': datetime.now().isoformat()
        }
        sales_entry.update(kwargs)
        self.sales_history.append(sales_entry)
        
        logger.info(f"Logged sales data for {date.strftime('%Y-%m-%d')}: ₹{sales}")
    
    def get_intent_distribution(self) -> Dict[str, int]:
        """
        Get distribution of predicted intents
        
        Returns:
            Dictionary with intent counts
        """
        intents = [log['predicted_intent'] for log in self.interaction_logs]
        distribution = dict(Counter(intents))
        logger.info(f"Intent distribution: {distribution}")
        return distribution
    
    def get_average_confidence(self) -> float:
        """
        Calculate average confidence score
        
        Returns:
            Average confidence score
        """
        if not self.metrics['confidence']:
            return 0.0
        
        avg_confidence = statistics.mean(self.metrics['confidence'])
        logger.info(f"Average confidence: {avg_confidence:.2f}")
        return avg_confidence
    
    def get_confidence_statistics(self) -> Dict[str, float]:
        """
        Get comprehensive confidence statistics
        
        Returns:
            Dictionary with confidence metrics
        """
        if not self.metrics['confidence']:
            return {
                'mean': 0.0,
                'median': 0.0,
                'std_dev': 0.0,
                'min': 0.0,
                'max': 0.0
            }
        
        confidences = self.metrics['confidence']
        return {
            'mean': statistics.mean(confidences),
            'median': statistics.median(confidences),
            'std_dev': statistics.stdev(confidences) if len(confidences) > 1 else 0.0,
            'min': min(confidences),
            'max': max(confidences)
        }
    
    def get_low_confidence_interactions(self, threshold: float = 0.5) -> List[Dict]:
        """
        Get interactions with low confidence scores
        
        Args:
            threshold: Confidence threshold
            
        Returns:
            List of low-confidence interactions
        """
        low_confidence = [
            log for log in self.interaction_logs 
            if log['confidence'] < threshold
        ]
        logger.info(f"Found {len(low_confidence)} low-confidence interactions")
        return low_confidence
    
    def analyze_intent_trends(self, time_window_hours: int = 24) -> Dict[str, Any]:
        """
        Analyze intent usage trends over time
        
        Args:
            time_window_hours: Time window for analysis in hours
            
        Returns:
            Dictionary with trend analysis
        """
        cutoff_time = datetime.now() - timedelta(hours=time_window_hours)
        
        recent_logs = [
            log for log in self.interaction_logs
            if datetime.fromisoformat(log['timestamp']) > cutoff_time
        ]
        
        if not recent_logs:
            return {'message': 'No recent interactions'}
        
        intents = [log['predicted_intent'] for log in recent_logs]
        intent_counts = Counter(intents)
        
        return {
            'time_window_hours': time_window_hours,
            'total_interactions': len(recent_logs),
            'unique_intents': len(intent_counts),
            'most_common': intent_counts.most_common(5),
            'least_common': intent_counts.most_common()[-5:] if len(intent_counts) > 5 else []
        }
    
    def predict_sales_trend(self, days_ahead: int = 7) -> Dict[str, Any]:
        """
        Simple sales prediction using moving average
        
        Args:
            days_ahead: Number of days to predict
            
        Returns:
            Dictionary with predictions
        """
        if len(self.sales_history) < 7:
            return {
                'error': 'Insufficient data for prediction',
                'required_days': 7,
                'available_days': len(self.sales_history)
            }
        
        # Calculate moving average (simple prediction)
        recent_sales = [entry['sales'] for entry in self.sales_history[-7:]]
        avg_sales = statistics.mean(recent_sales)
        trend = (recent_sales[-1] - recent_sales[0]) / len(recent_sales)
        
        predictions = []
        for i in range(1, days_ahead + 1):
            predicted_sales = avg_sales + (trend * i)
            predictions.append({
                'day': i,
                'predicted_sales': max(0, predicted_sales),  # Ensure non-negative
                'confidence': 'medium'
            })
        
        return {
            'predictions': predictions,
            'base_average': avg_sales,
            'detected_trend': 'increasing' if trend > 0 else 'decreasing',
            'trend_value': trend
        }
    
    def analyze_sales_performance(self) -> Dict[str, Any]:
        """
        Comprehensive sales performance analysis
        
        Returns:
            Dictionary with performance metrics
        """
        if not self.sales_history:
            return {'error': 'No sales data available'}
        
        total_sales = sum(entry['sales'] for entry in self.sales_history)
        total_orders = sum(entry.get('orders', 0) for entry in self.sales_history)
        avg_daily_sales = total_sales / len(self.sales_history)
        
        sales_values = [entry['sales'] for entry in self.sales_history]
        
        # Find best and worst days
        best_day = max(self.sales_history, key=lambda x: x['sales'])
        worst_day = min(self.sales_history, key=lambda x: x['sales'])
        
        # Calculate growth rate
        growth_rate = 0
        if len(self.sales_history) >= 2:
            first_week_avg = statistics.mean([e['sales'] for e in self.sales_history[:7]]) if len(self.sales_history) >= 7 else self.sales_history[0]['sales']
            last_week_avg = statistics.mean([e['sales'] for e in self.sales_history[-7:]]) if len(self.sales_history) >= 7 else self.sales_history[-1]['sales']
            if first_week_avg > 0:
                growth_rate = ((last_week_avg - first_week_avg) / first_week_avg) * 100
        
        return {
            'total_sales': total_sales,
            'total_orders': total_orders,
            'avg_daily_sales': avg_daily_sales,
            'avg_order_value': total_sales / total_orders if total_orders > 0 else 0,
            'days_tracked': len(self.sales_history),
            'best_day': {
                'date': best_day['date'],
                'sales': best_day['sales']
            },
            'worst_day': {
                'date': worst_day['date'],
                'sales': worst_day['sales']
            },
            'sales_variance': statistics.variance(sales_values) if len(sales_values) > 1 else 0,
            'growth_rate_percentage': growth_rate
        }
    
    def identify_anomalies(self, threshold_std: float = 2.0) -> List[Dict]:
        """
        Identify anomalous sales days using statistical methods
        
        Args:
            threshold_std: Number of standard deviations for anomaly detection
            
        Returns:
            List of anomalous entries
        """
        if len(self.sales_history) < 3:
            return []
        
        sales_values = [entry['sales'] for entry in self.sales_history]
        mean_sales = statistics.mean(sales_values)
        std_sales = statistics.stdev(sales_values)
        
        anomalies = []
        for entry in self.sales_history:
            z_score = (entry['sales'] - mean_sales) / std_sales if std_sales > 0 else 0
            if abs(z_score) > threshold_std:
                anomalies.append({
                    'date': entry['date'],
                    'sales': entry['sales'],
                    'z_score': z_score,
                    'type': 'spike' if z_score > 0 else 'drop'
                })
        
        logger.info(f"Identified {len(anomalies)} anomalies")
        return anomalies
    
    def get_user_engagement_stats(self) -> Dict[str, Any]:
        """
        Analyze user engagement patterns
        
        Returns:
            Dictionary with engagement metrics
        """
        if not self.interaction_logs:
            return {'total_users': 0, 'total_interactions': 0}
        
        # Extract user IDs
        user_ids = [log.get('user_id') for log in self.interaction_logs if log.get('user_id')]
        unique_users = len(set(user_ids))
        
        # Calculate sessions (interactions within 30 minutes)
        sessions = self._calculate_sessions()
        
        # Average interactions per user
        avg_interactions_per_user = len(user_ids) / unique_users if unique_users > 0 else 0
        
        return {
            'total_users': unique_users,
            'total_interactions': len(self.interaction_logs),
            'avg_interactions_per_user': avg_interactions_per_user,
            'total_sessions': len(sessions),
            'avg_session_length': statistics.mean([s['duration'] for s in sessions]) if sessions else 0
        }
    
    def _calculate_sessions(self, session_gap_minutes: int = 30) -> List[Dict]:
        """
        Calculate user sessions based on interaction timing
        
        Args:
            session_gap_minutes: Gap in minutes to define new session
            
        Returns:
            List of session dictionaries
        """
        if not self.interaction_logs:
            return []
        
        # Sort by timestamp
        sorted_logs = sorted(self.interaction_logs, key=lambda x: x['timestamp'])
        
        sessions = []
        current_session = {
            'start': sorted_logs[0]['timestamp'],
            'end': sorted_logs[0]['timestamp'],
            'interactions': 1
        }
        
        for i in range(1, len(sorted_logs)):
            prev_time = datetime.fromisoformat(sorted_logs[i-1]['timestamp'])
            curr_time = datetime.fromisoformat(sorted_logs[i]['timestamp'])
            
            time_diff = (curr_time - prev_time).total_seconds() / 60
            
            if time_diff <= session_gap_minutes:
                # Continue current session
                current_session['end'] = sorted_logs[i]['timestamp']
                current_session['interactions'] += 1
            else:
                # Start new session
                start = datetime.fromisoformat(current_session['start'])
                end = datetime.fromisoformat(current_session['end'])
                current_session['duration'] = (end - start).total_seconds() / 60
                sessions.append(current_session)
                
                current_session = {
                    'start': sorted_logs[i]['timestamp'],
                    'end': sorted_logs[i]['timestamp'],
                    'interactions': 1
                }
        
        # Add last session
        start = datetime.fromisoformat(current_session['start'])
        end = datetime.fromisoformat(current_session['end'])
        current_session['duration'] = (end - start).total_seconds() / 60
        sessions.append(current_session)
        
        return sessions
    
    def generate_report(self, include_sales: bool = True) -> Dict[str, Any]:
        """
        Generate comprehensive analytics report
        
        Args:
            include_sales: Whether to include sales analytics
            
        Returns:
            Dictionary containing various metrics and insights
        """
        report = {
            'generated_at': datetime.now().isoformat(),
            'interaction_analytics': {
                'total_interactions': len(self.interaction_logs),
                'intent_distribution': self.get_intent_distribution(),
                'confidence_stats': self.get_confidence_statistics(),
                'low_confidence_count': len(self.get_low_confidence_interactions()),
                'unique_intents': len(set(log['predicted_intent'] for log in self.interaction_logs))
            },
            'engagement_analytics': self.get_user_engagement_stats()
        }
        
        if include_sales and self.sales_history:
            report['sales_analytics'] = self.analyze_sales_performance()
            report['anomalies'] = self.identify_anomalies()
            report['sales_prediction'] = self.predict_sales_trend(days_ahead=7)
        
        logger.info("Comprehensive analytics report generated")
        return report
    
    def export_logs(self, filepath: str, log_type: str = 'interactions'):
        """
        Export logs to JSON file
        
        Args:
            filepath: Path to export file
            log_type: Type of logs to export ('interactions', 'sales', or 'all')
        """
        try:
            export_data = {}
            
            if log_type in ['interactions', 'all']:
                export_data['interaction_logs'] = self.interaction_logs
            
            if log_type in ['sales', 'all']:
                export_data['sales_history'] = self.sales_history
            
            if log_type == 'all':
                export_data['report'] = self.generate_report()
            
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(export_data, f, indent=2, ensure_ascii=False)
            
            logger.info(f"Exported {log_type} logs to {filepath}")
        except Exception as e:
            logger.error(f"Error exporting logs: {e}")
    
    def clear_logs(self, log_type: str = 'all'):
        """
        Clear logs and metrics
        
        Args:
            log_type: Type of logs to clear ('interactions', 'sales', or 'all')
        """
        if log_type in ['interactions', 'all']:
            self.interaction_logs = []
            self.metrics = defaultdict(list)
        
        if log_type in ['sales', 'all']:
            self.sales_history = []
        
        logger.info(f"Cleared {log_type} logs")
    
    def get_recommendations(self) -> List[str]:
        """
        Generate AI-powered recommendations based on analytics
        
        Returns:
            List of recommendation strings
        """
        recommendations = []
        
        # Confidence-based recommendations
        avg_confidence = self.get_average_confidence()
        if avg_confidence < 0.6:
            recommendations.append(
                "📊 Model confidence is low. Consider retraining with more diverse data."
            )
        
        # Intent distribution recommendations
        intent_dist = self.get_intent_distribution()
        if intent_dist:
            max_intent = max(intent_dist, key=intent_dist.get)
            max_count = intent_dist[max_intent]
            total_interactions = sum(intent_dist.values())
            
            if max_count / total_interactions > 0.6:
                recommendations.append(
                    f"⚠️ {max_intent} dominates {(max_count/total_interactions*100):.1f}% of interactions. "
                    "Expand training data for other intents."
                )
        
        # Sales-based recommendations
        if self.sales_history:
            perf = self.analyze_sales_performance()
            if perf.get('growth_rate_percentage', 0) < -5:
                recommendations.append(
                    f"📉 Sales declining by {abs(perf['growth_rate_percentage']):.1f}%. "
                    "Review pricing and marketing strategies."
                )
            elif perf.get('growth_rate_percentage', 0) > 10:
                recommendations.append(
                    f"📈 Sales growing by {perf['growth_rate_percentage']:.1f}%. "
                    "Great momentum! Consider expanding capacity."
                )
        
        if not recommendations:
            recommendations.append("✅ All metrics look healthy. Keep up the good work!")
        
        return recommendations