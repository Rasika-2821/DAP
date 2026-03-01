"""
AAVA (Authorized Address Validation Agency) Endpoints
======================================================
Handles physical verification requests and updates verification levels.
"""

from typing import Any, List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app import crud, models, schemas
from app.api import deps
from app.core.logger import log_aava, log_success, log_error

router = APIRouter()

# In-memory storage for verification requests (would be database in production)
verification_requests = {}
verification_counter = 0


class VerificationRequest(BaseModel):
    address_id: int
    address_label: str
    digipin: str
    latitude: float
    longitude: float
    requester_id: str
    requester_name: str
    purpose: str


class VerificationRequestCreate(BaseModel):
    address_id: int
    purpose: str = "KYC Verification"


class VerificationResponse(BaseModel):
    request_id: str
    status: str
    message: str


class VerificationUpdate(BaseModel):
    request_id: str
    verified: bool
    notes: Optional[str] = None


@router.post("/request-verification", response_model=VerificationResponse)
def request_verification(
    *,
    db: Session = Depends(deps.get_db),
    request_in: VerificationRequestCreate,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Request physical verification of an address by AAVA.
    This triggers a field agent to visit the location.
    """
    global verification_counter
    
    # Get the address
    address = crud.address.get(db=db, id=request_in.address_id)
    if not address:
        log_error("AAVA", "Verification request failed", "Address not found")
        raise HTTPException(status_code=404, detail="Address not found")
    
    # Create verification request
    verification_counter += 1
    request_id = f"AAVA-VR-{verification_counter:06d}"
    
    verification_requests[request_id] = {
        "request_id": request_id,
        "address_id": address.id,
        "address_label": address.label,
        "digipin": address.digipin,
        "latitude": address.latitude,
        "longitude": address.longitude,
        "requester_id": str(current_user.id),
        "requester_name": current_user.full_name or current_user.username,
        "purpose": request_in.purpose,
        "status": "PENDING",
        "created_at": datetime.utcnow().isoformat(),
        "verified": None,
        "verified_at": None,
        "field_agent": None,
        "notes": None
    }
    
    # Log the activity
    log_aava(
        "VERIFICATION REQUEST RECEIVED",
        f"Request ID: {request_id}",
        Address=address.label,
        DIGIPIN=address.digipin,
        Requester=current_user.username,
        Purpose=request_in.purpose,
        Location=f"({address.latitude}, {address.longitude})"
    )
    
    print(f"\n{'='*60}")
    print(f"  🔔 NEW VERIFICATION REQUEST FOR AAVA FIELD AGENT")
    print(f"{'='*60}")
    print(f"  Request ID:  {request_id}")
    print(f"  Address:     {address.label}")
    print(f"  DIGIPIN:     {address.digipin}")
    print(f"  Coordinates: {address.latitude}, {address.longitude}")
    print(f"  Purpose:     {request_in.purpose}")
    print(f"  Status:      PENDING FIELD VISIT")
    print(f"{'='*60}\n")
    
    return {
        "request_id": request_id,
        "status": "PENDING",
        "message": f"Verification request created. AAVA field agent will visit location."
    }


@router.get("/pending-verifications", response_model=List[dict])
def get_pending_verifications(
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get all pending verification requests (for AAVA agents).
    """
    pending = [
        req for req in verification_requests.values()
        if req["status"] == "PENDING"
    ]
    
    log_aava(
        "LISTING PENDING VERIFICATIONS",
        f"Found {len(pending)} pending requests"
    )
    
    return pending


@router.get("/all-verifications", response_model=List[dict])
def get_all_verifications(
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get all verification requests.
    """
    return list(verification_requests.values())


@router.post("/complete-verification", response_model=dict)
def complete_verification(
    *,
    db: Session = Depends(deps.get_db),
    update: VerificationUpdate,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    AAVA field agent completes verification after physical visit.
    """
    if update.request_id not in verification_requests:
        log_error("AAVA", "Verification completion failed", "Request not found")
        raise HTTPException(status_code=404, detail="Verification request not found")
    
    req = verification_requests[update.request_id]
    
    if req["status"] != "PENDING":
        raise HTTPException(status_code=400, detail="Request already processed")
    
    # Update the request
    req["status"] = "VERIFIED" if update.verified else "REJECTED"
    req["verified"] = update.verified
    req["verified_at"] = datetime.utcnow().isoformat()
    req["field_agent"] = current_user.username
    req["notes"] = update.notes
    
    # Update address verification level in database
    if update.verified:
        address = crud.address.get(db=db, id=req["address_id"])
        if address:
            # Update to L3 (Physical Verification)
            crud.address.update(
                db=db,
                db_obj=address,
                obj_in={"verification_level": "L3"}
            )
    
    # Log the activity
    status_emoji = "✅" if update.verified else "❌"
    log_aava(
        f"VERIFICATION COMPLETED {status_emoji}",
        f"Request ID: {update.request_id}",
        Address=req["address_label"],
        Result="VERIFIED" if update.verified else "REJECTED",
        FieldAgent=current_user.username,
        Notes=update.notes or "None"
    )
    
    print(f"\n{'='*60}")
    print(f"  {status_emoji} VERIFICATION {'COMPLETED' if update.verified else 'REJECTED'}")
    print(f"{'='*60}")
    print(f"  Request ID:   {update.request_id}")
    print(f"  Address:      {req['address_label']}")
    print(f"  DIGIPIN:      {req['digipin']}")
    print(f"  Field Agent:  {current_user.username}")
    print(f"  Result:       {'VERIFIED - Address exists at location' if update.verified else 'REJECTED - Address mismatch'}")
    print(f"  New Level:    {'L3 (Physically Verified)' if update.verified else 'Unchanged'}")
    if update.notes:
        print(f"  Notes:        {update.notes}")
    print(f"{'='*60}\n")
    
    return {
        "success": True,
        "request_id": update.request_id,
        "status": req["status"],
        "verification_level": "L3" if update.verified else "L1",
        "message": f"Verification {'completed successfully' if update.verified else 'rejected'}"
    }


@router.get("/verification-status/{request_id}", response_model=dict)
def get_verification_status(
    request_id: str,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Check status of a verification request.
    """
    if request_id not in verification_requests:
        raise HTTPException(status_code=404, detail="Verification request not found")
    
    req = verification_requests[request_id]
    
    log_aava(
        "STATUS CHECK",
        f"Request ID: {request_id} - Status: {req['status']}"
    )
    
    return req
