import bcrypt
from fastapi import APIRouter, HTTPException, status

from auth.dependencies import create_access_token
from database.db import get_users_collection
from models.schemas import UserSignin, UserSignup

router = APIRouter()


@router.post("/signup", status_code=status.HTTP_201_CREATED)
async def signup(data: UserSignup) -> dict:
    users = get_users_collection()

    if users.find_one({"email": data.email}):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    hashed = bcrypt.hashpw(data.password.encode("utf-8"), bcrypt.gensalt())
    result = users.insert_one(
        {
            "username": data.username,
            "email": data.email,
            "password": hashed.decode("utf-8"),
        }
    )

    return {"id": str(result.inserted_id), "username": data.username}


@router.post("/signin", status_code=status.HTTP_200_OK)
async def signin(data: UserSignin) -> dict:
    users = get_users_collection()

    user = users.find_one({"email": data.email})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )

    if not bcrypt.checkpw(data.password.encode("utf-8"), user["password"].encode("utf-8")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )

    token = create_access_token({"sub": str(user["_id"])})
    return {"access_token": token, "token_type": "bearer"}
