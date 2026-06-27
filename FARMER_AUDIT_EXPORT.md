# Farmer Audit Log & CSV Export — Frontend Integration

**Audience:** React admin panel  
**Base:** `http://localhost:5000/v1/admin`  
**Migration:** `migrate009AdminAuditLogs.js` (run `npm run db:migrate`)

Append-only **farmer action trail** + **CSV export** for the farmers list.

---

## 1. What is farmer audit log?

Har admin action jo kisi **farmer** ko change kare — suspend, profile edit, consent, OTP, DSR, detection delete — `admin_audit_logs` table mein save hoti hai.

- **Read-only** — koi UPDATE/DELETE API nahi
- Phone numbers **details JSON mein masked** hain
- Logging fail ho to bhi main action succeed hota hai

**Note:** Global hash-chain audit (`GET /audit`) alag hai — yeh farmer-focused trail hai.

---

## 2. New APIs

### 2.1 Farmer audit log (detail tab)

```
GET /v1/admin/farmers/{id}/audit-log?page=1&page_size=50
```

| | |
|--|--|
| **Permission** | `farmers.read_single` |
| **UI** | Farmer detail → **Audit log** tab |

**Response:**

```json
{
  "data": {
    "items": [
      {
        "id": "uuid",
        "farmer_id": "uuid",
        "admin_user_id": "uuid",
        "admin_name": "Super Admin",
        "admin_email": "admin@aasan.kisan",
        "admin_role": "super_admin",
        "action": "edit_profile",
        "details": {
          "before": { "name": "Muhammad Aslam", "district": "Lahore" },
          "after": { "name": "Muhammad Aslam", "district": "Multan" }
        },
        "ip_address": "::1",
        "created_at": "2026-06-27T10:00:00.000Z"
      }
    ],
    "total": 12,
    "page": 1,
    "page_size": 50
  }
}
```

---

### 2.2 Global farmer audit log

```
GET /v1/admin/audit-log?farmer_id=&admin_user_id=&action=&date_from=&date_to=&page=&page_size=
```

| | |
|--|--|
| **Permission** | `audit.read` (auditor, super_admin, ops with audit) |
| **UI** | Optional: Audit → **Farmer actions** sub-view, or sidebar link |

**Query params:**

| Param | Example |
|-------|---------|
| `farmer_id` | filter one farmer |
| `admin_user_id` | filter by admin |
| `action` | `suspend`, `edit_profile`, … |
| `date_from` | `2026-06-01` or ISO datetime |
| `date_to` | `2026-06-30` |
| `page`, `page_size` | pagination |

Extra field on items: `farmer_name`

---

### 2.3 Export farmers CSV

```
GET /v1/admin/farmers/export?phone=&district=&consent=&identity_status=&account_status=&sync=&sort=
```

| | |
|--|--|
| **Permission** | `farmers.read_list` (same as list) |
| **Response** | Raw CSV file (not JSON envelope) |

**Headers:**

```
Content-Type: text/csv; charset=utf-8
Content-Disposition: attachment; filename="farmers-export-{timestamp}.csv"
```

**CSV columns:**

`id`, `full_name`, `phone`, `district`, `identity_status`, `account_status`, `consent_analytics`, `consent_training`, `created_at`

**Phone column:**

- Default: **masked** (`0300****567`) — same as list view
- Full phone: only if `farmers.read_pii` + header `X-Access-Reason: ticket-123`

**Filters:** Same query params as `GET /farmers` (no pagination — max 10,000 rows).

**Frontend example:**

```ts
const qs = new URLSearchParams({ district: "Multan", consent: "analytics" });
const res = await fetch(`${API}/v1/admin/farmers/export?${qs}`, {
  headers: { Authorization: `Bearer ${token}` },
});
const blob = await res.blob();
// trigger download with <a download="farmers.csv">
```

---

## 3. Logged actions (action values)

| `action` | Trigger |
|----------|---------|
| `edit_profile` | PATCH `/farmers/{id}` |
| `consent_override` | PUT `/farmers/{id}/consent` |
| `resend_otp` | POST `/farmers/{id}/resend-otp` |
| `suspend` | POST `/farmers/{id}/suspend` |
| `unsuspend` | POST `/farmers/{id}/unsuspend` |
| `force_erase` | POST `/farmers/{id}/force-erase` |
| `create_farmer` | POST `/farmers` |
| `add_note` | POST `/farmers/{id}/notes` |
| `revoke_session` | POST `/farmers/{id}/sessions/revoke` |
| `delete_detection` | DELETE `/detections/{id}` |
| `file_dsr` | POST `/farmers/{id}/dsr` |
| `dsr_status_change` | PATCH `/dsr/{request_id}` |

Use these strings for filter dropdowns on global audit log.

---

## 4. Suggested UI

### Farmers list page

- **Export CSV** button next to filters → `GET /farmers/export` with current filter state
- Same filters as list (phone, district, consent, etc.)

### Farmer detail

- New tab: **Audit log** → table: When | Admin | Role | Action | Details (expand JSON)
- Optional: link action `delete_detection` → detections tab

### Global (optional)

- **Audit log → Farmer actions** → `GET /audit-log` with filters
- Distinct from existing **Audit** page (`GET /audit`) which is system-wide hash-chain log

---

## 5. Permissions summary

| API | Permission |
|-----|------------|
| `GET /farmers/{id}/audit-log` | `farmers.read_single` |
| `GET /audit-log` | `audit.read` |
| `GET /farmers/export` | `farmers.read_list` |

| Role | Audit log | Export |
|------|-----------|--------|
| support | farmer tab ✅ | ✅ |
| ops_officer | farmer tab ✅ | ✅ |
| auditor | farmer tab ✅, global ✅ | ✅ |
| super_admin | all ✅ | ✅ |

---

## 6. Test

After migrate, perform any farmer action (e.g. edit profile), then:

```
GET /v1/admin/farmers/{id}/audit-log
```

Should show new row with `action: "edit_profile"`.

Export:

```
GET /v1/admin/farmers/export
```

Browser should download CSV.

---

*See also `FARMER_ADMIN_CONTROLS.md` for all farmer admin APIs.*
