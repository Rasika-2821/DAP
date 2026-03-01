"""
Consent Management Endpoints (AIA - Address Information Agent)
==============================================================
Handles consent requests, approvals, and authorization tokens.
"""

from typing import Any, List, Optional
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel
import secrets
import hashlib
import base64
import json

from app import crud, models, schemas
from app.api import deps
from app.core.logger import log_aia, log_aiu, log_aip, log_success, log_error
from app.models.user import ConsentRequest, ConsentArtifact, AuthorizationToken
from app.crud.activity_log import create_audit_log

router = APIRouter()

# Request counter for generating unique IDs
def get_next_request_id(db: Session) -> str:
    """Generate next request ID based on database count"""
    count = db.query(ConsentRequest).count()
    return f"CR-{count + 1:06d}"


class ConsentRequestCreate(BaseModel):
    address_label: str
    purpose: str  # DELIVERY, KYC, EMERGENCY, etc.
    scope: List[str] = ["digipin", "city", "pincode"]
    validity_hours: int = 24
    aiu_name: str  # Name of service provider


class UserConsentRequest(BaseModel):
    """For logged-in users - uses their username automatically"""
    address_type: str  # "home", "office", etc - username is auto-added
    purpose: str
    scope: List[str] = ["digipin", "city", "pincode"]
    validity_hours: int = 24
    aiu_name: str


class ConsentApproval(BaseModel):
    request_id: str
    approved: bool
    modified_scope: Optional[List[str]] = None


class ResolutionRequest(BaseModel):
    address_label: str
    token: str


# Purpose codes
PURPOSE_CODES = {
    "DELIVERY": "Package/Product Delivery",
    "KYC": "Know Your Customer Verification",
    "EMERGENCY": "Emergency Services",
    "BANKING": "Banking Services",
    "GOVERNMENT": "Government Services",
    "OTHER": "Other Purpose"
}


@router.post("/request-consent", response_model=dict)
def request_consent(
    *,
    db: Session = Depends(deps.get_db),
    request_in: ConsentRequestCreate,
) -> Any:
    """
    AIU (Service Provider) requests consent to access a Digital Address.
    This creates a pending consent request for the user to approve.
    """
    # Create consent request
    request_id = get_next_request_id(db)
    
    db_request = ConsentRequest(
        request_id=request_id,
        address_label=request_in.address_label,
        aiu_name=request_in.aiu_name,
        purpose=request_in.purpose,
        purpose_description=PURPOSE_CODES.get(request_in.purpose, "Unknown"),
        scope=request_in.scope,
        validity_hours=request_in.validity_hours,
        status="PENDING",
        expires_at=datetime.utcnow() + timedelta(hours=24),
    )
    db.add(db_request)
    db.commit()
    db.refresh(db_request)
    
    # Log AIU request
    log_aiu(
        "CONSENT REQUEST INITIATED",
        f"Request ID: {request_id}",
        ServiceProvider=request_in.aiu_name,
        TargetAddress=request_in.address_label,
        Purpose=request_in.purpose,
        Scope=", ".join(request_in.scope)
    )
    
    # Log AIA receiving the request
    log_aia(
        "CONSENT REQUEST RECEIVED",
        f"From: {request_in.aiu_name}",
        RequestID=request_id,
        Address=request_in.address_label,
        Purpose=request_in.purpose
    )
    
    print(f"\n{'='*60}")
    print(f"  📩 NEW CONSENT REQUEST - AWAITING USER APPROVAL")
    print(f"{'='*60}")
    print(f"  Request ID:      {request_id}")
    print(f"  Service Provider: {request_in.aiu_name}")
    print(f"  Target Address:  {request_in.address_label}")
    print(f"  Purpose:         {request_in.purpose}")
    print(f"  Requested Scope: {', '.join(request_in.scope)}")
    print(f"  Valid For:       {request_in.validity_hours} hours")
    print(f"  Status:          PENDING USER APPROVAL")
    print(f"{'='*60}\n")
    
    return {
        "success": True,
        "request_id": request_id,
        "status": "PENDING",
        "message": f"Consent request sent to address owner. Awaiting approval."
    }


