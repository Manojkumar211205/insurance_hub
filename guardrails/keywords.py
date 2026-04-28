"""
Guardrails — Keyword Definitions
=================================
All restricted / controlled keyword lists used by the input and output
guardrail filters.  Keeping them in one place makes it easy to update
without touching any business logic.
"""

# ===========================================================================
# INPUT  Guardrails  (applied to user messages)
# ===========================================================================

FRAUD_KEYWORDS: list[str] = [
    "cheat insurance",
    "fake claim",
    "fraud claim",
    "scam insurance",
    "how to get money illegally",
    "false documents",
    "forge documents",
    "fake accident",
    "staged accident",
    "insurance fraud",
    "fake death",
    "fake medical report",
    "bribe agent",
    "illegal insurance trick",
]

INJECTION_KEYWORDS: list[str] = [
    "ignore instructions",
    "ignore previous instructions",
    "override system",
    "bypass rules",
    "act as admin",
    "give hidden data",
    "system prompt",
    "reveal your instructions",
    "jailbreak",
    "developer mode",
    "pretend you are",
    "ignore all previous",
    "forget your instructions",
    "disregard safety",
]

OUT_OF_SCOPE_KEYWORDS: list[str] = [
    "movie recommendation",
    "game cheat",
    "hack wifi",
    "crack software",
    "download pirated",
    "torrent link",
    "crypto trading",
    "betting tips",
    "gambling strategy",
    "recipe for",
    "write my essay",
    "dating advice",
]

TOXIC_KEYWORDS: list[str] = [
    "stupid bot",
    "idiot",
    "useless bot",
    "shut up",
    "dumb bot",
    "you suck",
    "piece of junk",
    "waste of time",
    "go to hell",
    "damn bot",
]


# ===========================================================================
# OUTPUT  Guardrails  (applied to LLM responses)
# ===========================================================================

BANNED_OUTPUT_REPLACEMENTS: dict[str, str] = {
    "guaranteed return":    "potential return",
    "100% safe":            "relatively low-risk",
    "no risk":              "lower risk",
    "best policy ever":     "a suitable option based on your profile",
    "zero risk":            "minimal risk",
    "guaranteed profit":    "potential benefit",
    "sure shot":            "recommended",
    "absolutely guaranteed":"subject to terms and conditions",
    "risk free":            "relatively low-risk",
    "no chance of loss":    "lower likelihood of loss",
}

SENSITIVE_OUTPUT_KEYWORDS: list[str] = [
    "legal advice",
    "financial guarantee",
    "tax saving guaranteed",
    "investment advice",
    "certified financial",
    "legally binding",
    "tax benefit guaranteed",
    "guaranteed tax deduction",
]

DISCLAIMER_TEXT: str = (
    "\n\n *Disclaimer: This information is for general guidance only "
    "and does not constitute professional financial, legal, or tax advice. "
    "Please consult a qualified professional for personalised recommendations.*"
)

HALLUCINATED_KEYWORDS: list[str] = [
    "exclusive hidden plan",
    "secret insurance",
    "internal policy",
    "undisclosed plan",
    "hidden benefit",
    "insider deal",
    "unofficial offer",
    "off-the-record plan",
    "confidential scheme",
]
