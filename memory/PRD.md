# CivicNest - Civic Intelligence Platform PRD

## Original Problem Statement
Build a frontend UI prototype for CivicNest - an AI-powered civic technology platform for Montgomery with multi-persona architecture:
- Landing page with persona selection
- Separate portals for Residents, Public Workers, and City Operators
- Advanced map visualization with clustering and heatmap
- Mock data simulating Montgomery Open Data Portal datasets

## User Personas
1. **Resident** - Reports neighborhood issues, receives AI guidance
2. **Public Worker** - Manages incidents, field operations, assignments
3. **City Operator** - Monitors trends, analytics, launches interventions

## Core Requirements (Static)
- Multi-persona routing: /, /resident, /worker, /admin
- Isolated UI per persona with sidebar navigation
- "Change Persona" button in headers
- API-ready service architecture with mock data
- Leaflet maps with OpenStreetMap (no API keys)
- Recharts for analytics dashboards

## What's Been Implemented (Jan 2026)

### Landing Page
- Hero section with civic blue (#1F4E79) theme
- 3 persona selection cards with features list
- Navigation to each portal

### Resident Portal
- AI-powered chat assistant with structured responses
- Quick suggestion buttons for common issues
- Response cards with confidence scores, priority badges
- Recurrence risk assessment bars
- Follow-up action buttons (Resolved/Still Unresolved)

### Worker Portal
- Incident Queue table with 10 mock incidents
- Priority/Status badges with color coding
- Recurrence score progress bars
- Filters (status, priority, category, zone)
- Search functionality
- Map View tab with Leaflet map
- Marker clustering when zoomed out
- Heatmap overlay for hotspots
- Incident detail modal with assignment

### Admin Portal
- KPI cards (Total Incidents, Resolved, Avg Time, High Priority)
- Trend chart (Area chart for incidents over time)
- Category chart (Horizontal bar chart)
- Zone Risk Assessment table
- Hotspot Trends with Escalate buttons
- Escalation Manager with history table
- New Escalation dialog form

## Tech Stack
- React 19 with React Router
- TailwindCSS + Shadcn UI components
- Leaflet with react-leaflet, clustering, heatmap
- Recharts for data visualization
- Mock data in /mockData folder
- API services in /services/api.js

## Prioritized Backlog

### P0 - Core (Completed)
- [x] Multi-persona routing
- [x] Landing page with persona cards
- [x] Resident chat assistant
- [x] Worker incident queue
- [x] Worker map with heatmap
- [x] Admin analytics dashboard
- [x] Escalation management

### P1 - Enhancements (Future)
- [ ] Connect to real FastAPI backend
- [ ] My Reports page for Resident portal
- [ ] Follow-up Status tracking
- [ ] Worker Assignments page
- [ ] Real-time incident updates
- [ ] Export reports to PDF

### P2 - Nice to Have
- [ ] Mobile responsive sidebar
- [ ] Dark mode toggle
- [ ] Notification system
- [ ] User preferences storage

## Next Action Items
1. Connect to FastAPI backend with MongoDB
2. Implement real authentication if needed
3. Add My Reports and Follow-up Status pages for Resident
4. Implement real-time updates with WebSocket
