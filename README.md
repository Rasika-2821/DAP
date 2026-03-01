
# Digital Address Project - Proof of Concept

A full-stack proof of concept for the Digital Address Project (DAP), featuring:

1. **DIGIPIN Generation** - Converting lat/long to a 10-character geospatial code
2. **Digital Address Creation** - Linking human-friendly addresses to DIGIPINs
3. **Consent-Based Authorization** - Privacy-first data access workflow
4. **Address Resolution** - Wrapping data with authorization tokens
5. **Activity Logs** - Track all user actions (create, access, revoke, verify)

## Architecture Overview

**Frontend:** React + TypeScript (Vite, Tailwind, ShadCN UI)

**Backend:** FastAPI (Python), SQLAlchemy ORM, JWT Auth

**Database:** SQLite (default) or PostgreSQL

## Quick Start

### Backend
1. Install dependencies:
  ```bash
  cd Code/backend
  pip install -r requirements.txt
  ```
2. Copy `.env.example` to `.env` and update as needed.
3. Run the backend:
  ```bash
  python -m app.main
  ```
4. API docs: http://localhost:8001/docs

### Frontend
1. Install dependencies:
  ```bash
  cd Code/address-agent-central-main
  npm install
  ```
2. Copy `.env.example` to `.env` and update as needed.
3. Run the frontend:
  ```bash
  npm run dev
  ```
4. Open http://localhost:5173

## Project Structure

```
dap_poc/
├── Code/
│   ├── backend/           # FastAPI backend
│   └── address-agent-central-main/  # React frontend
└── README.md
```

## Key Backend API Endpoints (v1)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/addresses/` | GET/POST | List or create addresses |
| `/api/v1/addresses/{id}` | PUT/DELETE | Update or delete address |
| `/api/v1/consent/request-consent` | POST | AIU requests access |
| `/api/v1/activity-logs/` | GET | Get user activity logs |
| `/api/v1/addresses/generate-digipin` | POST | Convert lat/long → DIGIPIN |

## Activity Logs

All user actions (address creation, consent, verification, etc.) are logged and viewable in the frontend under Activity Logs.

## API Endpoints Breakdown

### DIGIPIN APIs
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/addresses/generate-digipin` | POST | Convert lat/long → DIGIPIN |

### User & Address APIs
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/auth/register` | POST | Register new user |
| `/api/v1/auth/login/access-token` | POST | Login for access token |
| `/api/v1/addresses/` | POST | Create Digital Address |
| `/api/v1/addresses/{id}` | GET | Get address details |

### Consent APIs
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/consent/request-consent` | POST | AIU requests access |
| `/api/v1/consent/pending-consents` | GET | List pending requests |
| `/api/v1/consent/approve-consent` | POST | User approves request |
| `/api/v1/consent/revoke-consent` | POST | Revoke active consent |

### Resolution API
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/consent/resolve-address` | POST | Resolve address with token |

## Demo Workflow

### Step 1: Generate DIGIPIN
```bash
curl -X POST http://localhost:8001/api/v1/addresses/generate-digipin \
  -H "Content-Type: application/json" \
  -d '{"latitude": 28.6139, "longitude": 77.2090}'
```

Response:
```json
{
  "success": true,
  "digipin": "J77LKMC4F6",
  "grid_info": {
    "center": {"latitude": 28.6139, "longitude": 77.2090},
    "precision_meters": {"lat": 3.8, "lon": 3.2}
  }
}
```

### Step 2: Create Address (requires Auth)
```bash
# First get token
curl -X POST http://localhost:8000/api/v1/auth/login/access-token \
  -d "username=user@dap.in&password=dap123"

# Use token in Header
curl -X POST http://localhost:8000/api/v1/addresses/ \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "label": "home",
    "digipin": "CHARSET-ENCODED",
    "latitude": 28.6139,
    "longitude": 77.2090
  }'
```

### Step 3: Request Consent (as AIU)
```bash
curl -X POST http://localhost:8000/api/v1/consent/request-consent \
  -H "Content-Type: application/json" \
  -d '{
    "aiu_name": "LogisticsApp",
    "address_label": "dapuser@home",
    "purpose": "DELIVERY",
    "scope": ["digipin", "city", "pincode"]
  }'
```

### Step 4: Approve Consent (as User)
```bash
curl -X POST http://localhost:8000/api/v1/consent/approve-consent \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "request_id": "CR-000001",
    "approved": true
  }'
```

### Step 5: Resolve Address (as AIU with token)
```bash
curl -X POST http://localhost:8000/api/v1/consent/resolve-address \
  -H "Content-Type: application/json" \
  -d '{
    "token": "<AUTH_TOKEN_STRING>",
    "address_label": "dapuser@home"
  }'
```

Response (wrapped data):
```json
{
  "success": true,
  "da_label": "rahul@home",
  "digipin": "J77LKMC4F6",
  "descriptive_address": {
    "city": "New Delhi",
    "pincode": "110001"
  },
  "resolved_at": "2025-12-03T10:30:00",
  "token_id": "token-abc"
}
```

## Key Concepts Demonstrated

### 1. DIGIPIN Algorithm
- 10-character alphanumeric code
- 16-character set: `{2,3,4,5,6,7,8,9,C,F,J,K,L,M,P,T}`
- Hierarchical 4x4 grid subdivision
- ~4m x 4m precision at level 10

### 2. Privacy by Design
- **Default Deny**: No data shared without explicit consent
- **Granular Scope**: Users control which fields to share
- **Time-Bound Tokens**: Authorization expires automatically
- **Revocable Consent**: Users can revoke access anytime

### 3. Federated Architecture
- AIP holds data but can't share without token
- AIA manages consent but doesn't hold address data
- CM (simulated) provides discovery without storing data

## Limitations (PoC Only)
- In-memory storage (no persistence)
- Simplified authentication (no real OTP)
- Single-node (no actual federation)
- No TLS/encryption (development mode)
- No rate limiting

---

**Author**: Digital Address Project PoC  
**Based on**: DAP Technical Architecture Document
