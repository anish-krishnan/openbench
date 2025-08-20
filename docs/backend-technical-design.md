# Open Bench - Backend Technical Design Document

## Executive Summary

This document specifies the backend architecture for Open Bench, focusing on API design, evaluation orchestration, and system reliability. The backend will handle parallel model evaluations, structured output validation, and provide real-time updates while maintaining high performance.

## Technology Stack

### Core Stack
- **Framework**: FastAPI (Python 3.11+)
- **Database**: Supabase (PostgreSQL 15)
- **Hosting**: Railway
- **Cache**: Redis
- **Async**: asyncio + httpx
- **Validation**: Pydantic v2
- **Monitoring**: Sentry + Railway metrics

### External Integrations
- LLM Providers: OpenAI, Anthropic, Google, Together AI
- Authentication: Supabase Auth (JWT)
- Real-time: Supabase Realtime

## System Architecture

### Service Architecture

The backend follows a layered architecture:

1. **API Layer** - Request handling, validation, authentication
2. **Service Layer** - Business logic, orchestration
3. **Provider Layer** - LLM provider abstractions
4. **Data Layer** - Database and cache operations

### Key Design Principles

- **Stateless Services** - All state in database/cache
- **Provider Agnostic** - Unified interface for all LLM providers
- **Async First** - Non-blocking I/O for all external calls
- **Fail Fast** - Aggressive timeouts and circuit breakers
- **Observable** - Structured logging and metrics

## Database Design

### Schema Strategy

**Approach**: Optimized for read performance with denormalization where appropriate.

### Core Tables

1. **users** - User accounts and metadata
2. **models** - LLM model registry with capabilities
3. **test_cases** - Test definitions with schemas
4. **test_results** - Evaluation results
5. **executions** - Batch execution tracking

### Performance Optimizations

- **Materialized Views** for leaderboard and analytics
- **JSONB columns** for flexible schema storage
- **Partial indexes** for common query patterns
- **Row-level security** for multi-tenancy

### Key Indexes

- `test_results(test_case_id, model_id, executed_at)`
- `test_cases(is_approved, category)` WHERE `is_public = true`
- `models(provider, is_active)`

## API Design

### Authentication Strategy

- **Method**: JWT tokens from Supabase Auth
- **Validation**: Verify tokens with Supabase public key
- **Rate Limiting**: Per-user limits based on tier
- **API Keys**: Optional for programmatic access

### Core API Modules

#### 1. Test Management API

**POST /api/v1/tests**
- Creates new test case
- Validates JSON schema and expected output
- Triggers async evaluation
- Returns test ID immediately

**GET /api/v1/tests/{id}**
- Returns test details
- Optional inclusion of results
- Cached for 5 minutes

**POST /api/v1/tests/{id}/run**
- Re-runs test on specified models
- Supports partial re-runs
- Returns execution ID

**GET /api/v1/tests/{id}/results**
- Returns paginated results
- Supports filtering by execution
- Real-time updates via WebSocket upgrade

#### 2. Model Management API

**GET /api/v1/models**
- Lists available models
- Filterable by provider, capabilities
- Cached for 1 hour

**GET /api/v1/models/{id}/performance**
- Detailed performance metrics
- Category breakdowns
- Historical trends

**POST /api/v1/models/register** (Admin)
- Register new model
- Validate API credentials
- Test basic functionality

#### 3. Benchmark API

**GET /api/v1/leaderboard**
- Global rankings
- Filters: category, timeframe, minimum tests
- Cached for 5 minutes
- Pagination support

**GET /api/v1/compare**
- Compare 2-5 models
- Head-to-head results
- Category breakdowns

**GET /api/v1/analytics/trends**
- Historical performance data
- Time-series aggregations
- Export support (CSV/JSON)

#### 4. Admin API

**GET /api/v1/admin/pending**
- Tests awaiting approval
- Bulk operations support

**POST /api/v1/admin/approve**
- Approve/reject tests
- Add moderation notes

**GET /api/v1/admin/stats**
- System health metrics
- Usage statistics

### Response Formats

All responses follow consistent structure:

