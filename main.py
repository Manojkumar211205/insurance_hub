import os
from dotenv import load_dotenv

load_dotenv()

if not os.getenv("MONGO_URI"):
    raise RuntimeError("MONGO_URI environment variable is not set")

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.auth import router as auth_router
from routes.insurance import router as insurance_router
from main_agent import router as agent_router

app = FastAPI(title="Insurance API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(insurance_router)
app.include_router(agent_router)
