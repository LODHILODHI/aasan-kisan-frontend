# Aasan Kisan — React Admin Panel Integration Guide

**Audience:** React admin panel team only  
**Backend (dev):** `http://localhost:5000`  
**API prefix:** `/v1/admin`  
**Logins:** `DEMO_CREDENTIALS.md`  
**Farmer app doc:** `FLUTTER_INTEGRATION.md` (do not mix admin routes into mobile)

This is the **single source of truth** for wiring the React admin UI to the backend. Phase 3 shipped model registry, knowledge base, and AI review queue — those modules were **removed from the API**. Only **Analytics** from Phase 3 remains.

---

## 1. What changed (remove from React UI)

Delete routes, sidebar items, API clients, and permission checks for:

| Remove from UI | Former paths | Status |
|----------------|--------------|--------|
| **Model registry** | `GET/POST /v1/admin/models*`, `/label-sets` | **404 — removed** |
| **AI review queue** | `GET/POST /v1/admin/ai/review/items*` | **404 — removed** |
| **Knowledge base (RAG)** | `GET/POST /v1/admin/kb/*` | **404 — removed** |

**Keep** everything from Phase 1–2 plus:

| Keep in UI | Paths |
|------------|-------|
| **Analytics dashboard** | `GET /v1/admin/analytics/*` |
| **DSR queue** (list + update) | `GET/PATCH /v1/admin/dsr*` |
| **Pest threshold** (settings) | `GET/PUT /v1/admin/config/pest-threshold` |
| **Detection images** on farmer detail | `GET /v1/admin/detections/{id}/image` |

Low-confidence pest review stays on **Cloud recheck** (`/cloud-recheck`) — not a separate AI review module.

---

## 2. Suggested sidebar & routes

| Sidebar label | React route | Primary APIs | Min role / permission |
|---------------|-------------|--------------|------------------------|
| Dashboard | `/dashboard` | sync health, analytics overview | `sync.read` or `analytics.read` |
| Farmers | `/farmers` | `GET /farmers` | `farmers.read_list` |
| Farmer detail | `/farmers/:id` | `GET /farmers/:id`, detection image | `farmers.read_single` |
| DSR queue | `/dsr` | `GET /dsr`, `PATCH /dsr/:id` | `dsr.read_list` |
| Cloud recheck | `/cloud-recheck` | `GET /cloud-recheck`, review POST | `cloud_recheck.read` |
| Catalog | `/catalog` | `GET /catalog/pest`, `/catalog/plant` | `catalog.read` |
| Advice CMS | `/advice` | `/advice/*`, content-releases | `advice_content.read` |
| Mandi feed | `/mandi` | `/mandi` GET/PUT/refresh | `mandi_feed.read` |
| Weather feed | `/weather` | `/weather*` | `weather_feed.read` |
| Localization | `/l10n/*` | `/locales`, `/strings` | `l10n.read` |
| Analytics | `/analytics` | `/analytics/*` | `analytics.read` |
| Audit | `/audit` | `/audit` | `audit.read` |
| Admin users | `/users` | `/users`, `/roles` | `admin_users.read` |
| Pest threshold | `/settings/threshold` | `GET/PUT /config/pest-threshold` | `models.set_threshold` |

**Do not add:** `/models`, `/kb`, `/ai-review`.

---

## 3. Auth & session

| Action | Method | Path |
|--------|--------|------|
| Dev login | POST | `/v1/admin/auth/dev-login` |
| Refresh | POST | `/v1/admin/auth/refresh` |
| Step-up MFA | POST | `/v1/admin/auth/stepup` |
| Logout | POST | `/v1/admin/auth/logout` |
| SSO (prod) | POST | `/v1/admin/auth/sso/callback` | **501** |

**Dev login body:** `{ "email": "admin@aasan.kisan", "password": "admin123" }`

**Response:** `access_token`, `refresh_token`, `admin_user.grants[]` with `{ role, scope }`.

Use `Authorization: Bearer <access_token>` on all routes below (except dev-login / refresh).

**Token TTL:** access ~15 min, refresh ~12 h.

---

