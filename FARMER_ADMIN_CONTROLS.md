# Farmer Admin Controls — Frontend Integration

**Audience:** React admin panel  
**Base:** `http://localhost:5000/v1/admin`  
**Migration:** `npm run db:migrate` (applies `migrate008FarmerAdminControls.js`)

Phase A/B/C farmer controls — wire these on **Farmers list** and **Farmer detail** pages.

---

## Phase A — enriched reads (no new buttons API-wise)

### List filters — `GET /v1/admin/farmers`

| Query | Values |
|-------|--------|
| `phone` | partial phone |
| `district` | text |
| `consent` | `analytics` \| `training` \| `limited` |
| `identity_status` | `verified` \| `unverified` |
| `account_status` | `active` \| `suspended` |
| `sync` | `pending` \| `failed` |
| `sort` | `created_at` (default) \| `name` \| `detections` |
| `page`, `page_size` | pagination |

List item now includes `account_status`.

### Detail — `GET /v1/admin/farmers/{id}`

New fields in `data`:

```json
{
  "account_status": "active",
  "identity": { "status": "verified", "masked_cnic": "35202-*******-1", "verified_at": "..." },
  "dsr_history": [{ "request_id", "type", "status", "created_at", ... }],
  "sync_summary": { "synced": 10, "pending": 1, "failed": 0 },
  "cloud_recheck_pending": 2,
  "cloud_recheck_queue_path": "/cloud-recheck?farmerId={id}",
  "detections": [{
    "needs_cloud_recheck": true,
    "cloud_recheck_path": "/cloud-recheck?highlight={detectionId}"
  }]
}
```

**UI:** CNIC badge from `identity.status`. DSR table from `dsr_history`. Link buttons use `cloud_recheck_*_path` (React routes).

---

## Phase B — support actions

| Action | Method | Path | Permission | Step-up |
|--------|--------|------|------------|---------|
| Edit profile | PATCH | `/farmers/{id}` | `farmers.edit_profile` | no |
| Consent override | PUT | `/farmers/{id}/consent` | `farmers.consent_override` | **yes** |
| List notes | GET | `/farmers/{id}/notes` | `farmers.notes.read` | no |
| Add note | POST | `/farmers/{id}/notes` | `farmers.notes.write` | no |
| List sessions | GET | `/farmers/{id}/sessions` | `farmers.sessions.read` | no |
| Revoke sessions | POST | `/farmers/{id}/sessions/revoke` | `farmers.sessions.revoke` | no |
| Delete detection | DELETE | `/detections/{id}` | `detections.delete` | **yes** |

**PATCH profile body:** `{ "name", "district", "locale_code" }` (any subset)

**PUT consent body:** `{ "consentFlags": { "analytics": true, "imageTraining": false }, "reason": "ticket-1042" }`

**POST note body:** `{ "body": "Called farmer, OTP resent", "ticket_id": "1042" }`

**POST revoke body:** `{ "allDevices": true }` OR `{ "deviceId": "uuid" }`

---

## Phase C — sensitive ops

| Action | Method | Path | Permission | Step-up |
|--------|--------|------|------------|---------|
| Suspend | POST | `/farmers/{id}/suspend` | `farmers.suspend` | **yes** |
| Unsuspend | POST | `/farmers/{id}/unsuspend` | `farmers.unsuspend` | no |
| Force erase | POST | `/farmers/{id}/force-erase` | `farmers.force_erase` | **yes** |
| Create farmer | POST | `/farmers` | `farmers.create` | no |

**Suspend body:** `{ "reason": "abuse report #99" }` — revokes all sessions; login blocked (`ACCOUNT_SUSPENDED`).

**Force erase body:** `{ "reason": "legal erasure order", "confirm": "{farmer-uuid}" }` — immediate tombstone (same as farmer self-delete).

**Create farmer body:**

```json
{
  "phone": "03009998877",
  "name": "Ali Raza",
  "district": "Multan",
  "locale_code": "ur",
  "consent": { "analytics": false, "imageTraining": false }
}
```

Returns `201` with `phone_masked`. Farmer logs in via OTP on first use.

---

## Suggested UI layout (Farmer detail)

1. **Profile card** — add CNIC badge, account status badge, edit button (PATCH)
2. **Consent card** — override toggle (PUT + reason modal, step-up)
3. **DSR history** table (from GET detail)
4. **Sync summary** chips
5. **Notes** thread + add form (GET/POST notes)
6. **Sessions** list + “Logout all devices” (POST revoke)
7. **Detections** — link on `needs_cloud_recheck`; delete icon (DELETE, step-up)
8. **Danger zone** — Suspend / Unsuspend / Force erase (confirm dialogs)

**Farmers list:** filter dropdowns + “Add farmer” button (POST `/farmers`).

---

## Roles (summary)

| Role | Typical farmer controls |
|------|-------------------------|
| `support` | read, edit profile, notes, sessions, consent override, DSR, OTP |
| `ops_officer` | + suspend/unsuspend, create farmer |
| `super_admin` | + force erase, detection delete |
| `auditor` | read-only + notes read |

---

## Test

```bash
npm run db:migrate
node scripts/test-farmer-admin-apis.js
```

---

*See also `ADMIN_FRONTEND_INTEGRATION.md` §6.2 for base farmer APIs (OTP, DSR file).*
