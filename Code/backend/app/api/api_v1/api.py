from fastapi import APIRouter

from app.api.api_v1.endpoints import addresses, auth, locations, aava, consent, activity_logs

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(addresses.router, prefix="/addresses", tags=["addresses"])
api_router.include_router(locations.router, prefix="/locations", tags=["locations"])
api_router.include_router(aava.router, prefix="/aava", tags=["AAVA - Verification"])
api_router.include_router(consent.router, prefix="/consent", tags=["AIA - Consent Management"])
api_router.include_router(activity_logs.router, prefix="/activity-logs", tags=["Activity Logs"])