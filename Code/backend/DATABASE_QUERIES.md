# PostgreSQL Database Query Guide

## 🔍 Inspecting Your Database

### Method 1: Using the Python Inspector Script

```bash
cd backend
python inspect_database.py
```

This will show:
- All tables in your database
- Column structure for each table
- Row counts
- Sample data (first 5 rows)
- Location data summary

### Method 2: Using psql (Command Line)

If you have psql installed:

```bash
# Connect to your database
psql -h your_host -U your_username -d your_database_name

# List all tables
\dt

# Describe a table structure
\d table_name

# Get row count
SELECT COUNT(*) FROM table_name;

# View sample data
SELECT * FROM table_name LIMIT 10;
```

### Method 3: Using pgAdmin or DBeaver

Connect to your PostgreSQL database using a GUI tool and run these queries:

## 📊 Useful SQL Queries

### Get All Table Names and Row Counts
```sql
SELECT
    schemaname,
    tablename,
    attname as column_name,
    format_type(atttypid, atttypmod) as data_type
FROM pg_attribute
JOIN pg_class ON pg_attribute.attrelid = pg_class.oid
JOIN pg_namespace ON pg_class.relnamespace = pg_namespace.oid
WHERE pg_attribute.attnum > 0
    AND pg_namespace.nspname NOT IN ('pg_catalog', 'information_schema')
ORDER BY schemaname, tablename, attnum;
```

### Find Tables with Location Data
```sql
SELECT table_name, column_name
FROM information_schema.columns
WHERE table_schema = 'public'
    AND column_name IN ('latitude', 'longitude', 'lat', 'lon', 'location')
ORDER BY table_name;
```

### Get Location Statistics
```sql
SELECT
    COUNT(*) as total_records,
    COUNT(CASE WHEN latitude IS NOT NULL AND longitude IS NOT NULL THEN 1 END) as with_coordinates,
    ROUND(AVG(latitude), 4) as avg_latitude,
    ROUND(AVG(longitude), 4) as avg_longitude,
    MIN(latitude) as min_lat,
    MAX(latitude) as max_lat,
    MIN(longitude) as min_lon,
    MAX(longitude) as max_lon
FROM your_table_name
WHERE latitude IS NOT NULL
    AND longitude IS NOT NULL
    AND latitude BETWEEN -90 AND 90
    AND longitude BETWEEN -180 AND 180;
```

### Sample Location Records
```sql
SELECT id, latitude, longitude, label, digipin
FROM your_table_name
WHERE latitude IS NOT NULL
    AND longitude IS NOT NULL
    AND latitude BETWEEN -90 AND 90
    AND longitude BETWEEN -180 AND 180
LIMIT 20;
```

### Find Records by Location (Nearby Points)
```sql
SELECT id, latitude, longitude, label,
    (6371 * acos(cos(radians(28.6139)) * cos(radians(latitude)) *
    cos(radians(longitude) - radians(77.2090)) +
    sin(radians(28.6139)) * sin(radians(latitude)))) AS distance_km
FROM your_table_name
WHERE latitude IS NOT NULL AND longitude IS NOT NULL
ORDER BY distance_km
LIMIT 10;
```
*(Replace 28.6139, 77.2090 with your reference coordinates)*

## 🐍 Python Queries (if using the inspector script)

### Export Sample Data to CSV
```bash
python inspect_database.py --export
```

### Get Location Summary Only
```bash
python inspect_database.py --locations
```

## 🔍 What to Look For

1. **ID Columns**: Look for `id`, `address_id`, `record_id`, etc.
2. **Location Columns**: `latitude`, `longitude`, `lat`, `lon`, `coordinates`
3. **Address Fields**: `label`, `address`, `location_name`, `digipin`
4. **Metadata**: `created_at`, `updated_at`, `user_id`, `owner_id`

## 📋 Next Steps

1. Run the inspector script to see your data structure
2. Identify which tables contain location/address data
3. Note the column names for IDs and coordinates
4. Update your FastAPI models if needed to match your schema
5. Test the API endpoints with your actual data