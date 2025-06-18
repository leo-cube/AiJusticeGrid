#!/usr/bin/env python3
"""
Startup script to run both backend servers for testing the fixes.
"""

import subprocess
import sys
import time
import os
import signal
from pathlib import Path

def start_server(script_name, port, name):
    """Start a server script."""
    print(f"🚀 Starting {name} on port {port}...")
    
    try:
        # Start the server process
        process = subprocess.Popen([
            sys.executable, script_name
        ], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        
        # Give it a moment to start
        time.sleep(2)
        
        # Check if it's still running
        if process.poll() is None:
            print(f"  ✅ {name} started successfully (PID: {process.pid})")
            return process
        else:
            stdout, stderr = process.communicate()
            print(f"  ❌ {name} failed to start")
            if stderr:
                print(f"     Error: {stderr}")
            return None
            
    except Exception as e:
        print(f"  ❌ Failed to start {name}: {e}")
        return None

def main():
    """Start both servers."""
    print("🔧 AiJusticeGrid Backend Startup Script")
    print("="*50)
    
    # Check if we're in the right directory
    if not Path("murder_agent_backend.py").exists():
        print("❌ murder_agent_backend.py not found!")
        print("   Please run this script from the AiJusticeGrid directory")
        return
    
    if not Path("unified_server.py").exists():
        print("❌ unified_server.py not found!")
        print("   Please run this script from the AiJusticeGrid directory")
        return
    
    processes = []
    
    try:
        # Start Murder Agent backend
        murder_process = start_server("murder_agent_backend.py", 5001, "Murder Agent Backend")
        if murder_process:
            processes.append(("Murder Agent Backend", murder_process))
        
        # Start Unified server
        unified_process = start_server("unified_server.py", 5000, "Unified Server")
        if unified_process:
            processes.append(("Unified Server", unified_process))
        
        if not processes:
            print("\n❌ No servers started successfully!")
            return
        
        print(f"\n✅ Started {len(processes)} server(s) successfully!")
        print("\nServers running:")
        for name, process in processes:
            print(f"  - {name} (PID: {process.pid})")
        
        print("\n🧪 You can now run the test script:")
        print("   python test_fixes.py")
        
        print("\n⏹️  Press Ctrl+C to stop all servers")
        
        # Wait for user to stop
        try:
            while True:
                time.sleep(1)
                # Check if any process has died
                for name, process in processes:
                    if process.poll() is not None:
                        print(f"\n⚠️  {name} has stopped unexpectedly")
                        stdout, stderr = process.communicate()
                        if stderr:
                            print(f"   Error: {stderr}")
        except KeyboardInterrupt:
            print("\n\n🛑 Stopping servers...")
            
    except Exception as e:
        print(f"\n❌ Error: {e}")
    
    finally:
        # Clean up processes
        for name, process in processes:
            try:
                print(f"  Stopping {name}...")
                process.terminate()
                
                # Wait a bit for graceful shutdown
                try:
                    process.wait(timeout=5)
                except subprocess.TimeoutExpired:
                    print(f"    Force killing {name}...")
                    process.kill()
                    
            except Exception as e:
                print(f"    Error stopping {name}: {e}")
        
        print("✅ All servers stopped")

if __name__ == "__main__":
    main()
