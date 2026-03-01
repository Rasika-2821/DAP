from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer
import uvicorn

from app.api.api_v1.api import api_router
from app.core.config import settings
from app.core.logger import print_banner, log_system
from app.core.security import get_password_hash
from app.db.session import engine, SessionLocal
from app.db.base import Base
from app.models.user import User

# Create database tables (only creates missing tables, doesn't drop existing data)
try:
    Base.metadata.create_all(bind=engine)
    print("✅ Database tables verified/created successfully")
except Exception as e:
    print(f"⚠️  Database table creation warning: {e}")
    print("   This might be expected if tables already exist with your 40,000 datasets")


def create_default_users():
    """Create default users for demo purposes."""
    db = SessionLocal()
    try:
        # Default citizen user
        citizen = db.query(User).filter(User.email == "user@dap.in").first()
        if not citizen:
            citizen = User(
                email="user@dap.in",
                username="dapuser",
                hashed_password=get_password_hash("dap123"),
                full_name="DAP User",
                is_active=True,
                is_superuser=False,
                user_type="citizen"
            )
            db.add(citizen)
            print("  ✅ Created default citizen: user@dap.in / dap123")
        
        # Default admin user
        admin = db.query(User).filter(User.email == "admin@dap.in").first()
        if not admin:
            admin = User(
                email="admin@dap.in",
                username="dapadmin",
                hashed_password=get_password_hash("admin123"),
                full_name="DAP Admin",
                is_active=True,
                is_superuser=True,
                user_type="admin"
            )
            db.add(admin)
            print("  ✅ Created default admin: admin@dap.in / admin123")
        
        db.commit()
    except Exception as e:
        print(f"  ⚠️  Error creating default users: {e}")
        db.rollback()
    finally:
        db.close()


app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Set up CORS
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex="https?://(localhost|127\.0\.0\.1)(:[0-9]+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_STR)


@app.on_event("startup")
async def startup_event():
    """Print banner and log startup."""
    print_banner()
    log_system("SERVER STARTED", f"Listening on http://0.0.0.0:8000")
    log_system("API DOCS", "Available at http://localhost:8000/docs")
    
    # Create default users
    print("\n  📝 Checking default users...")
    create_default_users()
    
    print("\n" + "="*60)
    print("  DEFAULT LOGIN CREDENTIALS:")
    print("  ---------------------------")
    print("  Citizen Portal:  user@dap.in  /  dap123")
    print("  Admin Portal:    admin@dap.in /  admin123")
    print("="*60)
    print("  Ready to receive requests. Activity will be logged below.")
    print("="*60 + "\n")


@app.get("/health")
def health_check():
    return {"status": "healthy", "database": settings.DATABASE_TYPE}

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)