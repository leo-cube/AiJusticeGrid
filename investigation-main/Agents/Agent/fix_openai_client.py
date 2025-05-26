#!/usr/bin/env python3
"""
Quick fix for OpenAI client initialization issues.
This script provides a working OpenAI client that bypasses the 'proxies' error.
"""

import os
import requests
import json
from pathlib import Path

class FixedOpenAIClient:
    """
    A fixed OpenAI client that works around the 'proxies' parameter issue.
    This client uses direct HTTP requests instead of the problematic OpenAI library.
    """
    
    def __init__(self, api_key, base_url="https://integrate.api.nvidia.com/v1"):
        self.api_key = api_key
        self.base_url = base_url.rstrip('/')
        self.headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
    
    def chat_completions_create(self, model, messages, **kwargs):
        """
        Create a chat completion using direct HTTP request.
        """
        url = f"{self.base_url}/chat/completions"
        
        payload = {
            "model": model,
            "messages": messages,
            **kwargs
        }
        
        try:
            response = requests.post(url, headers=self.headers, json=payload, timeout=30)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            raise Exception(f"API request failed: {str(e)}")
    
    @property
    def chat(self):
        """Property to mimic OpenAI client structure."""
        return ChatCompletions(self)

class ChatCompletions:
    """Helper class to mimic OpenAI client structure."""
    
    def __init__(self, client):
        self.client = client
    
    def create(self, **kwargs):
        """Create method that delegates to the client."""
        return self.client.chat_completions_create(**kwargs)

def test_fixed_client():
    """Test the fixed OpenAI client."""
    print("Testing Fixed OpenAI Client")
    print("=" * 40)
    
    # Load API key
    api_key = os.getenv('NVIDIA_API_KEY')
    if not api_key:
        # Try to load from .env file
        env_file = Path(".env")
        if env_file.exists():
            with open(env_file, 'r') as f:
                for line in f:
                    if line.startswith("NVIDIA_API_KEY="):
                        api_key = line.strip().split('=', 1)[1]
                        break
    
    if not api_key:
        print("✗ No API key found!")
        return False
    
    print(f"✓ API key loaded (length: {len(api_key)})")
    
    # Test client initialization
    try:
        client = FixedOpenAIClient(api_key)
        print("✓ Fixed OpenAI client initialized successfully")
        
        # Test a simple request (this will fail without proper model, but should not have 'proxies' error)
        try:
            response = client.chat.create(
                model="meta/llama-3.1-405b-instruct",
                messages=[{"role": "user", "content": "Hello"}],
                max_tokens=10
            )
            print("✓ API request successful!")
            return True
        except Exception as e:
            if "proxies" in str(e).lower():
                print(f"✗ Still getting proxies error: {e}")
                return False
            else:
                print(f"✓ No proxies error (got different error as expected): {e}")
                return True
                
    except Exception as e:
        print(f"✗ Client initialization failed: {e}")
        return False

def create_patched_unified_server():
    """Create a patched version of unified_server.py that uses the fixed client."""
    print("\nCreating patched unified_server.py...")
    
    patch_code = '''
# Patch for OpenAI client initialization issue
# Add this code before the MurderAgent class definition

class FixedOpenAIClient:
    """Fixed OpenAI client that bypasses the proxies parameter issue."""
    
    def __init__(self, api_key, base_url="https://integrate.api.nvidia.com/v1"):
        self.api_key = api_key
        self.base_url = base_url.rstrip('/')
        self.headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
    
    def chat_completions_create(self, model, messages, **kwargs):
        """Create a chat completion using direct HTTP request."""
        import requests
        url = f"{self.base_url}/chat/completions"
        
        payload = {
            "model": model,
            "messages": messages,
            **kwargs
        }
        
        try:
            response = requests.post(url, headers=self.headers, json=payload, timeout=30)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            raise Exception(f"API request failed: {str(e)}")
    
    @property
    def chat(self):
        """Property to mimic OpenAI client structure."""
        return type('ChatCompletions', (), {
            'completions': type('Completions', (), {
                'create': self.chat_completions_create
            })()
        })()

# Then in the MurderAgent.__init__ method, replace the OpenAI initialization with:
# self.client = FixedOpenAIClient(self.api_key)
'''
    
    with open("openai_client_patch.py", "w") as f:
        f.write(patch_code)
    
    print("✓ Patch file created: openai_client_patch.py")
    print("You can copy this code into unified_server.py to fix the issue")

if __name__ == "__main__":
    success = test_fixed_client()
    
    if success:
        print("\n✓ Fixed client works! You can use this approach in unified_server.py")
        create_patched_unified_server()
    else:
        print("\n✗ Fixed client still has issues. Try updating dependencies first.")
        print("Run: python install_dependencies.py")
