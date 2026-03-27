# SC4052-Project

## CrowdByte: NTU Crowd Monitoring

A sophisticated web application exploring the intersection of architecture, human behavior, and academic spaces through real-time canteen crowd monitoring.

### Features

- **Elegant Design**: High-end, gallery-like interface with sophisticated typography and curated visual elements
- **Real-time Monitoring**: Live crowd level updates across 8 NTU canteens
- **Interactive Map**: Visual campus layout with dynamic crowd indicators
- **AI Simulation**: Mock AI image analysis for crowd density detection
- **Analytics Dashboard**: Administrative insights into usage patterns
- **Responsive**: Optimized for all device sizes

### Technology Stack

- **Frontend**: Vanilla HTML/CSS/JavaScript with Vite
- **Styling**: Custom CSS with Google Fonts (Playfair Display, Crimson Text, Inter, Space Mono)
- **Data Storage**: Browser localStorage
- **Build Tool**: Vite

### Project Structure

```
SC4052-Project/
├── frontend/           # Main application
│   ├── index.html
│   ├── style.css
│   ├── script.js
│   ├── package.json
│   └── package-lock.json
├── backend/            # FastAPI server (future)
│   ├── main.py
│   └── requirements.txt
├── .gitignore
└── README.md
```

### Running the Application

#### Frontend (Required)

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` (or the port shown in terminal).

#### Backend (Optional - Future API integration)

```bash
cd backend
python -m venv .venv
source .venv/Scripts/activate    # Windows
# or: source .venv/bin/activate   # macOS/Linux
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

API available at `http://localhost:8000`.

### Design Philosophy

This application explores how physical environments shape human behavior in academic settings. The sophisticated design reflects the thoughtful curation of space and time in educational institutions.

### Navigation

- **Home**: Landing page with curated content sections
- **Dashboard**: Real-time canteen monitoring with interactive map
- **Submit Report**: Crowd level reporting with AI simulation
- **Admin**: Analytics and usage insights

### Development Notes

- All functionality preserved from original prototype
- localStorage maintains report data between sessions
- No external dependencies beyond development tools
- Fully responsive design with mobile optimization


## NTU Crowd Monitoring MVP

A simple crowdsourced canteen crowd monitoring web app.

### Run locally

1. Open `index.html` in a browser (or serve folder with a local static server).
2. Use the top navigation to go to Dashboard and Submit Report.

### Features

- Landing/Cover page matching screenshot style
- Dashboard with 8 canteens and color-coded crowd levels
- Report form stores data in browser `localStorage`
- Image upload auto-suggests level via simulated AI rule
- Dashboard refreshes after report submission and periodically
