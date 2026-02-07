from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from typing import List
from .. import database, models, schemas

router = APIRouter(
    prefix="/drivers",
    tags=["drivers"],
)

@router.get("/", response_model=List[schemas.DriverSummary])
async def get_drivers(db: AsyncSession = Depends(database.get_db)):
    """
    Aggregate bookings by driver_phone to create a registry of drivers.
    """
    stmt = (
        select(
            models.Booking.driver_phone,
            func.max(models.Booking.carrier_name).label("carrier_name"),
            func.count(models.Booking.id).label("total_visits"),
            func.max(models.Booking.start_time).label("last_visit")
        )
        .where(models.Booking.driver_phone.isnot(None))
        .where(models.Booking.driver_phone != "")
        .group_by(models.Booking.driver_phone)
        .order_by(desc("last_visit"))
    )

    result = await db.execute(stmt)
    rows = result.all()

    drivers = []
    for row in rows:
        drivers.append(schemas.DriverSummary(
            driver_phone=row.driver_phone,
            carrier_name=row.carrier_name or "Unknown",
            total_visits=row.total_visits,
            last_visit=row.last_visit,
            status="Active" # Default status for now
        ))
    
    return drivers
