from datetime import timedelta
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app import crud, schemas
from app.api import deps
from app.core import security
from app.core.config import settings
from app.core.logger import log_aia, log_success, log_error

router = APIRouter()


@router.post("/login/access-token", response_model=schemas.Token)
def login_access_token(
    db: Session = Depends(deps.get_db), form_data: OAuth2PasswordRequestForm = Depends()
) -> Any:
    """
    OAuth2 compatible token login, get an access token for future requests
    """
    user = crud.user.authenticate(
        db, email=form_data.username, password=form_data.password
    )
    if not user:
        log_error("AIA", "Login failed", f"Invalid credentials for: {form_data.username}")
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    elif not crud.user.is_active(user):
        log_error("AIA", "Login failed", f"Inactive user: {form_data.username}")
        raise HTTPException(status_code=400, detail="Inactive user")
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    token = security.create_access_token(user.id, expires_delta=access_token_expires)
    
    log_aia(
        "USER LOGIN ✅",
        f"User: {user.username}",
        Email=user.email,
        UserType=user.user_type or "citizen"
    )
    
    return {
        "access_token": token,
        "token_type": "bearer",
    }


@router.post("/register", response_model=schemas.User)
def register(
    *,
    db: Session = Depends(deps.get_db),
    user_in: schemas.UserCreate,
) -> Any:
    """
    Register a new user
    """
    user = crud.user.get_by_email(db, email=user_in.email)
    if user:
        log_error("AIA", "Registration failed", f"Email exists: {user_in.email}")
        raise HTTPException(
            status_code=400,
            detail="A user with this email already exists",
        )
    user = crud.user.get_by_username(db, username=user_in.username)
    if user:
        log_error("AIA", "Registration failed", f"Username exists: {user_in.username}")
        raise HTTPException(
            status_code=400,
            detail="A user with this username already exists",
        )
    user = crud.user.create(db, obj_in=user_in)
    
    log_aia(
        "USER REGISTERED ✅",
        f"New user: {user.username}",
        Email=user.email,
        FullName=user.full_name or "Not provided"
    )
    
    print(f"\n{'='*60}")
    print(f"  👤 NEW USER REGISTERED")
    print(f"{'='*60}")
    print(f"  Username: {user.username}")
    print(f"  Email:    {user.email}")
    print(f"  Name:     {user.full_name or 'Not provided'}")
    print(f"{'='*60}\n")
    
    return user


@router.get("/me", response_model=schemas.User)
def read_users_me(
    current_user: schemas.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get current user
    """
    return current_user
