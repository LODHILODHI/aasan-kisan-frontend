# Aasan Kisan — Phase 3 Frontend Integration Guide

**Audience:** React admin panel team + Flutter farmer app team  
**Backend (dev):** `http://localhost:5000`  
**Prefix:** `/v1`  
**Prerequisite docs:** `FRONTEND_INTEGRATION.md` (Phase 1–2), `DEMO_CREDENTIALS.md`

Phase 3 adds **AI/ML operations**, **DSR queue**, **analytics dashboards**, and **app-facing `/v1/ai/*` seams**. NADRA SSO remains `501` (not in this phase).

---

## 1. What is new in Phase 3

| Area | Admin routes | Farmer app routes |
|------|--------------|-------------------|
| Model registry | `/v1/admin/models*` | `/v1/ai/device-model-manifest` |
| Pest threshold (read) | `GET /v1/admin/config/pest-threshold` | `/v1/ai/runtime-config`, `/v1/config` |
| AI review queue | `/v1/admin/ai/review/items*` | `POST /v1/ai/review/items` (ingest) |
| RAG knowledge base | `/v1/admin/kb/*` | `/v1/ai/kb/retrieve`, `/v1/ai/kb/answer` |
| Analytics | `/v1/admin/analytics/*` | — |
| DSR queue | `GET /v1/admin/dsr`, `PATCH /v1/admin/dsr/{id}` | — (farmer uses `/v1/me/export`, `DELETE /v1/me`) |
| Speech capabilities | — | `GET /v1/ai/speech/capabilities` |
| Consent withdraw (server purge) | — | `POST /v1/ai/consent/withdraw` |

**Migration:** `npm run db:migrate` applies `migrate007Phase3.js`  
**Smoke test:** `node scripts/test-phase3-apis.js`

---

## 2. Auth (unchanged)

| Client | Header | Token `aud` |
|--------|--------|-------------|
| Admin panel | `Authorization: Bearer <admin_access_token>` | `admin` |
| Farmer app | `Authorization: Bearer <farmer_access_token>` | `app` |

Admin login (dev): `POST /v1/admin/auth/dev-login` → `admin@aasan.kisan` / `admin123`

---

## 3. Admin panel — new screens

### 3.1 Model registry (`/models`)

**List models** — `GET /v1/admin/models`  
Permission: `models.read`  
Roles: `super_admin`, `agronomist`, `ops_officer`, `auditor`

```json
{
  "data": {
    "items": [
      {
        "id": "a1000001-0001-4000-8000-000000000001",
        "name": "assan_pest_v1",
        "kind": "pest",
        "status": "active",
        "active_version_id": "c3000001-0001-4000-8000-000000000001",
        "versions": [
          {
            "version_id": "c3000001-0001-4000-8000-000000000001",
            "semver": "1.0.0",
            "status": "production",
            "artifact_uri": "/uploads/models/pest_v1.tflite",
            "sha256": "stub_pest_sha256",
            "rollout_pct": 100,
            "metrics": { "accuracyProxy": 0.82 }
          }
        ]
      }
    ],
    "total": 2
  }
}
```

**Register new version** — `POST /v1/admin/models`  
Permission: `models.register`

```json
{
  "name": "assan_pest_v2",
  "kind": "pest",
  "artifact_uri": "/uploads/models/pest_v2.tflite",
  "sha256": "abc123...",
  "size_bytes": 2100000,
  "semver": "2.0.0"
}
```

**Stage rollout** — `POST /v1/admin/models/{id}/stage`  
Permission: `models.stage`

```json
{ "rollout_pct": 10, "version_id": "optional-uuid" }
```

**Promote to production** — `POST /v1/admin/models/{id}/promote`  
Permission: `models.promote_prod` (step-up in prod)

**Rollback** — `POST /v1/admin/models/{id}/rollback`  
Permission: `models.rollback`

**Retire** — `POST /v1/admin/models/{id}/retire` → `204`  
Permission: `models.retire`

