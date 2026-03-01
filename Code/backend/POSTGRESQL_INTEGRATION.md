# PostgreSQL Integration Guide

## Overview
Your FastAPI backend has been updated to support PostgreSQL integration with your existing 40,000 dataset database.

## Configuration Steps

### 1. Update Environment Variables
Edit the `.env` file in the backend directory with your PostgreSQL credentials:

```env
# Database Configuration
DATABASE_TYPE=postgresql
POSTGRES_SERVER=your_postgres_host  # e.g., localhost, 192.168.1.100, or your cloud DB host
POSTGRES_USER=your_postgres_username
POSTGRES_PASSWORD=your_actual_password
POSTGRES_DB=your_database_name
POSTGRES_PORT=5432  # Default PostgreSQL port
```

### 2. Test Database Connection
Run the connection test script:

```bash
cd backend
python test_db_connection.py
```

This will:
- Verify your database connection
- List all existing tables
- Show row counts for each table

### 3. Database Schema Compatibility
Your existing PostgreSQL database should have tables that match the following structure:

#### Required Tables:
- `users` - User accounts
- `addresses` - Address records with DIGIPIN data

#### Expected Columns for `users`:
- `id` (Integer, Primary Key)
- `email` (String, Unique)
- `username` (String, Unique)
- `hashed_password` (String)
- `full_name` (String)
- `is_active` (Boolean)
- `is_superuser` (Boolean)
- `user_type` (String)
- `created_at` (DateTime)
- `updated_at` (DateTime)

#### Expected Columns for `addresses`:
- `id` (Integer, Primary Key)
- `label` (String)
- `digipin` (String, Unique)
- `latitude` (Float)
- `longitude` (Float)
- `address_type` (String)
- `verification_level` (String)
- `provider` (String)
- `created_at` (DateTime)
- `updated_at` (DateTime)
- `owner_id` (Integer, Foreign Key to users.id)

### 4. Start the Backend
Once configured, start your FastAPI server:

```bash
cd backend
python -m app.main
```

The API will be available at `http://localhost:8000`

### 5. API Documentation
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Troubleshooting

### Connection Issues
- Ensure PostgreSQL server is running
- Verify credentials in `.env` file
- Check firewall settings
- Confirm database exists and user has access

### Schema Mismatches
If your existing database schema differs from the expected structure, you may need to:
1. Create database views that map your existing tables to the expected structure
2. Update the SQLAlchemy models to match your existing schema
3. Create migration scripts to transform your data

### Performance Considerations
With 40,000 datasets:
- Ensure proper indexing on frequently queried columns
- Consider database connection pooling for production
- Monitor query performance and optimize as needed

## Next Steps
1. Configure your `.env` file with actual PostgreSQL credentials
2. Test the connection using `test_db_connection.py`
3. Start the FastAPI server
4. Update your React frontend to connect to the new API endpoints
5. Test the full application flow