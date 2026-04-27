"""
Unit tests for main_agent.chat_with_agent

These tests mock the MCP session and LLM to simulate the full conversation
flow observed during manual testing.  Each test feeds a scripted sequence of
LLM responses and verifies:
  - correct tools are called with expected arguments
  - user_id is auto-injected
  - tool results are relayed back to the user
  - the max-loop fallback fires when needed
  - MCP connection errors are handled gracefully
"""

# Set asyncio mode for all tests in this module
pytestmark = __import__("pytest").mark.asyncio

import os
import sys
import json
import asyncio
import pytest
from unittest.mock import AsyncMock, MagicMock, patch, PropertyMock
from types import SimpleNamespace
from datetime import datetime, timezone

# Ensure project root is importable
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


# ---------------------------------------------------------------------------
# Helpers to build mock objects
# ---------------------------------------------------------------------------

TEST_USER_ID = "69ee59cbd9bc1cc3e57c7d46"


def _make_tool_result(text: str):
    """Mimics the structure returned by session.call_tool()."""
    content_item = SimpleNamespace(text=text)
    return SimpleNamespace(content=[content_item])


def _make_mcp_tool(name: str, description: str, schema: dict):
    return SimpleNamespace(name=name, description=description, inputSchema=schema)


MOCK_TOOLS = [
    _make_mcp_tool("suggest_insurance", "Suggests insurance", {
        "properties": {"user_id": {"type": "string"}, "user_message": {"type": "string"}},
        "required": ["user_id", "user_message"],
    }),
    _make_mcp_tool("claim_procedure", "Claim steps", {
        "properties": {"user_message": {"type": "string"}},
        "required": ["user_message"],
    }),
    _make_mcp_tool("check_coverage", "Coverage check", {
        "properties": {"user_id": {"type": "string"}, "index_names": {"type": "array"}, "user_query": {"type": "string"}},
        "required": ["user_id", "index_names", "user_query"],
    }),
    _make_mcp_tool("fetch_user_insurance", "Fetch user insurance", {
        "properties": {"user_id": {"type": "string"}},
        "required": ["user_id"],
    }),
    _make_mcp_tool("store_user_feedback", "Store feedback", {
        "properties": {"user_id": {"type": "string"}, "rating": {"type": "integer"}, "comment": {"type": "string"}},
        "required": ["user_id", "rating", "comment"],
    }),
    _make_mcp_tool("store_claim_request", "Store claim", {
        "properties": {"user_id": {"type": "string"}, "insurance_name": {"type": "string"}, "claim_description": {"type": "string"}, "claim_amount": {"type": "number"}},
        "required": ["user_id", "insurance_name", "claim_description", "claim_amount"],
    }),
    _make_mcp_tool("new_insurance_application", "Apply insurance", {
        "properties": {"user_id": {"type": "string"}, "insurance_type": {"type": "string"}, "applicant_age": {"type": "integer"}, "reason": {"type": "string"}},
        "required": ["user_id", "insurance_type", "applicant_age", "reason"],
    }),
]


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture(autouse=True)
def patch_globals():
    """Patch MongoDB and LLM so no real I/O happens."""
    with patch("main_agent._load_memory", return_value=[]), \
         patch("main_agent._save_memory") as mock_save, \
         patch("main_agent._llm") as mock_llm_factory:
        # Make the LLM mock accessible to individual tests via the fixture
        llm_mock = MagicMock()
        mock_llm_factory.return_value = llm_mock
        yield {
            "save_memory": mock_save,
            "llm": llm_mock,
        }


@pytest.fixture
def mock_session():
    """Create a mock MCP ClientSession."""
    session = AsyncMock()
    session.initialize = AsyncMock()
    session.list_tools = AsyncMock(return_value=SimpleNamespace(tools=MOCK_TOOLS))
    session.call_tool = AsyncMock()
    return session


