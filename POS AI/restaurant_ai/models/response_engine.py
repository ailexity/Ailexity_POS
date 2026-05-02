"""
Response Engine Module
Advanced response generation with context awareness and dynamic data integration
"""

import json
import random
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class ResponseEngine:
    """
    Advanced response engine with context management and data integration
    """
    
    def __init__(self):
        """Initialize response engine with context tracking"""
        self.context = {}
        self.conversation_history = []
        self.user_preferences = {}
        logger.info("ResponseEngine initialized")
    
    def generate(self, intent: str, data: Dict[str, Any], 
                user_id: Optional[str] = None) -> str:
        """
        Generate contextual response based on intent and data
        
        Args:
            intent: Detected user intent
            data: Data dictionary with relevant information
            user_id: Optional user identifier for personalization
            
        Returns:
            Generated response string
        """
        # Track conversation
        self.conversation_history.append({
            'timestamp': datetime.now(),
            'intent': intent,
            'user_id': user_id
        })
        
        # Generate response based on intent
        response_generators = {
            'sales_overview': self._generate_sales_overview,
            'stock_status': self._generate_stock_status,
            'profit_margin_analysis': self._generate_profit_analysis,
            'ai_daily_advice': self._generate_daily_advice,
            'greeting': self._generate_greeting,
            'menu_inquiry': self._generate_menu_response,
            'reservation': self._generate_reservation_response,
            'goodbye': self._generate_goodbye,
            'order_status': self._generate_order_status,
            'customer_feedback': self._generate_feedback_response,
            'staff_performance': self._generate_staff_performance,
            'peak_hours': self._generate_peak_hours_analysis
        }
        
        generator = response_generators.get(intent, self._generate_default)
        response = generator(data)
        
        # Apply personalization if available
        if user_id and user_id in self.user_preferences:
            response = self._personalize_response(response, user_id)
        
        logger.info(f"Generated response for intent: {intent}")
        return response
    
    def _generate_sales_overview(self, data: Dict) -> str:
        """Generate sales overview response"""
        total_sales = data.get('total_sales', 0)
        orders_count = data.get('orders_count', 0)
        avg_order_value = data.get('avg_order_value', 0)
        
        response = f"📊 **Today's Sales Overview**\n\n"
        response += f"💰 Total Sales: ₹{total_sales:,.2f}\n"
        response += f"📦 Total Orders: {orders_count}\n"
        response += f"📈 Average Order Value: ₹{avg_order_value:,.2f}\n"
        
        # Compare with previous day if available
        if 'yesterday_sales' in data:
            diff = total_sales - data['yesterday_sales']
            percentage = (diff / data['yesterday_sales'] * 100) if data['yesterday_sales'] > 0 else 0
            trend = "📈" if diff > 0 else "📉"
            response += f"\n{trend} Change from yesterday: ₹{abs(diff):,.2f} ({abs(percentage):.1f}%)"
        
        return response
    
    def _generate_stock_status(self, data: Dict) -> str:
        """Generate stock status response"""
        low_stock = data.get('low_stock', [])
        out_of_stock = data.get('out_of_stock', [])
        total_items = data.get('total_items', 0)
        
        response = "📦 **Inventory Status**\n\n"
        
        if out_of_stock:
            response += f"❌ Out of Stock ({len(out_of_stock)} items):\n"
            for item in out_of_stock[:5]:
                response += f"   • {item}\n"
        
        if low_stock:
            response += f"\n⚠️ Low Stock Alert ({len(low_stock)} items):\n"
            for item in low_stock[:5]:
                qty = data.get('quantities', {}).get(item, 0)
                response += f"   • {item}: {qty} units remaining\n"
        
        if not low_stock and not out_of_stock:
            response += "✅ All items are well-stocked!\n"
        
        response += f"\n📊 Total Items in Inventory: {total_items}"
        
        return response
    
    def _generate_profit_analysis(self, data: Dict) -> str:
        """Generate profit margin analysis response"""
        top_item = data.get('top_item', 'N/A')
        top_margin = data.get('top_margin', 0)
        low_margin_items = data.get('low_margin_items', [])
        avg_margin = data.get('avg_margin', 0)
        
        response = "💹 **Profit Margin Analysis**\n\n"
        response += f"🏆 Highest Margin Item: {top_item} ({top_margin:.1f}%)\n"
        response += f"📊 Average Profit Margin: {avg_margin:.1f}%\n"
        
        if low_margin_items:
            response += f"\n⚠️ Low Margin Items (< 20%):\n"
            for item in low_margin_items[:5]:
                margin = data.get('margins', {}).get(item, 0)
                response += f"   • {item}: {margin:.1f}%\n"
            response += "\n💡 Consider reviewing pricing or costs for these items."
        
        # Add recommendations
        if top_margin > 50:
            response += f"\n✨ Tip: Promote {top_item} to boost overall profits!"
        
        return response
    
    def _generate_daily_advice(self, data: Dict) -> str:
        """Generate AI-powered daily advice"""
        advice_items = []
        
        # Sales analysis
        if data.get("sales_drop", False):
            drop_percentage = data.get('sales_drop_percentage', 0)
            advice_items.append(
                f"📉 Sales are {drop_percentage:.1f}% lower than yesterday. "
                f"Consider running a promotion or special offer."
            )
        elif data.get("sales_increase", False):
            increase = data.get('sales_increase_percentage', 0)
            advice_items.append(
                f"📈 Great job! Sales increased by {increase:.1f}% today!"
            )
        
        # Inventory alerts
        if data.get("low_stock"):
            items = ', '.join(data['low_stock'][:3])
            advice_items.append(
                f"⚠️ Urgent: Restock {items}. Order now to avoid stockouts."
            )
        
        # Peak hours optimization
        if data.get("peak_hour_understaffed"):
            peak_time = data.get('peak_time', 'lunch')
            advice_items.append(
                f"👥 Consider adding staff during {peak_time} hours for better service."
            )
        
        # Customer feedback
        if data.get("negative_feedback_trend"):
            advice_items.append(
                "💬 Recent customer feedback shows concerns. Review and address issues promptly."
            )
        
        # Best sellers
        if data.get("trending_item"):
            item = data['trending_item']
            advice_items.append(
                f"🔥 {item} is trending! Ensure adequate stock and consider featuring it prominently."
            )
        
        # Wastage alert
        if data.get("high_wastage"):
            wastage_value = data.get('wastage_value', 0)
            advice_items.append(
                f"🗑️ Wastage is high (₹{wastage_value:,.0f}). Review portion sizes and inventory ordering."
            )
        
        if not advice_items:
            advice_items.append("✅ Everything looks good! Keep up the excellent work!")
        
        response = "🤖 **AI Daily Insights**\n\n"
        response += "\n\n".join(f"{i+1}. {advice}" for i, advice in enumerate(advice_items))
        
        return response
    
    def _generate_greeting(self, data: Dict) -> str:
        """Generate greeting response"""
        time_of_day = datetime.now().hour
        
        if time_of_day < 12:
            greeting = "Good morning"
            emoji = "🌅"
        elif time_of_day < 17:
            greeting = "Good afternoon"
            emoji = "☀️"
        else:
            greeting = "Good evening"
            emoji = "🌙"
        
        greetings = [
            f"{emoji} {greeting}! How can I help you with your restaurant today?",
            f"{emoji} {greeting}! What would you like to know about your business?",
            f"{emoji} {greeting}! I'm here to assist with your restaurant analytics."
        ]
        
        return random.choice(greetings)
    
    def _generate_menu_response(self, data: Dict) -> str:
        """Generate menu inquiry response"""
        menu_items = data.get('menu_items', [])
        categories = data.get('categories', [])
        
        if menu_items:
            response = "📋 **Our Menu**\n\n"
            if categories:
                for category in categories[:3]:
                    items = data.get(f'{category}_items', [])
                    response += f"**{category}**\n"
                    for item in items[:4]:
                        price = data.get('prices', {}).get(item, 0)
                        response += f"  • {item} - ₹{price}\n"
                    response += "\n"
            response += "Would you like more details about any specific dish?"
        else:
            response = "I can show you our full menu. What type of cuisine are you interested in?"
        
        return response
    
    def _generate_reservation_response(self, data: Dict) -> str:
        """Generate reservation response"""
        available_slots = data.get('available_slots', [])
        
        if available_slots:
            response = "🍽️ **Table Reservation**\n\n"
            response += "I'd be happy to help you reserve a table!\n\n"
            response += "Available time slots today:\n"
            for slot in available_slots[:5]:
                response += f"  • {slot}\n"
            response += "\nHow many guests will be joining you?"
        else:
            response = "I'd love to help you make a reservation. For how many people and what time?"
        
        return response
    
    def _generate_goodbye(self, data: Dict) -> str:
        """Generate goodbye response"""
        goodbyes = [
            "Thank you! Have a wonderful day! 👋",
            "Goodbye! Come back soon! 😊",
            "Take care! See you next time! 🌟",
            "Thanks for chatting! Have a great day ahead! ✨"
        ]
        
        return random.choice(goodbyes)
    
    def _generate_order_status(self, data: Dict) -> str:
        """Generate order status response"""
        pending_orders = data.get('pending_orders', 0)
        completed_orders = data.get('completed_orders', 0)
        avg_prep_time = data.get('avg_prep_time', 0)
        
        response = "📋 **Order Status**\n\n"
        response += f"⏳ Pending Orders: {pending_orders}\n"
        response += f"✅ Completed Today: {completed_orders}\n"
        response += f"⏱️ Average Prep Time: {avg_prep_time} minutes\n"
        
        if pending_orders > 10:
            response += "\n⚠️ High order volume! Consider allocating more kitchen staff."
        
        return response
    
    def _generate_feedback_response(self, data: Dict) -> str:
        """Generate customer feedback analysis response"""
        avg_rating = data.get('avg_rating', 0)
        total_reviews = data.get('total_reviews', 0)
        positive_count = data.get('positive_count', 0)
        negative_count = data.get('negative_count', 0)
        
        response = "⭐ **Customer Feedback Analysis**\n\n"
        response += f"📊 Average Rating: {avg_rating:.1f}/5.0\n"
        response += f"📝 Total Reviews: {total_reviews}\n"
        response += f"👍 Positive: {positive_count}\n"
        response += f"👎 Negative: {negative_count}\n"
        
        if avg_rating >= 4.0:
            response += "\n✨ Excellent! Your customers love your service!"
        elif avg_rating >= 3.0:
            response += "\n📈 Good, but there's room for improvement."
        else:
            response += "\n⚠️ Attention needed! Review negative feedback carefully."
        
        return response
    
    def _generate_staff_performance(self, data: Dict) -> str:
        """Generate staff performance analysis"""
        top_performer = data.get('top_performer', 'N/A')
        total_staff = data.get('total_staff', 0)
        attendance_rate = data.get('attendance_rate', 0)
        
        response = "👥 **Staff Performance**\n\n"
        response += f"🏆 Top Performer: {top_performer}\n"
        response += f"👨‍🍳 Total Staff: {total_staff}\n"
        response += f"📅 Attendance Rate: {attendance_rate:.1f}%\n"
        
        return response
    
    def _generate_peak_hours_analysis(self, data: Dict) -> str:
        """Generate peak hours analysis"""
        peak_hours = data.get('peak_hours', [])
        busiest_day = data.get('busiest_day', 'N/A')
        
        response = "⏰ **Peak Hours Analysis**\n\n"
        
        if peak_hours:
            response += "Busiest times:\n"
            for hour, orders in peak_hours:
                response += f"  • {hour}: {orders} orders\n"
        
        response += f"\n📅 Busiest Day: {busiest_day}\n"
        response += "\n💡 Schedule more staff during these peak periods."
        
        return response
    
    def _generate_default(self, data: Dict) -> str:
        """Generate default response for unknown intents"""
        return "I'm here to help! You can ask me about sales, inventory, profits, or daily advice."
    
    def _personalize_response(self, response: str, user_id: str) -> str:
        """
        Personalize response based on user preferences
        
        Args:
            response: Base response
            user_id: User identifier
            
        Returns:
            Personalized response
        """
        prefs = self.user_preferences.get(user_id, {})
        name = prefs.get('name')
        
        if name:
            response = f"Hi {name}! " + response
        
        return response
    
    def set_user_preference(self, user_id: str, key: str, value: Any):
        """Set user preference"""
        if user_id not in self.user_preferences:
            self.user_preferences[user_id] = {}
        self.user_preferences[user_id][key] = value
    
    def set_context(self, key: str, value: Any):
        """Set conversation context"""
        self.context[key] = value
        logger.debug(f"Context updated: {key} = {value}")
    
    def get_context(self, key: str) -> Any:
        """Get conversation context"""
        return self.context.get(key)
    
    def clear_context(self):
        """Clear conversation context"""
        self.context = {}
        logger.info("Context cleared")
    
    def get_conversation_stats(self) -> Dict:
        """Get conversation statistics"""
        if not self.conversation_history:
            return {'total_interactions': 0}
        
        intent_counts = {}
        for entry in self.conversation_history:
            intent = entry['intent']
            intent_counts[intent] = intent_counts.get(intent, 0) + 1
        
        return {
            'total_interactions': len(self.conversation_history),
            'intent_distribution': intent_counts,
            'first_interaction': self.conversation_history[0]['timestamp'],
            'last_interaction': self.conversation_history[-1]['timestamp']
        }
