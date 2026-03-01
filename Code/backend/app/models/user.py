from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.base_class import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    full_name = Column(String)
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    user_type = Column(String, default="citizen")  # citizen or provider
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    addresses = relationship("Address", back_populates="owner")
    consent_requests = relationship("ConsentRequest", back_populates="user", foreign_keys="ConsentRequest.user_id")
    consent_artifacts = relationship("ConsentArtifact", back_populates="user")


class Address(Base):
    __tablename__ = "addresses"

    id = Column(Integer, primary_key=True, index=True)
    label = Column(String, index=True)  # e.g., "vikram@home"
    digipin = Column(String, unique=True, index=True)
    latitude = Column(Float)
    longitude = Column(Float)
    address_type = Column(String)  # extracted from label, e.g., "home", "office"
    
    # Descriptive address fields
    building = Column(String, nullable=True)
    street = Column(String, nullable=True)
    landmark = Column(String, nullable=True)
    locality = Column(String, nullable=True)
    city = Column(String, nullable=True)
    state = Column(String, nullable=True)
    pincode = Column(String, nullable=True)
    country = Column(String, default="India")
    
    verification_level = Column(String, default="L1")  # L1, L2, L3
    provider = Column(String, default="India Post AIP")
    description = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    owner_id = Column(Integer, ForeignKey("users.id"))
    owner = relationship("User", back_populates="addresses")


class ConsentRequest(Base):
    """Stores consent requests from AIUs (Address Information Users/Service Providers)"""
    __tablename__ = "consent_requests"

    id = Column(Integer, primary_key=True, index=True)
    request_id = Column(String, unique=True, index=True)  # e.g., "CR-000001"
    address_label = Column(String, index=True)  # e.g., "vikram@home"
    aiu_name = Column(String)  # Name of service provider
    purpose = Column(String)  # DELIVERY, KYC, EMERGENCY, etc.
    purpose_description = Column(String)
    scope = Column(JSON)  # List of data fields requested: ["digipin", "city", "pincode"]
    validity_hours = Column(Integer, default=24)
    status = Column(String, default="PENDING")  # PENDING, APPROVED, DENIED, EXPIRED
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True))
    processed_at = Column(DateTime(timezone=True))

    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    user = relationship("User", back_populates="consent_requests", foreign_keys=[user_id])


class ConsentArtifact(Base):
    """Stores approved consent artifacts with signatures"""
    __tablename__ = "consent_artifacts"

    id = Column(Integer, primary_key=True, index=True)
    consent_id = Column(String, unique=True, index=True)  # Unique consent identifier
    request_id = Column(String, ForeignKey("consent_requests.request_id"))
    address_label = Column(String, index=True)
    aiu_name = Column(String)
    purpose = Column(String)
    scope = Column(JSON)  # Approved scope (may be modified from request)
    approved_at = Column(DateTime(timezone=True), server_default=func.now())
    valid_until = Column(DateTime(timezone=True))
    signature = Column(String)  # Digital signature for verification
    revoked = Column(Boolean, default=False)
    revoked_at = Column(DateTime(timezone=True))

    user_id = Column(Integer, ForeignKey("users.id"))
    user = relationship("User", back_populates="consent_artifacts")
    
    request = relationship("ConsentRequest")



class AuthorizationToken(Base):
    """Stores authorization tokens issued after consent approval"""
    __tablename__ = "authorization_tokens"

    id = Column(Integer, primary_key=True, index=True)
    token_id = Column(String, unique=True, index=True)
    consent_id = Column(String, ForeignKey("consent_artifacts.consent_id"))
    token = Column(Text)  # Base64 encoded token data
    aiu_name = Column(String)
    address_label = Column(String)
    scope = Column(JSON)
    issued_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True))
    used = Column(Boolean, default=False)
    used_at = Column(DateTime(timezone=True))

    consent = relationship("ConsentArtifact")


class VerificationRequest(Base):
    """Stores AAVA physical verification requests persistently"""
    __tablename__ = "verification_requests"

    id = Column(Integer, primary_key=True, index=True)
    request_id = Column(String, unique=True, index=True)  # e.g., "AAVA-VR-000001"
    address_id = Column(Integer, ForeignKey("addresses.id"))
    address_label = Column(String)
    digipin = Column(String)
    latitude = Column(Float)
    longitude = Column(Float)
    requester_id = Column(String)
    requester_name = Column(String)
    purpose = Column(String)
    status = Column(String, default="PENDING")  # PENDING, VERIFIED, REJECTED
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    verified_at = Column(DateTime(timezone=True))
    field_agent = Column(String)
    notes = Column(Text)

    address = relationship("Address")


# ActivityLog model for logging user actions (Audit Log)
class ActivityLog(Base):
    __tablename__ = "activity_logs"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    action = Column(String)  # access, create, revoke, verify
    description = Column(String)
    
    # Audit fields
    ip_address = Column(String, nullable=True)
    user_agent = Column(String, nullable=True)
    severity = Column(String, default="INFO")  # INFO, WARNING, CRITICAL
    payload = Column(Text, nullable=True)  # Store JSON dumps
    
    timestamp = Column(DateTime(timezone=True), server_default=func.now())