from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.api import deps
from app.models.user import ActivityLog
from app.schemas import ActivityLog as ActivityLogSchema

router = APIRouter()

@router.get("/", response_model=List[ActivityLogSchema])
def get_activity_logs(
    db: Session = Depends(deps.get_db),
    current_user=Depends(deps.get_current_active_user),
):
    logs = db.query(ActivityLog).filter(ActivityLog.user_id == current_user.id).order_by(ActivityLog.timestamp.desc()).all()
    return logs
