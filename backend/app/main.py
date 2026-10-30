"""
Aaroh-Saarthi – main application entry point.

This file:
  1. Creates the FastAPI app.
  2. Loads transport data from CSV files.
  3. Initialises the database.
  4. Creates the routing engine and fleet simulator.
  5. Registers all API routers.
  6. Enables CORS so the React frontend can call the backend.

RUN WITH:
  cd backend
  .venv\\Scripts\\python.exe -m uvicorn app.main:app --reload --port 8000
"""

from __future__ import annotations

import sys
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database.init_db import init_database
from app.services.data_loader import data, load_all
from app.services.routing_service import RoutingService
from app.services.delay_service import DelayService
from app.services.fleet_simulator import FleetSimulator

from app.api import routes as routes_api
from app.api import saved_routes as saved_routes_api
from app.api import chat as chat_api
from app.api import fleet as fleet_api


# -- Application-wide singletons --
delay_service = DelayService()
routing_service: RoutingService | None = None
fleet_simulator: FleetSimulator | None = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Startup / shutdown lifecycle.

    Everything inside the `yield` runs while the server is alive.
    """
    global routing_service, fleet_simulator

    # 1. Load transport data.
    td = load_all()
    # Copy into the module-level singleton so other modules can import it.
    import app.services.data_loader as dl
    dl.data = td

    # 2. Initialise the routing engine.
    routing_service = RoutingService(td)

    # 3. Initialise the database (creates tables if needed).
    init_database()

    # 4. Initialise the fleet simulator.
    fleet_simulator = FleetSimulator()
    fleet_simulator.init_default_fleet(td)

    # 5. Inject dependencies into API modules.
    routes_api.init(td, routing_service, delay_service)
    chat_api.init(td, routing_service, delay_service)
    fleet_api.init(fleet_simulator)

    yield  # Server is running; handle requests until shutdown.


# -- Create the FastAPI app --
app = FastAPI(
    title="Aaroh-Saarthi",
    description="Public Transit Route Assistant & Fleet Intelligence",
    version="1.0.0",
    lifespan=lifespan,
)

# -- CORS --
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.frontend_origin,
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -- Register routers --
app.include_router(routes_api.router)
app.include_router(saved_routes_api.router)
app.include_router(chat_api.router)
app.include_router(fleet_api.router)