**Label sets** — `GET /v1/admin/label-sets?task=pest_classification`

---

### 3.2 Pest threshold (`/settings/threshold`)

| Action | Method | Path |
|--------|--------|------|
| Read current | `GET` | `/v1/admin/config/pest-threshold` |
| Save | `PUT` | `/v1/admin/config/pest-threshold` |

Permission: `models.set_threshold`  
Body (either field works; `55` as percent auto-normalizes to `0.55`):

```json
{ "value": 0.55 }
```

Response:

```json
{ "data": { "value": 0.55, "previous": 0.6 } }
```

**Plant threshold:** not applicable — only pest has cloud-recheck threshold.

---

### 3.3 AI review queue (`/ai/review`)

**List** — `GET /v1/admin/ai/review/items?state=pending&kind=pest&page=1&page_size=50`  
Permission: `ai_review.read`

```json
{
  "data": {
    "items": [
      {
        "id": "e5000001-0001-4000-8000-000000000001",
        "ingest_key": "seed-review-aphids-1",
        "kind": "pest",
        "state": "pending",
        "species_key": "aphids",
        "confidence": 0.52,
        "has_image": false,
        "consent_training": false,
        "locale_code": "ur",
        "district": "Multan"
      }
    ],
    "total": 2,
    "page": 1,
    "page_size": 50
  }
}
```

**Assign to self** — `POST /v1/admin/ai/review/items/{id}/assign`  
**Label correction** — `POST /v1/admin/ai/review/items/{id}/label`

```json
{ "species_key": "aphids", "severity": "medium", "note_key": "reviewNoteAphids" }
```

**Adjudicate** — `POST /v1/admin/ai/review/items/{id}/adjudicate`

```json
{ "verdict": "confirm", "species_key": "aphids", "severity": "medium" }
```

`verdict`: `confirm` | `reject`  
Permission: `ai_review.manage` (agronomist, super_admin)

> **Note:** `image_uri` is only returned when `consent_training=true`. Never show images without consent.

---

### 3.4 Knowledge base / RAG (`/kb`)

| Action | Method | Path |
|--------|--------|------|
| List sources | `GET` | `/v1/admin/kb/sources` |
| Create source | `POST` | `/v1/admin/kb/sources` |
| List chunks | `GET` | `/v1/admin/kb/sources/{id}/chunks` |
| Add chunk | `POST` | `/v1/admin/kb/sources/{id}/chunks` |
| Publish | `POST` | `/v1/admin/kb/sources/{id}/publish` |
| Dry-run retrieve | `POST` | `/v1/admin/kb/retrieve` |
| Dry-run answer | `POST` | `/v1/admin/kb/answer` |

Permissions: `kb.read`, `kb.edit` (agronomist)

Create source body:

```json
{ "title": "Cotton IPM Guide", "source_type": "document" }
```

Add chunk:

```json
{ "chunk_text": "Aphids on cotton...", "mapped_species_key": "aphids" }
```

Publish requires `agronomist_reviewed=true` on source (set via DB/seed for demo; UI can add toggle in Phase 3.1).

Answer response (keys only — no free-text advice to app):

```json
{
  "data": {
    "answerKey": "pestAdviceAphids",
    "grounded": true,
    "confidence": 0.78,
    "escalate": false,
    "relatedSpeciesKeys": ["aphids"],
    "citations": [{ "chunk_id": "...", "source_title": "..." }],
    "disclaimer": "advisoryDisclaimer"
  }
}
```

---

### 3.5 Analytics dashboard (`/analytics`)

| Widget | Endpoint |
|--------|----------|
| Overview cards | `GET /v1/admin/analytics/overview` |
| Consent breakdown | `GET /v1/admin/analytics/consent` |
| Telemetry (7d) | `GET /v1/admin/analytics/telemetry` |
| Classifier metrics | `GET /v1/admin/analytics/classifier` |

Permission: `analytics.read`  
Roles: `ops_officer`, `agronomist`, `auditor`, `super_admin`

Overview example:

