import os
from dotenv import load_dotenv
from PIL import Image
from openai import OpenAI
from openai import RateLimitError  # Import for handling rate limit exceptions

class LLMInterface:
    def __init__(self):
        # Load .env file from project root explicitly
        from pathlib import Path
        env_path = Path(__file__).resolve().parent.parent / ".env"
        load_dotenv(dotenv_path=env_path, override=True)

        
        # Load multiple NVIDIA API keys dynamically from env vars
        # Handle both consistent and inconsistent naming patterns
        self.nvapi_keys = []
        
        # Add keys with consistent naming pattern (nvidiaKey1, nvidiaKey2, etc.)
        for i in range(1, 10):  # Check up to 10 keys
            key = os.getenv(f"nvidiaKey{i}")
            if key:
                # Remove quotes if present
                key = key.strip('"\'')
                if key not in self.nvapi_keys:  # Avoid duplicates
                    self.nvapi_keys.append(key)
        
        # Add keys with lowercase pattern (nvidiakey1, nvidiakey2, etc.)
        for i in range(1, 10):  # Check up to 10 keys
            key = os.getenv(f"nvidiakey{i}")
            if key:
                # Remove quotes if present
                key = key.strip('"\'')
                if key not in self.nvapi_keys:  # Avoid duplicates
                    self.nvapi_keys.append(key)
        
        # Add keys with NVAPI pattern (NVAPI_KEY_1, NVAPI_KEY_2, etc.)
        for i in range(1, 10):  # Check up to 10 keys
            key = os.getenv(f"NVAPI_KEY_{i}")
            if key:
                # Remove quotes if present
                key = key.strip('"\'')
                if key not in self.nvapi_keys:  # Avoid duplicates
                    self.nvapi_keys.append(key)
        
        # Remove any None values and empty strings
        self.nvapi_keys = [key for key in self.nvapi_keys if key and key.strip()]
        
        if not self.nvapi_keys:
            raise ValueError("❌ No NVIDIA API keys found. Please set at least one in your .env file as nvidiaKey1, nvidiaKey2, etc.")
        
        print(f"✅ Loaded {len(self.nvapi_keys)} NVIDIA API keys for fallback")
        
        self.current_key_index = 0
        self.client = None  # Will be created dynamically in nvidiaResponse

    def nvidiaResponse(self, prompt: str, model: str = "meta/llama-3.3-70b-instruct",
                          temperature: float = 0.6, top_p: float = 0.7, max_completion_tokens: int = 4096) -> str:
        import time
        from openai import APIConnectionError
        
        response_text = ""
        max_retries = len(self.nvapi_keys)

        for attempt in range(max_retries):
            # Rotate to the next key in a round-robin fashion
            key_index = (self.current_key_index + attempt) % len(self.nvapi_keys)
            api_key = self.nvapi_keys[key_index]

            try:
                print(f"🔑 Trying NVIDIA API key {key_index + 1}/{len(self.nvapi_keys)}")
                
                # Create a new client for this key
                client = OpenAI(
                    base_url="https://integrate.api.nvidia.com/v1",
                    api_key=api_key,
                    timeout=60.0,
                    max_retries=0  # Disable internal retries, we handle them manually
                )

                completion = client.chat.completions.create(
                    model=model,
                    messages=[{"role": "user", "content": prompt}],
                    temperature=temperature,
                    top_p=top_p,
                    max_completion_tokens=max_completion_tokens,
                    stream=True
                )

                for chunk in completion:
                    # Skip chunks with empty choices list
                    if not chunk.choices:
                        continue
                    
                    delta = chunk.choices[0].delta
                    if delta.content:
                        response_text += delta.content

                # Success: Update current index to this key for future starts
                self.current_key_index = key_index
                print(f"✅ Successfully used key {key_index + 1}")
                return response_text

            except (APIConnectionError, ConnectionError, OSError) as e:
                error_str = str(e)
                print(f"❌ Connection error with key {key_index + 1}: {e}")
                print(f"🔄 Moving to next key...")
                # Immediately try next key instead of retrying same key
                continue
                
            except RateLimitError as e:
                print(f"⚠️ Rate limit hit with key {key_index + 1}. Trying next key... (Error: {e})")
                # Continue to next key
                continue
                
            except Exception as e:
                error_str = str(e)
                # Check if it's a connection-related error
                if "10054" in error_str or "forcibly closed" in error_str or "Connection" in error_str:
                    print(f"❌ Connection error with key {key_index + 1}: {e}")
                    print(f"🔄 Moving to next key...")
                    continue
                else:
                    print(f"❌ Unexpected error with key {key_index + 1}: {e}")
                    print(f"🔄 Moving to next key...")
                    continue

        # All keys exhausted
        raise ValueError("❌ All NVIDIA API keys exhausted or connection failed. Please check:\n"
                        "   1. Your internet connection\n"
                        "   2. Firewall/proxy settings (Windows connection error 10054)\n"
                        "   3. API key validity\n"
                        "   4. Try using a VPN if connection issues persist")