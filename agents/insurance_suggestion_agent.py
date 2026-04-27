"""
Insurance Suggestion Agent
==========================
Conversational agent that collects user profile, decides which insurance
types to explore, does parallel RAG search with query decomposition on
relevant indexes, then gives a final personalised recommendation.

Public function:
    insurance_suggestion(user_id, user_message) -> str

Conversation flow:
  Phase 1 — Intent:    Understand what insurance types the user is interested in
  Phase 2 — Profile:   Collect basic + financial profile (age, income, dependents, etc.)
  Phase 3 — RAG:       Parallel search on relevant indexes with query decomposition
  Phase 4 — Answer:    Final LLM recommendation
"""

import os
import threading
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone

from dotenv import load_dotenv
from pymongo import MongoClient

from rag_system import RAGSystem
from services.llms import LLMInterface

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "..", ".env"), override=True)

# ---------------------------------------------------------------------------
# Singletons (lazy-initialized on first use)
# ---------------------------------------------------------------------------
_llm_instance = None
_mongo = MongoClient(os.getenv("MONGO_URI"))

def _llm() -> LLMInterface:
    global _llm_instance
    if _llm_instance is None:
        _llm_instance = LLMInterface()
    return _llm_instance
_memory_col  = _mongo["insurance_mcp"]["suggestion_memory"]
_avail_col   = _mongo["insurance_mcp"]["insurance_available"]
_history_lock = threading.Lock()

# Profile fields we need before doing RAG
_REQUIRED_PROFILE_FIELDS = [
    "age", "gender", "location", "marital_status", "dependents",
    "income_range", "monthly_expenses", "savings_assets", "existing_insurance",
]


# ---------------------------------------------------------------------------
# Memory helpers
# ---------------------------------------------------------------------------

def _load_session(user_id: str) -> dict:
    doc = _memory_col.find_one({"user_id": user_id})
    if doc:
        return doc
    return {"user_id": user_id, "history": [], "profile": {}, "phase": "intent"}


def _save_session(session: dict) -> None:
    _memory_col.update_one(
        {"user_id": session["user_id"]},
        {"$set": {**session, "updated_at": datetime.now(timezone.utc)}},
        upsert=True,
    )


# ---------------------------------------------------------------------------
# Available insurance from MongoDB
# ---------------------------------------------------------------------------

def _get_available_indexes() -> list[str]:
    """Return list of insurance_available field values (used as RAG index names)."""
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
# RAG helper
# ---------------------------------------------------------------------------

def _rag_search(index_name: str, query: str, top_k: int = 5) -> list[str]:
    rag = RAGSystem(index_name=index_name)
    results = rag.hybrid_search(query, top_k=top_k)
    return [r["text"] for r in results]


# ---------------------------------------------------------------------------
# LLM helpers
# ---------------------------------------------------------------------------

def _extract_profile_updates(user_message: str, current_profile: dict) -> dict:
    """Ask LLM to extract any profile fields from the latest user message."""
    known = "\n".join(f"  {k}: {v}" for k, v in current_profile.items()) or "  (none yet)"
    prompt = f"""You are extracting user profile data for insurance recommendation.

Already collected:
{known}

User message: "{user_message}"

Extract any of these fields if mentioned:
age, gender, location, marital_status, dependents, income_range,
monthly_expenses, savings_assets, existing_insurance

Respond ONLY as key=value pairs, one per line. Example:
age=32
gender=male
location=Chennai

If nothing new is found, respond: NONE
"""
    reply = _llm().nvidiaResponse(prompt, temperature=0.1)
    updates = {}
    if reply.strip().upper() != "NONE":
        for line in reply.strip().splitlines():
            if "=" in line:
                k, _, v = line.partition("=")
                k, v = k.strip(), v.strip()
                if k in _REQUIRED_PROFILE_FIELDS and v:
                    updates[k] = v
    return updates


def _missing_profile_fields(profile: dict) -> list[str]:
    return [f for f in _REQUIRED_PROFILE_FIELDS if not profile.get(f)]