def _patch_mcp_session(session):
    """
    Returns a context-manager patch that replaces stdio_client + ClientSession
    with the provided mock session.
    """
    # Build an async context manager that yields (read, write)
    async def fake_stdio_client(params):
        class _CM:
            async def __aenter__(self):
                return (AsyncMock(), AsyncMock())
            async def __aexit__(self, *args):
                pass
        return _CM()

    # Build an async context manager that yields session
    async def fake_session_cm(*a, **kw):
        class _CM:
            async def __aenter__(self):
                return session
            async def __aexit__(self, *args):
                pass
        return _CM()

    # We need to patch the context managers properly
    from contextlib import asynccontextmanager

    @asynccontextmanager
    async def fake_stdio(params):
        yield (AsyncMock(), AsyncMock())

    @asynccontextmanager
    async def fake_client_session(read, write):
        yield session

    return (
        patch("main_agent.stdio_client", fake_stdio),
        patch("main_agent.ClientSession", fake_client_session),
    )


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------

class TestFetchUserInsurance:
    """Scenario: User asks 'what are my insurances?' → agent calls fetch_user_insurance."""

    @pytest.mark.asyncio
    async def test_fetches_insurance_and_replies(self, patch_globals, mock_session):
        from main_agent import chat_with_agent

        insurance_data = json.dumps([
            {"insurance_name": "bajaj_health_insurance", "insurance_date": "2026-04-26"},
            {"insurance_name": "bajaj_moto_insurance", "insurance_date": "2026-04-26"},
        ], indent=2)

        # LLM call 1: decide to call fetch_user_insurance
        # LLM call 2: reply with the result
        patch_globals["llm"].nvidiaResponse.side_effect = [
            'TOOL_CALL: {"name": "fetch_user_insurance", "args": {}}',
            f"REPLY: You have the following insurances: {insurance_data}",
        ]

        mock_session.call_tool.return_value = _make_tool_result(insurance_data)

        patches = _patch_mcp_session(mock_session)
        with patches[0], patches[1]:
            reply = await chat_with_agent(TEST_USER_ID, "what are my insurances?")

        # Verify tool was called with auto-injected user_id
        mock_session.call_tool.assert_called_once_with(
            "fetch_user_insurance", {"user_id": TEST_USER_ID}
        )
        assert "bajaj_health_insurance" in reply
        assert "bajaj_moto_insurance" in reply


class TestStoreFeedback:
    """Scenario: User gives feedback → agent calls store_user_feedback."""

    @pytest.mark.asyncio
    async def test_stores_feedback_and_confirms(self, patch_globals, mock_session):
        from main_agent import chat_with_agent

        feedback_result = json.dumps({
            "message": "Feedback stored successfully.",
            "rating": 2,
            "comment": "bajaj motor insurance claim takes a long time",
        })

        patch_globals["llm"].nvidiaResponse.side_effect = [
            'TOOL_CALL: {"name": "store_user_feedback", "args": {"rating": 2, "comment": "bajaj motor insurance claim takes a long time"}}',
            "REPLY: Thank you for your feedback. I've recorded your comment.",
        ]
        mock_session.call_tool.return_value = _make_tool_result(feedback_result)

        patches = _patch_mcp_session(mock_session)
        with patches[0], patches[1]:
            reply = await chat_with_agent(TEST_USER_ID, "bajaj motor insurance claim takes a long time")

        # Verify user_id was injected
        call_args = mock_session.call_tool.call_args
        assert call_args[0][0] == "store_user_feedback"
        assert call_args[0][1]["user_id"] == TEST_USER_ID
        assert call_args[0][1]["rating"] == 2
        assert "feedback" in reply.lower() or "recorded" in reply.lower()


