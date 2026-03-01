#!/usr/bin/env python3
"""
Data Migration Helper Script
Helps migrate or validate existing PostgreSQL data with the FastAPI models.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine, text, inspect
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
from app.db.base import Base

def analyze_existing_schema():
    """Analyze existing database schema and compare with expected models."""
    try:
        engine = create_engine(settings.SQLALCHEMY_DATABASE_URI)
        inspector = inspect(engine)

        print("🔍 Analyzing existing database schema...")
        print("=" * 50)

        # Get all table names
        tables = inspector.get_table_names()
        print(f"Found {len(tables)} tables: {', '.join(tables)}")
        print()

        # Expected tables from our models
        expected_tables = ['users', 'addresses']

        for table_name in expected_tables:
            if table_name in tables:
                print(f"✅ Table '{table_name}' exists")
                columns = inspector.get_columns(table_name)

                print(f"   Columns ({len(columns)}):")
                for col in columns:
                    nullable = "NULL" if col['nullable'] else "NOT NULL"
                    default = f" DEFAULT {col['default']}" if col['default'] else ""
                    print(f"     - {col['name']} ({col['type']}) {nullable}{default}")

                # Check for data
                with engine.connect() as conn:
                    result = conn.execute(text(f"SELECT COUNT(*) FROM {table_name}"))
                    count = result.fetchone()[0]
                    print(f"   📊 Records: {count}")
            else:
                print(f"❌ Table '{table_name}' missing")

            print()

        # Check foreign key relationships
        print("🔗 Foreign Key Relationships:")
        for table_name in expected_tables:
            if table_name in tables:
                fks = inspector.get_foreign_keys(table_name)
                if fks:
                    for fk in fks:
                        print(f"   {table_name}.{fk['constrained_columns'][0]} -> {fk['referred_table']}.{fk['referred_columns'][0]}")
                else:
                    print(f"   {table_name}: No foreign keys found")

        print("\n✅ Schema analysis completed!")

    except Exception as e:
        print(f"❌ Schema analysis failed: {e}")

def create_tables_if_missing():
    """Create missing tables based on SQLAlchemy models."""
    try:
        print("🔨 Creating missing tables...")
        engine = create_engine(settings.SQLALCHEMY_DATABASE_URI)

        # This will create tables that don't exist, but won't drop existing ones
        Base.metadata.create_all(bind=engine)
        print("✅ Tables created/verified successfully!")

    except Exception as e:
        print(f"❌ Table creation failed: {e}")

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--create-tables":
        create_tables_if_missing()
    else:
        analyze_existing_schema()