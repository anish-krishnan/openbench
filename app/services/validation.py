"""
Validation service for evaluating model outputs.
"""
import json
import re
from typing import Any, Dict, Optional
import structlog

from app.core.exceptions import ValidationException

logger = structlog.get_logger(__name__)


class ValidationService:
    """Service for validating and evaluating model outputs."""
    
    async def evaluate_response(
        self,
        response: str,
        expected_output: Dict[str, Any],
        evaluation_type: str,
        evaluation_config: Optional[Dict[str, Any]] = None,
        output_schema: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Evaluate a model response against expected output."""
        
        logger.info(
            "Evaluating response",
            evaluation_type=evaluation_type,
            response_length=len(response),
        )
        
        try:
            # Parse the response
            parsed_output = self._parse_response(response, output_schema)
            
            # Evaluate based on type
            if evaluation_type == "exact_match":
                result = self._evaluate_exact_match(parsed_output, expected_output)
            elif evaluation_type == "structured_match":
                result = self._evaluate_structured_match(
                    parsed_output, expected_output, evaluation_config or {}
                )
            elif evaluation_type == "llm_judge":
                result = await self._evaluate_llm_judge(
                    response, expected_output, evaluation_config or {}
                )
            else:
                raise ValidationException(f"Unknown evaluation type: {evaluation_type}")
            
            result["parsed_output"] = parsed_output
            return result
            
        except Exception as e:
            logger.error("Evaluation failed", error=str(e))
            return {
                "is_correct": False,
                "accuracy_score": 0.0,
                "error": str(e),
                "parsed_output": None,
            }
    
    def _parse_response(self, response: str, schema: Optional[Dict[str, Any]] = None) -> Any:
        """Parse response using multiple strategies."""
        
        # Strategy 1: Direct JSON parsing
        try:
            return json.loads(response.strip())
        except json.JSONDecodeError:
            pass
        
        # Strategy 2: Extract JSON from markdown code blocks
        json_match = re.search(r'```(?:json)?\s*\n(.*?)\n```', response, re.DOTALL | re.IGNORECASE)
        if json_match:
            try:
                return json.loads(json_match.group(1).strip())
            except json.JSONDecodeError:
                pass
        
        # Strategy 3: Find JSON-like content with regex
        json_pattern = r'\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}'
        json_matches = re.findall(json_pattern, response)
        
        for match in json_matches:
            try:
                return json.loads(match)
            except json.JSONDecodeError:
                continue
        
        # Strategy 4: Return raw string if no JSON found
        return response.strip()
    
    def _evaluate_exact_match(self, parsed_output: Any, expected_output: Dict[str, Any]) -> Dict[str, Any]:
        """Evaluate using exact match comparison."""
        
        # Convert both to strings for comparison if needed
        if not isinstance(parsed_output, dict):
            parsed_str = str(parsed_output).strip().lower()
            expected_str = str(expected_output.get("value", expected_output)).strip().lower()
            is_correct = parsed_str == expected_str
        else:
            is_correct = parsed_output == expected_output
        
        return {
            "is_correct": is_correct,
            "accuracy_score": 1.0 if is_correct else 0.0,
            "details": {
                "evaluation_type": "exact_match",
                "expected": expected_output,
                "actual": parsed_output,
            },
        }
    
    def _evaluate_structured_match(
        self,
        parsed_output: Any,
        expected_output: Dict[str, Any],
        config: Dict[str, Any],
    ) -> Dict[str, Any]:
        """Evaluate using flexible structured matching."""
        
        if not isinstance(parsed_output, dict) or not isinstance(expected_output, dict):
            # Fall back to exact match for non-dict types
            return self._evaluate_exact_match(parsed_output, expected_output)
        
        # Configuration options
        ignore_order = config.get("ignore_array_order", True)
        float_tolerance = config.get("float_tolerance", 1e-6)
        ignore_extra_fields = config.get("ignore_extra_fields", True)
        
        score, details = self._compare_structures(
            parsed_output,
            expected_output,
            ignore_order=ignore_order,
            float_tolerance=float_tolerance,
            ignore_extra_fields=ignore_extra_fields,
        )
        
        return {
            "is_correct": score >= 0.95,  # 95% threshold for structured match
            "accuracy_score": score,
            "details": {
                "evaluation_type": "structured_match",
                "comparison_details": details,
                "config": config,
            },
        }
    
    def _compare_structures(
        self,
        actual: Any,
        expected: Any,
        ignore_order: bool = True,
        float_tolerance: float = 1e-6,
        ignore_extra_fields: bool = True,
    ) -> tuple[float, Dict[str, Any]]:
        """Compare two structures and return similarity score."""
        
        if type(actual) != type(expected):
            return 0.0, {"error": "Type mismatch", "actual_type": type(actual).__name__, "expected_type": type(expected).__name__}
        
        if isinstance(expected, dict):
            return self._compare_dicts(actual, expected, ignore_order, float_tolerance, ignore_extra_fields)
        elif isinstance(expected, list):
            return self._compare_lists(actual, expected, ignore_order, float_tolerance, ignore_extra_fields)
        elif isinstance(expected, float):
            diff = abs(actual - expected)
            score = 1.0 if diff <= float_tolerance else 0.0
            return score, {"difference": diff, "tolerance": float_tolerance}
        else:
            score = 1.0 if actual == expected else 0.0
            return score, {"match": score == 1.0}
    
    def _compare_dicts(
        self,
        actual: dict,
        expected: dict,
        ignore_order: bool,
        float_tolerance: float,
        ignore_extra_fields: bool,
    ) -> tuple[float, Dict[str, Any]]:
        """Compare two dictionaries."""
        
        if not ignore_extra_fields and set(actual.keys()) != set(expected.keys()):
            missing_keys = set(expected.keys()) - set(actual.keys())
            extra_keys = set(actual.keys()) - set(expected.keys())
            return 0.0, {"missing_keys": list(missing_keys), "extra_keys": list(extra_keys)}
        
        total_fields = len(expected)
        if total_fields == 0:
            return 1.0, {"empty_dict": True}
        
        matching_fields = 0
        field_details = {}
        
        for key, expected_value in expected.items():
            if key not in actual:
                field_details[key] = {"status": "missing"}
                continue
            
            field_score, field_detail = self._compare_structures(
                actual[key], expected_value, ignore_order, float_tolerance, ignore_extra_fields
            )
            
            field_details[key] = {"score": field_score, "details": field_detail}
            matching_fields += field_score
        
        overall_score = matching_fields / total_fields
        
        return overall_score, {"field_scores": field_details, "overall_score": overall_score}
    
    def _compare_lists(
        self,
        actual: list,
        expected: list,
        ignore_order: bool,
        float_tolerance: float,
        ignore_extra_fields: bool,
    ) -> tuple[float, Dict[str, Any]]:
        """Compare two lists."""
        
        if len(actual) != len(expected):
            return 0.0, {"length_mismatch": {"actual": len(actual), "expected": len(expected)}}
        
        if len(expected) == 0:
            return 1.0, {"empty_list": True}
        
        if ignore_order:
            # Try to find best matching for each expected item
            used_indices = set()
            total_score = 0.0
            
            for expected_item in expected:
                best_score = 0.0
                best_index = -1
                
                for i, actual_item in enumerate(actual):
                    if i in used_indices:
                        continue
                    
                    score, _ = self._compare_structures(
                        actual_item, expected_item, ignore_order, float_tolerance, ignore_extra_fields
                    )
                    
                    if score > best_score:
                        best_score = score
                        best_index = i
                
                if best_index >= 0:
                    used_indices.add(best_index)
                
                total_score += best_score
            
            overall_score = total_score / len(expected)
        else:
            # Compare in order
            total_score = 0.0
            for actual_item, expected_item in zip(actual, expected):
                score, _ = self._compare_structures(
                    actual_item, expected_item, ignore_order, float_tolerance, ignore_extra_fields
                )
                total_score += score
            
            overall_score = total_score / len(expected)
        
        return overall_score, {"list_score": overall_score, "ignore_order": ignore_order}
    
    async def _evaluate_llm_judge(
        self,
        response: str,
        expected_output: Dict[str, Any],
        config: Dict[str, Any],
    ) -> Dict[str, Any]:
        """Evaluate using LLM as judge (GPT-4)."""
        
        # TODO: Implement LLM judge evaluation
        # This would:
        # 1. Create a judge prompt
        # 2. Call GPT-4 to evaluate the response
        # 3. Parse the judge's response for score and reasoning
        
        logger.info("LLM judge evaluation not implemented yet")
        
        # Placeholder - fall back to structured match for now
        return self._evaluate_structured_match(response, expected_output, config)
