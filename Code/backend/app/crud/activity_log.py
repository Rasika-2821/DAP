import json
from datetime import datetime
from typing import Any, Dict, Optional
from sqlalchemy.orm import Session
from fastapi import Request
from app.models.user import ActivityLog
from app.core.logger import log_system

def create_audit_log(
    db: Session,
    user_id: int,
    action: str,
    description: str,
    request: Optional[Request] = None,
    severity: str = "INFO",
    payload: Optional[Dict[str, Any]] = None
) -> ActivityLog:
    """Create a comprehensive audit log entry."""
    ip_address = None
    user_agent = None
    
    if request:
        if request.client:
            ip_address = request.client.host
        user_agent = request.headers.get("user-agent")
        
    payload_str = None
    if payload:
        try:
            payload_str = json.dumps(payload)
        except Exception as e:
            payload_str = f"Error serializing payload: {str(e)}"
            
    db_obj = ActivityLog(
        user_id=user_id,
        action=action,
        description=description,
        ip_address=ip_address,
        user_agent=user_agent,
        severity=severity,
        payload=payload_str,
        timestamp=datetime.utcnow()
    )
    
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    
    log_system("AUDIT LOG CREATED", f"User {user_id} - {action} - {severity}")
    return db_obj
