"""
Configuration Module
Comprehensive configuration management for restaurant AI system
"""

import os
from dataclasses import dataclass, field
from typing import Dict, Any, List
import json


@dataclass
class ModelConfig:
    """Model-specific configuration"""
    model_type: str = 'logistic'  # logistic, random_forest, svm, naive_bayes, gradient_boosting
    vectorizer_type: str = 'tfidf'  # tfidf or count
    max_features: int = 5000
    ngram_range: tuple = (1, 3)
    min_df: int = 1
    max_df: float = 0.9


@dataclass
class TrainingConfig:
    """Training-specific configuration"""
    validation_split: float = 0.2
    cross_validate: bool = True
    cv_folds: int = 5
    random_state: int = 42
    
    # Logistic Regression params
    lr_max_iter: int = 1000
    lr_c: float = 1.0
    
    # Random Forest params
    rf_n_estimators: int = 100
    rf_max_depth: int = 20
    rf_min_samples_split: int = 5
    
    # SVM params
    svm_kernel: str = 'rbf'
    svm_c: float = 1.0
    svm_gamma: str = 'scale'
    
    # Gradient Boosting params
    gb_n_estimators: int = 100
    gb_learning_rate: float = 0.1
    gb_max_depth: int = 5


@dataclass
class InferenceConfig:
    """Inference and response configuration"""
    confidence_threshold: float = 0.65
    low_confidence_message: str = "I'm not quite sure I understood that. Could you rephrase?"
    max_response_length: int = 500
    top_k_predictions: int = 3
    enable_context: bool = True
    session_timeout_minutes: int = 30


@dataclass
class DataConfig:
    """Data management configuration"""
    cache_enabled: bool = True
    cache_ttl_seconds: int = 300  # 5 minutes
    data_mode: str = 'mock'  # mock, database, api
    database_url: str = ''
    api_endpoint: str = ''
    api_key: str = ''


@dataclass
class AnalyticsConfig:
    """Analytics configuration"""
    enable_logging: bool = True
    log_interactions: bool = True
    log_sales: bool = True
    anomaly_threshold_std: float = 2.0
    prediction_days_ahead: int = 7
    session_gap_minutes: int = 30


