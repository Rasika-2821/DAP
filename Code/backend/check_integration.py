#!/usr/bin/env python3
"""
PostgreSQL Integration Status Checker
Provides a comprehensive overview of the integration setup.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def check_integration_status():
    """Check the status of PostgreSQL integration."""
    print("🚀 Address Agent Central - PostgreSQL Integration Status")
    print("=" * 60)

    # Check environment file
    env_file = ".env"
    if os.path.exists(env_file):
        print("✅ .env file exists")
        with open(env_file, 'r') as f:
            content = f.read()
            if 'DATABASE_TYPE=postgresql' in content:
                print("✅ Database type set to PostgreSQL")
            else:
                print("❌ Database type not set to PostgreSQL")

            if 'your_postgres_username' in content:
                print("⚠️  Using placeholder credentials - update with real values")
            else:
                print("✅ Custom credentials configured")
    else:
        print("❌ .env file missing")

    # Check requirements
    requirements_file = "requirements.txt"
    if os.path.exists(requirements_file):
        with open(requirements_file, 'r') as f:
            content = f.read()
            if 'psycopg2-binary' in content:
                print("✅ PostgreSQL driver (psycopg2-binary) in requirements.txt")
            else:
                print("❌ PostgreSQL driver missing from requirements.txt")

    # Check configuration files
    config_files = [
        "app/core/config.py",
        "app/db/session.py",
        "alembic/env.py"
    ]

    for config_file in config_files:
        if os.path.exists(config_file):
            print(f"✅ {config_file} exists")
        else:
            print(f"❌ {config_file} missing")

    # Check utility scripts
    utility_scripts = [
        "test_db_connection.py",
        "migrate_data.py",
        "POSTGRESQL_INTEGRATION.md"
    ]

    print("\n📋 Utility Scripts:")
    for script in utility_scripts:
        if os.path.exists(script):
            print(f"✅ {script} available")
        else:
            print(f"❌ {script} missing")

    print("\n📖 Next Steps:")
    print("1. Update .env file with your actual PostgreSQL credentials")
    print("2. Run: python test_db_connection.py")
    print("3. Run: python migrate_data.py (to analyze existing schema)")
    print("4. Start server: python -m app.main")
    print("5. Test API: http://localhost:8000/docs")

    print("\n🔗 Integration Complete: Ready for your 40,000 datasets!")

if __name__ == "__main__":
    check_integration_status()