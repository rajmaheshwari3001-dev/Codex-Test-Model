# Aaroh-Saarthi

**Public Transit Route Assistant & Intelligent Fleet Coordination**

A full-stack web application that helps passengers find public transport routes and enables operators to evaluate fleet disruption responses.

## Quick Start (Windows 11 PowerShell)

### Prerequisites

- Python 3.10+ installed and on PATH
- Node.js 18+ installed and on PATH
- npm (comes with Node.js)

### 1. Backend Setup

```powershell
cd backend

# Create a virtual environment
python -m venv .venv

# Activate it
.venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Start the backend server
python -m uvicorn app.main:app --reload --port 8000
```

The backend is now running at **http://localhost:8000**

API docs: **http://localhost:8000/docs**

### 2. Frontend Setup (new terminal)

```powershell
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

The frontend is now running at **http://localhost:5173**

### 3. Run Backend Tests

```powershell
cd backend
.venv\Scripts\Activate.ps1
python -m pytest tests/ -v
```

### 4. Stop the Servers

Press `Ctrl+C` in each terminal window.

## Features

### Module A: Passenger Route Assistant

- Select origin/destination stops and departure time
- Find fastest and cheapest routes (schedule-aware)
- View routes on an interactive Leaflet map
- See transfer details, estimated duration, and fares
- Delay-aware routing with simulated disruptions
- Crowding indicators when occupancy data is available
- Save, reopen, and delete frequently used routes
- Chat assistant for transport questions (intent-based)
- Clear data provenance labels (scheduled/simulated)

### Module B: Fleet Intelligence

- View simulated bus fleet with status, occupancy, delays
- Trigger disruptions (bus breakdown, delay)
- Compare baseline vs response options with calculated metrics
- Approve or reject proposed responses
- See trade-offs and recommendation explanations

## Technology Stack

| Layer    | Technology                                      |
|----------|------------------------------------------------|
| Frontend | React, TypeScript, Vite, Tailwind CSS, Leaflet |
| Backend  | Python, FastAPI, Uvicorn                        |
| Routing  | NetworkX, custom schedule-aware algorithm        |
| Database | SQLite (saved routes)                           |
| Testing  | Pytest (49 tests)                               |
| Data     | Synthetic CSV dataset (15 stops, 4 routes)      |

## Project Structure

```
aaroh-saarthi/
├── backend/
│   ├── app/
│   │   ├── api/          # FastAPI route handlers
│   │   ├── models/       # Pydantic data models
│   │   ├── services/     # Business logic (routing, fleet, chat)
│   │   ├── database/     # SQLite connection & init
│   │   ├── data/         # CSV dataset files
│   │   ├── config.py     # Environment configuration
│   │   └── main.py       # Application entry point
│   ├── tests/            # Pytest test suite
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/   # React UI components
│   │   ├── pages/        # Page-level components
│   │   ├── services/     # API client
│   │   ├── types/        # TypeScript interfaces
│   │   └── styles/       # Tailwind CSS
│   └── package.json
├── docs/                 # Project documentation
├── .env.example
└── .gitignore
```

## Dataset

The demo uses a **synthetic** transit network with:
- 15 stops with Delhi-area coordinates
- 4 bus routes (Blue Line, Green Line, Red Ring, Yellow Express)
- 19 trips with weekday/weekend schedules
- Zone-based fares (₹10–₹30)
- Sample occupancy data

**All data is fictional.** See `backend/app/data/README.md` for details.

## Known Limitations

- Dataset is small and synthetic – not a real transit system
- No real-time GPS tracking or live feed integration
- Chat uses keyword-based intent detection (no LLM in V1)
- Fleet simulation uses simplified deterministic models
- Delays and occupancy are static simulated values
- No user authentication (hackathon prototype)
- No mobile app (web-only)

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `ModuleNotFoundError` | Activate the virtual environment: `.venv\Scripts\Activate.ps1` |
| Frontend shows "Failed to load" | Ensure the backend is running on port 8000 |
| Map not loading | Check internet connection (OpenStreetMap tiles need connectivity) |
| Port already in use | Change the port: `--port 8001` for backend, edit `vite.config.ts` for frontend |
| Python not found | Install Python from python.org and ensure it's on PATH |

## Documentation

- [Architecture](docs/ARCHITECTURE.md) – System design and component overview
- [API Reference](docs/API_REFERENCE.md) – All API endpoints with examples
- [Data Dictionary](docs/DATA_DICTIONARY.md) – Dataset field descriptions
- [Learning Guide](docs/LEARNING_GUIDE.md) – Educational walkthrough
- [Testing Guide](docs/TESTING_GUIDE.md) – How to run and write tests
- [Team Responsibilities](docs/TEAM_RESPONSIBILITIES.md) – 4-member team plan

## License

Hackathon prototype – educational use.
