# CROWDBYTE — Privacy‑Preserving Campus Flow (CFaaS)

**CROWDBYTE** is a "Campus-Flow-as-a-Service" (CFaaS) platform designed for real-time, crowdsourced crowd sensing of campus canteens. Built for a Cloud Computing context, it leverages a hybrid serverless-and-API architecture to provide live spatial intelligence while maintaining strict user anonymity through edge-based redaction and ephemeral data lifecycles.

## Cloud Computing Architecture

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

## AI-Powered Crowd Sensing

CROWDBYTE integrates an advanced Vision AI pipeline:

- **Model**: OpenAI GPT-4o Vision API.
- **Trigger**: Automatic invocation when a user uploads an image without manually selecting a crowd level.
- **Output**: The model returns a JSON response containing:
  - `crowd_level`: (Low, Medium, High)
  - `ai_confidence`: Numerical score (0-100)
  - `ai_reasoning`: Brief contextual explanation of the classification.
- **Fallback**: A client-side "Simulation Mode" (deterministic heuristic) provides instant UX feedback when AI inference is pending or unavailable.

## Privacy & Security Manifest

Aligning with modern privacy protocols (e.g., USENIX 2020), CROWDBYTE decouples identity from spatial analytics:

- **Anonymized Reporting**: No authentication required; users are represented by ephemeral `anon_user` tokens.
- **Edge-Based Redaction**: All PII (faces, IDs) in photos are visually masked via client-side simulation.
- **Data Decay (Staleness)**: Cloud data is considered "stale" after **120 minutes**. The UI automatically invalidates outdated reports to prevent reliance on stale tracking.
- **Ephemeral Lifecycle**: Original high-res imagery is never stored; only compressed, blurred, and anonymized previews are retained in cloud storage.

## API Endpoints (v1)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/canteens/status` | Aggregated real-time status for all canteens. |
| `GET` | `/api/v1/canteens/{id}` | Detailed status and metadata for a specific canteen. |
| `POST` | `/api/v1/report` | Submit a report (Manual or AI-assisted). |
| `GET` | `/api/v1/health` | Service health check. |

## 🚀 Quick Start

For detailed setup instructions, see the [documentation folder](documentation/README.md):

- **Getting started?** → [PHASE_1_QUICK_START](documentation/phases/PHASE_1_QUICK_START.md)
- **Deploying?** → [DEPLOYMENT_QUICK_START](documentation/deployment/DEPLOYMENT_QUICK_START.md)  
- **Full architecture?** → [BACKEND_DEVELOPMENT_PLAN](documentation/planning/BACKEND_DEVELOPMENT_PLAN.md)

## 🏗️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 16, React, Tailwind CSS, Vercel |
| **Backend** | FastAPI, Python 3.10+, Uvicorn |
| **Database** | Firebase Firestore (NoSQL) |
| **Storage** | Firebase Storage (Images) |
| **AI/ML** | OpenAI GPT-4o Vision API |
| **Infrastructure** | Docker, Docker Compose, Vercel, GitHub Actions |

## 📦 Project Structure

```
SC4052-Project/
├── frontend/              # Next.js app (deployed on Vercel)
├── backend/               # FastAPI service
├── scripts/               # Deployment & setup scripts
├── documentation/         # All guides & specifications
└── README.md              # This file
```
