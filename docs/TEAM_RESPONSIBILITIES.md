# Team Responsibilities

Four-member team plan for Aaroh-Saarthi hackathon development.

## Member 1: Frontend & User Experience

**Owner of:** `frontend/` directory

### Responsibilities
- React components (RouteSearchForm, RouteResultCard, TransportMap, ChatAssistant, SavedRoutes)
- FleetDashboard and ScenarioComparison components
- Tailwind CSS styling and responsive design
- Leaflet map integration
- Loading states, error messages, empty states
- Manual browser testing

### Key Files
- `frontend/src/components/*.tsx`
- `frontend/src/pages/*.tsx`
- `frontend/src/services/api.ts`
- `frontend/src/types/index.ts`
- `frontend/src/styles/index.css`

### How to Avoid Conflicts
- Only edit files in `frontend/`
- Agree on API response shapes with Member 2 before coding
- Use `types/index.ts` as the shared contract

---

## Member 2: Backend & Routing Engine

**Owner of:** `backend/app/api/`, `backend/app/services/routing_service.py`, `backend/app/models/`

### Responsibilities
- FastAPI endpoints (routes.py, saved_routes.py, chat.py)
- Routing algorithm (routing_service.py)
- Schedule and fare logic
- Pydantic models (input validation, response shapes)
- API documentation

### Key Files
- `backend/app/api/routes.py`
- `backend/app/api/saved_routes.py`
- `backend/app/api/chat.py`
- `backend/app/services/routing_service.py`
- `backend/app/services/schedule_service.py`
- `backend/app/models/*.py`
- `backend/app/main.py`

### How to Avoid Conflicts
- Own the API contract — communicate changes to Member 1
- Don't modify fleet_simulator.py (that's Member 3)
- Coordinate with Member 4 on data format changes

---

## Member 3: Simulation & Technical Testing

**Owner of:** `backend/app/services/fleet_simulator.py`, `backend/tests/`

### Responsibilities
- Fleet simulator logic and disruption scenarios
- Fleet API endpoints (fleet.py)
- All backend tests (pytest)
- Delay and crowd services
- Database initialization and migrations
- Performance and edge case testing

### Key Files
- `backend/app/services/fleet_simulator.py`
- `backend/app/services/delay_service.py`
- `backend/app/services/crowd_service.py`
- `backend/app/api/fleet.py`
- `backend/app/database/*.py`
- `backend/tests/*.py`

### How to Avoid Conflicts
- Own the test suite — run tests before pulling changes
- Coordinate with Member 2 on service interfaces
- Don't modify routing_service.py without discussing

---

## Member 4: Coordination, Integration & Presentation

**Owner of:** `docs/`, `README.md`, `.env.example`, dataset files

### Responsibilities
- Project documentation (README, ARCHITECTURE, LEARNING_GUIDE, etc.)
- Dataset creation and validation (CSV files)
- Integration testing (run frontend + backend together)
- Presentation preparation for hackathon judges
- Git workflow coordination (branches, merges, conflict resolution)
- Ensure the app starts with documented commands

### Key Files
- `README.md`
- `docs/*.md`
- `backend/app/data/*.csv`
- `backend/app/data/README.md`
- `.env.example`, `.gitignore`

### How to Avoid Conflicts
- Own documentation files exclusively
- Run integration tests after each team member's PR
- Keep the README accurate and up-to-date

---

## Git Workflow

1. Each member works on a feature branch: `feature/member1-map-improvements`
2. Push to remote and create a Pull Request
3. Member 4 reviews integration compatibility
4. Merge to `main` only after tests pass
5. Never force-push to `main`

## Communication Checklist

- [ ] Agree on API response schemas before coding (Members 1 & 2)
- [ ] Run `pytest` before pushing (all members)
- [ ] Update README when adding features (Member 4)
- [ ] Demo the feature to the team before merging (all members)

## Presentation Tips

- Member 1 demos the passenger interface (search, map, chat)
- Member 2 explains the routing algorithm with a whiteboard diagram
- Member 3 demos the fleet simulation (trigger disruption, compare options)
- Member 4 presents the architecture overview and answers judge questions
