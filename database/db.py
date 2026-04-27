import os
from pymongo import MongoClient
from pymongo.database import Database
from pymongo.collection import Collection


def get_db() -> Database:
    """Returns the insurance_mcp database."""
    mongo_uri = os.environ.get("MONGO_URI")
    if not mongo_uri:
        raise RuntimeError("MONGO_URI environment variable is not set")
    client = MongoClient(mongo_uri)
    return client["insurance_mcp"]


def get_users_collection() -> Collection:
    """Returns the users collection."""
    return get_db()["users"]


def get_insurance_collection() -> Collection:
    """Returns the user_insurance collection."""
    return get_db()["user_insurance"]

def get_insurance_available_collection() -> Collection:
    """Returns the insurance_available collection."""
    return get_db()["insurance_available"]


def get_main_agent_memory_collection() -> Collection:
    """Returns the main_agent_memory collection."""
    return get_db()["main_agent_memory"]


def get_suggestion_memory_collection() -> Collection:
    """Returns the suggestion_memory collection."""
    return get_db()["suggestion_memory"]


def get_user_feedbacks_collection() -> Collection:
    """Returns the user_feedbacks collection."""
    return get_db()["user_feedbacks"]


def get_user_claim_requests_collection() -> Collection:
    """Returns the user_claim_requests collection."""
    return get_db()["user_claim_requests"]


def get_insurance_applications_collection() -> Collection:
    """Returns the insurance_applications collection."""
    return get_db()["insurance_applications"]
