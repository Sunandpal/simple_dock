from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from .. import crud, schemas, database

router = APIRouter(
    prefix="/docks",
    tags=["docks"],
)

@router.post("/", response_model=schemas.Dock)
async def create_dock(dock: schemas.DockCreate, db: AsyncSession = Depends(database.get_db)):
    return await crud.create_dock(db=db, dock=dock)

@router.get("/", response_model=List[schemas.Dock])
async def read_docks(skip: int = 0, limit: int = 100, db: AsyncSession = Depends(database.get_db)):
    docks = await crud.get_docks(db, skip=skip, limit=limit)
    results = []
    
    for dock in docks:
        # Convert ORM to Pydantic-compatible dict/obj
        dock_data = schemas.Dock.model_validate(dock)
        
        # Real Metrics
        metrics = await crud.get_dock_metrics(db, dock.id)
        dock_data.today_booking_count = metrics["today_booking_count"]
        dock_data.utilization_percent = metrics["utilization_percent"]
        dock_data.next_booking_info = metrics["next_booking_info"]
        
        results.append(dock_data)
        
    return results

@router.put("/{dock_id}", response_model=schemas.Dock)
async def update_dock(dock_id: int, dock: schemas.DockCreate, db: AsyncSession = Depends(database.get_db)):
    db_dock = await crud.update_dock(db, dock_id=dock_id, dock_update=dock)
    if db_dock is None:
        raise HTTPException(status_code=404, detail="Dock not found")
    
    # We need to return the dock with metrics (even if 0) to match schema
    dock_data = schemas.Dock.model_validate(db_dock)
    metrics = await crud.get_dock_metrics(db, dock_id)
    dock_data.today_booking_count = metrics["today_booking_count"]
    dock_data.utilization_percent = metrics["utilization_percent"]
    dock_data.next_booking_info = metrics["next_booking_info"]
    return dock_data

@router.delete("/{dock_id}", response_model=schemas.Dock)
async def delete_dock(dock_id: int, db: AsyncSession = Depends(database.get_db)):
    db_dock = await crud.delete_dock(db, dock_id=dock_id)
    if db_dock is None:
        raise HTTPException(status_code=404, detail="Dock not found")
    # Return deleted dock (metrics 0)
    dock_data = schemas.Dock.model_validate(db_dock)
    return dock_data
