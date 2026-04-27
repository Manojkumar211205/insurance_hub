import os
from dotenv import load_dotenv
from pymongo import MongoClient

from rag_system import RAGSystem
from services.llms import LLMInterface

# Load environment variables
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "..", ".env"), override=True)

# ---------------------------------------------------------------------------
# Singletons (lazy-initialized on first use)
# ---------------------------------------------------------------------------
_llm_instance = None
_mongo = MongoClient(os.getenv("MONGO_URI"))
_avail_col = _mongo["insurance_mcp"]["insurance_available"]

def _llm() -> LLMInterface:
    global _llm_instance
    if _llm_instance is None:
        _llm_instance = LLMInterface()
    return _llm_instance

# ---------------------------------------------------------------------------
# Database Helpers
# ---------------------------------------------------------------------------
def _get_available_indexes() -> list[str]:
    """Return list of available insurance indexes from MongoDB."""
    docs = _avail_col.find({}, {"insurance_available": 1, "_id": 0})
    indexes = []
    for doc in docs:
        val = doc.get("insurance_available")
        if isinstance(val, list):
            for v in val:
                if v and v not in indexes:
                    indexes.append(v)
        elif val and val not in indexes:
            indexes.append(val)
    return indexes

# ---------------------------------------------------------------------------
# Agent Logic Functions
# ---------------------------------------------------------------------------
def _extract_insurance_name(user_message: str, available_indexes: list[str]) -> str:
    """Uses LLM to match the user's message to one of the available indexes."""
    indexes_str = "\n".join(f"- {idx}" for idx in available_indexes)
    prompt = f"""You are an insurance assistant.
The user is asking about a claim process. 
User message: "{user_message}"

Available insurance indexes in our system:
{indexes_str}

Which of the available indexes best matches the user's insurance?
If you find a clear match based on the company name and type (e.g. Health, Life, Motor), reply ONLY with the exact index name from the list.
If you cannot determine a match with confidence, reply with "UNKNOWN".
"""
    reply = _llm().nvidiaResponse(prompt, temperature=0.1).strip()
    return reply

def _rag_search(index_name: str, query: str, top_k: int = 5) -> str:
    """Searches the appropriate index for claim details."""
    rag = RAGSystem(index_name=index_name)
    results = rag.hybrid_search(query, top_k=top_k)
    chunks = [r["text"] for r in results]
    return "\n---\n".join(chunks) if chunks else "(no relevant content found)"

def _format_claim_steps(index_name: str, context: str) -> str:
    """Uses the LLM to format the retrieved text into clear steps."""
    display_name = index_name.replace('_', ' ').title()
    prompt = f"""You are an expert insurance advisor.
The user wants to know the claim process for {display_name}.

Retrieved information from policy documents:
{context}

Based ONLY on the retrieved information, provide a clear, step-by-step guide on how to file a claim.
Use a numbered list with clear headings. Include any important contact info or deadlines mentioned.
If the retrieved information does not contain claim steps, politely inform the user that the exact claim procedure is currently unavailable in the documents.
"""
    return _llm().nvidiaResponse(prompt, temperature=0.3)

# ---------------------------------------------------------------------------
# Main Agent Function
# ---------------------------------------------------------------------------
def get_claim_process(user_message: str) -> str:
    """
    Agent entry point to fetch claim process steps.
    
    Args:
        user_message: The query from the user (e.g., "How do I claim my Star Health insurance?")
        
    Returns:
        A step-by-step guide to the claim process, or a clarifying question.
    """
    # 1. Fetch available indexes
    available_indexes = _get_available_indexes()
    if not available_indexes:
        return "I'm sorry, our system currently has no insurance plans available to check."
        
    # 2. Extract which insurance the user is asking about
    target_index = _extract_insurance_name(user_message, available_indexes)
    
    if target_index not in available_indexes:
        return ("I couldn't identify exactly which insurance plan you're referring to. "
                "Could you please clarify the company name and insurance type (e.g., Bajaj Health, Star Health, ICICI Motor)?")

    # 3. Perform RAG search specifically for claim procedure
    query = f"{target_index.replace('_', ' ')} claim procedure process steps how to file reimbursement cashless"
    print(f"[{target_index}] Searching for claim process...")
    try:
        context = _rag_search(target_index, query, top_k=5)
    except Exception as e:
        print(f"Error connecting to RAG: {e}")
        return "Sorry, I am currently unable to access the documents to find the claim procedure. Please try again later."
    
    # 4. Generate the final step-by-step response
    response = _format_claim_steps(target_index, context)
    return response

# if __name__ == "__main__":
#     # Simple interactive loop for testing
#     print("Claim Process Agent Initialized. Type 'quit' to exit.")
#     while True:
#         try:
#             msg = input("\nUser: ")
#             if msg.lower() in ('quit', 'exit'):
#                 break
#             print("\nAgent: ", get_claim_process(msg))
#         except KeyboardInterrupt:
#             break
