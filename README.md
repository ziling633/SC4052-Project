# CROWDBYTE — Privacy‑Preserving Campus Flow

CROWDBYTE is a Next.js + Firebase + FastAPI project for crowdsourced canteen crowd sensing, with a privacy-preserving UX (blurred previews, anonymized aggregation, and staleness handling for outdated data).

## Architecture (current repo)

- **Frontend**: Next.js (App Router) + Tailwind CSS + Framer Motion  
  - Real-time UI is driven by Firestore listeners on `reports` (Directory, Map, Canteen modal, Privacy feed).
  - Report submission uses a custom dropzone + client-side image compression before sending to the backend.
- **Backend**: FastAPI (Python)  
  - REST endpoints under `/api/v1` (see below).
  - Validates report `canteen_id` against the `canteens` collection and writes `reports` documents.
  - In-memory rate limit for report submission.
- **Database**: Firebase Firestore  
  - Collections used: `canteens`, `reports`.

## Firestore Collections (as used by code)

- **canteens** documents (document ID is a string canteen id)  
  - Fields used: `name`, `location`, `lat`, `lng`, `lastUpdated` (seeded by scripts)
- **reports** documents  
  - Fields written by backend: `canteen_id`, `canteen_name`, `crowd_level`, `source`, `timestamp`, `user_id`  
  - Optional image fields: `image_name`, `image_type`, `image_size`, `image_preview` (base64 data URL)

## Backend Endpoints

Defined in [canteens.py](backend/routes/canteens.py) and [reports.py](backend/routes/reports.py):

- `GET /api/v1/canteens/status` — aggregated status for all canteens
- `GET /api/v1/canteens/{canteen_id}` — aggregated status for a single canteen
- `POST /api/v1/report` — submit a report (optional image metadata)
- `GET /api/v1/health` — health check

## Frontend Features (implemented)

- **Directory + Map from `reports`**: Directory and map use the latest `reports` per `canteen_id`.
- **Staleness**: If the last report is older than 2 hours, canteens are treated as outdated (Directory shows “Update Status”; Map markers are neutral).
- **Update Status flow**: Clicking “Update Status” scrolls to Submit Report and pre-selects the chosen canteen.
- **Premium controls**: Custom dropdowns (no native `<select>`), custom dashed-border file dropzone, tactile hover states, and skeleton loaders.
- **Map interactions**: Hover tooltips for “last updated”, and a ping effect for “High” crowd markers.
- **Analytics**: “Live report entries” counts up on in-view.
- **Reveal on scroll**: Major sections use `FadeInReveal` ([FadeInReveal.js](frontend/app/FadeInReveal.js)).

## Privacy-Preserving Architecture (USENIX 2020 Alignment)
CROWDBYTE is engineered with a strict privacy manifesto to decouple spatial analytics from individual identities:

- **Edge-Based Redaction**: All facial data and PII in user-submitted photos are masked via client-side simulation before processing.

- **Ephemeral Storage**: Raw imagery is purged immediately; only abstract crowd density indices (Low/Medium/High) are retained in the database.

- **Staleness Invalidation**: Data automatically decays after 120 minutes, forcing a neutral state to prevent reliance on outdated tracking.

## Local Development

### Prerequisites

- Node.js (for frontend)
- Python 3.x (for backend)
- A Firebase project with Firestore enabled
- A Firebase Admin service-account JSON key

### Backend (FastAPI)

1. Put your service account key JSON at `backend/firebase-key.json` (default) or set `FIREBASE_CREDENTIALS` in `backend/.env` to the key path.
2. Install and run:

```bash
cd backend
python -m venv .venv
.venv\\Scripts\\activate
pip install -r requirements.txt
python main.py
```

- API: `http://localhost:8000`
- Docs: `http://localhost:8000/docs`

Optional data scripts in `backend/`:

- `python setup_collections.py` — initializes canteens (if empty) + adds a sample report
- `python update_canteens.py` — upserts a fuller canteen set + updates report `canteen_name` for selected canteens
- `python populate.py` — populates sample reports

### Frontend (Next.js)

```bash
cd frontend
npm install
npm run dev
```

- Web: `http://localhost:3000`

Firebase Web config is currently in [firebaseClient.js](frontend/lib/firebaseClient.js).

## Notes / Non-integrated code

- `backend/api/analyze-crowd/route.js` exists as a Node route that references Google Generative AI; it is not wired into the current frontend flow.
