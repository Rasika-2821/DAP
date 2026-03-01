from typing import Any

from fastapi import APIRouter, HTTPException
import httpx

from app import schemas

router = APIRouter()


@router.get("/ip-location", response_model=schemas.IPLocationResponse)
async def get_ip_location() -> Any:
    """
    Get location based on IP address
    """
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get("http://ip-api.com/json/")
            data = response.json()
            
            if data.get("status") == "success":
                return {
                    "latitude": data.get("lat", 0.0),
                    "longitude": data.get("lon", 0.0),
                    "city": data.get("city", ""),
                    "region": data.get("regionName", ""),
                    "country": data.get("country", ""),
                    "zipcode": data.get("zip", ""),
                }
            else:
                raise HTTPException(
                    status_code=400,
                    detail="Could not determine location from IP"
                )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching IP location: {str(e)}"
        )


@router.post("/reverse-geocode")
async def reverse_geocode(
    coords: schemas.Coordinates,
) -> Any:
    """
    Get address from coordinates using reverse geocoding
    """
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://nominatim.openstreetmap.org/reverse",
                params={
                    "lat": coords.latitude,
                    "lon": coords.longitude,
                    "format": "json",
                },
                headers={"User-Agent": "AddressAgentCentral/1.0"},
            )
            data = response.json()
            
            return {
                "display_name": data.get("display_name", ""),
                "address": data.get("address", {}),
                "latitude": coords.latitude,
                "longitude": coords.longitude,
            }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error reverse geocoding: {str(e)}"
        )
