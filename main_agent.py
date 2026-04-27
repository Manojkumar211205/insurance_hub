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
                print("mcp details:",tools_str)
                # ReAct Loop: Iterate up to 5 times for multi-step tool use
                for i in range(5):
                    # Keep history concise for the LLM but avoid losing the user's initial request
                    recent_history = history[-30:]
                    history_str = "\n".join([f"{m['role'].upper()}: {m['content']}" for m in recent_history])
                    
                    prompt = f"""You are a helpful and intelligent insurance assistant agent.
You have access to the following tools from our MCP server:

{tools_str}
the input should be in correct format to call the tools and dont care about user id it will be assigned automatically in the backend

Conversation history:
{history_str}

INSTRUCTIONS ON WHEN TO CALL TOOLS:
-dont reply by your own you should always use the tools, only skip when the memory already have the data of that tool no update is needed.
- If you have enough information to reply to the user, output ONLY your REPLY and NOTHING ELSE.
- If you need information from a tool, output ONLY the TOOL_CALL and NOTHING ELSE.
- CRITICAL RULE: If the last message in the Conversation History is a SYSTEM message containing a tool's result, and that result is a conversational message or question for the user (like "Hi there, what kind of insurance..."), YOU MUST NOT CALL THE TOOL AGAIN. You must immediately output that exact message using the REPLY format so the user can see it!

FORMATTING INSTRUCTIONS:
If you need to fetch information from a tool, output EXACTLY and ONLY this JSON format (no other text):
TOOL_CALL: {{"name": "tool_name", "args": {{"arg1": "value1"}}}}

If you have all the information needed to answer the user's question, or just want to reply directly, output EXACTLY and ONLY:
REPLY: <your final answer to the user>
"""
                    response = _llm().nvidiaResponse(prompt, temperature=0.1,model="nvidia/nemotron-3-nano-30b-a3b").strip()
                    print(f"loop number {i}")
                    print(response)
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
                                
                            print(f"[{user_id}] Calling tool: {tool_name} with args {tool_args}")
                            
                            tool_result = await session.call_tool(tool_name, tool_args)
                            
                            result_text = "Tool executed successfully."
                            if tool_result.content:
                                result_text = tool_result.content[0].text
                                
                            history.append({"role": "system", "content": f"Tool '{tool_name}' result:\n{result_text}"})
                            
                        except Exception as e:
                            error_msg = f"Error calling tool: {e}"
                            print(error_msg)
                            history.append({"role": "system", "content": error_msg})
                    
                    elif reply_match:
                        reply_text = reply_match.group(1).strip()
                        history.append({"role": "assistant", "content": reply_text})
                        _save_memory(user_id, history)
                        return reply_text
                        
                    elif "TOOL_CALL:" in response:

                        # Fallback for poorly formatted JSON
                        print("Fallback: LLM tried to call tool but JSON was malformed.")
                        history.append({"role": "system", "content": "Error: Your TOOL_CALL was not valid JSON. Please fix it and try again."})
                    else:
                        # Fallback if the LLM didn't format exactly and didn't attempt a tool call
                        print("moving to fall back")
                        history.append({"role": "assistant", "content": response})
                        _save_memory(user_id, history)
                      
                        return response
                
                # If we exceed max loops
                final_msg = "I need more time to process that, please try again."
                history.append({"role": "assistant", "content": final_msg})
                _save_memory(user_id, history)
                return final_msg
                
    except Exception as e:
        print(f"MCP Connection Error: {e}")
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
    print("user id given",userid)
    return {"reply": reply}