## 4. RBAC — menu gating

Call `GET /v1/admin/roles` or derive from `admin_user.grants` after login. Server returns `403 FORBIDDEN` if permission missing.

| Role | Typical modules |
|------|-----------------|
| `super_admin` | All |
| `ops_officer` | Farmers (read), DSR execute, sync, mandi/weather, cloud recheck read, analytics, audit read |
| `agronomist` | Catalog, advice CMS, cloud recheck review, pest threshold, analytics |
| `content_manager` | Advice, l10n, catalog read |
| `support` | Farmers, OTP, DSR file, PII (step-up) |
| `auditor` | Read-only: audit, farmers, feeds, catalog, analytics |

**Removed permissions** (drop from UI checks): `models.read`, `models.register`, `models.stage`, `models.promote_prod`, `models.rollback`, `models.retire`, `ai_review.read`, `ai_review.manage`, `kb.read`, `kb.edit`.

**Still used:** `models.set_threshold` — only for pest confidence threshold page (not model registry).

Full matrix: `server/utils/adminRbac.js`.

---

## 5. HTTP contract

### Success (most reads/writes)

```json
{
  "data": { },
  "meta": {
    "requestId": "req_abc123",
    "serverTime": "2026-06-25T09:14:02.512Z",
    "localeServed": "ur"
  }
}
```

### Auth exceptions (no `data` wrapper)

| Endpoint | Shape |
|----------|--------|
| `POST /v1/admin/auth/dev-login` | `{ access_token, refresh_token, expires_in, admin_user }` |
| `POST /v1/admin/auth/refresh` | `{ access_token, refresh_token, expires_in }` |
| `POST /v1/admin/auth/stepup` | `{ stepup_token, expires_in }` |
| `POST /v1/admin/mandi/refresh` | `{ job_id }` (202) |
| `POST /v1/admin/weather/refresh` | `{ job_id }` (202) |

### Errors

```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "…",
    "retryable": false,
    "requestId": "…"
  },
  "meta": { }
}
```

---

## 6. Module reference

### 6.1 Admin users

| Action | Method | Path | Permission |
|--------|--------|------|------------|
| List roles | GET | `/v1/admin/roles` | `roles.read` |
| List users | GET | `/v1/admin/users` | `admin_users.read` |
| Create user | POST | `/v1/admin/users` | `admin_users.create` |
| Assign roles | PUT | `/v1/admin/users/{id}/grants` | `admin_users.assign_role` |
| Deactivate | POST | `/v1/admin/users/{id}/deactivate` | `admin_users.deactivate` |

---

### 6.2 Farmers & support

| Action | Method | Path | Permission |
|--------|--------|------|------------|
| Search | GET | `/v1/admin/farmers?phone=&district=&page=&page_size=` | `farmers.read_list` |
| Detail | GET | `/v1/admin/farmers/{id}` | `farmers.read_single` |
| Full phone (PII) | Same + `X-Access-Reason: ticket-123` | `farmers.read_pii` + step-up |
| Resend OTP | POST | `/v1/admin/farmers/{id}/resend-otp` | `otp.resend` |
| File DSR | POST | `/v1/admin/farmers/{id}/dsr` | `farmers.dsr_file` |

List returns `phone_masked`, `plot_count`, `detection_count`, `consent`.

**Detection image (farmer detail):**  
`GET /v1/admin/detections/{detectionId}/image` — streams JPEG/WebP when `imageTraining` consent exists; else `404`.

---

### 6.3 DSR queue

| Action | Method | Path | Permission |
|--------|--------|------|------------|
| List | GET | `/v1/admin/dsr?status=pending&type=export` | `dsr.read_list` |
| Get one | GET | `/v1/admin/dsr/{request_id}` | `dsr.read_list` |
| Update status | PATCH | `/v1/admin/dsr/{request_id}` | `dsr.execute` |

**List item:**

```json
{
  "request_id": "dsr10001-0001-4000-8000-000000000001",
  "farmer_id": "...",
  "farmer_name": "Muhammad Aslam",
  "phone_masked": "0300***4567",
  "type": "export",
  "status": "pending",
  "reason": "Demo ticket #1042",
  "created_at": "2026-06-25T..."
}
```

