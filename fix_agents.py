import re

# Fix coverage_check_agent.py
with open("agents/coverage_check_agent.py", "r") as f:
    content = f.read()

# Replace load_dotenv() with explicit path version
content = content.replace(
    "load_dotenv()",
    "from pathlib import Path as _Path\nload_dotenv(dotenv_path=_Path(__file__).parent.parent / '.env', override=True)"
)

# Replace _llm = LLMInterface() with lazy init
content = content.replace(
    "_llm = LLMInterface()\n",
    "_llm_instance = None\n\ndef _llm():\n    global _llm_instance\n    if _llm_instance is None:\n        _llm_instance = LLMInterface()\n    return _llm_instance\n"
)

# Replace all _llm.nvidiaResponse with _llm().nvidiaResponse
content = content.replace("_llm.nvidiaResponse(", "_llm().nvidiaResponse(")

with open("agents/coverage_check_agent.py", "w") as f:
    f.write(content)

print("coverage_check_agent.py fixed")

# Fix insurance_suggestion_agent.py - just the dotenv part (llm already lazy)
with open("agents/insurance_suggestion_agent.py", "r") as f:
    content = f.read()

content = content.replace(
    "load_dotenv()",
    "from pathlib import Path as _Path\nload_dotenv(dotenv_path=_Path(__file__).parent.parent / '.env', override=True)"
)

with open("agents/insurance_suggestion_agent.py", "w") as f:
    f.write(content)

print("insurance_suggestion_agent.py fixed")
print("All done.")
