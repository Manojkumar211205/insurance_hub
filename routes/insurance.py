from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
import os
import tempfile
from datetime import date

from auth.dependencies import get_current_user
from database.db import (
    get_insurance_collection,
    get_insurance_available_collection,
    get_main_agent_memory_collection,
    get_suggestion_memory_collection,
    get_users_collection,
    get_user_feedbacks_collection,
    get_user_claim_requests_collection,
    get_insurance_applications_collection,
)
from models.schemas import InsuranceEntry

router = APIRouter()

SUPPORTED_EXTENSIONS = {".pdf", ".docx", ".pptx", ".txt"}


@router.get("/insurance-obtained", status_code=200)
async def get_insurance(user_id: str = Depends(get_current_user)) -> dict:
    col = get_insurance_collection()
    record = col.find_one({"userid": user_id})
    if not record:
        return {"insurance_obtained": []}
    return {"insurance_obtained": record.get("insurance_obtained", [])}


@router.post("/insurance-obtained", status_code=201)
async def add_insurance_entry(
    entry: InsuranceEntry,
    user_id: str = Depends(get_current_user),
) -> dict:
    col = get_insurance_collection()
    col.update_one(
        {"userid": user_id},
        {"$push": {"insurance_obtained": entry.model_dump()}, "$setOnInsert": {"userid": user_id}},
        upsert=True,
    )
    record = col.find_one({"userid": user_id})
    record.pop("_id", None)
    return record


@router.post("/add-insurance", status_code=201)
async def upload_insurance(
    insurance_name: str = Form(...),
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user),
) -> dict:
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in SUPPORTED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Unsupported file type: {ext}",
        )

    from doc_processing import process_and_store_document

    tmp_path = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmp:
            tmp.write(await file.read())
            tmp_path = tmp.name

        success = process_and_store_document(tmp_path, collection_name=insurance_name)
    except Exception:
        success = False
    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.remove(tmp_path)

    if not success:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="Document could not be processed",
        )

    entry = InsuranceEntry(
        insurance_name=insurance_name,
        insurance_date=date.today().isoformat(),
    )
    col = get_insurance_collection()
    col.update_one(
        {"userid": user_id},
        {"$push": {"insurance_obtained": entry.model_dump()}, "$setOnInsert": {"userid": user_id}},
        upsert=True,
    )
    record = col.find_one({"userid": user_id})
    record.pop("_id", None)
    return record


@router.get("/insurance-available", status_code=200)
async def get_all_insurance_available() -> dict:
    col = get_insurance_available_collection()
    records = list(col.find({}))
    for record in records:
        record.pop("_id", None)
    return {"insurance_available": records}


@router.delete("/clear-memory", status_code=200)
async def clear_user_memory(user_id: str = Depends(get_current_user)) -> dict:
    """Delete all past agent and suggestion memory for the authenticated user."""
    agent_result = get_main_agent_memory_collection().delete_many({"userid": user_id})
    suggestion_result = get_suggestion_memory_collection().delete_many({"user_id": user_id})
    return {
        "message": "Memory cleared successfully.",
        "deleted": {
            "main_agent_memory": agent_result.deleted_count,
            "suggestion_memory": suggestion_result.deleted_count,
        },
    }


@router.get("/user-profile", status_code=200)
async def get_user_profile(user_id: str = Depends(get_current_user)) -> dict:
    """Return user account details along with all insurances they have purchased."""
    from bson import ObjectId

    user = get_users_collection().find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    insurance_record = get_insurance_collection().find_one({"userid": user_id})
    insurances = insurance_record.get("insurance_obtained", []) if insurance_record else []

    return {
        "user_id": str(user["_id"]),
        "username": user.get("username", ""),
        "email": user.get("email", ""),
        "insurance_obtained": insurances,
    }


@router.get("/feedbacks", status_code=200)
async def get_user_feedbacks(user_id: str = Depends(get_current_user)) -> dict:
    """Return all feedbacks submitted by the authenticated user."""
    col = get_user_feedbacks_collection()
    records = list(col.find({"userid": user_id}))
    for r in records:
        r["_id"] = str(r["_id"])
    return {"feedbacks": records}


@router.get("/claim-requests", status_code=200)
async def get_user_claim_requests(user_id: str = Depends(get_current_user)) -> dict:
    """Return all claim requests submitted by the authenticated user."""
    col = get_user_claim_requests_collection()
    records = list(col.find({"userid": user_id}))
    for r in records:
        r["_id"] = str(r["_id"])
    return {"claim_requests": records}


@router.get("/insurance-applications", status_code=200)
async def get_user_insurance_applications(user_id: str = Depends(get_current_user)) -> dict:
    """Return all insurance applications submitted by the authenticated user."""
    col = get_insurance_applications_collection()
    records = list(col.find({"userid": user_id}))
    for r in records:
        r["_id"] = str(r["_id"])
    return {"insurance_applications": records}
