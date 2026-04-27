import os
import sys

# Ensure the root project directory is in the path so we can import agents
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from mcp.server.fastmcp import FastMCP

from agents.insurance_suggestion_agent import insurance_suggestion
from agents.claim_process import get_claim_process
from agents.coverage_check_agent import coverage_check
from agents.user_details import get_user_insurance

# Initialize FastMCP Server
mcp = FastMCP("Insurance MCP Server")

@mcp.tool()
def suggest_insurance(user_id: str, user_message: str) -> str:
    """
    Suggests personalized insurance based on user details (age, income, etc.).
    If this tool returns a question, YOU MUST NOT CALL IT AGAIN. You must relay the question to the user directly so the user can answer it!,
    come to me only if user need to take any new insurance or need to research on it. dont come to me when user working with his existing things.
    
    """
    return insurance_suggestion(user_id, user_message)

@mcp.tool()
def claim_procedure(user_message: str) -> str:
    """
    i can give the claim procedure for user based on the insureance they already taken, content on claim procedure should be always be done by me,
    i can give step by step procedure to claim the insurance.
    user input should have the entier scenario of the user.
    """
    return get_claim_process(user_message)

@mcp.tool()
def check_coverage(user_id: str, index_names: list[str], user_query: str) -> str:
    """
    i can give best insurance to claim based on user real world scenario and  index names. details based user insurance name (you can get the user insrance details from fetch_user_insurance tool)
    i can be used when user have know point what to claim and where to. in this case just call fetch user insurance tool and give me the required index_names , and also the user query,
    i can compare multiple insurances and give best insurance to claim based on user requirement.
    finally the index_name should match with insuarance name in the user details(output for fetch_user_insurance).
    """
    return coverage_check(user_id, index_names, user_query)

@mcp.tool()
def fetch_user_insurance(user_id: str) -> str:
    """
    based on the user id i can give all the insurances optained by the user from the database
    """
    import json
    data = get_user_insurance(user_id)
    if not data:
        return "No insurance found for this user."
    return json.dumps(data, indent=2)


@mcp.tool()
def store_user_feedback(user_id: str, rating: int, comment: str) -> str:
    """
    i can update positive and negative feedbacks on company side. comment show the user feedback and you can assume rating from the comment
    """
    import json
    from datetime import datetime, timezone
    from pymongo import MongoClient

    if rating < 1 or rating > 5:
        return "Rating must be between 1 and 5."

    mongo = MongoClient(os.getenv("MONGO_URI"))
    col = mongo["insurance_mcp"]["user_feedbacks"]
    doc = {
        "userid": user_id,
        "rating": rating,
        "comment": comment,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    col.insert_one(doc)
    return json.dumps({"message": "Feedback stored successfully.", "rating": rating, "comment": comment})


@mcp.tool()
def store_claim_request(user_id: str, insurance_name: str, claim_description: str, claim_amount: float) -> str:
    """
    if user need to apply for any claim can call me it will store in the database, insurance_name should match the insurance name in fetch_user_insurance output.
    """
    import json
    from datetime import datetime, timezone
    from pymongo import MongoClient

    mongo = MongoClient(os.getenv("MONGO_URI"))
    col = mongo["insurance_mcp"]["user_claim_requests"]
    doc = {
        "userid": user_id,
        "insurance_name": insurance_name,
        "claim_description": claim_description,
        "claim_amount": claim_amount,
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    col.insert_one(doc)
    return json.dumps({
        "message": "Claim request submitted successfully.",
        "insurance_name": insurance_name,
        "claim_amount": claim_amount,
        "status": "pending",
    })


@mcp.tool()
def new_insurance_application(user_id: str, insurance_type: str, applicant_age: int, reason: str) -> str:
    """
    Apply for a new insurance policy. Use this when the user wants to submit an application for a new insurance.
    insurance_type is the type of insurance the user wants to apply for (e.g. health, motor, life, home).
    applicant_name is the full name of the applicant.
    applicant_age is the age of the applicant.
    reason is why the user wants this insurance or any additional details.
    """
    import json
    from datetime import datetime, timezone
    from pymongo import MongoClient

    mongo = MongoClient(os.getenv("MONGO_URI"))
    col = mongo["insurance_mcp"]["insurance_applications"]
    doc = {
        "userid": user_id,
        "insurance_type": insurance_type,
        "applicant_age": applicant_age,
        "reason": reason,
        "status": "submitted",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    col.insert_one(doc)
    return json.dumps({
        "message": "Insurance application submitted successfully.",
        "insurance_type": insurance_type,
        "status": "submitted",
    })


if __name__ == "__main__":
    # Suppress all print statements so they don't corrupt the MCP stdio JSON-RPC protocol
    import builtins
    builtins.print = lambda *args, **kwargs: None
    
    # Start the MCP server using stdio transport
    mcp.run()