**PATCH body (ops):**

```json
{
  "status": "completed",
  "download_url": "https://.../export.zip"
}
```

`status`: `pending` | `processing` | `completed` | `rejected`

---

### 6.4 Detections & cloud recheck

| Action | Method | Path | Permission |
|--------|--------|------|------------|
| All detections | GET | `/v1/admin/detections` | `detections.read` |
| Detection image | GET | `/v1/admin/detections/{id}/image` | `detections.read` |
| Recheck queue | GET | `/v1/admin/cloud-recheck?status=pending` | `cloud_recheck.read` |
| Review item | POST | `/v1/admin/cloud-recheck/{id}/review` | `cloud_recheck.review` |
| Get threshold | GET | `/v1/admin/config/pest-threshold` | `models.set_threshold` |
| Set threshold | PUT | `/v1/admin/config/pest-threshold` | `models.set_threshold` |

**Review body:**

```json
{
  "verdict": "confirm",
  "species_key": "whitefly",
  "note_key": "optional_l10n_key"
}
```

`verdict`: `confirm` | `reclassify` (requires valid `species_key`).

**Threshold PUT body:** `{ "value": 0.55 }` — accepts `0.55` or `55` (normalized to 0–1). Farmer app reads via public `GET /v1/config`.

---

### 6.5 Catalog

| Action | Method | Path | Permission |
|--------|--------|------|------------|
| Pest catalog | GET | `/v1/admin/catalog/pest` | `catalog.read` |
| Plant catalog | GET | `/v1/admin/catalog/plant` | `catalog.read` |
| Edit severity | PUT | `/v1/admin/catalog/{kind}/{key}/severity` | `catalog.edit_severity` |

Plant response: `{ diseases: [...], nutrients: [...] }`.  
Severity body: `{ severity, version }` — `409` on stale version.

---

### 6.6 Advice CMS

Workflow: `draft` → `in_review` → `approved` → `published` (or `rejected` / `archived`).

| Action | Method | Path | Permission |
|--------|--------|------|------------|
| List | GET | `/v1/admin/advice?status=&kind=&speciesKey=&locale=` | `advice_content.read` |
| Create | POST | `/v1/admin/advice` | `advice_content.edit` |
| Edit | PATCH | `/v1/admin/advice/{id}` | `advice_content.edit` |
| Submit | POST | `/v1/admin/advice/{id}/submit` | `advice_content.edit` |
| Approve | POST | `/v1/admin/advice/{id}/approve` | `advice_content.approve` |
| Reject | POST | `/v1/admin/advice/{id}/reject` | `advice_content.approve` |
| Publish | POST | `/v1/admin/advice/{id}/publish` | `advice_content.publish` |
| Archive | POST | `/v1/admin/advice/{id}/archive` | `advice_content.edit` |
| History | GET | `/v1/admin/advice/{id}/history` | `advice_content.read` |
| New release | POST | `/v1/admin/content-releases` | `advice_content.publish` |
| Export ARB | GET | `/v1/admin/content-releases/{contentVersion}/arb` | `advice_content.read` |

Author cannot approve own entry; approver cannot publish own approval → `403 sod_violation`.

---

### 6.7 Mandi & weather feeds

**Mandi**

| Action | Method | Path | Permission |
|--------|--------|------|------------|
| List | GET | `/v1/admin/mandi?crop=wheat&mandi=Multan` | `mandi_feed.read` |
| Edit | PUT | `/v1/admin/mandi/{crop}/{mandi}` | `mandi_feed.edit` |
| Refresh | POST | `/v1/admin/mandi/refresh?scope=wheat` | `mandi_feed.refresh` |

**Weather**

| Action | Method | Path | Permission |
|--------|--------|------|------------|
| Get district | GET | `/v1/admin/weather?district=Multan` | `weather_feed.read` |
| Update | PUT | `/v1/admin/weather/{district}` | `weather_feed.edit` |
| Refresh | POST | `/v1/admin/weather/refresh?district=Multan` | `weather_feed.refresh` |

