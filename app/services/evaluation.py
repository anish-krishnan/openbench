"""
Evaluation service for orchestrating model evaluations.
"""
import asyncio
import time
from datetime import datetime
from typing import List, Dict, Any, Optional
from uuid import uuid4

import structlog
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.core.database import get_db
from app.core.exceptions import ProviderException, TimeoutException, DatabaseException
from app.models import TestCase, Model, Execution, TestResult
from app.providers.factory import ProviderFactory
from app.services.validation import ValidationService

logger = structlog.get_logger(__name__)


class EvaluationService:
    """Service for orchestrating test evaluations across multiple models."""
    
    def __init__(self):
        self.validation_service = ValidationService()
        self._running_evaluations: Dict[str, asyncio.Task] = {}
    
    async def run_evaluation(self, execution_id: str) -> None:
        """Start async evaluation for an execution."""
        if execution_id in self._running_evaluations:
            logger.warning("Evaluation already running", execution_id=execution_id)
            return
        
        # Create background task
        task = asyncio.create_task(self._execute_evaluation(execution_id))
        self._running_evaluations[execution_id] = task
        
        # Clean up task when done
        def cleanup_task(task: asyncio.Task):
            self._running_evaluations.pop(execution_id, None)
        
        task.add_done_callback(cleanup_task)
    
    async def _execute_evaluation(self, execution_id: str) -> None:
        """Execute evaluation for all models in the execution."""
        db = await get_db()
        
        try:
            # Get execution details
            result = await db.execute(
                select(Execution, TestCase)
                .join(TestCase, Execution.test_case_id == TestCase.id)
                .where(Execution.id == execution_id)
            )
            execution_data = result.first()
            
            if not execution_data:
                logger.error("Execution not found", execution_id=execution_id)
                return
            
            execution, test_case = execution_data
            
            # Update execution status
            execution.status = "running"
            execution.started_at = datetime.utcnow()
            await db.commit()
            
            logger.info(
                "Starting evaluation",
                execution_id=execution_id,
                test_case_id=test_case.id,
                model_count=len(execution.model_ids),
            )
            
            # Get model details
            models_result = await db.execute(
                select(Model).where(Model.id.in_(execution.model_ids))
            )
            models = {m.id: m for m in models_result.scalars().all()}
            
            # Run evaluations in parallel with concurrency limit
            semaphore = asyncio.Semaphore(settings.max_concurrent_evaluations)
            tasks = []
            
            for model_id in execution.model_ids:
                if model_id not in models:
                    logger.warning("Model not found", model_id=model_id)
                    continue
                
                model = models[model_id]
                task = asyncio.create_task(
                    self._evaluate_single_model(
                        semaphore, execution, test_case, model, db
                    )
                )
                tasks.append(task)
            
            # Wait for all evaluations with timeout
            try:
                await asyncio.wait_for(
                    asyncio.gather(*tasks, return_exceptions=True),
                    timeout=settings.test_run_timeout,
                )
            except asyncio.TimeoutError:
                logger.error("Evaluation timed out", execution_id=execution_id)
                execution.status = "failed"
                execution.error_message = "Evaluation timed out"
            
            # Update final execution status
            await self._finalize_execution(execution, db)
            
        except Exception as e:
            logger.error("Evaluation failed", execution_id=execution_id, error=str(e))
            try:
                execution.status = "failed"
                execution.error_message = str(e)
                execution.completed_at = datetime.utcnow()
                await db.commit()
            except Exception:
                pass
        finally:
            await db.close()
    
    async def _evaluate_single_model(
        self,
        semaphore: asyncio.Semaphore,
        execution: Execution,
        test_case: TestCase,
        model: Model,
        db: AsyncSession,
    ) -> None:
        """Evaluate a single model against a test case."""
        async with semaphore:
            start_time = time.time()
            result_id = str(uuid4())
            
            try:
                # Create result record
                test_result = TestResult(
                    id=result_id,
                    test_case_id=test_case.id,
                    model_id=model.id,
                    execution_id=execution.id,
                    status="running",
                )
                
                db.add(test_result)
                await db.commit()
                
                logger.info(
                    "Evaluating model",
                    model_id=model.id,
                    model_name=model.name,
                    test_case_id=test_case.id,
                )
                
                # Get provider and generate response
                provider = ProviderFactory.get_provider(model.provider)
                
                response = await asyncio.wait_for(
                    provider.generate(
                        prompt=test_case.prompt,
                        model=model.provider_model_id,
                        system_prompt=test_case.system_prompt,
                        temperature=0.1,  # Use low temperature for consistency
                        max_tokens=4096,
                        json_mode=test_case.evaluation_type == "structured_match",
                    ),
                    timeout=settings.evaluation_timeout,
                )
                
                # Validate and evaluate response
                evaluation_result = await self.validation_service.evaluate_response(
                    response=response.content,
                    expected_output=test_case.expected_output,
                    evaluation_type=test_case.evaluation_type,
                    evaluation_config=test_case.evaluation_config,
                    output_schema=test_case.output_schema,
                )
                
                # Update result with success data
                test_result.raw_output = response.content
                test_result.parsed_output = evaluation_result.get("parsed_output")
                test_result.is_correct = evaluation_result.get("is_correct")
                test_result.accuracy_score = evaluation_result.get("accuracy_score")
                test_result.evaluation_details = evaluation_result.get("details")
                
                test_result.latency_ms = response.latency_ms
                test_result.input_tokens = response.input_tokens
                test_result.output_tokens = response.output_tokens
                test_result.total_tokens = response.total_tokens
                
                test_result.input_cost = response.input_cost
                test_result.output_cost = response.output_cost
                test_result.total_cost = response.total_cost
                
                test_result.provider_request_id = response.provider_request_id
                test_result.status = "completed"
                
                logger.info(
                    "Model evaluation completed",
                    model_id=model.id,
                    is_correct=test_result.is_correct,
                    latency_ms=response.latency_ms,
                )
                
            except asyncio.TimeoutError:
                logger.warning("Model evaluation timed out", model_id=model.id)
                test_result.status = "timeout"
                test_result.error_message = "Evaluation timed out"
                test_result.error_type = "timeout"
                
            except ProviderException as e:
                logger.warning("Provider error during evaluation", model_id=model.id, error=str(e))
                test_result.status = "failed"
                test_result.error_message = str(e)
                test_result.error_type = "provider_error"
                
            except Exception as e:
                logger.error("Unexpected error during evaluation", model_id=model.id, error=str(e))
                test_result.status = "failed"
                test_result.error_message = str(e)
                test_result.error_type = "unknown_error"
            
            finally:
                # Always update the result and execution progress
                test_result.latency_ms = test_result.latency_ms or int((time.time() - start_time) * 1000)
                
                await db.commit()
                await self._update_execution_progress(execution, db)
    
    async def _update_execution_progress(self, execution: Execution, db: AsyncSession) -> None:
        """Update execution progress."""
        try:
            # Count completed evaluations
            result = await db.execute(
                select(TestResult)
                .where(TestResult.execution_id == execution.id)
                .where(TestResult.status.in_(["completed", "failed", "timeout"]))
            )
            completed_count = len(result.scalars().all())
            
            # Update progress
            execution.progress = completed_count
            
            # Update success/failure counts
            success_result = await db.execute(
                select(TestResult)
                .where(TestResult.execution_id == execution.id)
                .where(TestResult.status == "completed")
            )
            execution.successful_evaluations = len(success_result.scalars().all())
            
            failed_result = await db.execute(
                select(TestResult)
                .where(TestResult.execution_id == execution.id)
                .where(TestResult.status.in_(["failed", "timeout"]))
            )
            execution.failed_evaluations = len(failed_result.scalars().all())
            
            await db.commit()
            
        except Exception as e:
            logger.error("Failed to update execution progress", error=str(e))
    
    async def _finalize_execution(self, execution: Execution, db: AsyncSession) -> None:
        """Finalize execution with summary statistics."""
        try:
            # Get all results for this execution
            results_query = await db.execute(
                select(TestResult)
                .where(TestResult.execution_id == execution.id)
                .where(TestResult.status == "completed")
            )
            successful_results = results_query.scalars().all()
            
            if successful_results:
                # Calculate average accuracy
                accuracies = [r.accuracy_score for r in successful_results if r.accuracy_score is not None]
                if accuracies:
                    execution.avg_accuracy = sum(accuracies) / len(accuracies)
                
                # Calculate average latency
                latencies = [r.latency_ms for r in successful_results if r.latency_ms is not None]
                if latencies:
                    execution.avg_latency_ms = sum(latencies) / len(latencies)
            
            # Set final status
            if execution.progress >= execution.total_evaluations:
                execution.status = "completed"
            elif execution.successful_evaluations == 0:
                execution.status = "failed"
                execution.error_message = "All evaluations failed"
            else:
                execution.status = "completed"  # Partial success
            
            execution.completed_at = datetime.utcnow()
            await db.commit()
            
            logger.info(
                "Execution finalized",
                execution_id=execution.id,
                status=execution.status,
                successful=execution.successful_evaluations,
                failed=execution.failed_evaluations,
                avg_accuracy=execution.avg_accuracy,
            )
            
        except Exception as e:
            logger.error("Failed to finalize execution", error=str(e))
