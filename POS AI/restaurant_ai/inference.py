"""
Inference Script
Advanced inference engine with multiple modes and analytics
"""

import os
import sys
import argparse
import logging
from datetime import datetime
from typing import Optional

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from models.intent_classifier import IntentClassifier
from models.response_engine import ResponseEngine
from services.data_fetcher import DataFetcher
from services.analytics_engine import AnalyticsEngine
from config import Config

# Configure logging
def setup_logging(config: Config):
    """Setup logging configuration"""
    log_file = config.get_log_path(f"inference_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log")
    
    logging.basicConfig(
        level=getattr(logging, config.LOG_LEVEL),
        format=config.LOG_FORMAT,
        handlers=[
            logging.StreamHandler(sys.stdout),
            logging.FileHandler(log_file) if config.LOG_TO_FILE else logging.NullHandler()
        ]
    )
    return logging.getLogger(__name__)


class RestaurantAI:
    """
    Main restaurant AI assistant class with advanced features
    """
    
    def __init__(self, config: Config, model_path: Optional[str] = None):
        """
        Initialize the restaurant AI
        
        Args:
            config: Configuration object
            model_path: Path to trained model (optional)
        """
        self.config = config
        self.logger = logging.getLogger(self.__class__.__name__)
        
        # Initialize components
        self.classifier = IntentClassifier(
            model_type=config.model.model_type,
            vectorizer_type=config.model.vectorizer_type
        )
        
        if model_path and os.path.exists(model_path):
            self.logger.info(f"Loading model from {model_path}")
            self.classifier.load_model(model_path)
        else:
            self.logger.warning("No model loaded - you may need to train first")
        
        self.response_engine = ResponseEngine()
        self.data_fetcher = DataFetcher(mode=config.data.data_mode)
        self.analytics = AnalyticsEngine()
        
        self.session_active = True
        self.user_id = f"user_{datetime.now().strftime('%Y%m%d%H%M%S')}"
        
        self.logger.info("Restaurant AI initialized successfully")
    
    def process_message(self, user_input: str, show_details: bool = False) -> str:
        """
        Process user message and generate response
        
        Args:
            user_input: User's input text
            show_details: Whether to show prediction details
            
        Returns:
            Generated response
        """
        if not user_input.strip():
            return "Please enter a valid message."
        
        try:
            # Predict intent
            intent, confidence = self.classifier.predict(user_input)
            self.logger.info(f"Intent: {intent}, Confidence: {confidence:.3f}")
            
            # Check confidence threshold
            if confidence < self.config.inference.confidence_threshold:
                response = self.config.inference.low_confidence_message
                self.analytics.log_interaction(user_input, intent, confidence, response, self.user_id)
                return response
            
            # Fetch relevant data
            data = self.data_fetcher.fetch_pos_data()
            
            # Generate response
            response = self.response_engine.generate(intent, data, user_id=self.user_id)
            
            # Log interaction
            if self.config.analytics.log_interactions:
                self.analytics.log_interaction(user_input, intent, confidence, response, self.user_id)
            
            # Add details if requested
            if show_details:
                top_k = self.classifier.predict_top_k(user_input, k=3)
                details = f"\n\n[Debug Info]\n"
                details += f"Intent: {intent} ({confidence*100:.1f}%)\n"
                details += "Top 3 Predictions:\n"
                for i, (pred, prob) in enumerate(top_k, 1):
                    details += f"  {i}. {pred}: {prob*100:.1f}%\n"
                response += details
            
            return response
            
        except Exception as e:
            self.logger.error(f"Error processing message: {e}", exc_info=True)
            return f"Sorry, I encountered an error: {str(e)}"
    
    def chat(self, show_details: bool = False):
        """
        Start interactive chat session
        
        Args:
            show_details: Whether to show prediction details
        """
        self.display_welcome()
        
        message_count = 0
        
        while self.session_active:
            try:
                user_input = input("\n👤 You: ").strip()
                
                if not user_input:
                    continue
                
                # Check for exit commands
                if user_input.lower() in ['quit', 'exit', 'bye', 'goodbye']:
                    farewell_response = self.process_message(user_input)
                    print(f"\n🤖 AI: {farewell_response}")
                    break
                
                # Special commands
                if user_input.startswith('/'):
                    self.handle_command(user_input)
                    continue
                
                # Process message
                response = self.process_message(user_input, show_details=show_details)
                print(f"\n🤖 AI: {response}")
                
                message_count += 1
                
            except KeyboardInterrupt:
                print("\n\n👋 Chat session interrupted. Goodbye!")
                break
            except EOFError:
                print("\n\n👋 Chat session ended. Goodbye!")
                break
            except Exception as e:
                self.logger.error(f"Error in chat loop: {e}", exc_info=True)
                print(f"\n❌ Error: {e}")
        
        # End session
        self.end_session(message_count)
    
    def display_welcome(self):
        """Display welcome banner"""
        print("\n" + "=" * 70)
        print("🤖 RESTAURANT AI ASSISTANT")
        print("=" * 70)
        print(f"Version: {self.config.VERSION}")
        print(f"Session ID: {self.user_id}")
        print("\nAvailable Commands:")
        print("  /help     - Show available commands")
        print("  /stats    - Show session statistics")
        print("  /report   - Generate analytics report")
        print("  /examples - Show example queries")
        print("  quit/exit - End conversation")
        print("=" * 70 + "\n")
    
    def handle_command(self, command: str):
        """
        Handle special commands
        
        Args:
            command: Command string starting with /
        """
        cmd = command.lower().strip()
        
        if cmd == '/help':
            self.show_help()
        elif cmd == '/stats':
            self.show_stats()
        elif cmd == '/report':
            self.show_report()
        elif cmd == '/examples':
            self.show_examples()
        elif cmd == '/export':
            self.export_session()
        elif cmd == '/clear':
            os.system('cls' if os.name == 'nt' else 'clear')
            self.display_welcome()
        else:
            print(f"❌ Unknown command: {cmd}")
            print("   Type /help for available commands")
    
    def show_help(self):
        """Display help information"""
        print("\n" + "=" * 70)
        print("📚 HELP - Available Commands")
        print("=" * 70)
        print("/help     - Show this help message")
        print("/stats    - Show session statistics")
        print("/report   - Generate full analytics report")
        print("/examples - Show example queries")
        print("/export   - Export session data")
        print("/clear    - Clear screen")
        print("quit/exit - End conversation")
        print("=" * 70)
    
    def show_stats(self):
        """Display session statistics"""
        report = self.analytics.generate_report(include_sales=False)
        
        print("\n" + "=" * 70)
        print("📊 SESSION STATISTICS")
        print("=" * 70)
        
        ia = report['interaction_analytics']
        print(f"Total Interactions:     {ia['total_interactions']}")
        print(f"Unique Intents:         {ia['unique_intents']}")
        print(f"Low Confidence Count:   {ia['low_confidence_count']}")
        
        cs = ia['confidence_stats']
        print(f"\nConfidence Statistics:")
        print(f"  Mean:    {cs['mean']:.3f}")
        print(f"  Median:  {cs['median']:.3f}")
        print(f"  Min:     {cs['min']:.3f}")
        print(f"  Max:     {cs['max']:.3f}")
        
        print(f"\nIntent Distribution:")
        for intent, count in ia['intent_distribution'].items():
            percentage = (count / ia['total_interactions'] * 100) if ia['total_interactions'] > 0 else 0
            print(f"  {intent:25s}: {count:3d} ({percentage:5.1f}%)")
        
        print("=" * 70)
    
    def show_report(self):
        """Display comprehensive analytics report"""
        report = self.analytics.generate_report(include_sales=False)
        recommendations = self.analytics.get_recommendations()
        
        print("\n" + "=" * 70)
        print("📈 COMPREHENSIVE ANALYTICS REPORT")
        print("=" * 70)
        print(f"Generated at: {report['generated_at']}")
        
        print(f"\n🎯 Interaction Analytics:")
        ia = report['interaction_analytics']
        print(f"  Total Interactions: {ia['total_interactions']}")
        print(f"  Unique Intents: {ia['unique_intents']}")
        
        print(f"\n👥 Engagement Analytics:")
        ea = report['engagement_analytics']
        print(f"  Total Users: {ea['total_users']}")
        print(f"  Avg Interactions/User: {ea['avg_interactions_per_user']:.2f}")
        print(f"  Total Sessions: {ea['total_sessions']}")
        
        print(f"\n💡 AI Recommendations:")
        for i, rec in enumerate(recommendations, 1):
            print(f"  {i}. {rec}")
        
        print("=" * 70)
    
    def show_examples(self):
        """Show example queries"""
        examples = {
            "Sales & Revenue": [
                "What are today's sales?",
                "Show me total revenue",
                "How much did I earn today?"
            ],
            "Inventory": [
                "What stock is available?",
                "Which items are low in stock?",
                "Show inventory status"
            ],
            "Profit Analysis": [
                "Which dish is most profitable?",
                "Show profit margins",
                "Why is profit low?"
            ],
            "Daily Insights": [
                "What should I focus on today?",
                "Give me daily advice",
                "Any problems today?"
            ],
            "Orders & Operations": [
                "Show order status",
                "What's the average prep time?",
                "How many pending orders?"
            ],
            "Customer Feedback": [
                "Show customer feedback",
                "What's our average rating?",
                "Any negative reviews?"
            ]
        }
        
        print("\n" + "=" * 70)
        print("💡 EXAMPLE QUERIES")
        print("=" * 70)
        
        for category, queries in examples.items():
            print(f"\n{category}:")
            for query in queries:
                print(f"  • {query}")
        
        print("\n" + "=" * 70)
    
    def export_session(self):
        """Export session data"""
        export_path = self.config.get_export_path(
            f"session_{self.user_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        )
        
        try:
            self.analytics.export_logs(export_path, log_type='all')
            print(f"\n✅ Session data exported to: {export_path}")
        except Exception as e:
            print(f"\n❌ Export failed: {e}")
    
    def end_session(self, message_count: int):
        """
        End chat session and show summary
        
        Args:
            message_count: Number of messages exchanged
        """
        print("\n" + "=" * 70)
        print("📊 SESSION SUMMARY")
        print("=" * 70)
        print(f"Messages Exchanged:     {message_count}")
        print(f"Session Duration:       {self._get_session_duration()}")
        
        if message_count > 0:
            print(f"Average Confidence:     {self.analytics.get_average_confidence():.3f}")
        
        print("\n💾 Session data has been saved for analytics.")
        print("=" * 70)
        print("\n👋 Thank you for using Restaurant AI Assistant!")
        print("   Have a great day!\n")
    
    def _get_session_duration(self) -> str:
        """Calculate and format session duration"""
        if not self.analytics.interaction_logs:
            return "N/A"
        
        first = datetime.fromisoformat(self.analytics.interaction_logs[0]['timestamp'])
        last = datetime.fromisoformat(self.analytics.interaction_logs[-1]['timestamp'])
        duration = (last - first).total_seconds()
        
        minutes = int(duration // 60)
        seconds = int(duration % 60)
        
        return f"{minutes}m {seconds}s" if minutes > 0 else f"{seconds}s"


def main():
    """Main inference function"""
    parser = argparse.ArgumentParser(
        description='Restaurant AI Inference Engine',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python inference.py                              # Interactive chat mode
  python inference.py --model path/to/model.pkl   # Use specific model
  python inference.py --message "Show sales"      # Single message mode
  python inference.py --debug                      # Show debug information
        """
    )
    
    parser.add_argument('--model', type=str, default=None,
                       help='Path to trained model file')
    parser.add_argument('--message', type=str, default=None,
                       help='Single message to process (non-interactive)')
    parser.add_argument('--interactive', action='store_true',
                       help='Force interactive mode (default)')
    parser.add_argument('--debug', action='store_true',
                       help='Show debug information with responses')
    parser.add_argument('--config', type=str, default=None,
                       help='Path to custom config file')
    
    args = parser.parse_args()
    
    # Load configuration
    if args.config and os.path.exists(args.config):
        config = Config.load_from_file(args.config)
    else:
        config = Config()
    
    # Setup logging
    logger = setup_logging(config)
    
    try:
        # Find model if not specified
        model_path = args.model
        if not model_path:
            models_dir = config.MODELS_DIR
            if os.path.exists(models_dir):
                models = [f for f in os.listdir(models_dir) if f.endswith('.pkl')]
                if models:
                    # Use most recent model
                    model_path = os.path.join(models_dir, sorted(models)[-1])
                    logger.info(f"Using model: {model_path}")
        
        # Initialize AI
        ai = RestaurantAI(config=config, model_path=model_path)
        
        # Run in appropriate mode
        if args.message:
            # Single message mode
            response = ai.process_message(args.message, show_details=args.debug)
            print(f"\nResponse: {response}\n")
        else:
            # Interactive mode (default)
            ai.chat(show_details=args.debug)
        
        return 0
        
    except Exception as e:
        logger.error(f"Inference failed: {e}", exc_info=True)
        print(f"\n❌ Error: {e}\n")
        return 1


if __name__ == "__main__":
    sys.exit(main())
