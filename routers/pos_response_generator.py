"""
POS Response Generator
Generate intelligent responses for POS business queries
"""

import re
from datetime import datetime
import calendar
from typing import Dict, Any


class POSResponseGenerator:
    """
    Generate responses for POS business queries based on real data
    """
    
    def generate_response(self, message: str, data: Dict[str, Any], intent: str = None, confidence: float = None) -> str:
        """
        Generate intelligent response based on user query and data
        """
        message_lower = message.lower().strip()
        
        # Check for greeting
        greeting_pattern = r'\b(hi|hello|hey|good\s+morning|good\s+afternoon|good\s+evening|howdy)\b'
        if re.search(greeting_pattern, message_lower):
            return self._generate_greeting(data)
        
        # Check for thanks
        if any(word in message_lower for word in ['thank', 'thanks', 'thx', 'appreciate']):
            return "You're welcome! 😊 Let me know if you need anything else."
        
        # Check for goodbye
        if any(word in message_lower for word in ['bye', 'goodbye', 'see you', 'later', 'gotta go']):
            return "Goodbye! Have a great day! 👋"
        
        # Check for help
        if any(word in message_lower for word in ['help', 'what can you do', 'how to use', 'guide', 'commands', 'options']):
            return self._generate_help()
        
        # === SALES QUERIES ===
        if any(word in message_lower for word in ['sales', 'sale', 'revenue', 'earn', 'earning', 'income', 'money', 'made', 'profit', 'how much']):
            return self._generate_sales_response(message_lower, data)
        
        # === ORDER QUERIES ===
        if any(word in message_lower for word in ['order', 'orders', 'invoice', 'invoices', 'transaction', 'bill', 'bills']):
            return self._generate_orders_response(message_lower, data)
        
        # === ITEM/PRODUCT QUERIES ===
        if any(word in message_lower for word in ['item', 'items', 'product', 'products', 'inventory', 'stock', 'selling', 'menu']):
            return self._generate_items_response(message_lower, data)
        
        # === TOP/BEST QUERIES ===
        if any(word in message_lower for word in ['top', 'best', 'popular', 'favorite', 'most sold', 'highest', 'winner']):
            return self._generate_top_response(message_lower, data)
        
        # === WORST/SLOW QUERIES ===
        if any(word in message_lower for word in ['worst', 'slow', 'least', 'lowest', 'poor', 'not selling', 'unpopular']):
            return self._generate_slow_items_response(data)
        
        # === TREND/COMPARISON QUERIES ===
        if any(word in message_lower for word in ['trend', 'compare', 'comparison', 'growth', 'increase', 'decrease', 'vs', 'versus', 'performance', 'doing']):
            return self._generate_trends_response(message_lower, data)
        
        # === AVERAGE/STATISTICS QUERIES ===
        if any(word in message_lower for word in ['average', 'avg', 'mean', 'typical', 'normal']):
            return self._generate_average_response(message_lower, data)
        
        # === RECENT/LATEST QUERIES ===
        if any(word in message_lower for word in ['recent', 'latest', 'last', 'newest']):
            return self._generate_recent_response(message_lower, data)
        
        # === SUMMARY/OVERVIEW QUERIES ===
        if any(word in message_lower for word in ['summary', 'overview', 'report', 'status', 'stats', 'statistics', 'dashboard']):
            return self._generate_summary(data)
        
        # === PEAK/BUSY HOURS ===
        if any(word in message_lower for word in ['peak', 'busy', 'rush', 'hour', 'time', 'when']):
            return self._generate_peak_hours_response(data)
        
        # === TARGET/GOAL QUERIES ===
        if any(word in message_lower for word in ['target', 'goal', 'aim', 'objective', 'budget']):
            return self._generate_target_response(data)
        
        # === PREDICTION/FORECAST ===
        if any(word in message_lower for word in ['predict', 'forecast', 'expect', 'projection', 'estimate', 'will i']):
            return self._generate_prediction_response(data)
        
        # === CATEGORY QUERIES ===
        if any(word in message_lower for word in ['category', 'categories', 'type', 'types', 'kind']):
            return self._generate_category_response(data)
        
        # === PAYMENT QUERIES ===
        if any(word in message_lower for word in ['payment', 'pay', 'cash', 'card', 'upi', 'method']):
            return self._generate_payment_response(data)
        
        # === QUICK STAT QUERIES ===
        if message_lower in ['today', "today's", 'now']:
            return self._generate_today_quick(data)
        
        if message_lower in ['yesterday', "yesterday's"]:
            return self._generate_yesterday_quick(data)
        
        if message_lower in ['week', 'this week', 'weekly']:
            return self._generate_week_quick(data)
        
        if message_lower in ['month', 'this month', 'monthly']:
            return self._generate_month_quick(data)
        
        # === YES/NO QUESTIONS ===
        if message_lower.startswith(('is ', 'are ', 'was ', 'were ', 'do ', 'did ', 'have ', 'has ', 'am i')):
            return self._generate_yes_no_response(message_lower, data)
        
        # Default: provide overview
        return self._generate_overview(data)
    
    def _format_currency(self, amount: float) -> str:
        """Format currency in a readable way"""
        if amount >= 100000:
            return f"₹{amount/100000:.1f}L"
        elif amount >= 1000:
            return f"₹{amount/1000:.1f}K"
        else:
            return f"₹{amount:,.0f}"
    
    def _generate_greeting(self, data: Dict) -> str:
        """Generate a friendly greeting with key stats"""
        business = data.get('business_name', 'there')
        today_sales = data.get('today_sales', 0)
        today_orders = data.get('today_orders', 0)
        
        hour = datetime.now().hour
        if hour < 12:
            time_greeting = "Good morning"
        elif hour < 17:
            time_greeting = "Good afternoon"
        else:
            time_greeting = "Good evening"
        
        return f"""{time_greeting}, {business}! 👋

Here's your quick update:
• Today's sales: {self._format_currency(today_sales)}
• Orders so far: {today_orders}

What would you like to know? Try asking about sales, orders, or your top items."""
    
    def _generate_help(self) -> str:
        """Generate help message"""
        return """Here's what you can ask me:

💰 Sales
• "How much did I sell today?"
• "What's my weekly/monthly revenue?"
• "Compare today with yesterday"

📦 Orders
• "How many orders today?"
• "Show recent invoices"
• "What's my average order value?"

🏆 Products
• "What's my best selling item?"
• "Show top 5 products"
• "Which items are low on stock?"
• "What's not selling well?"

📈 Analysis
• "How am I doing?"
• "Show me trends"
• "Give me a summary"

⏰ Quick Stats
Just type: "today", "yesterday", "week", or "month"

Ask anything naturally - I'll understand!"""
    
    def _generate_sales_response(self, message: str, data: Dict) -> str:
        """Generate simple sales response"""
        
        if 'today' in message or 'day' in message:
            sales = data.get('today_sales', 0)
            yesterday = data.get('yesterday_sales', 0)
            orders = data.get('today_orders', 0)
            
            response = f"Today's Sales: {self._format_currency(sales)}\n"
            response += f"Orders: {orders}\n\n"
            
            if yesterday > 0:
                change = ((sales - yesterday) / yesterday * 100)
                if change > 0:
                    response += f"📈 Up {change:.0f}% from yesterday"
                elif change < 0:
                    response += f"📉 Down {abs(change):.0f}% from yesterday"
                else:
                    response += "Same as yesterday"
            return response
        
        elif 'week' in message:
            sales = data.get('week_sales', 0)
            orders = data.get('week_orders', 0)
            avg = sales / orders if orders > 0 else 0
            
            return f"""This Week's Sales: {self._format_currency(sales)}
Orders: {orders}
Avg per order: {self._format_currency(avg)}"""
        
        elif 'month' in message:
            sales = data.get('month_sales', 0)
            orders = data.get('month_orders', 0)
            days = datetime.now().day
            daily_avg = sales / days if days > 0 else 0
            
            return f"""This Month's Sales: {self._format_currency(sales)}
Orders: {orders}
Daily average: {self._format_currency(daily_avg)}"""
        
        elif 'yesterday' in message:
            sales = data.get('yesterday_sales', 0)
            orders = data.get('yesterday_orders', 0)
            
            return f"""Yesterday's Sales: {self._format_currency(sales)}
Orders: {orders}"""
        
        else:
            # Total sales
            sales = data.get('total_sales', 0)
            orders = data.get('total_orders', 0)
            avg = data.get('avg_order_value', 0)
            
            return f"""Total Sales (All Time): {self._format_currency(sales)}
Total Orders: {orders}
Avg order value: {self._format_currency(avg)}"""
    
    def _generate_orders_response(self, message: str, data: Dict) -> str:
        """Generate simple orders response"""
        
        if 'today' in message or 'day' in message:
            orders = data.get('today_orders', 0)
            revenue = data.get('today_sales', 0)
            avg = revenue / orders if orders > 0 else 0
            
            return f"""Today's Orders: {orders}
Total revenue: {self._format_currency(revenue)}
Avg order: {self._format_currency(avg)}"""
        
        elif 'week' in message:
            orders = data.get('week_orders', 0)
            revenue = data.get('week_sales', 0)
            
            return f"""This Week's Orders: {orders}
Total revenue: {self._format_currency(revenue)}"""
        
        elif 'month' in message:
            orders = data.get('month_orders', 0)
            revenue = data.get('month_sales', 0)
            
            return f"""This Month's Orders: {orders}
Total revenue: {self._format_currency(revenue)}"""
        
        elif 'recent' in message or 'latest' in message or 'last' in message:
            recent = data.get('recent_invoices', [])[:5]
            if not recent:
                return "No recent invoices found."
            
            response = "Recent Invoices:\n\n"
            for inv in recent:
                response += f"#{inv['invoice_number']} - {self._format_currency(inv['total'])} ({inv['date']})\n"
            return response
        
        else:
            orders = data.get('total_orders', 0)
            revenue = data.get('total_sales', 0)
            
            return f"""Total Orders: {orders}
Total revenue: {self._format_currency(revenue)}"""
    
    def _generate_items_response(self, message: str, data: Dict) -> str:
        """Generate simple items response"""
        
        if 'top' in message or 'best' in message or 'selling' in message or 'popular' in message:
            return self._generate_top_response(message, data)
        
        elif 'stock' in message or 'inventory' in message or 'low' in message:
            total = data.get('total_items', 0)
            low_stock = data.get('low_stock', [])
            
            response = f"Total Items: {total}\n\n"
            
            if low_stock:
                response += f"⚠️ Low Stock ({len(low_stock)} items):\n"
                for item in low_stock[:5]:
                    response += f"• {item}\n"
            else:
                response += "✅ All items are well-stocked!"
            return response
        
        else:
            total = data.get('total_items', 0)
            top_item = data.get('top_item', 'N/A')
            
            response = f"Total Items: {total}\n"
            if top_item and top_item != 'No items' and top_item != 'N/A':
                response += f"Best Seller: {top_item}"
            return response
    
    def _generate_top_response(self, message: str, data: Dict) -> str:
        """Generate top selling items response"""
        top_items = data.get('top_items', [])[:5]
        if not top_items:
            return "Not enough sales data yet to show top items."
        
        response = "🏆 Top Selling Items:\n\n"
        for i, item in enumerate(top_items, 1):
            response += f"{i}. {item['name']} - {self._format_currency(item['sales'])}\n"
        return response
    
    def _generate_slow_items_response(self, data: Dict) -> str:
        """Generate slow-selling items response"""
        top_items = data.get('top_items', [])
        item_quantities = data.get('item_quantities', {})
        
        if not item_quantities:
            return "Not enough data to identify slow-selling items yet."
        
        # Get items with lowest sales
        sorted_items = sorted(item_quantities.items(), key=lambda x: x[1])[:5]
        
        if not sorted_items:
            return "All items seem to be selling well!"
        
        response = "📉 Slow-Moving Items:\n\n"
        for name, qty in sorted_items:
            response += f"• {name} - only {qty} sold\n"
        response += "\n💡 Consider promoting these or adjusting prices."
        return response
    
    def _generate_trends_response(self, message: str, data: Dict) -> str:
        """Generate simple trends response"""
        today = data.get('today_sales', 0)
        yesterday = data.get('yesterday_sales', 0)
        week = data.get('week_sales', 0)
        month = data.get('month_sales', 0)
        
        response = "📊 Sales Overview:\n\n"
        response += f"Today: {self._format_currency(today)}\n"
        response += f"This Week: {self._format_currency(week)}\n"
        response += f"This Month: {self._format_currency(month)}\n\n"
        
        if yesterday > 0:
            change = ((today - yesterday) / yesterday * 100)
            if change > 0:
                response += f"📈 Today is {change:.0f}% better than yesterday!"
            elif change < 0:
                response += f"📉 Today is {abs(change):.0f}% lower than yesterday."
            else:
                response += "📊 Today is about the same as yesterday."
        
        return response
    
    def _generate_average_response(self, message: str, data: Dict) -> str:
        """Generate simple average response"""
        avg_order = data.get('avg_order_value', 0)
        today_sales = data.get('today_sales', 0)
        today_orders = data.get('today_orders', 0)
        today_avg = today_sales / today_orders if today_orders > 0 else 0
        
        week_sales = data.get('week_sales', 0)
        week_orders = data.get('week_orders', 0)
        week_avg = week_sales / week_orders if week_orders > 0 else 0
        
        return f"""Average Order Value:

• Overall: {self._format_currency(avg_order)}
• Today: {self._format_currency(today_avg)}
• This Week: {self._format_currency(week_avg)}

💡 Tip: Upselling can increase your average order value!"""
    
    def _generate_recent_response(self, message: str, data: Dict) -> str:
        """Generate response for recent data"""
        recent_invoices = data.get('recent_invoices', [])[:5]
        
        if not recent_invoices:
            return "No recent invoices yet."
        
        response = "Recent Invoices:\n\n"
        for inv in recent_invoices:
            response += f"#{inv['invoice_number']} • {self._format_currency(inv['total'])} • {inv['date']}\n"
        
        return response
    
    def _generate_summary(self, data: Dict) -> str:
        """Generate detailed summary"""
        today_sales = data.get('today_sales', 0)
        today_orders = data.get('today_orders', 0)
        yesterday_sales = data.get('yesterday_sales', 0)
        week_sales = data.get('week_sales', 0)
        week_orders = data.get('week_orders', 0)
        month_sales = data.get('month_sales', 0)
        month_orders = data.get('month_orders', 0)
        total_sales = data.get('total_sales', 0)
        total_items = data.get('total_items', 0)
        low_stock = data.get('low_stock', [])
        top_item = data.get('top_item', 'N/A')
        
        response = "📊 Business Summary\n\n"
        
        # Today
        response += f"TODAY\n"
        response += f"Sales: {self._format_currency(today_sales)} ({today_orders} orders)\n"
        if yesterday_sales > 0:
            change = ((today_sales - yesterday_sales) / yesterday_sales * 100)
            response += f"vs Yesterday: {change:+.0f}%\n"
        response += "\n"
        
        # Week
        response += f"THIS WEEK\n"
        response += f"Sales: {self._format_currency(week_sales)} ({week_orders} orders)\n\n"
        
        # Month
        response += f"THIS MONTH\n"
        response += f"Sales: {self._format_currency(month_sales)} ({month_orders} orders)\n\n"
        
        # Quick insights
        response += "HIGHLIGHTS\n"
        response += f"• All-time revenue: {self._format_currency(total_sales)}\n"
        response += f"• Active items: {total_items}\n"
        if top_item and top_item != 'No items':
            response += f"• Best seller: {top_item}\n"
        if low_stock:
            response += f"• ⚠️ {len(low_stock)} items low on stock\n"
        
        return response
    
    def _generate_peak_hours_response(self, data: Dict) -> str:
        """Generate peak hours response"""
        orders_per_day = data.get('orders_per_day', {})
        today_orders = data.get('today_orders', 0)
        hourly_orders = data.get('hourly_orders', {})
        peak_hour = data.get('peak_hour')
        
        response = "⏰ Business Hours Insight:\n\n"
        
        if orders_per_day:
            # Find busiest day
            busiest_day = max(orders_per_day.items(), key=lambda x: x[1]) if orders_per_day else None
            if busiest_day:
                response += f"Busiest recent day: {busiest_day[0]} ({busiest_day[1]} orders)\n\n"

        if peak_hour is not None:
            peak_start = int(peak_hour)
            peak_end = (peak_start + 1) % 24
            peak_volume = hourly_orders.get(str(peak_start), hourly_orders.get(peak_start, 0))
            response += f"Peak hour: {peak_start:02d}:00-{peak_end:02d}:00 ({peak_volume} orders)\n\n"
        
        response += f"Today so far: {today_orders} orders\n\n"
        response += "💡 Track your peak hours to optimize staffing!"
        
        return response
    
    def _generate_target_response(self, data: Dict) -> str:
        """Generate target/goal response"""
        month_sales = data.get('month_sales', 0)
        days_passed = datetime.now().day
        now = datetime.now()
        days_in_month = calendar.monthrange(now.year, now.month)[1]
        days_left = days_in_month - days_passed
        monthly_target = data.get('monthly_target', 0)
        
        daily_avg = month_sales / days_passed if days_passed > 0 else 0
        projected = daily_avg * days_in_month
        
        response = "🎯 Monthly Progress:\n\n"
        response += f"Current: {self._format_currency(month_sales)}\n"
        response += f"Daily average: {self._format_currency(daily_avg)}\n"
        response += f"Projected for month: {self._format_currency(projected)}\n"
        response += f"Days left: {days_left}\n\n"

        if monthly_target and monthly_target > 0:
            progress_pct = (month_sales / monthly_target) * 100 if monthly_target else 0
            remaining = max(monthly_target - month_sales, 0)
            response += f"Target: {self._format_currency(monthly_target)}\n"
            response += f"Progress: {progress_pct:.1f}%\n"
            response += f"Remaining: {self._format_currency(remaining)}\n\n"
            response += "💡 Keep momentum on high-value orders to close the gap."
        else:
            response += "💡 Set your monthly target in Settings for better tracking!"
        
        return response
    
    def _generate_prediction_response(self, data: Dict) -> str:
        """Generate prediction/forecast response"""
        month_sales = data.get('month_sales', 0)
        days_passed = datetime.now().day
        now = datetime.now()
        days_in_month = calendar.monthrange(now.year, now.month)[1]
        
        daily_avg = month_sales / days_passed if days_passed > 0 else 0
        projected_month = daily_avg * days_in_month
        projected_year = projected_month * 12
        
        today = data.get('today_sales', 0)
        yesterday = data.get('yesterday_sales', 0)
        
        response = "🔮 Projections:\n\n"
        response += f"This month (projected): {self._format_currency(projected_month)}\n"
        response += f"Annual (if trend continues): {self._format_currency(projected_year)}\n\n"
        
        if yesterday > 0 and today > 0:
            trend = "improving" if today > yesterday else "slower"
            response += f"Current trend: Business is {trend} compared to yesterday.\n"
        
        response += "\n💡 These are estimates based on your current data."
        return response
    
    def _generate_category_response(self, data: Dict) -> str:
        """Generate category analysis response"""
        top_items = data.get('top_items', [])[:10]
        
        if not top_items:
            return "Not enough data to analyze categories yet."
        
        response = "📂 Product Analysis:\n\n"
        response += "Top performing products:\n"
        for i, item in enumerate(top_items[:5], 1):
            response += f"{i}. {item['name']} ({self._format_currency(item['sales'])})\n"
        
        response += "\n💡 Consider adding more variety to your top sellers!"
        return response
    
    def _generate_payment_response(self, data: Dict) -> str:
        """Generate payment method response"""
        total_orders = data.get('total_orders', 0)
        payment_modes = data.get('payment_modes', {})
        
        response = "💳 Payment Information:\n\n"
        response += f"Total transactions: {total_orders}\n\n"

        if payment_modes:
            sorted_modes = sorted(payment_modes.items(), key=lambda x: x[1], reverse=True)
            response += "Payment mode split:\n"
            for mode, count in sorted_modes[:5]:
                pct = (count / total_orders * 100) if total_orders > 0 else 0
                response += f"• {mode}: {count} ({pct:.1f}%)\n"
            if sorted_modes:
                response += f"\nTop method: {sorted_modes[0][0]}"
        else:
            response += "No payment mode data available yet."

        response += "\n\n💡 Payment breakdown is available in your History page."
        return response
    
    def _generate_today_quick(self, data: Dict) -> str:
        """Quick today's stats"""
        sales = data.get('today_sales', 0)
        orders = data.get('today_orders', 0)
        avg = sales / orders if orders > 0 else 0
        
        return f"""Today so far:
• Sales: {self._format_currency(sales)}
• Orders: {orders}
• Avg order: {self._format_currency(avg)}"""
    
    def _generate_yesterday_quick(self, data: Dict) -> str:
        """Quick yesterday's stats"""
        sales = data.get('yesterday_sales', 0)
        orders = data.get('yesterday_orders', 0)
        
        return f"""Yesterday:
• Sales: {self._format_currency(sales)}
• Orders: {orders}"""
    
    def _generate_week_quick(self, data: Dict) -> str:
        """Quick week stats"""
        sales = data.get('week_sales', 0)
        orders = data.get('week_orders', 0)
        
        return f"""This Week:
• Sales: {self._format_currency(sales)}
• Orders: {orders}"""
    
    def _generate_month_quick(self, data: Dict) -> str:
        """Quick month stats"""
        sales = data.get('month_sales', 0)
        orders = data.get('month_orders', 0)
        
        return f"""This Month:
• Sales: {self._format_currency(sales)}
• Orders: {orders}"""
    
    def _generate_yes_no_response(self, message: str, data: Dict) -> str:
        """Handle yes/no questions"""
        today_sales = data.get('today_sales', 0)
        yesterday_sales = data.get('yesterday_sales', 0)
        today_orders = data.get('today_orders', 0)
        low_stock = data.get('low_stock', [])
        
        # "Am I doing well?"
        if 'doing well' in message or 'doing good' in message:
            if yesterday_sales > 0:
                change = ((today_sales - yesterday_sales) / yesterday_sales * 100)
                if change > 10:
                    return f"Yes! 🎉 You're doing great - up {change:.0f}% from yesterday!"
                elif change > 0:
                    return f"Yes, you're doing well - slightly up from yesterday!"
                elif change > -10:
                    return f"You're doing okay - similar to yesterday."
                else:
                    return f"Today is slower than yesterday, but there's still time to catch up!"
            return f"You have {today_orders} orders today for {self._format_currency(today_sales)}."
        
        # "Is stock low?"
        if 'stock' in message and ('low' in message or 'okay' in message or 'fine' in message):
            if low_stock:
                return f"⚠️ Yes, {len(low_stock)} items are running low: {', '.join(low_stock[:3])}..."
            return "✅ No, all items are well-stocked!"
        
        # "Is today better than yesterday?"
        if 'better' in message or 'more' in message:
            if yesterday_sales > 0:
                if today_sales > yesterday_sales:
                    diff = ((today_sales - yesterday_sales) / yesterday_sales * 100)
                    return f"Yes! Today is {diff:.0f}% better than yesterday! 📈"
                else:
                    diff = ((yesterday_sales - today_sales) / yesterday_sales * 100)
                    return f"Not yet - today is {diff:.0f}% behind yesterday. Keep going! 💪"
            return "No data from yesterday to compare."
        
        # Default yes/no handling
        return self._generate_overview(data)
    
    def _generate_overview(self, data: Dict) -> str:
        """Generate simple business overview"""
        today_sales = data.get('today_sales', 0)
        today_orders = data.get('today_orders', 0)
        total_sales = data.get('total_sales', 0)
        top_item = data.get('top_item', None)
        
        response = f"Here's your business snapshot:\n\n"
        response += f"Today: {self._format_currency(today_sales)} from {today_orders} orders\n"
        response += f"All Time: {self._format_currency(total_sales)}\n"
        
        if top_item and top_item != 'No items':
            response += f"Best Seller: {top_item}\n"
        
        response += "\nAsk me anything! Try: sales, orders, top items, trends, or summary."
        
        return response
