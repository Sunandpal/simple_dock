from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, JSON, Enum
from sqlalchemy.orm import relationship
import enum
from .database import Base

class BookingStatus(str, enum.Enum):
    PENDING = "Pending"
    CONFIRMED = "Confirmed"
    CANCELLED = "Cancelled"
    ARRIVED = "Arrived"
    COMPLETED = "Completed"
    LATE = "Late"
    RESCHEDULED = "Rescheduled"

class Dock(Base):
    __tablename__ = "docks"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    capabilities = Column(JSON, default=[]) # e.g. ["Cold Storage", "General"]
    is_active = Column(Boolean, default=True)

    bookings = relationship("Booking", back_populates="dock")

class Booking(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)
    dock_id = Column(Integer, ForeignKey("docks.id"))
    start_time = Column(DateTime, index=True)
    end_time = Column(DateTime, index=True)
    carrier_name = Column(String)
    po_number = Column(String, index=True)
    status = Column(Enum(BookingStatus), default=BookingStatus.PENDING)
    driver_phone = Column(String)

    dock = relationship("Dock", back_populates="bookings")
