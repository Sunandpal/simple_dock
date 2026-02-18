from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import timedelta
from .. import database, models, schemas, security
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from typing import Annotated

router = APIRouter(
    prefix="/auth",
    tags=["auth"],
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/driver/login")

@router.post("/driver/signup", response_model=schemas.DriverResponse)
async def signup_driver(driver: schemas.DriverCreate, db: AsyncSession = Depends(database.get_db)):
    # Check if driver exists
    result = await db.execute(select(models.Driver).where(models.Driver.phone == driver.phone))
    existing_driver = result.scalars().first()
    if existing_driver:
        raise HTTPException(status_code=400, detail="Phone number already registered")
    
    hashed_password = security.get_password_hash(driver.password)
    new_driver = models.Driver(
        phone=driver.phone,
        name=driver.name,
        hashed_password=hashed_password
    )
    db.add(new_driver)
    await db.commit()
    await db.refresh(new_driver)
    return new_driver

@router.post("/driver/login", response_model=schemas.Token)
async def login_driver(form_data: Annotated[OAuth2PasswordRequestForm, Depends()], db: AsyncSession = Depends(database.get_db)):
    # Note: OAuth2PasswordRequestForm expects 'username' and 'password'. We use phone as username.
    result = await db.execute(select(models.Driver).where(models.Driver.phone == form_data.username))
    driver = result.scalars().first()
    
    if not driver or not security.verify_password(form_data.password, driver.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect phone or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=security.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        data={"sub": driver.phone}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

async def get_current_driver(token: Annotated[str, Depends(oauth2_scheme)], db: AsyncSession = Depends(database.get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = security.jwt.decode(token, security.SECRET_KEY, algorithms=[security.ALGORITHM])
        phone: str = payload.get("sub")
        if phone is None:
            raise credentials_exception
        token_data = schemas.TokenData(phone=phone)
    except security.JWTError:
        raise credentials_exception
        
    result = await db.execute(select(models.Driver).where(models.Driver.phone == token_data.phone))
    driver = result.scalars().first()
    if driver is None:
        raise credentials_exception
    return driver

@router.get("/driver/me", response_model=schemas.DriverResponse)
async def read_users_me(current_driver: Annotated[schemas.DriverResponse, Depends(get_current_driver)]):
    return current_driver
