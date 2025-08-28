"""
Analytics service for generating performance metrics and insights.
"""
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
import structlog
from sqlalchemy import select, func, and_, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models import TestResult, TestCase, Model, Execution

logger = structlog.get_logger(__name__)


class AnalyticsService:
    """Service for analytics and performance metrics."""
    
    async def get_leaderboard(
        self,
        category: Optional[str] = None,
        timeframe: str = "30d",
        min_tests: int = 10,
        limit: int = 50,
    ) -> Dict[str, Any]:
        """Get global leaderboard rankings."""
        
        db = await get_db()
        
        try:
            # Parse timeframe
            days = self._parse_timeframe(timeframe)
            cutoff_date = datetime.utcnow() - timedelta(days=days) if days else None
            
            # Build base query
            query = (
                select(
                    Model.id,
                    Model.name,
                    Model.display_name,
                    Model.provider,
                    func.count(TestResult.id).label("total_evaluations"),
                    func.avg(TestResult.accuracy_score).label("avg_accuracy"),
                    func.avg(TestResult.latency_ms).label("avg_latency"),
                    func.sum(TestResult.total_cost).label("total_cost"),
                )
                .join(TestResult, Model.id == TestResult.model_id)
                .join(TestCase, TestResult.test_case_id == TestCase.id)
                .where(TestResult.status == "completed")
                .where(TestResult.is_correct.is_not(None))
            )
            
            # Apply filters
            if category:
                query = query.where(TestCase.category == category)
            
            if cutoff_date:
                query = query.where(TestResult.executed_at >= cutoff_date)
            
            # Group and filter by minimum tests
            query = (
                query.group_by(Model.id, Model.name, Model.display_name, Model.provider)
                .having(func.count(TestResult.id) >= min_tests)
                .order_by(desc("avg_accuracy"), "avg_latency")
                .limit(limit)
            )
            
            result = await db.execute(query)
            rows = result.all()
            
            leaderboard = []
            for i, row in enumerate(rows, 1):
                leaderboard.append({
                    "rank": i,
                    "model_id": row.id,
                    "model_name": row.display_name,
                    "provider": row.provider,
                    "accuracy": round(float(row.avg_accuracy or 0), 4),
                    "avg_latency_ms": round(float(row.avg_latency or 0), 2),
                    "total_evaluations": row.total_evaluations,
                    "total_cost": round(float(row.total_cost or 0), 6),
                })
            
            return {
                "leaderboard": leaderboard,
                "filters": {
                    "category": category,
                    "timeframe": timeframe,
                    "min_tests": min_tests,
                },
                "generated_at": datetime.utcnow().isoformat(),
            }
            
        finally:
            await db.close()
    
    async def compare_models(
        self,
        model_ids: List[str],
        category: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Compare multiple models head-to-head."""
        
        db = await get_db()
        
        try:
            # Get model details
            models_query = select(Model).where(Model.id.in_(model_ids))
            models_result = await db.execute(models_query)
            models = {m.id: m for m in models_result.scalars().all()}
            
            # Get performance data for each model
            comparison_data = []
            
            for model_id in model_ids:
                if model_id not in models:
                    continue
                
                model = models[model_id]
                
                # Build performance query
                query = (
                    select(
                        func.count(TestResult.id).label("total_evaluations"),
                        func.avg(TestResult.accuracy_score).label("avg_accuracy"),
                        func.avg(TestResult.latency_ms).label("avg_latency"),
                        func.sum(TestResult.total_cost).label("total_cost"),
                        func.sum(func.case((TestResult.is_correct == True, 1), else_=0)).label("correct_count"),
                    )
                    .where(TestResult.model_id == model_id)
                    .where(TestResult.status == "completed")
                )
                
                if category:
                    query = query.join(TestCase).where(TestCase.category == category)
                
                result = await db.execute(query)
                stats = result.first()
                
                # Get category breakdown
                category_query = (
                    select(
                        TestCase.category,
                        func.count(TestResult.id).label("count"),
                        func.avg(TestResult.accuracy_score).label("accuracy"),
                    )
                    .join(TestCase, TestResult.test_case_id == TestCase.id)
                    .where(TestResult.model_id == model_id)
                    .where(TestResult.status == "completed")
                    .group_by(TestCase.category)
                )
                
                category_result = await db.execute(category_query)
                category_breakdown = {
                    row.category: {
                        "count": row.count,
                        "accuracy": round(float(row.accuracy or 0), 4),
                    }
                    for row in category_result.all()
                }
                
                comparison_data.append({
                    "model_id": model_id,
                    "model_name": model.display_name,
                    "provider": model.provider,
                    "total_evaluations": stats.total_evaluations or 0,
                    "accuracy": round(float(stats.avg_accuracy or 0), 4),
                    "avg_latency_ms": round(float(stats.avg_latency or 0), 2),
                    "total_cost": round(float(stats.total_cost or 0), 6),
                    "correct_count": stats.correct_count or 0,
                    "category_breakdown": category_breakdown,
                })
            
            return {
                "comparison": comparison_data,
                "filters": {"category": category},
                "generated_at": datetime.utcnow().isoformat(),
            }
            
        finally:
            await db.close()
    
    async def get_model_performance(
        self,
        model_id: str,
        category: Optional[str] = None,
        days: int = 30,
    ) -> Dict[str, Any]:
        """Get detailed performance metrics for a model."""
        
        db = await get_db()
        
        try:
            cutoff_date = datetime.utcnow() - timedelta(days=days)
            
            # Get overall stats
            query = (
                select(
                    func.count(TestResult.id).label("total_evaluations"),
                    func.avg(TestResult.accuracy_score).label("avg_accuracy"),
                    func.avg(TestResult.latency_ms).label("avg_latency"),
                    func.sum(TestResult.total_cost).label("total_cost"),
                    func.avg(TestResult.input_tokens).label("avg_input_tokens"),
                    func.avg(TestResult.output_tokens).label("avg_output_tokens"),
                )
                .where(TestResult.model_id == model_id)
                .where(TestResult.status == "completed")
                .where(TestResult.executed_at >= cutoff_date)
            )
            
            if category:
                query = query.join(TestCase).where(TestCase.category == category)
            
            result = await db.execute(query)
            stats = result.first()
            
            # Get model details
            model_result = await db.execute(select(Model).where(Model.id == model_id))
            model = model_result.scalar_one()
            
            return {
                "model_id": model_id,
                "model_name": model.display_name,
                "overall_accuracy": round(float(stats.avg_accuracy or 0), 4),
                "total_evaluations": stats.total_evaluations or 0,
                "avg_latency_ms": round(float(stats.avg_latency or 0), 2),
                "success_rate": 1.0,  # TODO: Calculate actual success rate
                "cost_per_evaluation": round(float(stats.total_cost or 0) / max(stats.total_evaluations or 1, 1), 6),
                "avg_input_tokens": round(float(stats.avg_input_tokens or 0), 1),
                "avg_output_tokens": round(float(stats.avg_output_tokens or 0), 1),
                "category_performance": {},  # TODO: Implement category breakdown
                "last_updated": datetime.utcnow(),
            }
            
        finally:
            await db.close()
    
    async def get_trends(
        self,
        metric: str = "accuracy",
        timeframe: str = "30d",
        category: Optional[str] = None,
        model_ids: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        """Get historical performance trends."""
        
        # TODO: Implement trends analysis
        # This would involve:
        # 1. Time-series aggregation by day/week
        # 2. Trend calculation
        # 3. Comparative analysis
        
        return {
            "trends": [],
            "message": "Trends analysis not implemented yet",
            "filters": {
                "metric": metric,
                "timeframe": timeframe,
                "category": category,
                "model_ids": model_ids,
            },
        }
    
    async def get_categories(self) -> List[Dict[str, Any]]:
        """Get available test categories with statistics."""
        
        db = await get_db()
        
        try:
            query = (
                select(
                    TestCase.category,
                    func.count(TestCase.id).label("test_count"),
                    func.count(TestResult.id).label("evaluation_count"),
                )
                .outerjoin(TestResult, TestCase.id == TestResult.test_case_id)
                .where(TestCase.is_public == True)
                .where(TestCase.is_approved == True)
                .group_by(TestCase.category)
                .order_by(TestCase.category)
            )
            
            result = await db.execute(query)
            rows = result.all()
            
            categories = []
            for row in rows:
                categories.append({
                    "name": row.category,
                    "test_count": row.test_count,
                    "evaluation_count": row.evaluation_count or 0,
                })
            
            return categories
            
        finally:
            await db.close()
    
    async def get_platform_stats(self) -> Dict[str, Any]:
        """Get overall platform statistics."""
        
        db = await get_db()
        
        try:
            # Get counts
            test_count_result = await db.execute(select(func.count(TestCase.id)))
            test_count = test_count_result.scalar()
            
            evaluation_count_result = await db.execute(select(func.count(TestResult.id)))
            evaluation_count = evaluation_count_result.scalar()
            
            model_count_result = await db.execute(select(func.count(Model.id)).where(Model.is_active == True))
            model_count = model_count_result.scalar()
            
            return {
                "total_tests": test_count,
                "total_evaluations": evaluation_count,
                "active_models": model_count,
                "total_providers": 4,  # TODO: Calculate dynamically
                "generated_at": datetime.utcnow().isoformat(),
            }
            
        finally:
            await db.close()
    
    def _parse_timeframe(self, timeframe: str) -> Optional[int]:
        """Parse timeframe string to days."""
        if timeframe == "all":
            return None
        
        timeframe_map = {
            "7d": 7,
            "30d": 30,
            "90d": 90,
            "1y": 365,
        }
        
        return timeframe_map.get(timeframe, 30)