```json
{
  "data": {},
  "meta": {
    "pagination": {},
    "cache": {"hit": true, "ttl": 300}
  },
  "errors": []
}
```

## Service Layer Design

### 1. Evaluation Service

**Responsibilities:**
- Orchestrate test execution across models
- Handle timeouts and retries
- Aggregate results

**Key Features:**
- Parallel execution with configurable concurrency
- Per-provider rate limiting
- Automatic retry with exponential backoff
- Circuit breaker for failing providers

**Execution Flow:**
1. Validate test case
2. Get active models (or specified subset)
3. Prepare provider-specific requests
4. Execute in parallel with timeout (30s per model)
5. Parse and validate outputs
6. Evaluate correctness
7. Store results atomically
8. Trigger real-time updates

### 2. Provider Service

**Responsibilities:**
- Abstract provider differences
- Handle authentication
- Format requests/responses

**Provider Adapter Pattern:**
- Base abstract class defining interface
- Provider-specific implementations
- Factory pattern for instantiation
- Capability detection

**Supported Providers:**
- OpenAI (GPT-4, GPT-3.5)
- Anthropic (Claude)
- Google (Gemini)
- Together AI (Open models)
- Replicate (Custom models)

**Key Capabilities to Handle:**
- Structured output support
- JSON mode support
- Function calling
- Context window limits
- Token pricing

### 3. Validation Service

**Responsibilities:**
- JSON Schema validation
- Output parsing from various formats
- Structured matching logic

**Parsing Strategy:**
1. Direct JSON parsing (for structured output models)
2. Markdown code block extraction
3. Regex-based JSON extraction
4. Fallback to string matching

**Evaluation Types:**

**Exact Match:**
- Strict equality comparison
- Used for deterministic outputs

**Structured Match:**
- Flexible comparison
- Ignores array ordering (when appropriate)
- Floating point tolerance
- Optional field handling

**LLM Judge:**
- Uses GPT-4 as evaluator
- Custom judge prompts
- Confidence scores
- Explanation of reasoning

### 4. Analytics Service

**Responsibilities:**
- Aggregate performance metrics
- Generate leaderboards
- Calculate trends

**Key Metrics:**
- Accuracy by model/category
- Latency percentiles (p50, p95, p99)
- Cost per evaluation
- Success/failure rates
- Token usage statistics

**Materialized Views:**
- `model_performance` - Overall rankings
- `category_performance` - Per-category breakdowns
- `daily_trends` - Time-series data

**Refresh Strategy:**
- Automatic refresh every 15 minutes
- Manual refresh on-demand
- Incremental updates for recent data

## Performance Optimization

### Caching Strategy

**Redis Cache Layers:**

1. **API Response Cache** (TTL: 5 min)
   - Leaderboard queries
   - Model listings
   - Test search results

2. **Computation Cache** (TTL: 15 min)
   - Aggregated statistics
   - Performance metrics
   - Comparison results

3. **Session Cache** (TTL: 1 hour)
   - User sessions
   - Rate limit counters

### Concurrency Management

**Execution Limits:**
- 10 concurrent evaluations per test
- 50 total concurrent API calls
- Per-provider rate limiting
- Queue overflow handling

**Timeout Strategy:**
- 30 seconds per model evaluation
- 2 minutes for complete test run
- 5 seconds for API responses
- Circuit breaker after 3 failures

### Database Optimization

**Query Optimization:**
- Prepared statements for hot paths
- Batch inserts for results
- Connection pooling (min: 10, max: 50)
- Read replicas for analytics

**Data Retention:**
- Keep detailed results for 90 days
- Archive older data to cold storage
- Maintain aggregates indefinitely

## Error Handling

### Error Categories

1. **Client Errors (4xx)**
   - Validation errors
   - Authentication failures
   - Rate limiting
   - Not found

2. **Server Errors (5xx)**
   - Provider failures
   - Database errors
   - Timeout errors
   - Internal errors

### Recovery Strategies

**Provider Failures:**
- Automatic retry with backoff
- Fallback to alternative provider
- Mark model as degraded
- Alert on repeated failures

**Database Failures:**
- Connection pool recovery
- Transaction rollback
- Query retry logic
- Failover to replica