```json
{
  "data": {
    "farmers_total": 8,
    "detections_total": 12,
    "sync_pending": 0,
    "sync_failed": 0,
    "low_confidence_detections": 5,
    "ai_review_pending": 2,
    "dsr_pending": 1,
    "telemetry_events_24h": 0
  }
}
```

---

### 3.6 DSR queue (`/dsr`)

Previously only **file** + **get-by-id** existed. Phase 3 adds list + status update.

| Action | Method | Path | Permission |
|--------|--------|------|------------|
| List queue | `GET` | `/v1/admin/dsr?status=pending&type=export` | `dsr.read_list` |
| Get one | `GET` | `/v1/admin/dsr/{request_id}` | `dsr.read_list` |
| File new (from farmer detail) | `POST` | `/v1/admin/farmers/{id}/dsr` | `farmers.dsr_file` |
| Update status | `PATCH` | `/v1/admin/dsr/{request_id}` | `dsr.execute` |

List item shape:

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

Update status (ops):

```json
{
  "status": "completed",
  "download_url": "https://.../export.zip"
}
```

`status`: `pending` | `processing` | `completed` | `rejected`

---

## 4. Flutter farmer app — new seams

All require farmer JWT (`aud=app`). Base: `/v1/ai`

### 4.1 Runtime config (pest threshold)

`GET /v1/ai/runtime-config?localeCode=ur&appBuild=1.0.0+1&deviceId=...`

Supports `ETag` / `If-None-Match` → `304` when unchanged.

```json
{
  "data": {
    "pestConfidenceThreshold": 0.55,
    "minAppVersion": "1.0.0",
    "features": { "plantRecheck": true, "hotline": true, "advisory": true },
    "etag": "rc-0.55"
  }
}
```

Also available on public `GET /v1/config` (no auth) — same threshold from DB.

**Wire to:** `pestConfidenceThreshold` in scan controller; poll on app start + after admin threshold change (or use ETag).

---

### 4.2 Device model manifest

`GET /v1/ai/device-model-manifest?kind=pest&deviceId={id}&localeCode=ur&district=multan`

```json
{
  "data": {
    "kind": "pest",
    "modelId": "...",
    "versionId": "...",
    "semver": "1.0.0",
    "artifactUri": "/uploads/models/pest_v1.tflite",
    "sha256": "stub_pest_sha256",
    "sizeBytes": 2048000,
    "inputSpec": { "width": 224, "height": 224, "channels": 3, "format": "RGB" },
    "fallback": false,
    "labelSetId": "..."
  }
}
```

`fallback: true` → keep bundled model (device below rollout cohort).

**Legacy path still works:** `GET /v1/models/manifest`

---

### 4.3 Speech capabilities

`GET /v1/ai/speech/capabilities?modality=tts`  
`GET /v1/ai/speech/capabilities?modality=stt`

TTS:

```json
{
  "data": {
    "voices": [
      { "locale": "ur", "voiceId": "ur-PK-Standard-A" },
      { "locale": "en", "voiceId": "en-US-Standard-A" }
    ],
    "fallbackMap": { "pa": "ur", "skr": "ur", "sd": "ur", "ps": "ur", "bal": "ur" }
  }
}
```

STT:

```json
{
  "data": {
    "supported": ["ur", "en"],
    "localeIdMap": { "en": "en_US", "ur": "ur_PK" }
  }
}
```

---

### 4.4 Review item ingest (low-confidence / cloud recheck)

`POST /v1/ai/review/items`  
Header: `Idempotency-Key: <ingestKey>` (optional; body `ingestKey` also works)

```json
{
  "ingestKey": "det-uuid-lowconf-1",
  "kind": "pest",
  "task": "pest_classification",
  "speciesKey": "aphids",
  "severity": "medium",
  "confidence": 0.52,
  "localeCode": "ur",
  "district": "Multan",
  "consentTraining": false,
  "imageUri": null
}
```

→ `204` on success; idempotent replay → `204`

---

### 4.5 Advisory RAG (server keys only)

