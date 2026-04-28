"""
Centralized Prompts Module
===========================
All LLM prompt templates used by agents are defined here as functions.
Each function accepts the required dynamic data and returns a formatted
prompt string ready to be sent to the LLM.

This improves readability of agent logic by separating prompt engineering
from business logic.
"""


# ===========================================================================
# Claim Process Agent Prompts
# ===========================================================================

def claim_extract_insurance_name(user_message: str, indexes_str: str) -> str:
    """Prompt to match user's message to an available insurance index."""
    return f"""You are an insurance assistant.
The user is asking about a claim process. 
User message: "{user_message}"

Available insurance indexes in our system:
{indexes_str}

Which of the available indexes best matches the user's insurance?
If you find a clear match based on the company name and type (e.g. Health, Life, Motor), reply ONLY with the exact index name from the list.
If you cannot determine a match with confidence, reply with "UNKNOWN".
"""


def claim_format_steps(display_name: str, context: str) -> str:
    """Prompt to format retrieved claim info into clear steps."""
    return f"""You are an expert insurance advisor.
The user wants to know the claim process for {display_name}.

Retrieved information from policy documents:
{context}

Based ONLY on the retrieved information, provide a clear, step-by-step guide on how to file a claim.
Use a numbered list with clear headings. Include any important contact info or deadlines mentioned.
If the retrieved information does not contain claim steps, politely inform the user that the exact claim procedure is currently unavailable in the documents.
"""


# ===========================================================================
# Coverage Check Agent Prompts
# ===========================================================================

def coverage_evaluate_sufficiency(query: str, context: str) -> str:
    """Prompt to evaluate if retrieved content is sufficient for the query."""
    return f"""You are a RAG content evaluator.

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


def coverage_summarise_for_index(index_name: str, original_query: str, context: str) -> str:
    """Prompt to summarise retrieved content for a specific index."""
    return f"""You are an insurance coverage analyst.

Index / Document source: {index_name}
User query: {original_query}

Retrieved content:
{context}

Provide a concise summary of what this document says that is relevant to the query.
If nothing relevant was found, state that clearly.
"""


def coverage_final_decision(user_query: str, history_text: str, combined_summaries: str) -> str:
    """Prompt for final coverage decision based on summaries and history."""
    return f"""You are an expert insurance coverage advisor you analyse user insurance and suggest the best next move for them.

Conversation history:
{history_text}

Summaries from insurance documents:
{combined_summaries}

User query: {user_query}

Using the document summaries above, provide a comprehensive and accurate answer to the user query.
Mention which document/index each piece of information comes from.

your main task is to suggest the next best step for the user. the answer should say explictly about next step with reason.
"""


# ===========================================================================
# Insurance Suggestion Agent Prompts
# ===========================================================================

def suggestion_extract_profile_updates(known: str, user_message: str) -> str:
    """Prompt to extract profile fields from user message."""
    return f"""You are extracting user profile data for insurance recommendation.

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


def suggestion_ask_missing_fields(recent: str, fields_str: str) -> str:
    """Prompt to ask the user for missing profile fields."""
    return f"""You are a friendly insurance advisor collecting user information.

Conversation so far:
{recent}

Still need to collect: {fields_str}

Ask the user for the MOST IMPORTANT missing field(s) in a natural, conversational way.
Ask at most 2-3 fields at once. Be warm and brief.
"""


def suggestion_decide_intent(recent: str, user_message: str) -> str:
    """Prompt to determine what insurance type the user wants."""
    return f"""You are an insurance advisor.

{recent}
USER: {user_message}

What types of insurance is the user interested in?
Choose from: health, life, motor, all, unclear

Respond with ONE word only: health / life / motor / all / unclear
"""


def suggestion_ask_intent_question(recent: str) -> str:
    """Prompt to ask user which type of insurance they want."""
    return f"""You are a friendly insurance advisor.

{recent}

Ask the user what type of insurance they are looking for (health, life, motor, or all).
Be brief and conversational.
"""


def suggestion_decompose_query(profile_str: str, intent: str, index_name: str) -> str:
    """Prompt to generate sub-queries for a given index based on user profile."""
    return f"""You are preparing search queries for an insurance RAG system.

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


def suggestion_final_recommendation(
    profile_str: str, intent: str, recent: str, summaries_str: str
) -> str:
    """Prompt for final personalised insurance recommendation."""
    return f"""You are an expert insurance advisor giving a personalised recommendation.

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


# ===========================================================================
# Main Agent Prompt (ReAct Loop)
# ===========================================================================

def main_agent_react_prompt(tools_str: str, history_str: str) -> str:
    """ReAct prompt for the main autonomous agent with MCP tools."""
    return f"""You are a helpful and intelligent insurance assistant agent.
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
