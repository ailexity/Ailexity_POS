"""
Simple Test Script for Restaurant AI Model
"""

import os
from models.intent_classifier import IntentClassifier

# Load the latest trained model
trained_models_dir = 'trained_models'
models = [f for f in os.listdir(trained_models_dir) if f.endswith('.pkl')]
latest_model = os.path.join(trained_models_dir, sorted(models)[-1])

print(f"Testing model: {latest_model}\n")

# Initialize classifier
classifier = IntentClassifier(model_type='logistic', vectorizer_type='tfidf')
classifier.load_model(latest_model)

# Test queries
test_queries = [
    "What were today's sales?",
    "Show me sales report",
    "Total revenue today",
    "What's low in stock?",
    "Check inventory",
    "Out of stock items",
    "Best profit margin items",
    "Show profit analysis",
    "Business recommendations",
    "Daily insights",
    "Pending orders",
    "Order status",
    "Top selling items",
    "Most popular dishes",
    "Customer reviews",
    "Average rating",
    "Payment breakdown",
    "Peak hours",
    "Hello",
    "Good morning",
    "Goodbye",
    "Thanks bye"
]

print("="*70)
print("INTENT CLASSIFICATION TEST")
print("="*70)

results = {}
for query in test_queries:
    intent, confidence = classifier.predict(query)
    
    if intent not in results:
        results[intent] = []
    results[intent].append((query, confidence))
    
    status = "✅" if confidence > 0.5 else "⚠️" if confidence > 0.3 else "❌"
    print(f"{status} {query:40} -> {intent:25} ({confidence:.1%})")

print("\n" + "="*70)
print("SUMMARY BY INTENT")
print("="*70)

for intent in sorted(results.keys()):
    avg_conf = sum(c for _, c in results[intent]) / len(results[intent])
    print(f"\n{intent} (avg confidence: {avg_conf:.1%}):")
    for query, conf in results[intent]:
        print(f"  • {query} ({conf:.1%})")

print("\n" + "="*70)