def _ask_for_missing_fields(missing: list[str], history: list[dict]) -> str:
    recent = "\n".join(
        f"{m['role'].upper()}: {m['content']}"
        for m in history[-6:] if m.get("role") in ("user", "assistant")
    ) or "No prior conversation."
    fields_str = ", ".join(missing)
    prompt = f"""You are a friendly insurance advisor collecting user information.

Conversation so far:
{recent}

Still need to collect: {fields_str}

Ask the user for the MOST IMPORTANT missing field(s) in a natural, conversational way.
Ask at most 2-3 fields at once. Be warm and brief.
"""
    return _llm().nvidiaResponse(prompt, temperature=0.5)


def _decide_intent(user_message: str, history: list[dict]) -> str:
    """Ask LLM what insurance types the user is interested in."""
    recent = "\n".join(
        f"{m['role'].upper()}: {m['content']}"
        for m in history[-4:] if m.get("role") in ("user", "assistant")
    ) or ""
    prompt = f"""You are an insurance advisor.

{recent}
USER: {user_message}

What types of insurance is the user interested in?
Choose from: health, life, motor, all, unclear

Respond with ONE word only: health / life / motor / all / unclear
"""
    reply = _llm().nvidiaResponse(prompt, temperature=0.1).strip().lower()
    for t in ("health", "life", "motor", "all"):
        if t in reply:
            return t
    return "unclear"


def _ask_intent_question(history: list[dict]) -> str:
    recent = "\n".join(
        f"{m['role'].upper()}: {m['content']}"
        for m in history[-4:] if m.get("role") in ("user", "assistant")
    ) or ""
    prompt = f"""You are a friendly insurance advisor.

{recent}

Ask the user what type of insurance they are looking for (health, life, motor, or all).
Be brief and conversational.
"""
    return _llm().nvidiaResponse(prompt, temperature=0.5)


def _decompose_query(profile: dict, intent: str, index_name: str) -> list[str]:
    """Generate 2-3 focused sub-queries for a given index based on user profile."""
    profile_str = "\n".join(f"  {k}: {v}" for k, v in profile.items())
    prompt = f"""You are preparing search queries for an insurance RAG system.

User profile:
{profile_str}

Insurance interest: {intent}
Index to search: {index_name}

Generate 2-3 specific search queries to retrieve:
- Eligibility criteria
- Coverage benefits
- Premium range / cost
- Exclusions

Respond as a numbered list, one query per line. No explanations.
"""
    reply = _llm().nvidiaResponse(prompt, temperature=0.3)
    queries = []
    for line in reply.strip().splitlines():
        line = line.strip().lstrip("0123456789.-) ").strip()
        if line:
            queries.append(line)
    return queries[:3] or [f"{intent} insurance coverage benefits eligibility"]


def _search_index(index_name: str, queries: list[str]) -> str:
    """Run decomposed queries on one index, return combined unique chunks."""
    seen, chunks = set(), []
    for q in queries:
        for chunk in _rag_search(index_name, q, top_k=4):
            if chunk not in seen:
                seen.add(chunk)
                chunks.append(chunk)
    return "\n---\n".join(chunks) if chunks else "(no relevant content found)"


def _final_recommendation(profile: dict, intent: str,
                           index_summaries: dict[str, str],
                           history: list[dict]) -> str:
    recent = "\n".join(
        f"{m['role'].upper()}: {m['content']}"
        for m in history[-6:] if m.get("role") in ("user", "assistant")
    ) or "No prior conversation."

    profile_str = "\n".join(f"  {k}: {v}" for k, v in profile.items())
    summaries_str = "\n\n".join(
        f"### {idx}\n{content}" for idx, content in index_summaries.items()
    )

    prompt = f"""You are an expert insurance advisor giving a personalised recommendation.

User profile:
{profile_str}

Insurance interest: {intent}

Conversation history:
{recent}

Retrieved insurance information:
{summaries_str}

Based on the user's profile and the retrieved information:
1. Recommend the BEST insurance plan(s) for this user with clear reasons.
2. Mention eligibility, key benefits, and estimated premium range if available.
3. Warn about any exclusions relevant to their profile.
4. Suggest a clear next step (e.g. "Contact XYZ insurer", "Compare Plan A vs Plan B").

Be specific, warm, and actionable.
"""
    return _llm().nvidiaResponse(prompt, temperature=0.4)


