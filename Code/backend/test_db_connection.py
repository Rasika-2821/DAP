#!/usr/bin/env python3
"""
Database Connection Test Script
Tests the connection to PostgreSQL database and verifies existing data.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

def test_database_connection():
    """Test database connection and inspect existing tables/data."""
    try:
        print("🔍 Testing database connection...")
        print(f"Database Type: {settings.DATABASE_TYPE}")
        print(f"Database URI: {settings.SQLALCHEMY_DATABASE_URI.replace(settings.POSTGRES_PASSWORD, '***')}")

        # Create engine
        engine = create_engine(settings.SQLALCHEMY_DATABASE_URI)

        # Test connection
        with engine.connect() as connection:
            print("✅ Successfully connected to database!")

            # Get table list
            if settings.DATABASE_TYPE == "postgresql":
                result = connection.execute(text("""
                    SELECT table_name
                    FROM information_schema.tables
                    WHERE table_schema = 'public'
                    ORDER BY table_name;
                """))
            else:
                result = connection.execute(text("""
                    SELECT name FROM sqlite_master
                    WHERE type='table'
                    ORDER BY name;
                """))

            tables = result.fetchall()
            print(f"📋 Found {len(tables)} tables:")
            for table in tables:
                table_name = table[0]
                print(f"  - {table_name}")

                # Get row count for each table
                try:
                    count_result = connection.execute(text(f"SELECT COUNT(*) FROM {table_name}"))
                    count = count_result.fetchone()[0]
                    print(f"    Rows: {count}")
                except Exception as e:
                    print(f"    Error counting rows: {e}")

        print("✅ Database connection test completed successfully!")
        return True

    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        print("\n🔧 Please check your .env file and ensure:")
        print("   - PostgreSQL server is running")
        print("   - Database credentials are correct")
        print("   - Database exists and is accessible")
        return False

if __name__ == "__main__":
    success = test_database_connection()
    sys.exit(0 if success else 1)