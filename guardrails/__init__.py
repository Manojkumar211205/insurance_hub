"""
Guardrails Package
===================
Keyword-based input and output safety filters for the insurance chatbot.

Usage::

    from guardrails import check_input, clean_output

    # Before sending to LLM
    result = check_input(user_message)
    if not result.allowed:
        return result.message   # blocked — send canned response

    # After receiving from LLM
    safe_reply = clean_output(llm_reply)
"""

from .input_filter import check_input, InputGuardrailResult
from .output_filter import clean_output