`POST /v1/ai/kb/answer`

```json
{ "question": "cotton pest treatment", "locale": "ur" }
```

Response uses `answerKey` + `relatedSpeciesKeys` — render via ARB, never show `answerKey` string as prose.

**Legacy:** `POST /v1/advisory/ask` still works (stub).

---

### 4.6 Consent withdraw + image purge

`POST /v1/ai/consent/withdraw`

```json
{
  "flags": { "imageTraining": false, "analytics": false }
}
```

Purges pending review-item images for farmer; updates consent flags (most-restrictive).

**Also:** `PUT /v1/me/consent` for farmer self-service.

---

### 4.7 AI telemetry alias

`POST /v1/ai/telemetry` — same as `POST /v1/telemetry/batch`  
Requires `X-Consent-Analytics: true` header.

---

## 5. Admin UI route map (suggested)

| Admin page | Primary APIs |
|------------|--------------|
| `/models` | `GET/POST /v1/admin/models`, stage/promote/rollback |
| `/settings/threshold` | `GET/PUT /v1/admin/config/pest-threshold` |
| `/ai/review` | `GET /v1/admin/ai/review/items`, assign/label/adjudicate |
| `/kb` | `GET/POST /v1/admin/kb/sources`, chunks, publish |
| `/analytics` | `GET /v1/admin/analytics/*` |
| `/dsr` | `GET /v1/admin/dsr`, `PATCH /v1/admin/dsr/{id}` |

---

## 6. RBAC quick reference (Phase 3 permissions)

| Permission | Roles |
|------------|-------|
| `models.read` | super_admin, agronomist, ops_officer, auditor |
| `models.register`, `models.stage`, `models.set_threshold` | super_admin, agronomist |
| `models.promote_prod`, `models.rollback`, `models.retire` | super_admin |
| `ai_review.read` | super_admin, agronomist, ops_officer, auditor |
| `ai_review.manage` | super_admin, agronomist |
| `kb.read` | super_admin, agronomist, ops_officer, auditor |
| `kb.edit` | super_admin, agronomist |
| `analytics.read` | super_admin, ops_officer, agronomist, auditor |
| `dsr.read_list` | super_admin, ops_officer, support, auditor |
| `dsr.execute` | super_admin, ops_officer |

---

## 7. Error codes (Phase 3)

| Code | When |
|------|------|
| `out_of_range` | Threshold not in (0, 1) |
| `agronomist_review_required` | KB publish without review flag |
| `invalid_species_key` | Review label not in catalog |
| `ingest_key_required` | Missing ingest key on review POST |
| `not_found` | Model / DSR / review item missing |

---

## 8. Still not implemented

| Feature | Status |
|---------|--------|
| NADRA SSO `POST /v1/admin/auth/sso/callback` | `501` |
| Real TFLite upload / multipart artifact registry | URI + stub SHA only |
| Vector embeddings / pgvector | MySQL text search stub |
| Full eval runs, A/B, drift auto-pause | Future |
| PostgreSQL / RLS | MySQL only |

---

## 9. Test checklist

```bash
npm run db:migrate
npm run db:seed          # optional demo review items
npm run dev

# Phase 3 smoke
node scripts/test-phase3-apis.js

# Phase 1+2 admin
node scripts/test-admin-apis.js
```

**Test logins:** see `DEMO_CREDENTIALS.md`

| Module | Login | Test |
|--------|-------|------|
| Models | `admin@` | List → stage → promote |
| Threshold | `agronomist@` | GET 0.55 → PUT 0.60 |
| AI review | `agronomist@` | List pending → label → adjudicate |
| KB | `agronomist@` | List sources → retrieve dry-run |
| Analytics | `ops@` | Overview + consent |
| DSR | `ops@` | List → PATCH to `processing` |
| Farmer runtime | OTP login | `/v1/ai/runtime-config` + manifest |

---

*Phase 3 backend — model registry, AI review, RAG KB, analytics, DSR queue, `/v1/ai/*` app seams.*
