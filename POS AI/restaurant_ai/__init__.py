"""
Restaurant AI - Intelligent Assistant for Restaurant Management
Version: 2.0.0

This package provides an advanced AI system for restaurant POS analytics,
including intent classification, response generation, and business intelligence.
"""

__version__ = "2.0.0"
__author__ = "Ailexity POS"
__email__ = "support@ailexitypos.com"

from .config import Config, default_config
from .models.intent_classifier import IntentClassifier
from .models.response_engine import ResponseEngine
from .services.data_fetcher import DataFetcher
from .services.analytics_engine import AnalyticsEngine

__all__ = [
    'Config',
    'default_config',
    'IntentClassifier',
    'ResponseEngine',
    'DataFetcher',
    'AnalyticsEngine',
]
