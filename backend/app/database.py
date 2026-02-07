import os
from dotenv import load_dotenv, find_dotenv
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base

# Load .env file (looks in current dir and upwards)
load_dotenv(find_dotenv())

# Production (Postgres) or Local Dev (SQLite)
# If DATABASE_URL is set in env (e.g. via Render/Railway/Docker), use it.
# Otherwise, fallback to local SQLite file.
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    DATABASE_URL = "sqlite+aiosqlite:///./simpledock.db"

engine = create_async_engine(DATABASE_URL, echo=True)
AsyncSessionLocal = sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

Base = declarative_base()

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
