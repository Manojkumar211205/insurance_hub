"""
Coverage Check Agent
====================
Function: coverage_check(user_id, index_names, user_query)

Flow per index:
  1. RAG hybrid search with current query
  2. Evaluator LLM decides if retrieved content is sufficient
  3. If not sufficient and iterations < 3, refine query and retry
  4. Summarise final chunks for the index

After all indexes:
  - Concatenate all summaries
  - Decision LLM produces final answer
  - Save full conversation + all steps to MongoDB memory
"""

import os
import threading
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone

from dotenv import load_dotenv
from pymongo import MongoClient

from rag_system import RAGSystem
from services.llms import LLMInterface

from pathlib import Path as _Path
load_dotenv(dotenv_path=_Path(__file__).parent.parent / '.env', override=True)

# ---------------------------------------------------------------------------
# Singletons
# ---------------------------------------------------------------------------
_llm_instance = None

def _llm():
    global _llm_instance
    if _llm_instance is None:
        _llm_instance = LLMInterface()
    return _llm_instance
_mongo = MongoClient(os.getenv("MONGO_URI"))
_memory_col = _mongo["insurance_mcp"]["coverage_check_memory"]
_history_lock = threading.Lock()  # guards shared history list across threads

MAX_ITERATIONS = 3


# ---------------------------------------------------------------------------
# Memory helpers
# ---------------------------------------------------------------------------

def _load_memory(user_id: str) -> list[dict]:
    doc = _memory_col.find_one({"user_id": user_id})
    return doc["history"] if doc else []


def _save_memory(user_id: str, history: list[dict]) -> None:
    _memory_col.update_one(
        {"user_id": user_id},
        {
            "$set": {
                "user_id": user_id,
                "history": history,
                "updated_at": datetime.now(timezone.utc),
            }
        },
        upsert=True,
    )


# ---------------------------------------------------------------------------
# RAG helper
# ---------------------------------------------------------------------------

def _rag_search(index_name: str, query: str, top_k: int = 5) -> list[str]:
    rag = RAGSystem(index_name=index_name)
    results = rag.hybrid_search(query, top_k=top_k)
    return [r["text"] for r in results]


# ---------------------------------------------------------------------------
# LLM helpers  (all use LLMInterface.nvidiaResponse)
# ---------------------------------------------------------------------------

def _evaluate_sufficiency(query: str, chunks: list[str]) -> tuple[bool, str]:
    """
    Returns (is_sufficient, refined_query).
    refined_query is only used when is_sufficient is False.
    """
    context = "\n---\n".join(chunks) if chunks else "(no results retrieved)"

    prompt = f"""You are a RAG content evaluator.

User query: {query}

Retrieved content:
{context}

Decide if the retrieved content is sufficient to answer the user query.
If YES respond exactly:
SUFFICIENT: YES

If NO respond exactly:
SUFFICIENT: NO
REFINED_QUERY: <one improved search query, no explanation>
"""
    reply = _llm().nvidiaResponse(prompt, temperature=0.2)

    sufficient = "SUFFICIENT: YES" in reply
    refined_query = query  # fallback
    if not sufficient:
        for line in reply.splitlines():
            if line.strip().startswith("REFINED_QUERY:"):
                refined_query = line.replace("REFINED_QUERY:", "").strip()
                break

    return sufficient, refined_query


def _summarise_for_index(index_name: str, original_query: str, chunks: list[str]) -> str:
    context = "\n---\n".join(chunks) if chunks else "(no relevant content found)"

    prompt = f"""You are an insurance coverage analyst.

Index / Document source: {index_name}
User query: {original_query}

Retrieved content:
{context}

Provide a concise summary of what this document says that is relevant to the query.
If nothing relevant was found, state that clearly.
"""
    return _llm().nvidiaResponse(prompt, temperature=0.3)


def _final_decision(user_query: str, summaries: dict[str, str], history: list[dict]) -> str:
    # Include last 3 user/assistant turns for context
    recent = [
        m for m in history
        if m.get("role") in ("user", "assistant")
    ][-6:]
    history_text = "\n".join(
        f"{m['role'].upper()}: {m['content']}" for m in recent
    ) or "No prior conversation."

    combined_summaries = "\n\n".join(
        f"### {idx}\n{summary}" for idx, summary in summaries.items()
    )

    prompt = f"""You are an expert insurance coverage advisor you analyse user insurance and suggest the best next move for them.

Conversation history:
{history_text}

Summaries from insurance documents:
{combined_summaries}

User query: {user_query}

Using the document summaries above, provide a comprehensive and accurate answer to the user query.
Mention which document/index each piece of information comes from.

your main task is to suggest the next best step for the user. the answer should say explictly about next step with reason.
"""
    return _llm().nvidiaResponse(prompt, temperature=0.4)


# ---------------------------------------------------------------------------
# Public agent function
# ---------------------------------------------------------------------------

def coverage_check(user_id: str, index_names: list[str], user_query: str) -> str:
    """
    Check insurance coverage across multiple Elasticsearch indexes.

    Args:
        user_id:     Identifies the user (used for MongoDB memory).
        index_names: List of Elasticsearch index names to search.
        user_query:  The user's natural-language coverage question.

    Returns:
        Final answer string from the decision LLM.
    """
    # 1. Load existing memory
    history = _load_memory(user_id)

    # 2. Record user input
    history.append({
        "role": "user",
        "content": user_query,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    })
    _save_memory(user_id, history)

    summaries: dict[str, str] = {}
    thread_events: list[dict] = []  # collected from all threads, merged after

    # ---------------------------------------------------------------------------
    # Worker: handles one index — RAG loop + summarise
    # ---------------------------------------------------------------------------
    def _process_index(index_name: str):
        local_events = []
        current_query = user_query
        final_chunks: list[str] = []

        for iteration in range(1, MAX_ITERATIONS + 1):
            print(f"[{index_name}] Iteration {iteration} | query: {current_query}")

            chunks = _rag_search(index_name, current_query)
            sufficient, refined_query = _evaluate_sufficiency(current_query, chunks)

            local_events.append({
                "role": "agent",
                "event": "rag_search",
                "index": index_name,
                "iteration": iteration,
                "query": current_query,
                "chunks_found": len(chunks),
                "sufficient": sufficient,
                "timestamp": datetime.now(timezone.utc).isoformat(),
            })

            if sufficient or iteration == MAX_ITERATIONS:
                final_chunks = chunks
                break

            current_query = refined_query

        summary = _summarise_for_index(index_name, user_query, final_chunks)

        local_events.append({
            "role": "agent",
            "event": "index_summary",
            "index": index_name,
            "summary": summary,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        })

        return index_name, summary, local_events

    # 3. Run all indexes in parallel
    with ThreadPoolExecutor(max_workers=len(index_names)) as executor:
        futures = {executor.submit(_process_index, idx): idx for idx in index_names}
        for future in as_completed(futures):
            index_name, summary, events = future.result()
            summaries[index_name] = summary
            with _history_lock:
                thread_events.extend(events)

    # Merge thread events into history and persist once
    with _history_lock:
        history.extend(thread_events)
    _save_memory(user_id, history)

    # 5. Final decision LLM call
    final_answer = _final_decision(user_query, summaries, history)

    # 6. Save final answer to memory
    history.append({
        "role": "assistant",
        "content": final_answer,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    })
    _save_memory(user_id, history)

    return final_answer
