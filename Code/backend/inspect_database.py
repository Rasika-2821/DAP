#!/usr/bin/env python3
"""
PostgreSQL Data Inspector
Connects to your PostgreSQL database and shows table structure and sample data.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine, text, inspect
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
import pandas as pd

def inspect_database():
    """Inspect database structure and show sample data."""
    try:
        print("🔍 Inspecting PostgreSQL Database...")
        print(f"Connecting to: {settings.SQLALCHEMY_DATABASE_URI.replace(settings.POSTGRES_PASSWORD, '***')}")
        print("=" * 60)

        engine = create_engine(settings.SQLALCHEMY_DATABASE_URI)

        with engine.connect() as conn:
            # Get all tables
            inspector = inspect(engine)
            tables = inspector.get_table_names()

            print(f"📋 Found {len(tables)} tables:")
            for table in tables:
                print(f"\n🔸 Table: {table}")

                # Get column information
                columns = inspector.get_columns(table)
                print(f"   Columns ({len(columns)}):")
                for col in columns:
                    col_type = str(col['type'])
                    nullable = "NULL" if col['nullable'] else "NOT NULL"
                    print(f"     • {col['name']} ({col_type}) {nullable}")

                # Get row count
                count_query = text(f"SELECT COUNT(*) FROM {table}")
                count_result = conn.execute(count_query)
                row_count = count_result.fetchone()[0]
                print(f"   📊 Total rows: {row_count:,}")

                if row_count > 0:
                    # Show sample data (first 5 rows)
                    sample_query = text(f"SELECT * FROM {table} LIMIT 5")
                    sample_result = conn.execute(sample_query)
                    columns_names = sample_result.keys()

                    print(f"   📝 Sample data (first 5 rows):")
                    for i, row in enumerate(sample_result):
                        print(f"     Row {i+1}: ", end="")
                        row_data = dict(zip(columns_names, row))
                        # Show key fields
                        key_fields = []
                        if 'id' in row_data:
                            key_fields.append(f"id={row_data['id']}")
                        if 'latitude' in row_data and 'longitude' in row_data:
                            key_fields.append(f"lat={row_data['latitude']:.4f}, lon={row_data['longitude']:.4f}")
                        if 'digipin' in row_data:
                            key_fields.append(f"digipin={row_data['digipin']}")
                        if 'label' in row_data:
                            key_fields.append(f"label={row_data['label']}")

                        print(", ".join(key_fields))

                    # Show location-specific queries if applicable
                    if any(col['name'].lower() in ['latitude', 'longitude', 'lat', 'lon', 'location'] for col in columns):
                        print(f"   🌍 Location data available in this table")

                        # Count records with valid coordinates
                        coord_query = text(f"""
                            SELECT COUNT(*) FROM {table}
                            WHERE latitude IS NOT NULL AND longitude IS NOT NULL
                            AND latitude BETWEEN -90 AND 90 AND longitude BETWEEN -180 AND 180
                        """)
                        coord_count = conn.execute(coord_query).fetchone()[0]
                        print(f"   📍 Records with valid coordinates: {coord_count:,}")

    except Exception as e:
        print(f"❌ Database inspection failed: {e}")
        print("\n🔧 Troubleshooting:")
        print("1. Check your .env file has correct PostgreSQL credentials")
        print("2. Ensure PostgreSQL server is running")
        print("3. Verify database exists and user has access")
        return False

    return True

def get_location_summary():
    """Get summary of location data across all tables."""
    try:
        print("\n" + "=" * 60)
        print("🌍 LOCATION DATA SUMMARY")
        print("=" * 60)

        engine = create_engine(settings.SQLALCHEMY_DATABASE_URI)

        with engine.connect() as conn:
            inspector = inspect(engine)
            tables = inspector.get_table_names()

            total_locations = 0
            tables_with_locations = []

            for table in tables:
                columns = inspector.get_columns(table)
                has_location = any(col['name'].lower() in ['latitude', 'longitude', 'lat', 'lon'] for col in columns)

                if has_location:
                    tables_with_locations.append(table)

                    # Get location statistics
                    try:
                        stats_query = text(f"""
                            SELECT
                                COUNT(*) as total,
                                COUNT(CASE WHEN latitude IS NOT NULL AND longitude IS NOT NULL THEN 1 END) as with_coords,
                                MIN(latitude) as min_lat, MAX(latitude) as max_lat,
                                MIN(longitude) as min_lon, MAX(longitude) as max_lon
                            FROM {table}
                            WHERE latitude IS NOT NULL AND longitude IS NOT NULL
                            AND latitude BETWEEN -90 AND 90 AND longitude BETWEEN -180 AND 180
                        """)
                        result = conn.execute(stats_query).fetchone()

                        if result[1] > 0:  # with_coords > 0
                            print(f"\n📍 {table}:")
                            print(f"   • Records with coordinates: {result[1]:,}")
                            print(f"   • Latitude range: {result[2]:.4f} to {result[3]:.4f}")
                            print(f"   • Longitude range: {result[4]:.4f} to {result[5]:.4f}")
                            total_locations += result[1]

                    except Exception as e:
                        print(f"   • Error getting stats for {table}: {e}")

            print(f"\n📊 TOTAL: {total_locations:,} location records across {len(tables_with_locations)} tables")

    except Exception as e:
        print(f"❌ Location summary failed: {e}")

def export_sample_data():
    """Export sample location data to CSV for inspection."""
    try:
        print("\n" + "=" * 60)
        print("💾 EXPORTING SAMPLE DATA")
        print("=" * 60)

        engine = create_engine(settings.SQLALCHEMY_DATABASE_URI)

        with engine.connect() as conn:
            inspector = inspect(engine)
            tables = inspector.get_table_names()

            for table in tables:
                columns = inspector.get_columns(table)
                has_location = any(col['name'].lower() in ['latitude', 'longitude', 'lat', 'lon'] for col in columns)

                if has_location:
                    try:
                        # Export first 100 records with location data
                        export_query = text(f"""
                            SELECT * FROM {table}
                            WHERE latitude IS NOT NULL AND longitude IS NOT NULL
                            AND latitude BETWEEN -90 AND 90 AND longitude BETWEEN -180 AND 180
                            LIMIT 100
                        """)

                        df = pd.read_sql(export_query, engine)
                        filename = f"{table}_sample.csv"

                        df.to_csv(filename, index=False)
                        print(f"✅ Exported {len(df)} records from {table} to {filename}")

                    except Exception as e:
                        print(f"❌ Failed to export {table}: {e}")

    except Exception as e:
        print(f"❌ Export failed: {e}")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        if sys.argv[1] == "--export":
            export_sample_data()
        elif sys.argv[1] == "--locations":
            get_location_summary()
    else:
        inspect_database()