"""
Training Script
Comprehensive training pipeline for restaurant AI model
"""

import os
import sys
import argparse
import logging
from datetime import datetime

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from models.intent_classifier import IntentClassifier
from services.data_fetcher import DataFetcher
from services.analytics_engine import AnalyticsEngine
from config import Config

# Configure logging
def setup_logging(config: Config):
    """Setup logging configuration"""
    log_file = config.get_log_path(f"training_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log")
    
    logging.basicConfig(
        level=getattr(logging, config.LOG_LEVEL),
        format=config.LOG_FORMAT,
        handlers=[
            logging.StreamHandler(),
            logging.FileHandler(log_file) if config.LOG_TO_FILE else logging.NullHandler()
        ]
    )
    return logging.getLogger(__name__)


def display_banner():
    """Display training banner"""
    print("\n" + "=" * 70)
    print("🤖 RESTAURANT AI - MODEL TRAINING PIPELINE")
    print("=" * 70)
    print(f"Version: 2.0.0")
    print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 70 + "\n")


def load_training_data(data_path: str, expand_from_intents: bool = True):
    """
    Load and prepare training data
    
    Args:
        data_path: Path to training data file
        expand_from_intents: Whether to expand data from intents.json
        
    Returns:
        Number of samples loaded
    """
    logger.info("📂 Loading training data...")
    
    if expand_from_intents and os.path.exists(data_path):
        # Use intents.json to expand training data
        classifier = IntentClassifier()
        X, y = classifier.load_data(data_path)
        logger.info(f"✅ Loaded {len(X)} samples from {data_path}")
        return len(X)
    else:
        logger.error(f"❌ Training data not found at {data_path}")
        return 0


def train_model(config: Config, model_type: str = None, data_path: str = None):
    """
    Train the intent classification model
    
    Args:
        config: Configuration object
        model_type: Override model type from config
        data_path: Override data path
        
    Returns:
        Tuple of (classifier, metrics)
    """
    # Override config if specified
    if model_type:
        config.model.model_type = model_type
    
    if not data_path:
        data_path = config.get_data_path('training_data.json')
    
    logger.info(f"🔧 Initializing {config.model.model_type} classifier...")
    
    # Initialize classifier
    classifier = IntentClassifier(
        model_type=config.model.model_type,
        vectorizer_type=config.model.vectorizer_type
    )
    
    # Train model
    logger.info("🚀 Starting model training...")
    metrics = classifier.train(
        data_path=data_path,
        validation_split=config.training.validation_split,
        cross_validate=config.training.cross_validate
    )
    
    return classifier, metrics


def display_metrics(metrics: dict):
    """Display training metrics in formatted way"""
    print("\n" + "=" * 70)
    print("📊 TRAINING RESULTS")
    print("=" * 70)
    
    print(f"\n📈 Accuracy Metrics:")
    print(f"   Training Accuracy:    {metrics['train_accuracy']:.4f} ({metrics['train_accuracy']*100:.2f}%)")
    print(f"   Validation Accuracy:  {metrics['val_accuracy']:.4f} ({metrics['val_accuracy']*100:.2f}%)")
    
    if metrics.get('cv_mean'):
        print(f"   Cross-Val Mean:       {metrics['cv_mean']:.4f} (±{metrics['cv_std']:.4f})")
    
    print(f"\n📋 Dataset Info:")
    print(f"   Total Samples:        {metrics['n_samples']}")
    print(f"   Number of Classes:    {metrics['n_classes']}")
    
    # Display per-class metrics
    if 'classification_report' in metrics:
        print(f"\n🎯 Per-Class Performance:")
        report = metrics['classification_report']
        
        for intent, scores in report.items():
            if isinstance(scores, dict) and 'precision' in scores:
                print(f"   {intent:25s} - P: {scores['precision']:.3f}, R: {scores['recall']:.3f}, F1: {scores['f1-score']:.3f}")
    
    print("\n" + "=" * 70)


def save_model(classifier: IntentClassifier, config: Config, model_name: str = None):
    """
    Save trained model
    
    Args:
        classifier: Trained classifier
        config: Configuration object
        model_name: Custom model name (optional)
    """
    if not model_name:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        model_name = f"model_{config.model.model_type}_{timestamp}.pkl"
    
    model_path = config.get_model_path(model_name)
    
    logger.info(f"💾 Saving model to {model_path}...")
    classifier.save_model(model_path)
    logger.info("✅ Model saved successfully!")
    
    return model_path


