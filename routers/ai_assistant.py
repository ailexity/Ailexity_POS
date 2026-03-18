from fastapi import APIRouter, Depends, HTTPException
from pymongo.database import Database
from typing import Dict, Any
from pydantic import BaseModel
import sys
import os
from datetime import datetime
import logging
import importlib.util

from .. import database, auth
from .pos_data_fetcher import POSDataFetcher
from .pos_response_generator import POSResponseGenerator

logger = logging.getLogger(__name__)

# Initialize AI components
AI_AVAILABLE = False
_ai_modules = {}
_load_attempted = False
_load_error = None

def load_ai_modules():
    """Dynamically load AI modules to avoid conflicts"""
    global AI_AVAILABLE, _ai_modules, _load_attempted, _load_error
    
    if _load_attempted:
        return AI_AVAILABLE
    
    _load_attempted = True
    
    try:
        # Get the POS AI path
        pos_ai_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..', 'POS AI', 'restaurant_ai'))
        
        logging.info(f"[AI] Attempting to load AI modules from: {pos_ai_path}")
        
        if not os.path.exists(pos_ai_path):
            error_msg = f"POS AI path does not exist: {pos_ai_path}"
            logging.error(f"[AI] {error_msg}")
            _load_error = error_msg
            return False
        
        # Add POS AI path to sys.path FIRST - before any imports
        if pos_ai_path not in sys.path:
            sys.path.insert(0, pos_ai_path)
        
        logging.debug(f"[AI] sys.path[0]: {sys.path[0]}")
        logging.debug(f"[AI] Current dir: {os.getcwd()}")
        
        # Now import directly - the modules will use sys.path
        config_path = os.path.join(pos_ai_path, 'config.py')
        logging.debug(f"[AI] Loading config from: {config_path}")
        config_spec = importlib.util.spec_from_file_location("ai_config", config_path)
        config_module = importlib.util.module_from_spec(config_spec)
        config_spec.loader.exec_module(config_module)
        logging.debug("[AI] ✓ Config loaded successfully")
        
        # Load inference module
        inference_path = os.path.join(pos_ai_path, 'inference.py')
        logging.debug(f"[AI] Loading inference from: {inference_path}")
        inference_spec = importlib.util.spec_from_file_location("ai_inference", inference_path)
        inference_module = importlib.util.module_from_spec(inference_spec)
        inference_spec.loader.exec_module(inference_module)
        logging.debug("[AI] ✓ Inference loaded successfully")
        
        _ai_modules['Config'] = config_module.Config
        _ai_modules['RestaurantAI'] = inference_module.RestaurantAI
        _ai_modules['pos_ai_path'] = pos_ai_path
        
        AI_AVAILABLE = True
        logging.info("✓ AI modules loaded successfully")
        return True
        
    except Exception as e:
        error_msg = f"Failed to load AI modules: {e}"
        logging.error(f"✗ {error_msg}", exc_info=True)
        _load_error = str(e)
        AI_AVAILABLE = False
        return False

# Don't load at module import - load lazily on first request
# load_ai_modules()

router = APIRouter()

# Initialize AI Assistant (singleton)
_ai_assistant = None
_config = None

def get_ai_assistant():
    """Get or initialize AI assistant"""
    global _ai_assistant, _config, AI_AVAILABLE
    
    # Lazy load modules on first request
    if not AI_AVAILABLE and not _load_attempted:
        load_ai_modules()
    
    if not AI_AVAILABLE or not _ai_modules:
        return None
    
    if _ai_assistant is None:
        try:
            Config = _ai_modules['Config']
            RestaurantAI = _ai_modules['RestaurantAI']
            pos_ai_path = _ai_modules['pos_ai_path']
            
            _config = Config()
            
            # Try to find any trained model
            trained_models_dir = os.path.join(pos_ai_path, 'trained_models')
            model_path = None
            
            if os.path.exists(trained_models_dir):
                model_files = [f for f in os.listdir(trained_models_dir) if f.endswith('.pkl')]
                if model_files:
                    # Use the most recent model (sorted by name which includes timestamp)
                    model_files.sort(reverse=True)
                    model_path = os.path.join(trained_models_dir, model_files[0])
                    logging.info(f"✓ Found trained model: {model_files[0]}")
            
            _ai_assistant = RestaurantAI(_config, model_path=model_path)
            logging.info("✓ AI assistant initialized successfully")
        except Exception as e:
            logging.error(f"✗ Failed to initialize AI assistant: {e}", exc_info=True)
            return None
    return _ai_assistant

class AIQueryRequest(BaseModel):
    message: str
    show_details: bool = False

