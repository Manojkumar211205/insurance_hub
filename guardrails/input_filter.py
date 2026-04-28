"""
Guardrails — Input Filter
==========================
Checks user messages against keyword lists before they reach the LLM.
Returns a `GuardrailResult` with the verdict and, when blocked, a
user-friendly response that the caller can return immediately.
"""

from dataclasses import dataclass
from guardrails.keywords import (
    FRAUD_KEYWORDS,
    INJECTION_KEYWORDS,
    OUT_OF_SCOPE_KEYWORDS,
    TOXIC_KEYWORDS,
)
from services.logger import get_logger

logger = get_logger(__name__)


# ---------------------------------------------------------------------------
# Result object
# ---------------------------------------------------------------------------

@dataclass
class InputGuardrailResult:
    """
    Attributes:
        allowed:  True when the message is safe to forward to the LLM.
        reason:   Short machine-readable tag (e.g. ``"fraud"``, ``"injection"``).
        message:  Human-friendly reply to send back when the message is blocked.
    """
    allowed: bool
    reason: str = "ok"
    message: str = ""


# ---------------------------------------------------------------------------
# Friendly canned responses (one per block reason)
# ---------------------------------------------------------------------------

_BLOCK_RESPONSES: dict[str, str] = {
    "fraud": (
        "🚫 I'm here to help with legitimate insurance guidance only. "
        "I cannot assist with fraudulent or illegal activities."
    ),
    "injection": (
        "⚠️ That request appears to be an attempt to override my instructions. "
        "I'll continue with my normal operation. How can I help you with insurance?"
    ),
    "out_of_scope": (
        "🤔 I can only help with insurance-related queries — things like policy "
        "suggestions, coverage checks, and claims. Could you rephrase your question?"
    ),
    "toxic": (
        "😊 Let's keep the conversation respectful. "
        "I'm here to help — please feel free to ask me anything about insurance!"
    ),
}


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def check_input(user_message: str) -> InputGuardrailResult:
    """
    Run the user message through all input keyword guardrails.

    Checks are ordered by severity (most dangerous first):
    1. Prompt injection  — highest priority (security)
    2. Fraud intent
    3. Toxic language
    4. Out-of-scope

    Args:
        user_message: Raw text from the user.

    Returns:
        An ``InputGuardrailResult``.  When ``allowed`` is ``False``, the caller
        should return ``result.message`` directly to the user instead of
        forwarding to the LLM.
    """
    text = user_message.lower()

    # 1. Prompt injection (security-critical — check first)
    for kw in INJECTION_KEYWORDS:
        if kw in text:
            logger.warning("Input BLOCKED | reason=injection | keyword='%s'", kw)
            return InputGuardrailResult(
                allowed=False, reason="injection", message=_BLOCK_RESPONSES["injection"]
            )

    # 2. Fraud / illegal intent
    for kw in FRAUD_KEYWORDS:
        if kw in text:
            logger.warning("Input BLOCKED | reason=fraud | keyword='%s'", kw)
            return InputGuardrailResult(
                allowed=False, reason="fraud", message=_BLOCK_RESPONSES["fraud"]
            )

    # 3. Toxic / abusive language
    for kw in TOXIC_KEYWORDS:
        if kw in text:
            logger.warning("Input BLOCKED | reason=toxic | keyword='%s'", kw)
            return InputGuardrailResult(
                allowed=False, reason="toxic", message=_BLOCK_RESPONSES["toxic"]
            )

    # 4. Out-of-scope topics
    for kw in OUT_OF_SCOPE_KEYWORDS:
        if kw in text:
            logger.warning("Input BLOCKED | reason=out_of_scope | keyword='%s'", kw)
            return InputGuardrailResult(
                allowed=False, reason="out_of_scope", message=_BLOCK_RESPONSES["out_of_scope"]
            )

    return InputGuardrailResult(allowed=True)
