import os
from dotenv import load_dotenv
from pymongo import MongoClient

load_dotenv()

_mongo = MongoClient(os.getenv("MONGO_URI"))
_insurance_col = _mongo["insurance_mcp"]["user_insurance"]


def get_user_insurance(user_id: str) -> list[dict]:
    """
    Fetch all insurance entries for a given user_id from user_insurance collection.

    Args:
        user_id: The user's ID string.

    Returns:
        List of InsuranceEntry dicts (insurance_name, insurance_date),
        or empty list if no record found.
    """
    record = _insurance_col.find_one({"userid": user_id})
    if not record:
        return []
    return record.get("insurance_obtained", [])
