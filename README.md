# CROWDBYTE: Privacy-Preserving Campus Flow

A sophisticated, real-time spatial intelligence platform for NTU, designed to monitor canteen crowd density while safeguarding student privacy.

## Overview

CROWDBYTE synthesizes privacy-preserving engineering with real-time campus dynamics. It transforms crowdsourced observations into a shared campus resource, using edge-based redaction and anonymized aggregation to ensure individual identity is never compromised.

## Key Features

- **Privacy-First Architecture**: 
  - **Edge-Based Redaction**: Student-uploaded photos are blurred/masked on the client-side before submission.
  - **Privacy Metadata**: Compliant with USENIX 2020 protocols for anonymized movement data.
  - **Live Feed Anonymization**: Real-time previews in the dashboard are blurred to preserve privacy while showing volume trends.
- **Intelligent Canteen Directory**:
  - **Staleness Logic**: Data automatically "decays" and is marked as outdated if no report is received within 120 minutes.
  - **"Request Pulse"**: Interactive prompts for users to update status when data becomes stale.
- **Interactive Campus Collision Map**:
  - Dynamic visual layout of NTU canteens with color-coded crowd indicators.
  - Neutral "Outdated" state for canteens with expired data.
- **Sophisticated Reporting System**:
  - **AI-Assisted Classification**: Simulated AI analysis suggests crowd levels based on uploaded imagery.
  - **Client-Side Compression**: High-resolution images are automatically resized and optimized to stay within database limits.
- **Real-Time Analytics**:
  - Live tracking of report volume and participation.
  - Dynamic "Most Active Canteen" detection based on "High" crowd frequency.

## Technology Stack

### Frontend
- **Framework**: Next.js 16 (App Router)
- **Styling**: Tailwind CSS (Minimalist, Editorial Aesthetic)
- **Animations**: Framer Motion
- **State Management**: React Hooks + Firebase Real-time Listeners

### Backend
- **Framework**: Next.js API Routes (Node.js environment)
- **Database**: Google Cloud Firestore (Firebase)
- **AI Inference**: Google Gemini 1.5 Flash API (Vision-to-Status pipeline)
- **Security**: In-memory Rate Limiting (3 reports per 5 minutes per user)
- **Validation**: Pydantic models for strict data integrity
- **Archiecture**: Serverless Edge Functions handling secure API calls and prompt engineering.

## Project Structure

```
SC4052-Project/
├── frontend/               # Next.js Application
│   ├── app/                # App Router (Pages, Layouts, CSS)
│   ├── lib/                # Constants, Firebase Client, Utils
│   └── public/             # Static Assets
├── backend/                # FastAPI Application
│   ├── api/                # Route definitions
│   ├── logic/              # Rate limiting, Crowd calculations
│   ├── routes/             # Endpoint implementations
│   ├── database.py         # Firebase initialization
│   ├── main.py             # Entry point
│   ├── models.py           # Pydantic Schemas
│   └── requirements.txt    # Python dependencies
└── README.md
```

## Getting Started

### Prerequisites
- Node.js (v18+)
- Python 3.10+
- Firebase Project with Firestore enabled

### 1. Backend Setup
1. Place your `firebase-key.json` in the `backend/` directory.
2. Configure environment:
   ```bash
   cd backend
   python -m venv .venv
   source .venv/Scripts/activate # Windows: .venv\Scripts\activate
   pip install -r requirements.txt
   ```
3. Initialize the database:
   ```bash
   python setup_collections.py
   python update_canteens.py
   ```
4. Start the API:
   ```bash
   python main.py
   ```
   API available at `http://localhost:8000`.

### 2. Frontend Setup
1. Configure `.env.local` with your Firebase credentials.
2. Install and run:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   Open `http://localhost:3000`.

## Privacy Protocol

CROWDBYTE operates under a strict privacy manifesto:
1. **Redaction**: All facial data is masked at the edge.
2. **Ephemerality**: Raw imagery is purged immediately after processing.
3. **Anonymization**: Crowd levels are decoupled from individual identities.
4. **Differential Privacy**: Statistical noise is used to prevent pattern-matching of student schedules.

---
© 2026 CROWDBYTE • Designed with technical rigour and ethical intention for Nanyang Technological University.
