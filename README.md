# CROWDBYTE — Privacy‑Preserving Campus Flow (CFaaS)

**CROWDBYTE** is a "Campus-Flow-as-a-Service" (CFaaS) platform designed for real-time, crowdsourced crowd sensing of campus canteens. Built for a Cloud Computing context, it leverages a hybrid serverless-and-API architecture to provide live spatial intelligence while maintaining strict user anonymity through edge-based redaction and ephemeral data lifecycles.

## ☁️ Cloud Computing Architecture

The project implements a modern, decoupled cloud architecture:

- **Frontend (Edge/Client Layer)**: Next.js (App Router) + Tailwind CSS + Framer Motion. 
  - Performs **Edge-based processing**: Images are compressed and redacted client-side using HTML5 Canvas before transmission.
  - **Real-time Synchronization**: Leverages Firebase Firestore's `onSnapshot` (WebSockets/GRPC) for live UI updates without polling.
- **Backend (API Gateway Layer)**: FastAPI (Python).
  - Acts as a **Stateless Orchestrator** between the client, cloud database, and external AI services.
  - **Rate Limiting**: Implements IP-and-Canteen-based in-memory throttling to prevent DDoS and spam on cloud resources.
  - **AI Integration**: Orchestrates server-side Vision AI inference via external LLM APIs.
- **Cloud Database (State Layer)**: Firebase Firestore.
  - NoSQL document store for real-time data persistence.
  - **Aggregation-on-Read**: Crowd levels are dynamically computed during API calls to ensure fresh metrics.
- **Cloud Storage (Object Layer)**: Firebase Storage.
  - Stores anonymized, privacy-filtered preview images with secure public URLs.

## 🤖 AI-Powered Crowd Sensing

CROWDBYTE integrates an advanced Vision AI pipeline:

- **Model**: OpenAI GPT-4o Vision API.
- **Trigger**: Automatic invocation when a user uploads an image without manually selecting a crowd level.
- **Output**: The model returns a JSON response containing:
  - `crowd_level`: (Low, Medium, High)
  - `ai_confidence`: Numerical score (0-100)
  - `ai_reasoning`: Brief contextual explanation of the classification.
- **Fallback**: A client-side "Simulation Mode" (deterministic heuristic) provides instant UX feedback when AI inference is pending or unavailable.

## 🛡️ Privacy & Security Manifest

Aligning with modern privacy protocols (e.g., USENIX 2020), CROWDBYTE decouples identity from spatial analytics:

- **Anonymized Reporting**: No authentication required; users are represented by ephemeral `anon_user` tokens.
- **Edge-Based Redaction**: All PII (faces, IDs) in photos are visually masked via client-side simulation.
- **Data Decay (Staleness)**: Cloud data is considered "stale" after **120 minutes**. The UI automatically invalidates outdated reports to prevent reliance on stale tracking.
- **Ephemeral Lifecycle**: Original high-res imagery is never stored; only compressed, blurred, and anonymized previews are retained in cloud storage.

## 📡 API Endpoints (v1)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/canteens/status` | Aggregated real-time status for all canteens. |
| `GET` | `/api/v1/canteens/{id}` | Detailed status and metadata for a specific canteen. |
| `POST` | `/api/v1/report` | Submit a report (Manual or AI-assisted). |
| `GET` | `/api/v1/health` | Service health check. |

## 🚀 Local Development

### Prerequisites
- Node.js (v18+)
- Python 3.10+
- Firebase Project with Firestore & Storage enabled
- OpenAI API Key (for Vision features)

### Backend Setup
1. Create a `.env` file in `backend/` with:
   ```env
   FIREBASE_CREDENTIALS=firebase-key.json
   OPENAI_API_KEY=your_key_here
   PORT=8000
   ENV=development
   ```
2. Place your Firebase Service Account JSON as `backend/firebase-key.json`.
3. Install dependencies and run:
   ```bash
   cd backend
   pip install -r requirements.txt
   python main.py
   ```

### Frontend Setup
1. Create a `.env.local` in `frontend/` with:
   ```env
   NEXT_PUBLIC_API_BASE=http://localhost:8000/api/v1
   ```
2. Run development server:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

## 📊 Database Scripts
- `setup_collections.py`: Initializes the `canteens` collection with NTU metadata.
- `populate.py`: Generates sample historical data for testing aggregation.
- `seed_canteen_crowd_levels.py`: Seeds randomized initial states for UI testing.
