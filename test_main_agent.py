import sys
import os
import asyncio

# Set standard output encoding to utf-8 to handle emojis printed by llms.py
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from main_agent import chat_with_agent

async def run_test():
    user_id = "test_orchestrator_001"
    
    # We will test two scenarios to see if it calls different tools.
    
    print("=== TEST 1: Claim Procedure ===")
    msg1 = "I need to know the claim procedure for Star Health insurance."
    print(f"User: {msg1}")
    reply1 = await chat_with_agent(user_id, msg1)
    print(f"\nAgent Reply 1:\n{reply1}\n")
    
    print("=== TEST 2: Fetch User Insurance ===")
    msg2 = "Can you check what insurance plans I already have?"
    print(f"User: {msg2}")
    reply2 = await chat_with_agent(user_id, msg2)
    print(f"\nAgent Reply 2:\n{reply2}\n")

if __name__ == "__main__":
    asyncio.run(run_test())
