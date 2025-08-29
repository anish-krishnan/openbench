#!/usr/bin/env python3
"""
Simple seed script to add a few models to the database.
"""
import asyncio
import sys
import os

# Add the project root to the Python path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import init_db, get_db
from app.models import Model


async def simple_seed():
    """Add a few models to the database one by one."""
    await init_db()
    
    db = await get_db()
    
    try:
        # Check if models already exist
        from sqlalchemy import select
        result = await db.execute(select(Model))
        existing_models = result.scalars().all()
        
        if existing_models:
            print(f"Database already contains {len(existing_models)} models. Skipping seed.")
            return
        
        # Add models one by one
        models = [
            Model(
                name="gpt-4o",
                display_name="GPT-4o",
                provider="openai",
                provider_model_id="gpt-4o",
                description="OpenAI's most advanced multimodal model",
                model_type="chat",
                version="2024-08-06",
                supports_structured_output=True,
                supports_json_mode=True,
                supports_function_calling=True,
                max_context_length=128000,
                input_price_per_1k=0.0025,
                output_price_per_1k=0.01,
                is_active=True,
                is_public=True,
                health_status="healthy",
                total_evaluations=0,
            ),
            Model(
                name="gpt-4o-mini",
                display_name="GPT-4o Mini",
                provider="openai",
                provider_model_id="gpt-4o-mini",
                description="Affordable and intelligent small model for fast, lightweight tasks",
                model_type="chat",
                version="2024-07-18",
                supports_structured_output=True,
                supports_json_mode=True,
                supports_function_calling=True,
                max_context_length=128000,
                input_price_per_1k=0.00015,
                output_price_per_1k=0.0006,
                is_active=True,
                is_public=True,
                health_status="healthy",
                total_evaluations=0,
            ),
            Model(
                name="claude-3-5-sonnet-20241022",
                display_name="Claude 3.5 Sonnet",
                provider="anthropic",
                provider_model_id="claude-3-5-sonnet-20241022",
                description="Most intelligent model from Anthropic",
                model_type="chat",
                version="20241022",
                supports_structured_output=False,
                supports_json_mode=False,
                supports_function_calling=True,
                max_context_length=200000,
                input_price_per_1k=0.003,
                output_price_per_1k=0.015,
                is_active=True,
                is_public=True,
                health_status="healthy",
                total_evaluations=0,
            ),
        ]
        
        for model in models:
            db.add(model)
            await db.commit()
            await db.refresh(model)
            print(f"Added model: {model.name} (ID: {model.id})")
        
        print(f"Successfully seeded {len(models)} models to the database.")
        
    except Exception as e:
        await db.rollback()
        print(f"Error seeding models: {e}")
        raise
    finally:
        await db.close()


if __name__ == "__main__":
    asyncio.run(simple_seed())