Farmer app reads automatically from `GET /v1/mandi/prices` and `GET /v1/weather/forecast` — no extra publish step.

---

### 6.8 Localization

| Action | Method | Path | Permission |
|--------|--------|------|------------|
| Locales | GET | `/v1/admin/locales` | `l10n.read` |
| Toggle locale | PUT | `/v1/admin/locales/{code}` | `l10n.toggle_locale` |
| Strings | GET | `/v1/admin/strings?locale=ur&prefix=pest` | `l10n.read` |
| Edit string | PUT | `/v1/admin/strings/{locale}/{key}` | `l10n.edit` |
| Approve advice string | POST | `/v1/admin/strings/{locale}/{key}/approve` | `advice_content.approve` |

---

### 6.9 Sync health & audit

| Action | Method | Path | Permission |
|--------|--------|------|------------|
| Sync metrics | GET | `/v1/admin/sync/health` | `sync.read` |
| Audit log | GET | `/v1/admin/audit` | `audit.read` |
| Verify chain | GET | `/v1/admin/audit/verify` | `audit.read` |
| Audit entry | GET | `/v1/admin/audit/{id}` | `audit.read` |

---

### 6.10 Analytics (Phase 3 — kept)

Permission: `analytics.read`  
Roles: `super_admin`, `ops_officer`, `agronomist`, `auditor`

| Widget | Endpoint |
|--------|----------|
| Overview KPI cards | `GET /v1/admin/analytics/overview` |
| Consent breakdown | `GET /v1/admin/analytics/consent` |
| Telemetry (7 days) | `GET /v1/admin/analytics/telemetry` |
| Classifier metrics | `GET /v1/admin/analytics/classifier` |

**Overview response:**

```json
{
  "data": {
    "farmers_total": 8,
    "detections_total": 12,
    "sync_pending": 0,
    "sync_failed": 0,
    "low_confidence_detections": 5,
    "cloud_recheck_pending": 3,
    "dsr_pending": 1,
    "telemetry_events_24h": 0
  }
}
```

Use `cloud_recheck_pending` (not `ai_review_pending`) for the “needs review” card — links to **Cloud recheck** page.

**Consent response:** `farmers_total`, `analytics_enabled`, `image_training_enabled`, `both_disabled`.

**Telemetry response:** `events_7d`, `by_event[]` with `{ event_name, count }`.

**Classifier response:** `total_detections`, `below_threshold`, `low_confidence_rate`, `by_species[]` with `{ species_key, count, avg_confidence }`.

---

## 7. Dev setup

```bash
npm run dev          # http://localhost:5000
npm run db:seed      # demo farmers, DSR, detections
node scripts/test-analytics-apis.js
```

**React proxy:** point `/v1` → `http://localhost:5000` or set `VITE_API_BASE_URL`.

**CORS:** open in dev.

---

## 8. React migration checklist

- [ ] Remove sidebar: Models, Knowledge Base, AI Review
- [ ] Delete API modules calling `/models`, `/kb`, `/ai/review`
- [ ] Remove RBAC checks for `models.read`, `kb.*`, `ai_review.*` (keep `models.set_threshold`)
- [ ] Add or keep **Analytics** page with four endpoints above
- [ ] Overview card: bind `cloud_recheck_pending` → navigate to `/cloud-recheck`
- [ ] Keep **DSR queue** page (`GET /dsr`, `PATCH /dsr/:id`)
- [ ] Farmer detail: show detection thumbnails via `GET /detections/{id}/image`
- [ ] Pest threshold settings: `GET/PUT /config/pest-threshold` only

---

## 9. Not implemented

| Feature | Status |
|---------|--------|
| NADRA admin SSO | 501 |
| Model registry / OTA rollouts | Removed from API |
| RAG knowledge base admin | Removed from API |
| AI review queue (separate from cloud recheck) | Removed from API |
| Tenant district scoping | National scope in MVP |

---

*React admin integration — Phase 1–2 modules + Analytics + DSR queue. Updated after Phase 3 trim (June 2026).*
