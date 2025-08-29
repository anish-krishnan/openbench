# Open Bench — Frontend Technical Design

**Stack**: Next.js (App Router, React 18, TypeScript), TailwindCSS + shadcn/ui, TanStack Query, react-hook-form + Zod, NextAuth (Auth.js), Supabase JS (Realtime), Framer Motion, Charting (recharts), Sentry (browser + Vercel), PostHog/GA4.

**Deploy**: Vercel (production + preview branches). Edge Middleware for basic headers and bot protection.

**Targets**

- **SEO + shareability** for model/test pages; **fast TTFB** via RSC/SSR and ISR.
- **Low-latency, real-time** job/result updates via Supabase Realtime.
- **Strong type-safety** end-to-end via OpenAPI codegen and Zod validation.
- **Moderation & trust**: built-in flows for pending/flagged tests, content sanitization.
- **Maintainability**: clear routing, component library, testing pyramid.

---

## 1) Scope & Assumptions (Contracts with Backend)

We align to the provided backend spec (FastAPI on Railway; Supabase PG; Redis; Pydantic v2). We assume the following **stable API surfaces** (exact shapes from OpenAPI):

- **Models**

  - `GET /api/v1/models` → catalog (filters: provider, capability tags)
  - `GET /api/v1/models/{id}/performance` → aggregate metrics; history
  - `POST /api/v1/models/register` (admin)

- **Tests**

  - `GET /api/v1/tests` (filters: category, author, status[approved|pending|rejected], text search)
  - `POST /api/v1/tests` (create; returns pending test revision)
  - `GET /api/v1/tests/{id}` (latest approved revision + results)
  - `GET /api/v1/tests/{id}/revisions` & `POST /api/v1/tests/{id}/revisions`
  - `POST /api/v1/tests/{id}/run` (re-run across models; idempotent enqueue)

- **Evaluations / Results**

  - `GET /api/v1/results?testId=&modelId=` (paginated; latest-first)
  - `GET /api/v1/leaderboard?groupBy=...` (category/global; period)

- **Admin / Moderation**

  - `GET /api/v1/admin/pending`
  - `POST /api/v1/admin/approve` (approve/reject with notes)
  - `GET /api/v1/admin/stats`

- **Auth & Users**

  - `GET /api/v1/me` (profile, roles: viewer|contributor|moderator|admin)

- **Realtime**: Supabase Realtime channels on `jobs`, `results`, `tests`. We subscribe client-side for live status: `queued → running → passed/failed/error` per (model, test, revision) with token/cost/latency metadata.

- **Evaluation Types**

  - **Exact Match** (strict equality)
  - **Structured Match** (JSON-schema/Zod-like, FP tolerance, order-insensitive options)
  - **LLM-as-Judge** (verdict, confidence, rationale)

> **Note**: Exact request/response models are code-generated from OpenAPI at build time; any mismatch is surfaced in type errors.

---

## 2) High-Level Architecture

**App Router** with Server Components for data-heavy, cacheable pages (leaderboard, model/test details). Client Components for interactive forms and real-time subscriptions.

- **Data fetching**:
  - **Server** (RSC/SSR): initial fetch for SEO and fast first paint. Uses **Next.js Route Handlers** for proxying (if needed) and to attach cookies/headers.
  - **Client**: TanStack Query for mutations and live updates; query keys mirror REST resources.
- **Caching**:
  - **ISR** for public pages (e.g., `/leaderboard`, `/models/[id]`, `/tests/[id]`) with `revalidate` on table-change webhooks (or revalidate tags) triggered by backend when results land.
  - Client-side query cache + background refetch on focus.
- **Realtime**: Supabase Realtime subscriptions mounted at page/component scope to hydrate live status bars without full refetch.
- **Forms**: `react-hook-form` + `@hookform/resolvers/zod` for client validation; server-side validation errors surfaced from API.
- **Auth**: NextAuth with OAuth providers (GitHub/Google). Role claims come from backend; RLS is enforced at API/DB. Frontend gates UI affordances by role.
- **Design System**: shadcn/ui primitives (Button, Card, Tabs, Dialog, Dropdown, DataTable), Tailwind tokens. Dark mode via `next-themes`.
- **Charts**: `recharts` for pass-rate, latency percentiles, cost trends.

---

## 3) Routing Map (App Router)

```
/                          → Home (hero, quick stats, CTA to Contribute)
/leaderboard               → Global leaderboards + filters
/models                    → Model catalog
/models/[modelId]          → Model detail (metrics, strengths, cost, history)
/tests                     → Test directory + search
/tests/new                 → Multi-step submission wizard
/tests/[testId]            → Test detail (description, schema, correct answers, per-model results)
/tests/[testId]/history    → Version history & diffs
/compare                   → Model comparator (A vs B vs C)
/admin                     → Admin dashboard (role-gated)
/admin/pending             → Moderation queue & bulk actions
/admin/stats               → System health/usage
/account                   → Profile, API tokens (if exposed), submissions
/docs                      → API/Contribution docs (MDX)
/terms, /privacy           → Legal
```

**Edge Middleware**

- Security headers, bot/abuse rate limits (IP-based soft block for write routes), locale detection.