class TestStoreClaimRequest:
    """Scenario: User applies for a health insurance claim."""

    @pytest.mark.asyncio
    async def test_stores_claim_request(self, patch_globals, mock_session):
        from main_agent import chat_with_agent

        claim_result = json.dumps({
            "message": "Claim request submitted successfully.",
            "insurance_name": "bajaj_health_insurance",
            "claim_amount": 20000,
            "status": "pending",
        })

        patch_globals["llm"].nvidiaResponse.side_effect = [
            'TOOL_CALL: {"name": "store_claim_request", "args": {"insurance_name": "bajaj_health_insurance", "claim_description": "admitted for leg pain", "claim_amount": 20000}}',
            "REPLY: Your claim for bajaj_health_insurance has been submitted. Status: pending.",
        ]
        mock_session.call_tool.return_value = _make_tool_result(claim_result)

        patches = _patch_mcp_session(mock_session)
        with patches[0], patches[1]:
            reply = await chat_with_agent(TEST_USER_ID, "bajaj_health_insurance, admitted for leg pain, amount 20k")

        call_args = mock_session.call_tool.call_args
        assert call_args[0][0] == "store_claim_request"
        assert call_args[0][1]["user_id"] == TEST_USER_ID
        assert call_args[0][1]["insurance_name"] == "bajaj_health_insurance"
        assert call_args[0][1]["claim_amount"] == 20000
        assert "submitted" in reply.lower() or "pending" in reply.lower()


class TestNewInsuranceApplication:
    """Scenario: User applies for a new health insurance."""

    @pytest.mark.asyncio
    async def test_submits_application(self, patch_globals, mock_session):
        from main_agent import chat_with_agent

        app_result = json.dumps({
            "message": "Insurance application submitted successfully.",
            "insurance_type": "health",
            "status": "submitted",
        })

        patch_globals["llm"].nvidiaResponse.side_effect = [
            'TOOL_CALL: {"name": "new_insurance_application", "args": {"insurance_type": "health", "applicant_age": 18, "reason": "minor health issues on random days"}}',
            "REPLY: Your health insurance application has been submitted successfully!",
        ]
        mock_session.call_tool.return_value = _make_tool_result(app_result)

        patches = _patch_mcp_session(mock_session)
        with patches[0], patches[1]:
            reply = await chat_with_agent(TEST_USER_ID, "manoj kumar, 18, minor health issues")

        call_args = mock_session.call_tool.call_args
        assert call_args[0][0] == "new_insurance_application"
        assert call_args[0][1]["user_id"] == TEST_USER_ID
        assert call_args[0][1]["insurance_type"] == "health"
        assert call_args[0][1]["applicant_age"] == 18
        assert "submitted" in reply.lower()


class TestCoverageCheckFlow:
    """Scenario: User asks about car accident coverage → multi-tool chain."""

    @pytest.mark.asyncio
    async def test_fetches_insurance_then_checks_coverage(self, patch_globals, mock_session):
        from main_agent import chat_with_agent

        insurance_data = json.dumps([
            {"insurance_name": "bajaj_moto_insurance", "insurance_date": "2026-04-26"},
        ], indent=2)

        coverage_result = "Based on your Bajaj Moto Insurance, you should file an own-damage claim."

        # LLM loop: 1) fetch insurance → 2) check_coverage → 3) reply
        patch_globals["llm"].nvidiaResponse.side_effect = [
            'TOOL_CALL: {"name": "fetch_user_insurance", "args": {}}',
            'TOOL_CALL: {"name": "check_coverage", "args": {"index_names": ["bajaj_moto_insurance"], "user_query": "car accident repair 20k"}}',
            f"REPLY: {coverage_result}",
        ]
        mock_session.call_tool.side_effect = [
            _make_tool_result(insurance_data),
            _make_tool_result(coverage_result),
        ]

        patches = _patch_mcp_session(mock_session)
        with patches[0], patches[1]:
            reply = await chat_with_agent(TEST_USER_ID, "car accident, repair cost 20k, which insurance?")

        assert mock_session.call_tool.call_count == 2

        # First call: fetch_user_insurance
        first_call = mock_session.call_tool.call_args_list[0]
        assert first_call[0][0] == "fetch_user_insurance"
        assert first_call[0][1]["user_id"] == TEST_USER_ID

        # Second call: check_coverage
        second_call = mock_session.call_tool.call_args_list[1]
        assert second_call[0][0] == "check_coverage"
        assert second_call[0][1]["user_id"] == TEST_USER_ID

        assert "bajaj" in reply.lower() or "own-damage" in reply.lower()


