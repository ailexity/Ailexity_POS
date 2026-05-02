"""
Intent Classifier Module
Advanced classification of user intents with multiple algorithm support
"""

import json
import pickle
import numpy as np
from typing import Dict, List, Tuple, Optional
import logging
from sklearn.feature_extraction.text import TfidfVectorizer, CountVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.naive_bayes import MultinomialNB
from sklearn.svm import SVC
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score
import re

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class IntentClassifier:
    """
    Advanced intent classifier with multiple algorithm support
    """
    
    def __init__(self, model_type: str = 'logistic', vectorizer_type: str = 'tfidf'):
        """
        Initialize intent classifier
        
        Args:
            model_type: Type of model ('logistic', 'random_forest', 'svm', 'naive_bayes', 'gradient_boosting')
            vectorizer_type: Type of vectorizer ('tfidf' or 'count')
        """
        self.model_type = model_type
        self.vectorizer_type = vectorizer_type
        self.vectorizer = None
        self.model = None
        self.label_encoder = {}
        self.reverse_label_encoder = {}
        self.training_history = []
        
        self._initialize_components()
        logger.info(f"Initialized IntentClassifier with {model_type} model and {vectorizer_type} vectorizer")
    
    def _initialize_components(self):
        """Initialize vectorizer and model based on configuration"""
        # Initialize vectorizer
        if self.vectorizer_type == 'tfidf':
            self.vectorizer = TfidfVectorizer(
                max_features=5000,
                ngram_range=(1, 3),
                min_df=1,
                max_df=0.9,
                strip_accents='unicode',
                lowercase=True
            )
        else:
            self.vectorizer = CountVectorizer(
                max_features=5000,
                ngram_range=(1, 3),
                min_df=1,
                max_df=0.9,
                strip_accents='unicode',
                lowercase=True
            )
        
        # Initialize model
        model_map = {
            'logistic': LogisticRegression(
                max_iter=1000,
                C=1.0,
                class_weight='balanced',
                random_state=42
            ),
            'random_forest': RandomForestClassifier(
                n_estimators=100,
                max_depth=20,
                min_samples_split=5,
                random_state=42,
                class_weight='balanced'
            ),
            'svm': SVC(
                kernel='rbf',
                C=1.0,
                gamma='scale',
                probability=True,
                random_state=42,
                class_weight='balanced'
            ),
            'naive_bayes': MultinomialNB(alpha=1.0),
            'gradient_boosting': GradientBoostingClassifier(
                n_estimators=100,
                learning_rate=0.1,
                max_depth=5,
                random_state=42
            )
        }
        
        self.model = model_map.get(self.model_type, model_map['logistic'])
    
    def preprocess_text(self, text: str) -> str:
        """
        Advanced text preprocessing
        
        Args:
            text: Raw input text
            
        Returns:
            Preprocessed text
        """
        # Convert to lowercase
        text = text.lower()
        
        # Remove special characters but keep important punctuation
        text = re.sub(r'[^a-zA-Z0-9\s\?\!\.\,]', '', text)
        
        # Remove extra whitespace
        text = ' '.join(text.split())
        
        return text

    def load_data(self, path: str) -> Tuple[List[str], List[str]]:
        """
        Load and parse training data
        
        Args:
            path: Path to training data JSON file
            
        Returns:
            Tuple of (texts, labels)
        """
        with open(path, 'r', encoding='utf-8') as f:
            data = json.load(f)

        X, y = [], []
        
        # Handle both formats: list of dicts or dict of lists
        if isinstance(data, list):
            # Format: [{"text": "...", "intent": "..."}, ...]
            for item in data:
                text = item.get('text', '')
                intent = item.get('intent', '')
                if text and intent:
                    preprocessed_text = self.preprocess_text(text)
                    X.append(preprocessed_text)
                    y.append(intent)
        else:
            # Format: {"intent1": ["text1", "text2"], "intent2": [...]}
            for intent, examples in data.items():
                for text in examples:
                    preprocessed_text = self.preprocess_text(text)
                    X.append(preprocessed_text)
                    y.append(intent)

        logger.info(f"Loaded {len(X)} samples for {len(set(y))} intents")
        return X, y
    
    def _encode_labels(self, labels: List[str]) -> np.ndarray:
        """
        Encode string labels to numerical values
        
        Args:
            labels: List of string labels
            
        Returns:
            Numpy array of encoded labels
        """
        unique_labels = sorted(set(labels))
        self.label_encoder = {label: idx for idx, label in enumerate(unique_labels)}
        self.reverse_label_encoder = {idx: label for label, idx in self.label_encoder.items()}
        
        return np.array([self.label_encoder[label] for label in labels])
    
    def _decode_label(self, encoded_label: int) -> str:
        """
        Decode numerical label to string
        
        Args:
            encoded_label: Encoded integer label
            
        Returns:
            String label
        """
        return self.reverse_label_encoder.get(encoded_label, "unknown")

    def train(self, data_path: str, validation_split: float = 0.2, 
              cross_validate: bool = True) -> Dict:
        """
        Train the intent classifier with validation
        
        Args:
            data_path: Path to training data
            validation_split: Fraction of data for validation
            cross_validate: Whether to perform cross-validation
            
        Returns:
            Dictionary with training metrics
        """
        logger.info("Starting training process...")
        
        # Load data
        X, y = self.load_data(data_path)
        
        if len(X) == 0:
            logger.error("No training data found!")
            return {'error': 'No training data'}
        
        # Encode labels
        y_encoded = self._encode_labels(y)
        
        # Split data
        X_train, X_val, y_train, y_val = train_test_split(
            X, y_encoded, test_size=validation_split, random_state=42, stratify=y_encoded
        )
        
        # Vectorize
        X_train_vec = self.vectorizer.fit_transform(X_train)
        X_val_vec = self.vectorizer.transform(X_val)
        
        # Train model
        logger.info(f"Training {self.model_type} model...")
        self.model.fit(X_train_vec, y_train)
        
        # Validation predictions
        y_val_pred = self.model.predict(X_val_vec)
        
        # Calculate metrics
        val_accuracy = accuracy_score(y_val, y_val_pred)
        train_accuracy = accuracy_score(y_train, self.model.predict(X_train_vec))
        
        # Cross-validation
        cv_scores = None
        if cross_validate and len(X) > 10:
            try:
                cv_scores = cross_val_score(
                    self.model, X_train_vec, y_train, cv=min(5, len(X) // 2)
                )
                logger.info(f"Cross-validation scores: {cv_scores}")
            except Exception as e:
                logger.warning(f"Cross-validation failed: {e}")
        
        # Classification report
        y_val_labels = [self._decode_label(label) for label in y_val]
        y_pred_labels = [self._decode_label(label) for label in y_val_pred]
        
        report = classification_report(
            y_val_labels, y_pred_labels, output_dict=True, zero_division=0
        )
        
        metrics = {
            'train_accuracy': float(train_accuracy),
            'val_accuracy': float(val_accuracy),
            'cv_mean': float(np.mean(cv_scores)) if cv_scores is not None else None,
            'cv_std': float(np.std(cv_scores)) if cv_scores is not None else None,
            'classification_report': report,
            'n_samples': len(X),
            'n_classes': len(self.label_encoder)
        }
        
        self.training_history.append(metrics)
        
        logger.info(f"Training completed - Train Acc: {train_accuracy:.4f}, Val Acc: {val_accuracy:.4f}")
        return metrics

    def predict(self, text: str) -> Tuple[str, float]:
        """
        Predict intent for given text
        
        Args:
            text: Input text to classify
            
        Returns:
            Tuple of (predicted_intent, confidence_score)
        """
        if self.model is None or self.vectorizer is None:
            logger.error("Model not trained yet!")
            return "unknown", 0.0
        
        preprocessed_text = self.preprocess_text(text)
        vec = self.vectorizer.transform([preprocessed_text])
        
        # Get prediction
        encoded_intent = self.model.predict(vec)[0]
        intent = self._decode_label(encoded_intent)
        
        # Get confidence
        probabilities = self.model.predict_proba(vec)[0]
        confidence = float(max(probabilities))
        
        logger.debug(f"Predicted intent: {intent} with confidence: {confidence:.3f}")
        return intent, confidence
    
    def predict_top_k(self, text: str, k: int = 3) -> List[Tuple[str, float]]:
        """
        Predict top K intents with probabilities
        
        Args:
            text: Input text
            k: Number of top predictions to return
            
        Returns:
            List of (intent, probability) tuples
        """
        if self.model is None or self.vectorizer is None:
            return [("unknown", 0.0)]
        
        preprocessed_text = self.preprocess_text(text)
        vec = self.vectorizer.transform([preprocessed_text])
        
        probabilities = self.model.predict_proba(vec)[0]
        top_k_indices = np.argsort(probabilities)[-k:][::-1]
        
        results = [
            (self._decode_label(idx), float(probabilities[idx]))
            for idx in top_k_indices
        ]
        
        return results
    
    def save_model(self, path: str):
        """
        Save the trained model and vectorizer
        
        Args:
            path: Path to save the model
        """
        if self.model is None:
            logger.error("No model to save!")
            return
        
        model_data = {
            'model': self.model,
            'vectorizer': self.vectorizer,
            'label_encoder': self.label_encoder,
            'reverse_label_encoder': self.reverse_label_encoder,
            'model_type': self.model_type,
            'vectorizer_type': self.vectorizer_type,
            'training_history': self.training_history
        }
        
        with open(path, 'wb') as f:
            pickle.dump(model_data, f)
        
        logger.info(f"Model saved to {path}")
    
    def load_model(self, path: str):
        """
        Load a trained model from disk
        
        Args:
            path: Path to the saved model
        """
        try:
            with open(path, 'rb') as f:
                model_data = pickle.load(f)
            
            self.model = model_data['model']
            self.vectorizer = model_data['vectorizer']
            self.label_encoder = model_data['label_encoder']
            self.reverse_label_encoder = model_data['reverse_label_encoder']
            self.model_type = model_data.get('model_type', 'logistic')
            self.vectorizer_type = model_data.get('vectorizer_type', 'tfidf')
            self.training_history = model_data.get('training_history', [])
            
            logger.info(f"Model loaded from {path}")
        except Exception as e:
            logger.error(f"Error loading model: {e}")
    
    def get_feature_importance(self, top_n: int = 20) -> Dict[str, List[Tuple[str, float]]]:
        """
        Get most important features for each class (for applicable models)
        
        Args:
            top_n: Number of top features to return
            
        Returns:
            Dictionary mapping class names to list of (feature, importance) tuples
        """
        if self.model is None or self.vectorizer is None:
            return {}
        
        feature_names = self.vectorizer.get_feature_names_out()
        importance_dict = {}
        
        try:
            if hasattr(self.model, 'coef_'):
                # For linear models
                for idx, class_name in self.reverse_label_encoder.items():
                    coefficients = self.model.coef_[idx]
                    top_indices = np.argsort(np.abs(coefficients))[-top_n:][::-1]
                    importance_dict[class_name] = [
                        (feature_names[i], float(coefficients[i]))
                        for i in top_indices
                    ]
            elif hasattr(self.model, 'feature_importances_'):
                # For tree-based models
                importances = self.model.feature_importances_
                top_indices = np.argsort(importances)[-top_n:][::-1]
                importance_dict['global'] = [
                    (feature_names[i], float(importances[i]))
                    for i in top_indices
                ]
        except Exception as e:
            logger.warning(f"Could not extract feature importance: {e}")
        
        return importance_dict
