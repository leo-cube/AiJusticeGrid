#!/usr/bin/env python3
"""
Test script to check API key loading and OpenAI client initialization.
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def test_api_key_loading():
    """Test API key loading from different sources."""
    print("Testing API key loading...")
    print("=" * 50)
    
    # Method 1: Environment variable
    env_key = os.getenv('NVIDIA_API_KEY')
    print(f"Environment variable: {env_key[:10] + '...' if env_key else 'None'}")
    
    # Method 2: Direct file reading
    env_file = Path(".env")
    if env_file.exists():
        print(f".env file exists: {env_file.absolute()}")
        with open(env_file, 'r') as f:
            content = f.read()
            print(f".env file content length: {len(content)}")
            lines = content.strip().split('\n')
            for line in lines:
                if line.startswith('NVIDIA_API_KEY='):
                    file_key = line.split('=', 1)[1].strip()
                    print(f"File API key: {file_key[:10] + '...' if file_key else 'None'}")
                    print(f"File API key length: {len(file_key)}")
                    break
    else:
        print(".env file not found")
    
    # Method 3: Test the retrieve_api_key function
    def retrieve_api_key():
        """Retrieve the API key from the .env file."""
        try:
            env_path = Path(".env")
            if not env_path.exists():
                print("Error: .env file not found")
                return None

            api_key = None
            with open(env_path, 'r') as f:
                for line in f:
                    if line.startswith("NVIDIA_API_KEY="):
                        api_key = line.strip().split('=', 1)[1]
                        break

            if not api_key:
                print("Error: API key not found in .env file")
                return None

            return api_key

        except Exception as e:
            print(f"Error retrieving API key: {str(e)}")
            return None
    
    retrieved_key = retrieve_api_key()
    print(f"Retrieved API key: {retrieved_key[:10] + '...' if retrieved_key else 'None'}")
    
    # Final API key selection
    final_key = env_key or retrieved_key
    if final_key:
        final_key = final_key.strip()
        print(f"Final API key: {final_key[:10] + '...'}")
        print(f"Final API key length: {len(final_key)}")
        print(f"Final API key type: {type(final_key)}")
    else:
        print("No API key found!")
        return False
    
    return final_key

def test_openai_client(api_key):
    """Test OpenAI client initialization."""
    print("\nTesting OpenAI client initialization...")
    print("=" * 50)
    
    try:
        from openai import OpenAI
        
        print(f"Initializing OpenAI client with API key length: {len(api_key)}")
        
        client = OpenAI(
            base_url="https://integrate.api.nvidia.com/v1",
            api_key=api_key
        )
        
        print("✓ OpenAI client initialized successfully!")
        return True
        
    except Exception as e:
        print(f"✗ OpenAI client initialization failed: {str(e)}")
        print(f"Error type: {type(e)}")
        return False

def main():
    """Main test function."""
    print("API Key and OpenAI Client Test")
    print("=" * 50)
    
    # Test API key loading
    api_key = test_api_key_loading()
    
    if not api_key:
        print("\n✗ API key loading failed!")
        sys.exit(1)
    
    # Test OpenAI client
    if test_openai_client(api_key):
        print("\n✓ All tests passed!")
    else:
        print("\n✗ OpenAI client test failed!")
        sys.exit(1)

if __name__ == "__main__":
    main()
