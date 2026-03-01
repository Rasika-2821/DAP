from typing import Any, List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import crud, models, schemas
from app.api import deps
from app.core.logger import log_aip, log_cm, log_success, log_error

router = APIRouter()


@router.get("/", response_model=List[schemas.Address])
def read_addresses(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Retrieve addresses for current user
    """
    addresses = crud.address.get_multi_by_owner(
        db=db, owner_id=current_user.id, skip=skip, limit=limit
    )
    log_aip(
        "ADDRESSES RETRIEVED",
        f"User: {current_user.username}",
        Count=len(addresses)
    )
    return addresses


@router.post("/", response_model=schemas.Address)
def create_address(
    *,
    db: Session = Depends(deps.get_db),
    address_in: schemas.AddressCreate,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Create new address with label format: username@type (e.g., rasika@home)
    The username is automatically taken from the logged-in user.
    """
    # Auto-generate label using logged-in user's username
    if address_in.label:
        # If label contains @, extract the suffix (type) part
        if "@" in address_in.label:
            address_type = address_in.label.split("@")[-1]
        else:
            # If no @, treat the whole label as the address type
            address_type = address_in.label
        
        # Always use the current user's username as the prefix
        address_in.label = f"{current_user.username}@{address_type}"
        address_in.address_type = address_type
    
    # Log suffix discovery
    if "@" in address_in.label:
        suffix = address_in.label.split("@")[-1]
        log_cm(
            "SUFFIX LOOKUP",
            f"Suffix: @{suffix}",
            Provider="India Post AIP"
        )
    
    address = crud.address.create_with_owner(
        db=db, obj_in=address_in, owner_id=current_user.id
    )
    
    log_aip(
        "ADDRESS CREATED ✅",
        f"Label: {address.label}",
        DIGIPIN=address.digipin,
        Owner=current_user.username,
        Type=address.address_type,
        VerificationLevel=address.verification_level
    )
    
    print(f"\n{'='*60}")
    print(f"  📍 NEW DIGITAL ADDRESS CREATED")
    print(f"{'='*60}")
    print(f"  Label:      {address.label}")
    print(f"  DIGIPIN:    {address.digipin}")
    print(f"  Owner:      {current_user.username}")
    print(f"  Type:       {address.address_type}")
    print(f"  Location:   ({address.latitude}, {address.longitude})")
    print(f"  Level:      {address.verification_level} (Registry Verified)")
    print(f"{'='*60}\n")
    
    return address


@router.get("/{address_id}", response_model=schemas.Address)
def read_address(
    *,
    db: Session = Depends(deps.get_db),
    address_id: int,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get address by ID
    """
    address = crud.address.get(db=db, id=address_id)
    if not address:
        log_error("AIP", "Address lookup failed", f"ID: {address_id}")
        raise HTTPException(status_code=404, detail="Address not found")
    if address.owner_id != current_user.id:
        log_error("AIP", "Access denied", f"User {current_user.username} tried to access address {address_id}")
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    log_aip("ADDRESS LOOKUP", f"Label: {address.label}", By=current_user.username)
    return address


@router.put("/{address_id}", response_model=schemas.Address)
def update_address(
    *,
    db: Session = Depends(deps.get_db),
    address_id: int,
    address_in: schemas.AddressUpdate,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Update an address
    """
    address = crud.address.get(db=db, id=address_id)
    if not address:
        raise HTTPException(status_code=404, detail="Address not found")
    if address.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    old_label = address.label
    address = crud.address.update(db=db, db_obj=address, obj_in=address_in)
    
    log_aip(
        "ADDRESS UPDATED",
        f"Label: {address.label}",
        By=current_user.username
    )
    
    return address


@router.delete("/{address_id}", response_model=schemas.Address)
def delete_address(
    *,
    db: Session = Depends(deps.get_db),
    address_id: int,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Delete an address
    """
    address = crud.address.get(db=db, id=address_id)
    if not address:
        raise HTTPException(status_code=404, detail="Address not found")
    if address.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    label = address.label
    address = crud.address.remove(db=db, id=address_id)
    
    log_aip(
        "ADDRESS DELETED",
        f"Label: {label}",
        By=current_user.username
    )
    
    return address


@router.post("/generate-digipin", response_model=schemas.DIGIPINResponse)
def generate_digipin(
    *,
    coords: schemas.Coordinates,
) -> Any:
    """
    Generate a DIGIPIN from coordinates (no auth required)
    """
    digipin = crud.address.generate_digipin(coords.latitude, coords.longitude)
    
    log_aip(
        "DIGIPIN GENERATED",
        f"Code: {digipin}",
        Coordinates=f"({coords.latitude}, {coords.longitude})"
    )
    
    return {"digipin": digipin, "message": "DIGIPIN generated successfully"}
