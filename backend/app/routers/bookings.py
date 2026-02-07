from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from .. import crud, schemas, database

router = APIRouter(
    prefix="/bookings",
    tags=["bookings"],
)

def send_notification(booking_ref: str, time_str: str):
    # Mock Notification
    print(f"XXX NOTICE: Booking {booking_ref} Confirmed for {time_str} [Sent via WhatsApp] XXX")

@router.post("/", response_model=schemas.Booking)
async def create_booking(booking: schemas.BookingCreate, background_tasks: BackgroundTasks, db: AsyncSession = Depends(database.get_db)):
    db_booking = await crud.create_booking(db=db, booking=booking)
    if not db_booking:
        raise HTTPException(status_code=400, detail="Time slot already booked")
    
    # Generate booking ref (Simple ID based for MVP)
    booking_ref = f"BK-{db_booking.id:04d}"
    background_tasks.add_task(send_notification, booking_ref, str(db_booking.start_time))
    
    return db_booking

from datetime import date
from typing import Optional

@router.get("/", response_model=List[schemas.Booking])
async def read_bookings(skip: int = 0, limit: int = 100, dock_id: Optional[int] = None, date: Optional[date] = None, db: AsyncSession = Depends(database.get_db)):
    return await crud.get_bookings(db, skip=skip, limit=limit, dock_id=dock_id, date_filter=date)

@router.put("/{booking_id}", response_model=schemas.Booking)
async def update_booking(booking_id: int, booking_update: schemas.BookingUpdate, db: AsyncSession = Depends(database.get_db)):
    db_booking = await crud.update_booking(db, booking_id, booking_update)
    if not db_booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    return db_booking