class TestMaxLoopFallback:
    """Scenario: LLM keeps calling tools and never replies → hits 5-loop limit."""

    @pytest.mark.asyncio
    async def test_returns_fallback_after_5_loops(self, patch_globals, mock_session):
        from main_agent import chat_with_agent

        # LLM always tries to call a tool, never issues REPLY
        patch_globals["llm"].nvidiaResponse.side_effect = [
            'TOOL_CALL: {"name": "fetch_user_insurance", "args": {}}',
            'TOOL_CALL: {"name": "fetch_user_insurance", "args": {}}',
            'TOOL_CALL: {"name": "fetch_user_insurance", "args": {}}',
            'TOOL_CALL: {"name": "fetch_user_insurance", "args": {}}',
            'TOOL_CALL: {"name": "fetch_user_insurance", "args": {}}',
        ]
        mock_session.call_tool.return_value = _make_tool_result("[]")

        patches = _patch_mcp_session(mock_session)
        with patches[0], patches[1]:
            reply = await chat_with_agent(TEST_USER_ID, "some question")

        assert reply == "I need more time to process that, please try again."
        assert mock_session.call_tool.call_count == 5


class TestMalformedToolCall:
    """Scenario: LLM outputs a TOOL_CALL with broken JSON → fallback message injected."""

    @pytest.mark.asyncio
    async def test_handles_malformed_json(self, patch_globals, mock_session):
        from main_agent import chat_with_agent

        patch_globals["llm"].nvidiaResponse.side_effect = [
            'TOOL_CALL: {name: broken_json}',  # invalid JSON
            "REPLY: Sorry, I had trouble processing that. Can you rephrase?",
        ]

        patches = _patch_mcp_session(mock_session)
        with patches[0], patches[1]:
            reply = await chat_with_agent(TEST_USER_ID, "do something")

        # Tool should NOT have been called
        mock_session.call_tool.assert_not_called()
        assert "sorry" in reply.lower() or "rephrase" in reply.lower()


class TestDirectReply:
    """Scenario: LLM has enough info and replies directly without any tool call."""

    @pytest.mark.asyncio
    async def test_direct_reply_no_tool(self, patch_globals, mock_session):
        from main_agent import chat_with_agent

        patch_globals["llm"].nvidiaResponse.side_effect = [
            "REPLY: Hello! I'm your insurance assistant. How can I help you today?",
        ]

        patches = _patch_mcp_session(mock_session)
        with patches[0], patches[1]:
            reply = await chat_with_agent(TEST_USER_ID, "hello")

        mock_session.call_tool.assert_not_called()
        assert "insurance assistant" in reply.lower()


class TestMCPConnectionError:
    """Scenario: MCP server fails to start → graceful error message."""

    @pytest.mark.asyncio
    async def test_returns_disconnect_message(self, patch_globals):
        from main_agent import chat_with_agent

        from contextlib import asynccontextmanager

        @asynccontextmanager
        async def failing_stdio(params):
            raise ConnectionError("MCP server not available")
            yield  # pragma: no cover

        with patch("main_agent.stdio_client", failing_stdio):
            reply = await chat_with_agent(TEST_USER_ID, "hello")

        assert "disconnected" in reply.lower()


