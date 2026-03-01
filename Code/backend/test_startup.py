#!/usr/bin/env python3
"""
Test server startup to identify issues.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    print("🔍 Testing server startup...")

    print("1. Importing app...")
    from app.main import app
    print("   ✅ App imported successfully")

    print("2. Testing database connection...")
    from app.db.session import SessionLocal
    db = SessionLocal()
    db.close()
    print("   ✅ Database connection successful")

    print("3. Testing routes...")
    routes = []
    for route in app.routes:
        if hasattr(route, 'path'):
            routes.append(route.path)
    print(f"   ✅ Found {len(routes)} routes")

    print("4. Testing middleware...")
    middleware_count = len(app.user_middleware)
    print(f"   ✅ Found {middleware_count} middleware")

    print("\n🎉 All tests passed! Server should start successfully.")

except Exception as e:
    print(f"❌ Error during testing: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)