---

## 4) Key User Flows & Screens

### 4.1 Contribute a Test (Wizard)

**Steps**

1. **Basics**: Title, category, tags, difficulty, visibility (public by default), licenses, content warnings (if any). Markdown editor for description (DOMPurify-sanitized render).
2. **Prompt & Inputs**: Prompt template + example inputs. Option to add **parameterized** inputs (small dataset upload via presigned URL from backend; CSV/JSON constraints). Max N per submission to control cost (enforced by backend; surfaced in UI).
3. **Structured Output Schema**: Visual JSON Schema builder (object/array/union, required/optional, regex patterns, numeric tolerances, order-insensitive arrays, custom validators). JSON preview + schema linting.
4. **Correct Answer**: Provide canonical answer(s). For structured schema, validate against schema; for parameterized datasets, upload ground truth mapping by key.
5. **Evaluation Type**: Choose Exact / Structured / LLM-as-Judge. If LLM judge: provide rubric, grading prompt, and failure modes; preview rubric.
6. **Dry Run**: Optional, run on one sandbox model (non-blocking) to catch obvious errors (schema mismatch). Display sample output + validator verdict.
7. **Submit**: Create/submit test revision → pending moderation.

**UX details**

- Progress indicator; save-as-draft (autosave to localStorage + server draft when authenticated).
- Form-level Zod schema ensures consistent payload; backend errors mapped to fields.
- Access: contributors+ can submit; viewers see CTA to sign in.

### 4.2 Test Detail Page

- **Header**: Title, category, tags, author, status badge (approved/pending/rejected), last updated, version selector.
- **Description**: Markdown content; expandable; anchors for headings.
- **Schema**: Collapsible JSON view w/ copy; toggle to show canonical answer.
- **Run Panel**: “Re-run all models” (role-gated); dry-run single model (for debugging); shows **parallel tiles** per model with live status → queued/running/passed/failed/error; tokens, latency, cost; stdout/stderr (if surfaced by backend) in an expandable drawer.
- **Results**: Table (DataTable) of latest per-model verdict; filters (provider, pass/fail, errors). Sparkline of historical pass rate per model.
- **Discussion/Flags**: Comment thread (if enabled) and **Flag** button → submit moderation reason.

### 4.3 Leaderboard

- **Tabs**: Accuracy | Latency | Cost | Composite (weighted scoring config)
- **Filters**: Category, period (7d/30d/All), provider, context window, price tier, release year, model size.
- **Table**: Sticky header, sortable columns; badges for new/updated. Quick compare (select rows → `/compare`).
- **Charts**: Trend lines of top-N models; distribution of failures by category.

### 4.4 Model Detail

- **Overview**: Provider, context length, modality, max output tokens, pricing snapshot (from backend), release date.
- **Performance**: Pass-rate by category; latency p50/p95/p99; cost per evaluation; failure heatmap (category × error-type).
- **History**: Release/version notes (if backend tracks), time series charts.

### 4.5 Admin: Moderation Queue

- **Table** of pending tests: preview card, diff vs previous revision, policy checklist, content warnings.
- **Bulk actions** (approve/reject) with required note; optional **redlines** (fields to fix) → auto-feedback to author.
- **Automation**: On approve → trigger run across all models; UI reflects job fanout.

---

## 5) Component/System Design

### 5.1 Component Library (selected)

- `PageShell` (header/nav/footer, auth-aware; breadcrumbs)
- `FiltersBar` (leaderboard/tests)
- `DataTable` (shadcn + TanStack Table)
- `MetricsCard` (title, value, delta, tooltip)
- `ModelBadge` (provider icon, version tag)
- `StatusPill` (queued/running/passed/failed/error)
- `JobProgressGrid` (responsive grid of model tiles with live status)
- `SchemaBuilder` (visual editor; emits JSON Schema + zod string)
- `MarkdownEditor` (textarea + preview; sanitized render; image paste → presigned upload)
- `FileUpload` (dataset/canonical answers; progress; validation)
- `RunButton` (debounced; permission-aware; idempotent)
- `TrendChart` (recharts line/area; p50/p95/p99 toggle)
- `DiffView` (for revision diffs; e.g., Monaco or CodeMirror inline diff)
- `Toast` / `AlertDialog` / `ConfirmDialog`

### 5.2 State Management

- Prefer **co-located component state**.
- **TanStack Query** for server state: cache keys `['models', filters]`, `['tests', filters]`, `['test', id]`, `['results', {testId,modelId}]`, `['leaderboard', params]`.
- **Realtime** pushes **invalidate** events via `queryClient.invalidateQueries` by tag or direct update to cache rows.

### 5.3 Data Validation & Safety

- Use **OpenAPI-generated** client types (openapi-typescript) + **Zod** runtime guards for form payloads.
- Sanitize all user-rendered HTML from markdown via **DOMPurify** (server and client) and enforce a strict **CSP**.

### 5.4 Accessibility (a11y)

- WCAG 2.1 AA: focus rings, keyboard navigation, semantic landmarks, aria-live for job updates.
- Color contrast and non-color pass/fail indicators (icons + text).