class TestUserIdAutoInjection:
    """Verify user_id is injected for all tools that require it."""

    TOOLS_NEEDING_USER_ID = [
        ("suggest_insurance", {"user_message": "suggest me insurance"}),
        ("check_coverage", {"index_names": ["bajaj_moto_insurance"], "user_query": "coverage?"}),
        ("fetch_user_insurance", {}),
        ("store_user_feedback", {"rating": 5, "comment": "great service"}),
        ("store_claim_request", {"insurance_name": "bajaj_health", "claim_description": "leg pain", "claim_amount": 10000}),
        ("new_insurance_application", {"insurance_type": "health", "applicant_age": 25, "reason": "preventive"}),
    ]

    @pytest.mark.asyncio
    @pytest.mark.parametrize("tool_name,tool_args", TOOLS_NEEDING_USER_ID)
    async def test_user_id_injected(self, tool_name, tool_args, patch_globals, mock_session):
        from main_agent import chat_with_agent

        call_json = json.dumps({"name": tool_name, "args": tool_args})

        patch_globals["llm"].nvidiaResponse.side_effect = [
            f"TOOL_CALL: {call_json}",
            "REPLY: Done.",
        ]
        mock_session.call_tool.return_value = _make_tool_result("OK")

        patches = _patch_mcp_session(mock_session)
        with patches[0], patches[1]:
            await chat_with_agent(TEST_USER_ID, "test")

        actual_args = mock_session.call_tool.call_args[0][1]
        assert actual_args["user_id"] == TEST_USER_ID, (
            f"user_id not injected for tool '{tool_name}'"
        )


class TestMemorySaved:
    """Verify that history is persisted to MongoDB after a successful reply."""

    @pytest.mark.asyncio
    async def test_save_memory_called_on_reply(self, patch_globals, mock_session):
        from main_agent import chat_with_agent

        patch_globals["llm"].nvidiaResponse.side_effect = [
            "REPLY: Hi there!",
        ]

        patches = _patch_mcp_session(mock_session)
        with patches[0], patches[1]:
            await chat_with_agent(TEST_USER_ID, "hi")

        patch_globals["save_memory"].assert_called_once()
        saved_user_id = patch_globals["save_memory"].call_args[0][0]
        saved_history = patch_globals["save_memory"].call_args[0][1]
        assert saved_user_id == TEST_USER_ID
        # History should contain: user message + assistant reply
        roles = [m["role"] for m in saved_history]
        assert "user" in roles
        assert "assistant" in roles


class TestFallbackResponse:
    """Scenario: LLM outputs text without REPLY: or TOOL_CALL: prefix → treated as direct reply."""

    @pytest.mark.asyncio
    async def test_unformatted_response_is_returned(self, patch_globals, mock_session):
        from main_agent import chat_with_agent

        raw_text = "I think you should check your policy documents for details."
        patch_globals["llm"].nvidiaResponse.side_effect = [raw_text]

        patches = _patch_mcp_session(mock_session)
        with patches[0], patches[1]:
            reply = await chat_with_agent(TEST_USER_ID, "what should I do?")

        assert reply == raw_text
        patch_globals["save_memory"].assert_called_once()


# ---------------------------------------------------------------------------
# Multi-turn conversation replay: Insurance Suggestion Flow
# ---------------------------------------------------------------------------