### Error Response Format

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "User-friendly message",
    "details": {},
    "request_id": "uuid"
  }
}
```

## Security Considerations

### API Security

- **Authentication**: JWT validation on all protected endpoints
- **Authorization**: Role-based access control (user/admin)
- **Rate Limiting**: Tiered limits (10/min free, 100/min pro)
- **Input Validation**: Strict schema validation
- **SQL Injection**: Parameterized queries only

### Data Security

- **Encryption**: TLS for all external communications
- **Secrets**: Environment variables via Railway
- **PII Handling**: No storage of sensitive user data
- **Audit Logging**: All admin actions logged

### Provider Security

- **API Key Rotation**: Quarterly rotation schedule
- **Key Storage**: Encrypted in environment
- **Request Signing**: Where supported by provider
- **IP Whitelisting**: For production servers

## Monitoring & Observability

### Metrics to Track

**Application Metrics:**
- Request rate by endpoint
- Response time percentiles
- Error rates by category
- Active users

**Business Metrics:**
- Tests created per day
- Evaluations run per hour
- Model accuracy trends
- Cost per evaluation

**Infrastructure Metrics:**
- CPU/Memory usage
- Database connections
- Cache hit rates
- Queue depths

### Logging Strategy

**Structured Logging:**
- JSON format for all logs
- Correlation IDs for request tracing
- Log levels: DEBUG, INFO, WARN, ERROR
- Sensitive data masking

**Log Aggregation:**
- Centralized logging via Railway
- Real-time alerts for errors
- Daily reports for analytics

### Health Checks

**Endpoints:**
- `/health` - Basic liveness
- `/ready` - Readiness probe
- `/metrics` - Prometheus metrics

**Checks Include:**
- Database connectivity
- Redis availability
- Provider API status
- Queue depth

## Deployment Strategy

### Environment Configuration

**Development:**
- Local PostgreSQL + Redis
- Mock provider responses
- Reduced rate limits

**Staging:**
- Supabase free tier
- Real provider APIs (limited)
- Production-like configuration

**Production:**
- Supabase Pro
- Railway Pro deployment
- Auto-scaling enabled
- Multi-region consideration

### Deployment Process

1. **CI/CD Pipeline:**
   - Automated tests on push
   - Build Docker image
   - Deploy to Railway
   - Run smoke tests

2. **Database Migrations:**
   - Version controlled (Alembic)
   - Backward compatible
   - Automated rollback

3. **Zero-Downtime Deployments:**
   - Rolling updates
   - Health check validation
   - Automatic rollback on failure

## Implementation Phases

### Phase 1: Core Functionality (Week 1-2)
- Basic API structure
- Simple test execution
- Support 3-5 major models
- Exact match evaluation only
- Basic authentication

### Phase 2: Advanced Features (Week 3-4)
- Structured output validation
- Multiple evaluation types
- Provider abstraction layer
- Caching implementation
- Real-time updates

### Phase 3: Scale & Reliability (Week 5-6)
- Rate limiting
- Circuit breakers
- Monitoring setup
- Admin endpoints
- Performance optimization

### Future Enhancements
- Job queue system (BullMQ)
- Webhook notifications
- Batch API operations
- GraphQL API
- WebSocket subscriptions

## Risk Mitigation

| Risk | Impact | Mitigation Strategy |
|------|--------|-------------------|
| Provider API changes | High | Version detection, graceful degradation |
| Rate limit exhaustion | High | Request pooling, backoff, caching |
| Database overload | High | Read replicas, materialized views |
| Cost overruns | High | Usage quotas, cost alerts |
| Security breach | Critical | Regular audits, principle of least privilege |

## Success Criteria

### Performance Targets
- API response time: p95 < 500ms
- Test execution: < 2 minutes for all models
- Uptime: 99.9% availability
- Cache hit rate: > 80%

### Scale Targets
- Support 100 concurrent test executions
- Handle 1000 requests/minute
- Store 1M+ test results
- Support 50+ model providers

### Quality Targets
- Test coverage: > 80%
- Error rate: < 0.1%
- Failed evaluation rate: < 5%
- Data consistency: 100%