# DAP Connect - Digital Address Platform

**Note:** DAP is a microservice network project. As time was not sufficient enough, I just created a demo of how the AI agent should function and related features. Please refer to the attached presentation document for the full project vision and requirements.

## Overview

DAP Connect is a comprehensive digital address management system for India's Digital Public Infrastructure. It consists of a modern React frontend and a FastAPI backend, providing users with verified digital addresses and administrative tools for managing the address ecosystem.

## Features

### Frontend (React + TypeScript)
- **User Portal**: Dashboard, address management, access control, activity logs, settings
- **Admin Portal**: Database administration and system management
- **Authentication**: Secure user login and registration
- **Address Creation**: Wizard-based address registration with geocoding
- **Responsive Design**: Mobile and desktop optimized interface

### Backend (FastAPI + Python)
- **User Authentication**: JWT-based authentication for citizens and providers
- **Location Services**: GPS and IP-based geolocation
- **DIGIPIN Generation**: Unique address identifiers based on coordinates
- **Address Management**: CRUD operations for digital addresses
- **Admin Dashboard**: Type-based address organization (@home, @office, etc.)

## Tech Stack

### Frontend
- React 18 + TypeScript
- Vite (build tool)
- ShadCN UI + Radix UI components
- Tailwind CSS
- React Query (data fetching)
- React Router (routing)
- Supabase (backend services)

### Backend
- FastAPI (web framework)
- SQLAlchemy (ORM)
- SQLite (database)
- JWT (authentication)
- Pydantic (data validation)

## Setup and Installation

### Prerequisites
- Node.js & npm (for frontend)
- Python 3.8+ (for backend)
- Git

### Frontend Setup
1. Clone the repository:
```bash
git clone <repository-url>
cd address-agent-central-main
```

2. Install dependencies:
```bash
npm install
# or
bun install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Add your IP geolocation API key if needed
```

4. Start the development server:
```bash
npm run dev
# or
bun run dev
```

The frontend will be available at `http://localhost:5173`

### Backend Setup
1. Navigate to the backend directory:
```bash
cd ../backend
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Run the server:
```bash
python -m app.main
```

The API will be available at `http://localhost:8000`

## API Documentation

- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Key API Endpoints

### Authentication
- `POST /api/v1/auth/login/access-token` - Login
- `POST /api/v1/auth/register` - Register new user

### Addresses
- `GET /api/v1/addresses/` - Get user's addresses
- `POST /api/v1/addresses/` - Create new address
- `PUT /api/v1/addresses/{id}` - Update address
- `DELETE /api/v1/addresses/{id}` - Delete address

### Locations
- `POST /api/v1/locations/gps-locate` - Generate DIGIPIN from GPS coordinates
- `GET /api/v1/locations/ip-locate` - Get location from IP address

### Admin (Superuser only)
- `GET /api/v1/addresses/admin/all` - Get all addresses
- `GET /api/v1/addresses/admin/by-type/{type}` - Get addresses by type

## Database

The backend uses SQLite by default. The database file `app.db` will be created automatically on first run.

## Environment Variables

See `.env` file in both frontend and backend directories for configuration options.

## Deployment

The application can be deployed using various platforms. The frontend can be built for production using:

```bash
npm run build
```

The backend can be deployed using FastAPI's deployment options (Uvicorn, Gunicorn, etc.).

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

[Add license information here]