# The conversation turns observed during manual testing.
# Each entry: (user_message, llm_responses_sequence, tool_results, expected_reply_substring)
INSURANCE_SUGGESTION_CONVO = [
    {
        "turn": 1,
        "user": "i have no idea on insurance can you help me to pic me a right insurance for me?",
        "llm_responses": [
            'TOOL_CALL: {"name": "suggest_insurance", "args": {"user_message": "i have no idea on insurance can you help me to pic me a right insurance for me?"}}',
            "REPLY: No worries, I'm here to help. To get started, can you tell me what type of insurance are you looking for - health, life, motor (car), or maybe a combination of all?",
        ],
        "tool_results": [
            "No worries, I'm here to help. To get started, can you tell me what type of insurance are you looking for - health, life, motor (car), or maybe a combination of all?",
        ],
        "expect_in_reply": "what type of insurance",
    },
    {
        "turn": 2,
        "user": "motor",
        "llm_responses": [
            'TOOL_CALL: {"name": "suggest_insurance", "args": {"user_message": "motor"}}',
            "REPLY: Great! Since you're interested in motor insurance, I can help you find the best option. Could you please share a few more details, such as your age, the make and model of your vehicle, and any specific coverage you're looking for?",
        ],
        "tool_results": [
            "Great! Since you're interested in motor insurance, I can help you find the best option. Could you please share a few more details, such as your age, the make and model of your vehicle, and any specific coverage you're looking for?",
        ],
        "expect_in_reply": "motor insurance",
    },
    {
        "turn": 3,
        "user": "iam 18 , pulsur 120 bike",
        "llm_responses": [
            'TOOL_CALL: {"name": "suggest_insurance", "args": {"user_message": "iam 18 , pulsur 120 bike"}}',
            "REPLY: You're 18 and own a Pulsar 120 bike, that's great. To help me narrow down some insurance options for you, could you tell me a bit about your location and what you do?",
        ],
        "tool_results": [
            "You're 18 and own a Pulsar 120 bike, that's great. To help me narrow down some insurance options for you, could you tell me a bit about your location and what you do?",
        ],
        "expect_in_reply": "location",
    },
    {
        "turn": 4,
        "user": "i am a clg student and iam in pondicherry then earn 20k per month on my intern",
        "llm_responses": [
            'TOOL_CALL: {"name": "suggest_insurance", "args": {"user_message": "i am a clg student and iam in pondicherry then earn 20k per month on my intern"}}',
            "REPLY: You're a college student in Pondicherry, that's awesome. Could you tell me a bit about your personal life? Are you married, and do you have any dependents?",
        ],
        "tool_results": [
            "You're a college student in Pondicherry, that's awesome. Could you tell me a bit about your personal life? Are you married, and do you have any dependents?",
        ],
        "expect_in_reply": "pondicherry",
    },
    {
        "turn": 5,
        "user": "no iam single and i have no dependents",
        "llm_responses": [
            'TOOL_CALL: {"name": "suggest_insurance", "args": {"user_message": "no iam single and i have no dependents"}}',
            "REPLY: Thanks for the details! To fine-tune the motor insurance recommendation, could you let me know your gender?",
        ],
        "tool_results": [
            "Thanks for the details! To fine-tune the motor insurance recommendation, could you let me know your gender?",
        ],
        "expect_in_reply": "gender",
    },
    {
        "turn": 6,
        "user": "male",
        "llm_responses": [
            'TOOL_CALL: {"name": "suggest_insurance", "args": {"user_message": "male"}}',
            "REPLY: You're a young and independent student. Could you tell me about your monthly expenses and do you have any savings?",
        ],
        "tool_results": [
            "You're a young and independent student. Could you tell me about your monthly expenses and do you have any savings?",
        ],
        "expect_in_reply": "expenses",
    },
    {
        "turn": 7,
        "user": "i have no savings and my espence will be 5k per month",
        "llm_responses": [
            'TOOL_CALL: {"name": "suggest_insurance", "args": {"user_message": "i have no savings and my espence will be 5k per month"}}',
            "REPLY: Just a couple more questions. Do you currently have any existing insurance policies?",
        ],
        "tool_results": [
            "Just a couple more questions. Do you currently have any existing insurance policies?",
        ],
        "expect_in_reply": "existing insurance",
    },
    {
        "turn": 8,
        "user": "no",
        "llm_responses": [
            'TOOL_CALL: {"name": "suggest_insurance", "args": {"user_message": "no"}}',
            "REPLY: Based on the details you've shared, you're best suited for a basic third-party liability motor insurance from Bajaj Allianz. This is the most affordable option and meets the legal requirement.",
        ],
        "tool_results": [
            "Based on the details you've shared—18 years old, a Pulsar 120 bike, a student in Pondicherry—you're best suited for a basic third-party liability motor insurance. This is the most affordable option.",
        ],
        "expect_in_reply": "third-party",
    },
    {
        "turn": 9,
        "user": "what is the insurance company name?",
        "llm_responses": [
            "REPLY: The motor insurance we recommend for your Pulsar 120 bike is underwritten by Bajaj Allianz, one of the leading insurers we partner with for student riders.",
        ],
        "tool_results": [],  # no tool call this turn
        "expect_in_reply": "bajaj",
    },
]


