import os
import json
import asyncio
import re
import asyncio
from datetime import datetime, timezone

from dotenv import load_dotenv
from pymongo import MongoClient
from fastapi import APIRouter, Body, Depends, HTTPException

from auth.dependencies import get_current_user
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

from services.llms import LLMInterface
from services.logger import get_logger
from agents.prompts import main_agent_react_prompt
from guardrails import check_input, clean_output

logger = get_logger(__name__)

# Load environment variables
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), ".env"), override=True)

# ---------------------------------------------------------------------------
# Global Services
# ---------------------------------------------------------------------------
_mongo = MongoClient(os.getenv("MONGO_URI"))
_memory_col = _mongo["insurance_mcp"]["main_agent_memory"]

_llm_instance = None
def _llm() -> LLMInterface:
    global _llm_instance
    if _llm_instance is None:
        _llm_instance = LLMInterface()
    return _llm_instance

# ---------------------------------------------------------------------------
# Memory Management
# ---------------------------------------------------------------------------
def _load_memory(userid: str) -> list:
    doc = _memory_col.find_one({"userid": userid})
    if doc:
        return doc.get("history", [])
    return []

def _save_memory(userid: str, history: list):
    _memory_col.update_one(
        {"userid": userid},
        {"$set": {"history": history, "updated_at": datetime.now(timezone.utc)}},
        upsert=True
    )

# ---------------------------------------------------------------------------
# Core Agent Logic
# ---------------------------------------------------------------------------
async def chat_with_agent(user_id: str, user_message: str) -> str:
    """
    Main autonomous agent that connects to the MCP server.
    It decides which tool to call based on the user's intent.
    """
    # ── Input Guardrail ────────────────────────────────────────────
    guard_result = check_input(user_message)
    if not guard_result.allowed:
        logger.warning("Input blocked by guardrail | user=%s | reason=%s", user_id, guard_result.reason)
        return guard_result.message
    # ──────────────────────────────────────────────────────────────

    history = _load_memory(user_id)
    history.append({"role": "user", "content": user_message})
    
    server_params = StdioServerParameters(
        command="python",
        args=[os.path.join(os.path.dirname(__file__), "mcp_server.py")]
    )
    
    try:
        async with stdio_client(server_params) as (read, write):
            async with ClientSession(read, write) as session:
                await session.initialize()
                
                # Fetch available tools
                tools_response = await session.list_tools()
                mcp_tools = tools_response.tools
                
                tools_desc = []
                for t in mcp_tools:
                    schema_copy = t.inputSchema.copy() if hasattr(t, 'inputSchema') and t.inputSchema else {}
                    if "properties" in schema_copy and "user_id" in schema_copy["properties"]:
                        del schema_copy["properties"]["user_id"]
                    if "required" in schema_copy and "user_id" in schema_copy["required"]:
                        schema_copy["required"].remove("user_id")
                        
                    tools_desc.append(f"Tool Name: {t.name}\nDescription: {t.description}\nSchema: {json.dumps(schema_copy)}")
                
                tools_str = "\n\n".join(tools_desc)
                logger.debug("MCP tools discovered: %s", tools_str)
                # ReAct Loop: Iterate up to 5 times for multi-step tool use
                for i in range(5):
                    # Keep history concise for the LLM but avoid losing the user's initial request
                    recent_history = history[-30:]
                    history_str = "\n".join([f"{m['role'].upper()}: {m['content']}" for m in recent_history])
                    
                    prompt = main_agent_react_prompt(tools_str, history_str)
                    response = _llm().nvidiaResponse(prompt, temperature=0.1,model="nvidia/nemotron-3-nano-30b-a3b").strip()
                    logger.info("ReAct loop iteration %d | user=%s", i, user_id)
                    logger.debug("LLM raw response: %s", response)
                    tool_match = re.search(r"TOOL_CALL:\s*(\{.*\})", response, re.DOTALL)
                    reply_match = re.search(r"REPLY:\s*(.*)", response, re.DOTALL)
                    
                    if tool_match:
                        try:
                            # Parse JSON
                            call_str = tool_match.group(1)
                            call_data = json.loads(call_str)
                            tool_name = call_data.get("name")
                            tool_args = call_data.get("args", {})
                            
                            # Auto-inject user_id if needed by the tool
                            if tool_name in ["suggest_insurance", "check_coverage", "fetch_user_insurance", "store_user_feedback", "store_claim_request", "new_insurance_application"]:
                                tool_args["user_id"] = user_id
                                
                            logger.info("Tool call | user=%s | tool=%s | args=%s", user_id, tool_name, tool_args)
                            
                            tool_result = await session.call_tool(tool_name, tool_args)
                            
                            result_text = "Tool executed successfully."
                            if tool_result.content:
                                result_text = tool_result.content[0].text
                                
                            logger.info("Tool result | tool=%s | length=%d chars", tool_name, len(result_text))
                            logger.debug("Tool result content: %s", result_text[:500])
                            history.append({"role": "system", "content": f"Tool '{tool_name}' result:\n{result_text}"})
                            
                        except Exception as e:
                            error_msg = f"Error calling tool: {e}"
                            logger.error("Tool call failed | tool=%s | error=%s", tool_name, e, exc_info=True)
                            history.append({"role": "system", "content": error_msg})
                    
                    elif reply_match:
                        reply_text = reply_match.group(1).strip()
                        # ── Output Guardrail ──
                        reply_text = clean_output(reply_text)
                        logger.info("Agent reply | user=%s | length=%d chars", user_id, len(reply_text))
                        history.append({"role": "assistant", "content": reply_text})
                        _save_memory(user_id, history)
                        return reply_text
                        
                    elif "TOOL_CALL:" in response:

                        # Fallback for poorly formatted JSON
                        logger.warning("Malformed TOOL_CALL JSON from LLM | user=%s", user_id)
                        history.append({"role": "system", "content": "Error: Your TOOL_CALL was not valid JSON. Please fix it and try again."})
                    else:
                        # Fallback if the LLM didn't format exactly and didn't attempt a tool call
                        logger.info("Fallback reply (no REPLY/TOOL_CALL prefix) | user=%s", user_id)
                        # ── Output Guardrail ──
                        response = clean_output(response)
                        history.append({"role": "assistant", "content": response})
                        _save_memory(user_id, history)
                        return response
                
                # If we exceed max loops
                final_msg = "I need more time to process that, please try again."
                # ── Output Guardrail ──
                final_msg = clean_output(final_msg)
                history.append({"role": "assistant", "content": final_msg})
                _save_memory(user_id, history)
                return final_msg
                
    except Exception as e:
        logger.error("MCP connection error | user=%s | error=%s", user_id, e, exc_info=True)
        return "I am currently disconnected from my internal tools. Please try again later."

# ---------------------------------------------------------------------------
# FastAPI Router
# ---------------------------------------------------------------------------
router = APIRouter(prefix="/agent", tags=["Main Agent"])

@router.post("/chat")
async def api_chat_with_agent(
    user_message: str = Body(..., embed=True),
    userid: str = Depends(get_current_user)
):
    """
    Endpoint to communicate with the autonomous MCP-connected agent.
    Maintains session memory using userid.
    """
    if not userid or not user_message:
        raise HTTPException(status_code=400, detail="userid and user_message are required.")
        
    reply = await chat_with_agent(userid, user_message)
    logger.info("Chat completed | user=%s | reply_length=%d", userid, len(reply))
    return {"reply": reply}