# ---------------------------------------------------------------------------
# Index selection based on intent
# ---------------------------------------------------------------------------

def _select_indexes(intent: str, available: list[str]) -> list[str]:
    """Filter available indexes by intent keyword."""
    if intent == "all":
        return available
    return [idx for idx in available if intent in idx.lower()] or available


# ---------------------------------------------------------------------------
# Public agent function
# ---------------------------------------------------------------------------

def insurance_suggestion(user_id: str, user_message: str) -> str:
    """
    Conversational insurance suggestion agent with MongoDB memory.

    Args:
        user_id:      Identifies the user session.
        user_message: Latest message from the user.

    Returns:
        Agent's reply string.
    """
    session  = _load_session(user_id)
    history  = session["history"]
    profile  = session["profile"]
    phase    = session.get("phase", "intent")

    # Record user message
    history.append({
        "role": "user",
        "content": user_message,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    })

    # ------------------------------------------------------------------
    # Phase 1: Determine intent
    # ------------------------------------------------------------------
    if phase == "intent":
        intent = _decide_intent(user_message, history)
        if intent == "unclear":
            reply = _ask_intent_question(history)
        else:
            session["intent"] = intent
            session["phase"]  = "profile"
            missing = _missing_profile_fields(profile)
            reply = (
                f"Great! I'll help you find the best {intent} insurance. "
                "To give you a personalised recommendation, I need a few details.\n\n"
                + _ask_for_missing_fields(missing, history)
            )

    # ------------------------------------------------------------------
    # Phase 2: Collect profile
    # ------------------------------------------------------------------
    elif phase == "profile":
        updates = _extract_profile_updates(user_message, profile)
        profile.update(updates)
        session["profile"] = profile

        missing = _missing_profile_fields(profile)
        if missing:
            reply = _ask_for_missing_fields(missing, history)
        else:
            # Profile complete — move to RAG phase
            session["phase"] = "rag"
            reply = _run_rag_and_recommend(session, history)

    # ------------------------------------------------------------------
    # Phase 3+: Profile already complete, answer follow-up questions
    # ------------------------------------------------------------------
    else:
        reply = _run_rag_and_recommend(session, history)

    # Save reply to history and persist
    history.append({
        "role": "assistant",
        "content": reply,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    })
    session["history"] = history
    session["profile"] = profile
    _save_session(session)

    return reply


# ---------------------------------------------------------------------------
# RAG + recommendation (called when profile is complete)
# ---------------------------------------------------------------------------

def _run_rag_and_recommend(session: dict, history: list[dict]) -> str:
    profile  = session["profile"]
    intent   = session.get("intent", "all")
    user_id  = session["user_id"]

    available_indexes = _get_available_indexes()
    selected_indexes  = _select_indexes(intent, available_indexes)

    if not selected_indexes:
        return "I couldn't find any available insurance products to search. Please try again later."

    index_summaries: dict[str, str] = {}
    thread_events:   list[dict]     = []
    lock = threading.Lock()

    def _process_index(index_name: str):
        queries = _decompose_query(profile, intent, index_name)
        print(f"[{index_name}] Queries: {queries}")
        content = _search_index(index_name, queries)

        events = [{
            "role": "agent",
            "event": "rag_search",
            "index": index_name,
            "queries": queries,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }]
        return index_name, content, events

    # Parallel search across all selected indexes
    with ThreadPoolExecutor(max_workers=len(selected_indexes)) as executor:
        futures = {executor.submit(_process_index, idx): idx for idx in selected_indexes}
        for future in as_completed(futures):
            idx, content, events = future.result()
            index_summaries[idx] = content
            with lock:
                thread_events.extend(events)

    with lock:
        history.extend(thread_events)

    return _final_recommendation(profile, intent, index_summaries, history)
