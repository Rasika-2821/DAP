
from typing import Optional
from datetime import datetime
from pydantic import BaseModel, EmailStr

class ActivityLog(BaseModel):
    id: int
    user_id: int
    action: str
    description: str
    timestamp: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str


class TokenPayload(BaseModel):
    sub: Optional[int] = None


class UserBase(BaseModel):
    email: Optional[EmailStr] = None
    username: Optional[str] = None
    is_active: Optional[bool] = True
    is_superuser: Optional[bool] = False
    full_name: Optional[str] = None
    user_type: Optional[str] = "citizen"


class UserCreate(UserBase):
    email: EmailStr
    username: str
    password: str


class UserUpdate(UserBase):
    password: Optional[str] = None


class User(UserBase):
    id: int

    class Config:
        from_attributes = True


class AddressBase(BaseModel):
    label: Optional[str] = None
    digipin: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    address_type: Optional[str] = None
    verification_level: Optional[str] = "L1"
    provider: Optional[str] = "India Post AIP"


class AddressCreate(AddressBase):
    label: str
    digipin: str
    latitude: float
    longitude: float
    address_type: str


class AddressUpdate(AddressBase):
    pass


class Address(AddressBase):
    id: int
    owner_id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class Coordinates(BaseModel):
    latitude: float
    longitude: float


class DIGIPINResponse(BaseModel):
    digipin: str
    message: str


class IPLocationResponse(BaseModel):
    latitude: float
    longitude: float
    city: str
    region: str
    country: str
    zipcode: str