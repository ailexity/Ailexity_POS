"""
Test the trained Restaurant AI model with various queries
"""

import json
import os
from datetime import datetime
from inference import RestaurantAI


def test_model():
    """Test the trained model with various queries"""
    
    # Load the latest trained model
    trained_models_dir = 'trained_models'
    models = [f for f in os.listdir(trained_models_dir) if f.endswith('.pkl')]
    if not models:
        print("❌ No trained model found!")
        return
    
    latest_model = os.path.join(trained_models_dir, sorted(models)[-1])
    print(f"✅ Testing model: {latest_model}\n")
    
    # Initialize AI with config
    from config import Config
    config = Config()
    ai = RestaurantAI(model_path=latest_model, config=config)
    
    # Test queries
    test_queries = [
        # Sales queries
        "What were today's sales?",
        "Show me sales overview",
        "How much revenue did we make?",
        
        # Stock queries
        "What items are low in stock?",
        "Check inventory status",
        "Any out of stock items?",
        
        # Profit queries
        "Which items have the best profit margin?",
        "Show me profit analysis",
        "What's our most profitable item?",
        
        # AI advice
        "Give me business recommendations",
        "What should I focus on today?",
        "Any insights for improving business?",
        
        # Order status
        "How many pending orders?",
        "Show order status",
        "What's the average preparation time?",
        
        # Menu inquiry
        "What are our top selling items?",
        "Which dishes are trending?",
        "Show me popular menu items",
        
        # Customer feedback
        "How are our customer reviews?",
        "What's our average rating?",
        "Any negative feedback?",
        
        # Payment analysis
        "Show payment breakdown",
        "How many cash vs card transactions?",
        "Payment mode distribution",
        
        # Peak hours
        "When are our busiest hours?",
        "Show peak hours analysis",
        "What time do we get most orders?",
        
        # Greetings
        "Hello",
        "Hi there",
        "Good morning",
        
        # Goodbyes
        "Thanks bye",
        "That's all, goodbye",
        "Exit"
    ]
    
    results = []
    intent_distribution = {}
    
    print("="*70)
    print("🧪 TESTING RESTAURANT AI MODEL")
    print("="*70)
    print()
    
    for i, query in enumerate(test_queries, 1):
        print(f"[Test {i}/{len(test_queries)}]")
        print(f"👤 Query: {query}")
        
        # Get response
        response_text = ai.process_message(query)
        
        # For analytics, we need to get the last prediction
        intent, confidence = ai.classifier.predict(query)
        
        # Track intents
        intent_distribution[intent] = intent_distribution.get(intent, 0) + 1
        
        print(f"🤖 Intent: {intent} (confidence: {confidence:.2%})")
        print(f"💬 Response: {response_text[:150]}...")
        print("-"*70)
        
        results.append({
            'query': query,
            'intent': intent,
            'confidence': confidence,
            'response_length': len(response_text)
        })
    
    # Summary
    print("\n" + "="*70)
    print("📊 TEST SUMMARY")
    print("="*70)
    
    print(f"\nTotal Queries Tested: {len(test_queries)}")
    print(f"Unique Intents Detected: {len(intent_distribution)}")
    
    print("\n🎯 Intent Distribution:")
    for intent, count in sorted(intent_distribution.items(), key=lambda x: x[1], reverse=True):
        percentage = (count / len(test_queries)) * 100
        print(f"  • {intent}: {count} queries ({percentage:.1f}%)")
    
    # Average confidence
    avg_confidence = sum(r['confidence'] for r in results) / len(results)
    print(f"\n📈 Average Confidence: {avg_confidence:.2%}")
    
    # Confidence distribution
    high_conf = len([r for r in results if r['confidence'] >= 0.8])
    med_conf = len([r for r in results if 0.5 <= r['confidence'] < 0.8])
    low_conf = len([r for r in results if r['confidence'] < 0.5])
    
    print(f"\n🎚️ Confidence Distribution:")
    print(f"  • High (≥80%): {high_conf} queries ({high_conf/len(results)*100:.1f}%)")
    print(f"  • Medium (50-80%): {med_conf} queries ({med_conf/len(results)*100:.1f}%)")
    print(f"  • Low (<50%): {low_conf} queries ({low_conf/len(results)*100:.1f}%)")
    
    # Session stats
    session_stats = ai.get_session_stats()
    print(f"\n📊 Session Statistics:")
    print(f"  • Total Queries: {session_stats['total_queries']}")
    print(f"  • Session Duration: {session_stats['session_duration_seconds']:.1f} seconds")
    
    # Analytics report
    print("\n📋 Generating Analytics Report...")
    analytics = ai.generate_analytics_report()
    
    print(f"\n💰 POS Data Snapshot:")
    print(f"  • Today's Sales: ₹{analytics['pos_snapshot']['total_sales']:,.2f}")
    print(f"  • Orders Count: {analytics['pos_snapshot']['orders_count']}")
    print(f"  • Average Order Value: ₹{analytics['pos_snapshot']['avg_order_value']:,.2f}")
    
    # Save results
    output_file = f"exports/test_results_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    os.makedirs('exports', exist_ok=True)
    
    with open(output_file, 'w') as f:
        json.dump({
            'test_date': datetime.now().isoformat(),
            'model_path': latest_model,
            'test_queries': len(test_queries),
            'results': results,
            'intent_distribution': intent_distribution,
            'avg_confidence': avg_confidence,
            'session_stats': session_stats,
            'analytics': analytics
        }, f, indent=2)
    
    print(f"\n✅ Test results saved to: {output_file}")
    print("\n" + "="*70)


if __name__ == '__main__':
    test_model()
