from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List
from sqlalchemy import and_, or_
from . import models, schemas
from datetime import datetime, date

async def get_docks(db: AsyncSession, skip: int = 0, limit: int = 100):
    result = await db.execute(select(models.Dock).offset(skip).limit(limit))
    return result.scalars().all()

async def create_dock(db: AsyncSession, dock: schemas.DockCreate):
    db_dock = models.Dock(**dock.model_dump())
    db.add(db_dock)
    await db.commit()
    await db.refresh(db_dock)
    return db_dock

async def get_bookings(db: AsyncSession, skip: int = 0, limit: int = 100, dock_id: int = None, date_filter: date = None):
    stmt = select(models.Booking)
    
    constraints = []
    if dock_id:
        constraints.append(models.Booking.dock_id == dock_id)
        
    if date_filter:
        start_of_day = datetime.combine(date_filter, datetime.min.time())
        end_of_day = datetime.combine(date_filter, datetime.max.time())
        constraints.append(models.Booking.start_time >= start_of_day)
        constraints.append(models.Booking.start_time <= end_of_day)
        
    if constraints:
        stmt = stmt.where(and_(*constraints))
        
    stmt = stmt.offset(skip).limit(limit)
    result = await db.execute(stmt)
    return result.scalars().all()

async def create_booking(db: AsyncSession, booking: schemas.BookingCreate):
    # Overlap Check
    # (StartA < EndB) and (EndA > StartB)
    stmt = select(models.Booking).where(
        and_(
            models.Booking.dock_id == booking.dock_id,
            models.Booking.start_time < booking.end_time,
            models.Booking.end_time > booking.start_time,
            models.Booking.status != models.BookingStatus.CANCELLED
        )
    )
    result = await db.execute(stmt)
    overlapping = result.scalars().first()
    
    if overlapping:
        return None # Indicate failure

    db_booking = models.Booking(**booking.model_dump(), status=models.BookingStatus.CONFIRMED)
    db.add(db_booking)
    await db.commit()
    db.add(db_booking)
    await db.commit()
    await db.refresh(db_booking)
    return db_booking

async def update_booking(db: AsyncSession, booking_id: int, booking_update: schemas.BookingUpdate):
    result = await db.execute(select(models.Booking).where(models.Booking.id == booking_id))
    db_booking = result.scalars().first()
    if db_booking:
        # Update fields if provided
        if booking_update.status:
            db_booking.status = booking_update.status
        if booking_update.dock_id:
            db_booking.dock_id = booking_update.dock_id
        if booking_update.start_time:
            db_booking.start_time = booking_update.start_time
        if booking_update.end_time:
            db_booking.end_time = booking_update.end_time
            
        await db.commit()
        await db.refresh(db_booking)
    return db_booking

async def update_dock(db: AsyncSession, dock_id: int, dock_update: schemas.DockCreate):
    result = await db.execute(select(models.Dock).where(models.Dock.id == dock_id))
    db_dock = result.scalars().first()
    if db_dock:
        db_dock.name = dock_update.name
        db_dock.capabilities = dock_update.capabilities
        db_dock.is_active = dock_update.is_active
        await db.commit()
        await db.refresh(db_dock)
    return db_dock

async def delete_dock(db: AsyncSession, dock_id: int):
    result = await db.execute(select(models.Dock).where(models.Dock.id == dock_id))
    db_dock = result.scalars().first()
    if db_dock:
        await db.delete(db_dock)
        await db.commit()
    return db_dock

from sqlalchemy import func


async def get_dock_metrics(db: AsyncSession, dock_id: int):
    today = date.today()
    # Count Bookings Today
    # Note: SQLite date comparisons can be tricky, but usually standard comparison works if stored as ISO string/datetime.
    # We'll filter by start_time >= today midnight.
    
    # Construct start of today
    start_of_day = datetime.combine(today, datetime.min.time())
    end_of_day = datetime.combine(today, datetime.max.time())

    # Count
    stmt_count = select(func.count(models.Booking.id)).where(
        and_(
            models.Booking.dock_id == dock_id,
            models.Booking.start_time >= start_of_day,
            models.Booking.start_time <= end_of_day,
            models.Booking.status != models.BookingStatus.CANCELLED
        )
    )
    result_count = await db.execute(stmt_count)
    count = result_count.scalar() or 0

    # Utilization (Mock formula: Count / 8 slots * 100) -> Cap at 100
    utilization = min(int((count / 8) * 100), 100)

    # Next Booking
    now = datetime.now()
    stmt_next = select(models.Booking).where(
        and_(
            models.Booking.dock_id == dock_id,
            models.Booking.start_time >= now,
            models.Booking.status != models.BookingStatus.CANCELLED
        )
    ).order_by(models.Booking.start_time).limit(1)
    
    result_next = await db.execute(stmt_next)
    next_booking = result_next.scalars().first()
    
    next_info = None
    if next_booking:
        # Format: "HH:MM - Carrier"
        next_info = f"{next_booking.start_time.strftime('%H:%M')} - {next_booking.carrier_name}"

    return {
        "today_booking_count": count,
        "utilization_percent": utilization,
        "next_booking_info": next_info
    }
