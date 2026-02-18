from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from .database import engine, Base
from .routers import docks, bookings, drivers, auth

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Create tables
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
            
            # Auto-Migration for SQLite/Postgres: Add missing columns if table exists but column doesn't
            # This is a lightweight "migration" for this specific update
            from sqlalchemy import text
            
            # Check for odoo_order_id in bookings
            # Note: This is a hacky check but works for both SQLite and PG for this specific case
            try:
                await conn.execute(text("SELECT odoo_order_id FROM bookings LIMIT 1"))
            except Exception:
                print("Migrating: Adding odoo_order_id to bookings")
                await conn.execute(text("ALTER TABLE bookings ADD COLUMN odoo_order_id INTEGER"))
            
            # Seed Default Dock if empty
            res = await conn.execute(text("SELECT count(*) FROM docks"))
            if res.scalar() == 0:
                print("Seeding default Dock 1")
                # We use raw SQL for simplicity to avoid circular imports with models if possible, 
                # but standard SQL 'INSERT' works for both.
                # capabilities is JSON. '["General"]' is valid JSON.
                # is_active=1 (True)
                # Using text() to be safe across generic drivers
                await conn.execute(text("INSERT INTO docks (name, capabilities, is_active) VALUES ('Dock 1', '[\"General\"]', 1)"))
                
    except Exception as e:
        print(f"Database Startup Error: {e}")
    yield
    # Shutdown

app = FastAPI(title="SimpleDock API", version="0.1.0", lifespan=lifespan)

# Allow CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(docks.router)
app.include_router(bookings.router)
app.include_router(drivers.router)
app.include_router(auth.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to SimpleDock API"}