class AIQueryResponse(BaseModel):
    response: str
    intent: str = None
    confidence: float = None
    timestamp: str

@router.post("/ai/query", response_model=AIQueryResponse)
async def query_ai_assistant(
    query: AIQueryRequest,
    current_user: dict = Depends(auth.get_current_active_user),
    db: Database = Depends(database.get_db)
):
    """
    Process user query through AI assistant with real POS data
    """
    try:
        # Fetch real POS data for this user
        data_fetcher = POSDataFetcher(db, current_user)
        pos_data = data_fetcher.fetch_pos_data()
        
        # Use POS-specific response generator
        response_generator = POSResponseGenerator()
        
        # Get intent and confidence if AI is available
        intent = None
        confidence = None
        
        if AI_AVAILABLE:
            ai_assistant = get_ai_assistant()
            if ai_assistant:
                try:
                    intent, confidence = ai_assistant.classifier.predict(query.message)
                except Exception as e:
                    logger.error(f"Error predicting intent: {e}")
        
        # Generate response using POS data
        response_text = response_generator.generate_response(
            query.message, 
            pos_data, 
            intent=intent, 
            confidence=confidence
        )
        
        return AIQueryResponse(
            response=response_text,
            intent=intent,
            confidence=confidence,
            timestamp=datetime.now().isoformat()
        )
    except Exception as e:
        logging.error(f"Error processing AI query: {e}", exc_info=True)
        # Return a helpful error message
        return AIQueryResponse(
            response=f"I apologize, but I encountered an error processing your request. Please try asking about your sales, orders, or items in a different way.",
            intent="error",
            confidence=0.0,
            timestamp=datetime.now().isoformat()
        )

@router.get("/ai/greeting")
async def get_ai_greeting(
    current_user: dict = Depends(auth.get_current_active_user)
):
    """
    Get a personalized greeting from the AI assistant
    """
    business_name = current_user.get("business_name") or current_user.get("username")
    greetings = [
        f"Hello {business_name}! 👋 How can I assist you with your business today?",
        f"Welcome back, {business_name}! 🎉 Ready to check your business insights?",
        f"Hi {business_name}! 🤖 I'm here to help with sales data, trends, and more!",
        f"Good to see you, {business_name}! 💼 What would you like to know about your business?",
    ]
    
    # Time-based greeting
    hour = datetime.now().hour
    if hour < 12:
        time_greeting = f"Good morning, {business_name}! ☀️"
    elif hour < 18:
        time_greeting = f"Good afternoon, {business_name}! 👋"
    else:
        time_greeting = f"Good evening, {business_name}! 🌙"
    
    import random
    greeting = random.choice(greetings + [time_greeting])
    
    return {
        "greeting": greeting,
        "timestamp": datetime.now().isoformat(),
        "ai_available": True,
        "ai_model_available": AI_AVAILABLE
    }

@router.get("/ai/status")
async def get_ai_status(force_reload: bool = False):
    """
    Check AI assistant status with detailed info
    force_reload: If True, attempts to reload AI modules
    """
    global _load_attempted, AI_AVAILABLE, _ai_modules, _load_error
    
    # Force reload if requested
    if force_reload:
        _load_attempted = False
        AI_AVAILABLE = False
        _ai_modules = {}
        _load_error = None
        load_ai_modules()
    
    # Try to load if not attempted yet
    if not _load_attempted:
        load_ai_modules()
    
    ai_assistant = get_ai_assistant()
    
    pos_ai_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..', 'POS AI', 'restaurant_ai'))
    
    return {
        "available": True,
        "initialized": True,
        "fallback_available": True,
        "ai_model_available": AI_AVAILABLE,
        "ai_model_initialized": ai_assistant is not None,
        "modules_loaded": bool(_ai_modules),
        "load_attempted": _load_attempted,
        "load_error": _load_error,
        "pos_ai_path": pos_ai_path,
        "pos_ai_path_exists": os.path.exists(pos_ai_path),
        "timestamp": datetime.now().isoformat()
    }

@router.get("/ai/examples")
async def get_example_queries(
    current_user: dict = Depends(auth.get_current_active_user)
):
    """
    Get example queries users can ask
    """
    examples = [
        "What are my total sales?",
        "How much revenue did I make today?",
        "What are my top selling items?",
        "Show me my sales for this week",
        "How many orders did I get today?",
        "What was my revenue yesterday?",
        "What's my average order value?",
        "How are my sales this month?",
        "Show me recent invoices",
        "What are my sales trends?",
        "How did I do this week compared to last week?",
        "Which items are selling best?"
    ]
    
    return {
        "examples": examples,
        "timestamp": datetime.now().isoformat()
    }

