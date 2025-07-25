# Business Intelligence Migration Hub

A unified platform for migrating from traditional BI tools (Tableau, MicroStrategy) to modern solutions like Power BI.

## Overview

This platform integrates two powerful migration tools:

1. **Tableau to Power BI Migration Tool**: Analyze and convert Tableau dashboards, workbooks, and calculations to Power BI.
2. **MicroStrategy Analytics Platform**: Extract MicroStrategy reports, dossiers, and cubes for migration to other platforms.

The unified interface provides a single entry point with a shared authentication system and consistent user experience across both tools.

## Features

### Unified Frontend
- Single sign-on portal with tab-based navigation between tools
- Consistent UI/UX across both migration platforms
- Shared components and design system

### Tableau Migration Features
- Browse Tableau projects, workbooks, and dashboards
- Analyze and convert custom calculations to Power BI DAX
- Export visualization mappings and templates

### MicroStrategy Integration Features
- Explore MicroStrategy projects, reports, and dossiers
- Extract SQL queries and data models
- Analyze metrics, attributes, and their dependencies

## Getting Started

### Prerequisites
- Node.js (v16+)
- Python 3.8+ with pip
- Access credentials for Tableau and/or MicroStrategy

### Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   cd bi-migration-hub
   ```

2. Install frontend dependencies:
   ```
   npm install
   ```

3. Set up Python virtual environment:
   ```
   python -m venv .venv
   
   # Windows
   .venv\Scripts\activate
   
   # Linux/macOS
   source .venv/bin/activate
   ```

4. Install backend dependencies:
   ```
   pip install -r requirements.txt
   ```

5. Configure environment variables:
   Create `.env` files in the appropriate backend directories with your credentials.

### Running the Platform

#### Start the Backend Services:

```bash
# Start Tableau migration backend
cd backend/tableau
uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# Start MicroStrategy analytics backend (in another terminal)
cd backend/microstrategy
uvicorn main:app --host 0.0.0.0 --port 8001 --reload
```

#### Start the Frontend:

```bash
npm run dev
```

The unified platform will be available at http://localhost:3000

## Project Structure

```
bi-migration-hub/
├── backend/
│   ├── shared/               # Shared utilities and middleware
│   ├── tableau/              # Tableau migration backend
│   └── microstrategy/        # MicroStrategy analytics backend
├── frontend/
│   ├── public/               # Static assets
│   └── src/
│       ├── components/       # Reusable UI components
│       ├── pages/            # Application pages
│       │   ├── shared/       # Shared pages (login, home, etc.)
│       │   ├── tableau/      # Tableau-specific pages
│       │   └── mstr/         # MicroStrategy-specific pages
│       ├── services/         # API clients and services
│       └── context/          # Global state management
└── docs/                     # Documentation
```

## Contributing

Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.