def test_model(classifier: IntentClassifier, config: Config):
    """
    Interactive model testing
    
    Args:
        classifier: Trained classifier
        config: Configuration object
    """
    print("\n" + "=" * 70)
    print("🧪 INTERACTIVE MODEL TESTING")
    print("=" * 70)
    print("Enter test queries (or 'quit' to exit):\n")
    
    test_queries = [
        "What are today's sales?",
        "Show me low stock items",
        "Which dish has the best profit margin?",
        "Give me daily advice",
        "Hello",
        "I want to book a table"
    ]
    
    print("💡 Example queries you can try:")
    for i, query in enumerate(test_queries, 1):
        print(f"   {i}. {query}")
    
    print("\n" + "-" * 70 + "\n")
    
    while True:
        try:
            user_input = input("Test Query: ").strip()
            
            if not user_input:
                continue
            
            if user_input.lower() in ['quit', 'exit', 'q']:
                print("\n👋 Exiting test mode...")
                break
            
            # Predict
            intent, confidence = classifier.predict(user_input)
            
            # Get top K predictions
            top_k = classifier.predict_top_k(user_input, k=3)
            
            print(f"\n   🎯 Predicted Intent: {intent}")
            print(f"   📊 Confidence: {confidence:.4f} ({confidence*100:.2f}%)")
            
            if confidence < config.inference.confidence_threshold:
                print(f"   ⚠️  Below confidence threshold ({config.inference.confidence_threshold})")
            
            print(f"\n   🔝 Top 3 Predictions:")
            for i, (pred_intent, prob) in enumerate(top_k, 1):
                print(f"      {i}. {pred_intent:20s} - {prob:.4f} ({prob*100:.2f}%)")
            
            print("\n" + "-" * 70 + "\n")
            
        except KeyboardInterrupt:
            print("\n\n👋 Exiting test mode...")
            break
        except Exception as e:
            print(f"\n❌ Error: {e}\n")


def main():
    """Main training function"""
    parser = argparse.ArgumentParser(
        description='Train Restaurant AI Model',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python train.py                                    # Train with default settings
  python train.py --model logistic                   # Train with logistic regression
  python train.py --model random_forest --test       # Train and test interactively
  python train.py --model svm --no-cv               # Train SVM without cross-validation
        """
    )
    
    parser.add_argument('--model', type=str, default=None,
                       choices=['logistic', 'random_forest', 'svm', 'naive_bayes', 'gradient_boosting'],
                       help='Model type to train')
    parser.add_argument('--data', type=str, default=None,
                       help='Path to training data file')
    parser.add_argument('--output', type=str, default=None,
                       help='Output model filename')
    parser.add_argument('--test', action='store_true',
                       help='Run interactive testing after training')
    parser.add_argument('--no-cv', action='store_true',
                       help='Disable cross-validation')
    parser.add_argument('--config', type=str, default=None,
                       help='Path to custom config file')
    
    args = parser.parse_args()
    
    # Load configuration
    if args.config and os.path.exists(args.config):
        config = Config.load_from_file(args.config)
    else:
        config = Config()
    
    # Override config based on arguments
    if args.no_cv:
        config.training.cross_validate = False
    
    # Setup logging
    global logger
    logger = setup_logging(config)
    
    # Display banner
    display_banner()
    
    try:
        # Determine data path
        data_path = args.data if args.data else config.get_data_path('training_data.json')
        
        # Check if data exists
        if not os.path.exists(data_path):
            logger.error(f"❌ Training data not found at {data_path}")
            logger.info("💡 Make sure training_data.json exists in the data directory")
            return 1
        
        # Train model
        classifier, metrics = train_model(config, model_type=args.model, data_path=data_path)
        
        # Display results
        display_metrics(metrics)
        
        # Save model
        model_path = save_model(classifier, config, model_name=args.output)
        
        print(f"\n✨ Training completed successfully!")
        print(f"📦 Model saved to: {model_path}")
        
        # Interactive testing
        if args.test:
            test_model(classifier, config)
        
        # Save training report
        report_path = config.get_export_path(f"training_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json")
        import json
        with open(report_path, 'w', encoding='utf-8') as f:
            json.dump(metrics, f, indent=2, ensure_ascii=False)
        logger.info(f"📄 Training report saved to: {report_path}")
        
        print("\n" + "=" * 70)
        print("✅ ALL DONE!")
        print("=" * 70 + "\n")
        
        return 0
        
    except Exception as e:
        logger.error(f"❌ Training failed: {e}", exc_info=True)
        return 1


if __name__ == "__main__":
    sys.exit(main())
