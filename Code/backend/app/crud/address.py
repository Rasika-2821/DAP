import hashlib
from typing import List

from sqlalchemy.orm import Session

from app.crud.base import CRUDBase
from app.models.user import Address
from app.schemas import AddressCreate, AddressUpdate


class CRUDAddress(CRUDBase[Address, AddressCreate, AddressUpdate]):
    def create_with_owner(
        self, db: Session, *, obj_in: AddressCreate, owner_id: int
    ) -> Address:
        db_obj = Address(
            label=obj_in.label,
            digipin=obj_in.digipin,
            latitude=obj_in.latitude,
            longitude=obj_in.longitude,
            address_type=obj_in.address_type,
            building=obj_in.building,
            street=obj_in.street,
            landmark=obj_in.landmark,
            locality=obj_in.locality,
            city=obj_in.city,
            state=obj_in.state,
            pincode=obj_in.pincode,
            country=obj_in.country,
            verification_level=obj_in.verification_level,
            provider=obj_in.provider,
            description=obj_in.description,
            owner_id=owner_id,
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def get_multi_by_owner(
        self, db: Session, *, owner_id: int, skip: int = 0, limit: int = 100
    ) -> List[Address]:
        return (
            db.query(self.model)
            .filter(Address.owner_id == owner_id)
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_by_type(self, db: Session, *, address_type: str) -> List[Address]:
        return db.query(self.model).filter(Address.address_type == address_type).all()

    @staticmethod
    def generate_digipin(latitude: float, longitude: float) -> str:
        """
        Generate a hierarchical DIGIPIN based on 4x4 grid subdivision.
        - 16-character set: 2, 3, 4, 5, 6, 7, 8, 9, C, F, J, K, L, M, P, T
        - 10 levels of subdivision
        - India bounding box (approx): Lat [6, 38], Lon [68, 98]
        """
        # Character set (16 chars)
        CHARSET = "23456789CFJKLMPT"
        
        # India bounds (Simplified for PoC)
        min_lat, max_lat = 6.0, 38.0
        min_lon, max_lon = 68.0, 98.0
        
        # Clamp coordinates to bounds
        lat = max(min_lat, min(max_lat, latitude))
        lon = max(min_lon, min(max_lon, longitude))
        
        digipin = ""
        
        # 10 levels of subdivision
        for _ in range(10):
            # Calculate 4x4 grid indices
            lat_step = (max_lat - min_lat) / 4
            lon_step = (max_lon - min_lon) / 4
            
            # Find row and column (0-3)
            row = int((lat - min_lat) / lat_step)
            col = int((lon - min_lon) / lon_step)
            
            # Clamp indices
            row = min(3, row)
            col = min(3, col)
            
            # Map (row, col) to index (0-15)
            # Row 3 is top, Col 0 is left
            index = row * 4 + col
            digipin += CHARSET[index]
            
            # Update bounds for next level
            min_lat = min_lat + (row * lat_step)
            max_lat = min_lat + lat_step
            min_lon = min_lon + (col * lon_step)
            max_lon = min_lon + lon_step
            
        return digipin


address = CRUDAddress(Address)