@dataclass
class Config:
    """
    Main configuration class for restaurant AI
    """
    
    # Paths
    BASE_DIR: str = field(default_factory=lambda: os.path.dirname(os.path.abspath(__file__)))
    
    @property
    def DATA_DIR(self) -> str:
        return os.path.join(self.BASE_DIR, 'data')
    
    @property
    def MODELS_DIR(self) -> str:
        return os.path.join(self.BASE_DIR, 'trained_models')
    
    @property
    def LOGS_DIR(self) -> str:
        return os.path.join(self.BASE_DIR, 'logs')
    
    @property
    def EXPORTS_DIR(self) -> str:
        return os.path.join(self.BASE_DIR, 'exports')
    
    # Sub-configurations
    model: ModelConfig = field(default_factory=ModelConfig)
    training: TrainingConfig = field(default_factory=TrainingConfig)
    inference: InferenceConfig = field(default_factory=InferenceConfig)
    data: DataConfig = field(default_factory=DataConfig)
    analytics: AnalyticsConfig = field(default_factory=AnalyticsConfig)
    
    # Intent categories
    INTENT_CATEGORIES: List[str] = field(default_factory=lambda: [
        "sales_overview",
        "stock_status",
        "profit_margin_analysis",
        "ai_daily_advice",
        "greeting",
        "menu_inquiry",
        "reservation",
        "goodbye",
        "order_status",
        "customer_feedback",
        "staff_performance",
        "peak_hours"
    ])
    
    # Logging Configuration
    LOG_LEVEL: str = 'INFO'
    LOG_FORMAT: str = '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    LOG_TO_FILE: bool = True
    
    # Application metadata
    APP_NAME: str = "Restaurant AI Assistant"
    VERSION: str = "2.0.0"
    AUTHOR: str = "Ailexity POS"
    
    def __post_init__(self):
        """Create necessary directories after initialization"""
        for directory in [self.DATA_DIR, self.MODELS_DIR, self.LOGS_DIR, self.EXPORTS_DIR]:
            os.makedirs(directory, exist_ok=True)
    
    def to_dict(self) -> Dict[str, Any]:
        """
        Convert configuration to dictionary
        
        Returns:
            Dictionary representation of config
        """
        return {
            'BASE_DIR': self.BASE_DIR,
            'DATA_DIR': self.DATA_DIR,
            'MODELS_DIR': self.MODELS_DIR,
            'LOGS_DIR': self.LOGS_DIR,
            'EXPORTS_DIR': self.EXPORTS_DIR,
            'model': self.model.__dict__,
            'training': self.training.__dict__,
            'inference': self.inference.__dict__,
            'data': self.data.__dict__,
            'analytics': self.analytics.__dict__,
            'INTENT_CATEGORIES': self.INTENT_CATEGORIES,
            'LOG_LEVEL': self.LOG_LEVEL,
            'APP_NAME': self.APP_NAME,
            'VERSION': self.VERSION
        }
    
    def save_to_file(self, filepath: str):
        """
        Save configuration to JSON file
        
        Args:
            filepath: Path to save configuration
        """
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(self.to_dict(), f, indent=2, ensure_ascii=False)
    
    @classmethod
    def load_from_file(cls, filepath: str) -> 'Config':
        """
        Load configuration from JSON file
        
        Args:
            filepath: Path to configuration file
            
        Returns:
            Config instance
        """
        with open(filepath, 'r', encoding='utf-8') as f:
            config_dict = json.load(f)
        
        config = cls()
        
        # Update sub-configs
        if 'model' in config_dict:
            for key, value in config_dict['model'].items():
                if hasattr(config.model, key):
                    setattr(config.model, key, value)
        
        if 'training' in config_dict:
            for key, value in config_dict['training'].items():
                if hasattr(config.training, key):
                    setattr(config.training, key, value)
        
        if 'inference' in config_dict:
            for key, value in config_dict['inference'].items():
                if hasattr(config.inference, key):
                    setattr(config.inference, key, value)
        
        if 'data' in config_dict:
            for key, value in config_dict['data'].items():
                if hasattr(config.data, key):
                    setattr(config.data, key, value)
        
        if 'analytics' in config_dict:
            for key, value in config_dict['analytics'].items():
                if hasattr(config.analytics, key):
                    setattr(config.analytics, key, value)
        
        return config
    
    def update(self, **kwargs):
        """
        Update configuration parameters
        
        Args:
            **kwargs: Configuration parameters to update
        """
        for key, value in kwargs.items():
            if hasattr(self, key):
                setattr(self, key, value)
    
    def get_model_path(self, model_name: str) -> str:
        """Get full path for model file"""
        return os.path.join(self.MODELS_DIR, model_name)
    
    def get_data_path(self, filename: str) -> str:
        """Get full path for data file"""
        return os.path.join(self.DATA_DIR, filename)
    
    def get_log_path(self, filename: str) -> str:
        """Get full path for log file"""
        return os.path.join(self.LOGS_DIR, filename)
    
    def get_export_path(self, filename: str) -> str:
        """Get full path for export file"""
        return os.path.join(self.EXPORTS_DIR, filename)


# Legacy constants for backward compatibility
MODEL_NAME = "restaurant_intent_model"
CONFIDENCE_THRESHOLD = 0.65

INTENT_CATEGORIES = [
    "sales_overview",
    "stock_status",
    "profit_margin_analysis",
    "ai_daily_advice",
    "greeting",
    "menu_inquiry",
    "reservation",
    "goodbye",
    "order_status",
    "customer_feedback",
    "staff_performance",
    "peak_hours"
]

# Default configuration instance
default_config = Config()
