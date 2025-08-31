"""
Inference Service for Model Execution Service
"""
import json
import time
from typing import Dict, Any, Optional

import structlog
from jsonschema import validate, ValidationError as JSONValidationError

from app.core.config import model_config
from app.models.api import InferenceRequest, InferenceResponse, UsageInfo
from app.services.model_manager import model_manager
from app.services.ollama_client import (
    ollama_client,
    OllamaError,
    OllamaTimeoutError,
    OllamaModelNotFoundError
)

logger = structlog.get_logger(__name__)


class InferenceService:
    """Service for handling model inference requests."""
    
    async def generate(self, request: InferenceRequest) -> InferenceResponse:
        """
        Generate text using the specified model.
        
        Args:
            request: Inference request parameters
            
        Returns:
            InferenceResponse with generation results
        """
        start_time = time.time()
        model_id = request.model_id
        
        logger.info("Starting inference", 
                   model=model_id, 
                   prompt_length=len(request.prompt))
        
        try:
            # Check if model is loaded
            if not model_manager.is_model_loaded(model_id):
                # Try to load the model
                load_result = await model_manager.load_model(model_id)
                if not load_result["success"]:
                    return InferenceResponse(
                        success=False,
                        model_id=model_id,
                        latency_ms=int((time.time() - start_time) * 1000),
                        error=f"Failed to load model: {load_result['message']}"
                    )
            
            # Check if we can start inference (concurrent request limits)
            if not await model_manager.start_inference(model_id):
                return InferenceResponse(
                    success=False,
                    model_id=model_id,
                    latency_ms=int((time.time() - start_time) * 1000),
                    error="Model is at maximum concurrent request limit"
                )
            
            try:
                # Get model configuration
                config = model_config.get_model_config(model_id)
                defaults = model_config.get_defaults()
                
                # Prepare generation parameters
                options = {}
                
                # Set temperature
                temperature = request.temperature
                if temperature is None:
                    temperature = config.get("default_temperature") if config else defaults.get("temperature", 0.7)
                options["temperature"] = temperature
                
                # Set max tokens
                max_tokens = request.max_tokens
                if max_tokens is None:
                    max_tokens = defaults.get("max_tokens", 1000)
                options["num_predict"] = max_tokens
                
                # Set timeout
                timeout = request.timeout
                if timeout is None:
                    timeout = config.get("timeout") if config else defaults.get("timeout", 30)
                
                # Handle JSON schema if provided
                format_type = None
                enhanced_prompt = request.prompt
                
                if request.json_schema:
                    if config and config.get("supports_json_mode", False):
                        # Use native JSON mode
                        format_type = "json"
                        logger.info("Using native JSON mode", model=model_id)
                    else:
                        # Use prompt engineering
                        enhanced_prompt = self._enhance_prompt_for_json(
                            request.prompt, 
                            request.json_schema
                        )
                        logger.info("Using prompt engineering for JSON", model=model_id)
                
                # Perform generation
                result = await ollama_client.generate(
                    model=model_id,
                    prompt=enhanced_prompt,
                    system=request.system_prompt,
                    options=options,
                    format=format_type,
                    timeout=timeout
                )
                
                # Extract output
                output = result.get("response", "")
                
                # Validate JSON schema if provided
                if request.json_schema and output:
                    try:
                        output = self._process_json_output(output, request.json_schema)
                    except Exception as e:
                        logger.warning("JSON validation failed", 
                                     model=model_id, 
                                     error=str(e))
                        # Don't fail the request, just log the warning
                
                # Calculate token usage (approximation)
                usage = self._calculate_usage(request.prompt, output)
                
                latency_ms = result.get("latency_ms", int((time.time() - start_time) * 1000))
                
                logger.info("Inference completed successfully", 
                           model=model_id, 
                           latency_ms=latency_ms,
                           output_length=len(output))
                
                return InferenceResponse(
                    success=True,
                    output=output,
                    usage=usage,
                    latency_ms=latency_ms,
                    model_id=model_id
                )
                
            finally:
                # Always end inference tracking
                model_manager.end_inference(model_id)
        
        except OllamaTimeoutError:
            latency_ms = int((time.time() - start_time) * 1000)
            logger.error("Inference timeout", model=model_id, latency_ms=latency_ms)
            return InferenceResponse(
                success=False,
                model_id=model_id,
                latency_ms=latency_ms,
                error="Request timeout"
            )
        
        except OllamaModelNotFoundError:
            latency_ms = int((time.time() - start_time) * 1000)
            logger.error("Model not found", model=model_id)
            return InferenceResponse(
                success=False,
                model_id=model_id,
                latency_ms=latency_ms,
                error="Model not found"
            )
        
        except Exception as e:
            latency_ms = int((time.time() - start_time) * 1000)
            logger.error("Inference failed", 
                        model=model_id, 
                        error=str(e),
                        latency_ms=latency_ms)
            return InferenceResponse(
                success=False,
                model_id=model_id,
                latency_ms=latency_ms,
                error=f"Inference failed: {str(e)}"
            )
    
    def _enhance_prompt_for_json(self, prompt: str, schema: Dict[str, Any]) -> str:
        """
        Enhance prompt with JSON schema instructions.
        
        Args:
            prompt: Original prompt
            schema: JSON schema
            
        Returns:
            Enhanced prompt with JSON instructions
        """
        schema_str = json.dumps(schema, indent=2)
        
        enhanced = f"""{prompt}

Please provide your response as valid JSON that conforms to this schema:
{schema_str}

Your response should contain ONLY the JSON object, with no additional text or formatting."""
        
        return enhanced
    
    def _process_json_output(self, output: str, schema: Dict[str, Any]) -> str:
        """
        Process and validate JSON output.
        
        Args:
            output: Raw output from model
            schema: JSON schema for validation
            
        Returns:
            Validated JSON string
        """
        # Try to extract JSON from the output
        json_str = self._extract_json(output)
        
        # Parse JSON
        try:
            json_obj = json.loads(json_str)
        except json.JSONDecodeError as e:
            raise ValueError(f"Invalid JSON: {str(e)}")
        
        # Validate against schema
        try:
            validate(instance=json_obj, schema=schema)
        except JSONValidationError as e:
            raise ValueError(f"JSON schema validation failed: {str(e)}")
        
        # Return properly formatted JSON
        return json.dumps(json_obj, indent=2)
    
    def _extract_json(self, text: str) -> str:
        """
        Extract JSON from text that might contain additional formatting.
        
        Args:
            text: Text that should contain JSON
            
        Returns:
            Extracted JSON string
        """
        text = text.strip()
        
        # If it's already valid JSON, return as-is
        try:
            json.loads(text)
            return text
        except json.JSONDecodeError:
            pass
        
        # Try to extract from markdown code blocks
        if "```json" in text:
            start = text.find("```json") + 7
            end = text.find("```", start)
            if end > start:
                return text[start:end].strip()
        
        # Try to find JSON object boundaries
        start = text.find("{")
        if start >= 0:
            # Find matching closing brace
            brace_count = 0
            for i, char in enumerate(text[start:], start):
                if char == "{":
                    brace_count += 1
                elif char == "}":
                    brace_count -= 1
                    if brace_count == 0:
                        return text[start:i+1]
        
        # Try to find JSON array boundaries
        start = text.find("[")
        if start >= 0:
            bracket_count = 0
            for i, char in enumerate(text[start:], start):
                if char == "[":
                    bracket_count += 1
                elif char == "]":
                    bracket_count -= 1
                    if bracket_count == 0:
                        return text[start:i+1]
        
        # If no JSON found, return original text
        return text
    
    def _calculate_usage(self, prompt: str, output: str) -> UsageInfo:
        """
        Calculate approximate token usage.
        
        Args:
            prompt: Input prompt
            output: Generated output
            
        Returns:
            UsageInfo with token counts
        """
        # Rough approximation: 1 token ≈ 4 characters
        prompt_tokens = len(prompt) // 4
        completion_tokens = len(output) // 4
        
        return UsageInfo(
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens,
            total_tokens=prompt_tokens + completion_tokens
        )


# Global inference service instance
inference_service = InferenceService()