class TestInsuranceSuggestionConversation:
    """
    Replays the full 9-turn insurance suggestion conversation observed
    during manual testing.  Each turn is a separate call to chat_with_agent.
    The accumulated history is carried across turns (like the real agent).
    The full conversation is logged to tests/convo_insurance_suggestion.txt.
    """

    @pytest.mark.asyncio
    async def test_full_conversation_flow(self):
        """Replay every turn, verify replies, and write a conversation log."""
        from main_agent import chat_with_agent

        log_lines: list[str] = []
        accumulated_history: list[dict] = []

        log_lines.append("=" * 70)
        log_lines.append("INSURANCE SUGGESTION CONVERSATION LOG")
        log_lines.append(f"Generated: {datetime.now(timezone.utc).isoformat()}")
        log_lines.append("=" * 70)
        log_lines.append("")

        for step in INSURANCE_SUGGESTION_CONVO:
            turn_num = step["turn"]
            user_msg = step["user"]
            llm_sides = list(step["llm_responses"])
            tool_results = list(step["tool_results"])
            expect = step["expect_in_reply"]

            # --- Build mocks for this turn ---
            mock_session = AsyncMock()
            mock_session.initialize = AsyncMock()
            mock_session.list_tools = AsyncMock(
                return_value=SimpleNamespace(tools=MOCK_TOOLS)
            )

            # Set up tool results (one per tool call in this turn)
            if tool_results:
                mock_session.call_tool = AsyncMock(
                    side_effect=[_make_tool_result(r) for r in tool_results]
                )
            else:
                mock_session.call_tool = AsyncMock()

            # Capture history so it carries across turns
            history_snapshot = list(accumulated_history)

            with patch("main_agent._load_memory", return_value=history_snapshot), \
                 patch("main_agent._save_memory") as mock_save, \
                 patch("main_agent._llm") as mock_llm_factory:

                llm_mock = MagicMock()
                llm_mock.nvidiaResponse.side_effect = llm_sides
                mock_llm_factory.return_value = llm_mock

                patches = _patch_mcp_session(mock_session)
                with patches[0], patches[1]:
                    reply = await chat_with_agent(TEST_USER_ID, user_msg)

                # Extract saved history for next turn
                if mock_save.called:
                    accumulated_history = mock_save.call_args[0][1]

            # --- Log ---
            log_lines.append(f"--- Turn {turn_num} ---")
            log_lines.append(f"USER: {user_msg}")
            log_lines.append(f"AGENT: {reply}")
            if tool_results:
                log_lines.append(f"  [Tool called: suggest_insurance]")
            log_lines.append("")

            # --- Assert ---
            assert expect.lower() in reply.lower(), (
                f"Turn {turn_num}: expected '{expect}' in reply, got:\n{reply}"
            )

        # --- Write log file ---
        log_path = os.path.join(
            os.path.dirname(os.path.abspath(__file__)),
            "convo_insurance_suggestion.txt",
        )
        with open(log_path, "w", encoding="utf-8") as f:
            f.write("\n".join(log_lines))

        # Verify log file was created
        assert os.path.exists(log_path)
        content = open(log_path, encoding="utf-8").read()
        assert "Turn 1" in content
        assert "Turn 9" in content
        assert "bajaj" in content.lower()