@router.post("/request-my-consent", response_model=dict)
def request_my_consent(
    *,
    db: Session = Depends(deps.get_db),
    request_in: UserConsentRequest,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Logged-in user requests consent for their own address.
    The username is automatically taken from the logged-in user.
    Just provide the address type (home, office, etc).
    """
    # Auto-generate address label using logged-in user's username
    address_label = f"{current_user.username}@{request_in.address_type}"
    
    # Create consent request
    request_id = get_next_request_id(db)
    
    db_request = ConsentRequest(
        request_id=request_id,
        address_label=address_label,
        aiu_name=request_in.aiu_name,
        purpose=request_in.purpose,
        purpose_description=PURPOSE_CODES.get(request_in.purpose, "Unknown"),
        scope=request_in.scope,
        validity_hours=request_in.validity_hours,
        status="PENDING",
        expires_at=datetime.utcnow() + timedelta(hours=24),
        user_id=current_user.id,
    )
    db.add(db_request)
    db.commit()
    db.refresh(db_request)
    
    # Log AIU request
    log_aiu(
        "CONSENT REQUEST INITIATED",
        f"Request ID: {request_id}",
        ServiceProvider=request_in.aiu_name,
        TargetAddress=address_label,
        AddressOwner=current_user.username,
        Purpose=request_in.purpose,
        Scope=", ".join(request_in.scope)
    )
    
    # Log AIA receiving the request
    log_aia(
        "CONSENT REQUEST RECEIVED",
        f"From: {request_in.aiu_name}",
        RequestID=request_id,
        Address=address_label,
        Owner=current_user.username,
        Purpose=request_in.purpose
    )
    
    print(f"\n{'='*60}")
    print(f"  📩 NEW CONSENT REQUEST - AWAITING USER APPROVAL")
    print(f"{'='*60}")
    print(f"  Request ID:      {request_id}")
    print(f"  Service Provider: {request_in.aiu_name}")
    print(f"  Target Address:  {address_label}")
    print(f"  Address Owner:   {current_user.username}")
    print(f"  Purpose:         {request_in.purpose}")
    print(f"  Requested Scope: {', '.join(request_in.scope)}")
    print(f"  Valid For:       {request_in.validity_hours} hours")
    print(f"  Status:          PENDING USER APPROVAL")
    print(f"{'='*60}\n")
    
    return {
        "success": True,
        "request_id": request_id,
        "address_label": address_label,
        "status": "PENDING",
        "message": f"Consent request for {address_label} sent. Awaiting approval."
    }


@router.get("/pending-consents", response_model=List[dict])
def get_pending_consents(
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get pending consent requests for the current user.
    """
    # Get pending requests from database
    pending_requests = db.query(ConsentRequest).filter(
        ConsentRequest.status == "PENDING"
    ).all()
    
    pending = [
        {
            "request_id": req.request_id,
            "address_label": req.address_label,
            "aiu_name": req.aiu_name,
            "purpose": req.purpose,
            "purpose_description": req.purpose_description,
            "scope": req.scope,
            "validity_hours": req.validity_hours,
            "status": req.status,
            "created_at": req.created_at.isoformat() if req.created_at else None,
            "expires_at": req.expires_at.isoformat() if req.expires_at else None,
        }
        for req in pending_requests
    ]
    
    log_aia(
        "LISTING PENDING CONSENTS",
        f"Found {len(pending)} pending for user {current_user.username}"
    )
    
    return pending


@router.post("/approve-consent", response_model=dict)
def approve_consent(
    *,
    request: Request,
    db: Session = Depends(deps.get_db),
    approval: ConsentApproval,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    User approves or denies a consent request.
    If approved, generates an authorization token for the AIU.
    """
    req = db.query(ConsentRequest).filter(
        ConsentRequest.request_id == approval.request_id
    ).first()
    
    if not req:
        log_error("AIA", "Consent approval failed", "Request not found")
        raise HTTPException(status_code=404, detail="Consent request not found")
    
    if req.status != "PENDING":
        raise HTTPException(status_code=400, detail="Request already processed")
    
    if not approval.approved:
        req.status = "DENIED"
        req.processed_at = datetime.utcnow()
        db.commit()
        
        log_aia(
            "CONSENT DENIED ❌",
            f"Request ID: {approval.request_id}",
            User=current_user.username,
            ServiceProvider=req.aiu_name
        )
        
        print(f"\n{'='*60}")
        print(f"  ❌ CONSENT DENIED BY USER")
        print(f"{'='*60}")
        print(f"  Request ID:      {approval.request_id}")
        print(f"  Service Provider: {req.aiu_name}")
        print(f"  Address:         {req.address_label}")
        print(f"  User:            {current_user.username}")
        print(f"{'='*60}\n")
        
        create_audit_log(
            db=db,
            user_id=current_user.id,
            action="deny",
            description=f"Denied consent request from {req.aiu_name}",
            request=request,
            severity="WARNING",
            payload={"request_id": approval.request_id, "aiu_name": req.aiu_name}
        )
        
        return {
            "success": True,
            "request_id": approval.request_id,
            "status": "DENIED",
            "message": "Consent denied by user"
        }
    
    # Consent approved - create consent artifact
    final_scope = approval.modified_scope or req.scope
    consent_id = secrets.token_hex(16)
    valid_until = datetime.utcnow() + timedelta(hours=req.validity_hours)
    
    db_consent = ConsentArtifact(
        consent_id=consent_id,
        request_id=approval.request_id,
        address_label=req.address_label,
        aiu_name=req.aiu_name,
        purpose=req.purpose,
        scope=final_scope,
        valid_until=valid_until,
        signature=hashlib.sha256(f"{consent_id}{current_user.id}".encode()).hexdigest()[:16],
        user_id=current_user.id,
    )
    db.add(db_consent)
    
    # Generate authorization token
    token_id = secrets.token_hex(8)
    token_expires = datetime.utcnow() + timedelta(minutes=30)
    token_data = {
        "tid": token_id,
        "cid": consent_id,
        "aiu": req.aiu_name,
        "da": req.address_label,
        "scope": final_scope,
        "exp": token_expires.isoformat()
    }
    token_string = base64.b64encode(json.dumps(token_data).encode()).decode()
    
    db_token = AuthorizationToken(
        token_id=token_id,
        consent_id=consent_id,
        token=token_string,
        aiu_name=req.aiu_name,
        address_label=req.address_label,
        scope=final_scope,
        expires_at=token_expires,
        used=False,
    )
    db.add(db_token)
    
    req.status = "APPROVED"
    req.processed_at = datetime.utcnow()
    db.commit()
    
    # Log the approval
    log_aia(
        "CONSENT GRANTED ✅",
        f"Consent ID: {consent_id[:8]}...",
        User=current_user.username,
        Address=req.address_label,
        ServiceProvider=req.aiu_name,
        Scope=", ".join(final_scope)
    )
    
    log_aia(
        "AUTHORIZATION TOKEN ISSUED",
        f"Token ID: {token_id}",
        ValidFor="30 minutes",
        Purpose=req.purpose
    )
    
    print(f"\n{'='*60}")
    print(f"  ✅ CONSENT GRANTED - TOKEN ISSUED")
    print(f"{'='*60}")
    print(f"  Request ID:      {approval.request_id}")
    print(f"  Consent ID:      {consent_id[:8]}...")
    print(f"  Token ID:        {token_id}")
    print(f"  User:            {current_user.username}")
    print(f"  Service Provider: {req.aiu_name}")
    print(f"  Address:         {req.address_label}")
    print(f"  Approved Scope:  {', '.join(final_scope)}")
    print(f"  Token Valid For: 30 minutes")
    print(f"{'='*60}\n")
    
    create_audit_log(
        db=db,
        user_id=current_user.id,
        action="approve",
        description=f"Approved consent request from {req.aiu_name}",
        request=request,
        severity="INFO",
        payload={"request_id": approval.request_id, "aiu_name": req.aiu_name, "scope": final_scope}
    )
    
    return {
        "success": True,
        "request_id": approval.request_id,
        "consent_id": consent_id,
        "authorization_token": token_string,
        "token_id": token_id,
        "scope": final_scope,
        "expires_at": token_expires.isoformat(),
        "message": "Consent granted. Authorization token issued."
    }


@router.post("/resolve-address", response_model=dict)
def resolve_address(
    *,
    db: Session = Depends(deps.get_db),
    request_in: ResolutionRequest,
) -> Any:
    """
    AIU resolves a Digital Address using an authorization token.
    Returns address data based on approved scope.
    """
    # Decode and validate token
    try:
        token_data = json.loads(base64.b64decode(request_in.token))
        token_id = token_data.get("tid")
    except:
        log_error("AIP", "Resolution failed", "Invalid token format")
        raise HTTPException(status_code=400, detail="Invalid token format")
    
    db_token = db.query(AuthorizationToken).filter(
        AuthorizationToken.token_id == token_id
    ).first()
    
    if not db_token:
        log_error("AIP", "Resolution failed", "Token not found")
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    # Check expiration
    if db_token.expires_at < datetime.utcnow():
        log_error("AIP", "Resolution failed", "Token expired")
        raise HTTPException(status_code=401, detail="Token has expired")
    
    # Check if address matches
    if db_token.address_label != request_in.address_label:
        log_error("AIP", "Resolution failed", "Address mismatch")
        raise HTTPException(status_code=403, detail="Token not valid for this address")
    
    # Log AIU resolution attempt
    log_aiu(
        "RESOLUTION REQUEST",
        f"Token ID: {token_id}",
        ServiceProvider=db_token.aiu_name,
        TargetAddress=request_in.address_label
    )
    
    # Log AIP processing
    log_aip(
        "VALIDATING TOKEN",
        f"Token ID: {token_id}",
        Status="Valid",
        Scope=", ".join(db_token.scope)
    )
    
    # Get address from database
    from app.models.user import Address
    address = db.query(Address).filter(Address.label == request_in.address_label).first()
    
    address_data = {
        "da_label": request_in.address_label,
        "resolved_at": datetime.utcnow().isoformat(),
        "token_id": token_id,
    }
    
    # Add fields based on scope using real data from database
    scope = db_token.scope
    if address:
        if "digipin" in scope:
            address_data["digipin"] = address.digipin
        if "building" in scope:
            address_data["building"] = address.building or "Not Provided"
        if "street" in scope:
            address_data["street"] = address.street or "Not Provided"
        if "landmark" in scope:
            address_data["landmark"] = address.landmark or "Not Provided"
        if "locality" in scope:
            address_data["locality"] = address.locality or "Not Provided"
        if "city" in scope:
            address_data["city"] = address.city or "Not Provided"
        if "pincode" in scope:
            address_data["pincode"] = address.pincode or "Not Provided"
        if "state" in scope:
            address_data["state"] = address.state or "Not Provided"
        if "country" in scope:
            address_data["country"] = address.country or "India"
        if "coordinates" in scope:
            address_data["latitude"] = address.latitude
            address_data["longitude"] = address.longitude
    else:
        # Fallback for PoC if address not found (should not happen with valid token)
        if "digipin" in scope:
            address_data["digipin"] = "FPC7FT5CMK"
        if "city" in scope:
            address_data["city"] = "New Delhi"
    
    # Mark token as used
    db_token.used = True
    db_token.used_at = datetime.utcnow()
    db.commit()
    
    log_aip(
        "ADDRESS RESOLVED ✅",
        f"To: {db_token.aiu_name}",
        Address=request_in.address_label,
        FieldsReturned=len(address_data) - 3  # Minus metadata fields
    )
    
    print(f"\n{'='*60}")
    print(f"  📍 ADDRESS RESOLUTION SUCCESSFUL")
    print(f"{'='*60}")
    print(f"  Token ID:        {token_id}")
    print(f"  Service Provider: {db_token.aiu_name}")
    print(f"  Address:         {request_in.address_label}")
    print(f"  Scope:           {', '.join(db_token.scope)}")
    print(f"  Data Released:")
    for key, value in address_data.items():
        if key not in ["da_label", "resolved_at", "token_id"]:
            print(f"    - {key}: {value}")
    print(f"{'='*60}\n")
    
    return {
        "success": True,
        "resolution": address_data
    }


@router.post("/revoke-consent", response_model=dict)
def revoke_consent(
    *,
    request: Request,
    db: Session = Depends(deps.get_db),
    consent_id: str,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    User revokes a previously granted consent.
    """
    consent = db.query(ConsentArtifact).filter(
        ConsentArtifact.consent_id == consent_id
    ).first()
    
    if not consent:
        raise HTTPException(status_code=404, detail="Consent not found")
    
    consent.revoked = True
    consent.revoked_at = datetime.utcnow()
    
    # Invalidate any associated tokens
    db.query(AuthorizationToken).filter(
        AuthorizationToken.consent_id == consent_id
    ).update({"used": True, "used_at": datetime.utcnow()})
    
    db.commit()
    
    log_aia(
        "CONSENT REVOKED",
        f"Consent ID: {consent_id[:8]}...",
        User=current_user.username,
        ServiceProvider=consent.aiu_name
    )
    
    print(f"\n{'='*60}")
    print(f"  🚫 CONSENT REVOKED")
    print(f"{'='*60}")
    print(f"  Consent ID:      {consent_id[:8]}...")
    print(f"  Service Provider: {consent.aiu_name}")
    print(f"  Address:         {consent.address_label}")
    print(f"  All tokens invalidated")
    print(f"{'='*60}\n")
    
    create_audit_log(
        db=db,
        user_id=current_user.id,
        action="revoke",
        description=f"Revoked consent for {consent.aiu_name}",
        request=request,
        severity="CRITICAL",
        payload={"consent_id": consent_id, "aiu_name": consent.aiu_name, "address_label": consent.address_label}
    )
    
    return {
        "success": True,
        "message": "Consent revoked successfully"
    }
