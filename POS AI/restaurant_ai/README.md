# 🤖 Restaurant AI - Advanced ML Framework

An enterprise-grade AI system for restaurant Point-of-Sale (POS) analytics and intelligent assistance.

## 📋 Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Usage](#usage)
- [Configuration](#configuration)
- [API Reference](#api-reference)
- [Training](#training)
- [Deployment](#deployment)

## ✨ Features

### 🎯 Intent Classification
- **Multiple Algorithm Support**: Logistic Regression, Random Forest, SVM, Naive Bayes, Gradient Boosting
- **Advanced Text Processing**: TF-IDF and Count Vectorization with n-gram support
- **High Accuracy**: Cross-validation with comprehensive metrics
- **Confidence Scoring**: Robust probability estimates for predictions

### 💬 Response Generation
- **Context-Aware Responses**: Maintains conversation history and context
- **Dynamic Data Integration**: Real-time POS data fetching
- **Personalized Interactions**: User preference tracking
- **Rich Formatting**: Emoji support and structured output

### 📊 Analytics Engine
- **Real-time Metrics**: Track model performance and user interactions
- **Sales Analytics**: Trend analysis, predictions, and anomaly detection
- **Engagement Tracking**: Session analysis and user behavior insights
- **AI Recommendations**: Automated business intelligence

### 🔧 Advanced Features
- **Flexible Data Sources**: Mock data, database, or API integration
- **Caching System**: Optimized performance with smart caching
- **Comprehensive Logging**: Detailed logs for debugging and auditing
- **Export Capabilities**: Session data and analytics export

## 🏗️ Architecture

```
restaurant_ai/
├── data/                      # Training and configuration data
│   ├── intents.json          # Intent patterns and responses
│   └── training_data.json    # Training samples
├── models/                    # ML models
│   ├── intent_classifier.py  # Intent classification engine
│   └── response_engine.py    # Response generation system
├── services/                  # Business logic services
│   ├── data_fetcher.py       # Data retrieval and caching
│   └── analytics_engine.py   # Analytics and insights
├── trained_models/            # Saved model files
├── logs/                      # Application logs
├── exports/                   # Exported reports and data
├── train.py                   # Training pipeline
├── inference.py               # Inference engine
├── config.py                  # Configuration management
└── requirements.txt           # Python dependencies
```

## 🚀 Installation

### Prerequisites
- Python 3.8 or higher
- pip package manager
- Virtual environment (recommended)

### Step 1: Clone or Navigate to Directory
```bash
cd "d:\Ailexity POS\POS AI\restaurant_ai"
```

### Step 2: Create Virtual Environment (Recommended)
```bash
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate
```

### Step 3: Install Dependencies
```bash
pip install -r requirements.txt
```

### Step 4: Download NLTK Data (if using NLP features)
```python
python -c "import nltk; nltk.download('punkt'); nltk.download('stopwords')"
```

## 🎯 Quick Start

### 1. Train the Model
```bash
python train.py
```

This will:
- Load training data from `data/training_data.json`
- Train the default logistic regression model
- Save the trained model to `trained_models/`
- Display training metrics

### 2. Run Interactive Chat
```bash
python inference.py
```

### 3. Test Single Query
```bash
python inference.py --message "What are today's sales?"
```

## 📖 Usage

### Training Options

#### Basic Training
```bash
python train.py
```

#### Train with Specific Model
```bash
# Logistic Regression (fast, good baseline)
python train.py --model logistic

# Random Forest (high accuracy)
python train.py --model random_forest

# SVM (good for complex patterns)
python train.py --model svm

# Naive Bayes (fast, probabilistic)
python train.py --model naive_bayes

# Gradient Boosting (highest accuracy, slower)
python train.py --model gradient_boosting
```

#### Training with Options
```bash
# Train and test interactively
python train.py --model random_forest --test

# Train without cross-validation (faster)
python train.py --no-cv

# Custom output filename
python train.py --output my_model.pkl

# Use custom configuration
python train.py --config my_config.json
```

### Inference Options

#### Interactive Mode
```bash
# Basic interactive chat
python inference.py

# With debug information
python inference.py --debug

# Use specific model
python inference.py --model trained_models/model_logistic_20260115.pkl
```

#### Single Message Mode
```bash
python inference.py --message "Show me inventory status"
```

#### Available Commands in Chat
- `/help` - Show available commands
- `/stats` - Display session statistics
- `/report` - Generate analytics report
- `/examples` - Show example queries
- `/export` - Export session data
- `/clear` - Clear screen
- `quit` or `exit` - End conversation

### Example Queries

#### Sales & Revenue
```
What are today's sales?
Show me total revenue
How much did I earn today?
```

#### Inventory Management
```
What stock is available?
Which items are low in stock?
Show inventory status
```

#### Profit Analysis
```
Which dish is most profitable?
Show profit margins
Why is profit low?
```

#### Daily Insights
```
What should I focus on today?
Give me daily advice
Any problems today?
```

#### Operations
```
Show order status
What's the average prep time?
How many pending orders?
```

## ⚙️ Configuration

### Configuration File
The system uses a comprehensive configuration system defined in `config.py`:

```python
from config import Config

# Load default configuration
config = Config()

# Access configuration
print(config.model.model_type)  # 'logistic'
print(config.inference.confidence_threshold)  # 0.65

# Modify configuration
config.model.model_type = 'random_forest'
config.training.validation_split = 0.3

# Save custom configuration
config.save_to_file('my_config.json')

# Load custom configuration
config = Config.load_from_file('my_config.json')
```

### Key Configuration Options

#### Model Configuration
```python
config.model.model_type = 'logistic'  # Model algorithm
config.model.vectorizer_type = 'tfidf'  # Text vectorization
config.model.max_features = 5000  # Vocabulary size
config.model.ngram_range = (1, 3)  # N-gram range
```

#### Training Configuration
```python
config.training.validation_split = 0.2  # Validation set size
config.training.cross_validate = True  # Enable CV
config.training.cv_folds = 5  # Number of CV folds
```

#### Inference Configuration
```python
config.inference.confidence_threshold = 0.65  # Minimum confidence
config.inference.top_k_predictions = 3  # Top K results
config.inference.enable_context = True  # Context tracking
```

#### Data Configuration
```python
config.data.data_mode = 'mock'  # Data source mode
config.data.cache_enabled = True  # Enable caching
config.data.cache_ttl_seconds = 300  # Cache lifetime
```

## 📊 API Reference

### IntentClassifier

```python
from models.intent_classifier import IntentClassifier

# Initialize
classifier = IntentClassifier(model_type='logistic', vectorizer_type='tfidf')

# Train
metrics = classifier.train(
    data_path='data/training_data.json',
    validation_split=0.2,
    cross_validate=True
)

# Predict
intent, confidence = classifier.predict("What are today's sales?")

# Get top K predictions
top_k = classifier.predict_top_k("Show sales", k=3)

# Save/Load model
classifier.save_model('model.pkl')
classifier.load_model('model.pkl')
```

### ResponseEngine

```python
from models.response_engine import ResponseEngine

# Initialize
engine = ResponseEngine()

# Generate response
response = engine.generate(
    intent='sales_overview',
    data={'total_sales': 25000, 'orders_count': 120}
)

# Context management
engine.set_context('last_query', 'sales')
context = engine.get_context('last_query')
engine.clear_context()
```

### DataFetcher

```python
from services.data_fetcher import DataFetcher
from datetime import datetime

# Initialize
fetcher = DataFetcher(mode='mock')

# Fetch POS data
data = fetcher.fetch_pos_data()

# Fetch date range
sales_data = fetcher.fetch_sales_data(
    start_date=datetime(2026, 1, 1),
    end_date=datetime(2026, 1, 15)
)

# Specific data
inventory = fetcher.fetch_inventory_data()
customer_data = fetcher.fetch_customer_data()
```

### AnalyticsEngine

```python
from services.analytics_engine import AnalyticsEngine

# Initialize
analytics = AnalyticsEngine()

# Log interaction
analytics.log_interaction(
    user_input="Show sales",
    predicted_intent="sales_overview",
    confidence=0.95,
    response="Today's sales are ₹25,000"
)

# Generate report
report = analytics.generate_report(include_sales=True)

# Get recommendations
recommendations = analytics.get_recommendations()

# Export data
analytics.export_logs('session_data.json', log_type='all')
```

## 🎓 Training

### Training Data Format

`data/training_data.json`:
```json
{
  "sales_overview": [
    "What are today's sales?",
    "Show me total revenue",
    "How much did I earn?"
  ],
  "stock_status": [
    "What stock is available?",
    "Show inventory"
  ]
}
```

### Adding New Intents

1. Add training examples to `training_data.json`
2. Add intent to `INTENT_CATEGORIES` in `config.py`
3. Add response generation logic in `ResponseEngine`
4. Retrain the model

### Model Selection Guide

| Model | Speed | Accuracy | Best For |
|-------|-------|----------|----------|
| Logistic Regression | ⚡⚡⚡ | ⭐⭐⭐ | Baseline, fast inference |
| Naive Bayes | ⚡⚡⚡ | ⭐⭐ | Simple patterns, fast |
| SVM | ⚡⚡ | ⭐⭐⭐⭐ | Complex patterns |
| Random Forest | ⚡⚡ | ⭐⭐⭐⭐ | General purpose, robust |
| Gradient Boosting | ⚡ | ⭐⭐⭐⭐⭐ | Highest accuracy |

## 🚢 Deployment

### Production Checklist

- [ ] Train model with production data
- [ ] Set confidence threshold appropriately
- [ ] Configure database connection (if using)
- [ ] Set up logging to file
- [ ] Configure API endpoints (if using)
- [ ] Test with real user queries
- [ ] Set up monitoring and analytics
- [ ] Configure backup strategy

### Integration with POS System

```python
# Example integration
from models.intent_classifier import IntentClassifier
from models.response_engine import ResponseEngine
from services.data_fetcher import DataFetcher

# Initialize components
classifier = IntentClassifier()
classifier.load_model('trained_models/production_model.pkl')

response_engine = ResponseEngine()
data_fetcher = DataFetcher(
    mode='database',
    db_connection=your_db_connection
)

# Handle user query
def process_query(user_input):
    intent, confidence = classifier.predict(user_input)
    
    if confidence < 0.65:
        return "Could you please rephrase that?"
    
    data = data_fetcher.fetch_pos_data()
    response = response_engine.generate(intent, data)
    
    return response
```

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

Copyright © 2026 Ailexity POS. All rights reserved.

## 📞 Support

For support, please contact: support@ailexitypos.com

## 🎉 Acknowledgments

- Built with scikit-learn for machine learning
- Uses advanced NLP techniques for text processing
- Inspired by modern conversational AI systems
