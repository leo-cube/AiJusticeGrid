#!/usr/bin/env python3
"""
Backend restart script for Murder Agent
"""

import os
import sys
import time
import subprocess
import signal
import psutil

def find_python_processes():
    """Find running Python processes"""
    python_processes = []
    for proc in psutil.process_iter(['pid', 'name', 'cmdline']):
        try:
            if proc.info['name'] and 'python' in proc.info['name'].lower():
                cmdline = proc.info['cmdline']
                if cmdline and any('unified_server' in arg for arg in cmdline):
                    python_processes.append(proc)
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            pass
    return python_processes

def kill_existing_servers():
    """Kill existing server processes"""
    processes = find_python_processes()
    for proc in processes:
        try:
            print(f"Killing process {proc.pid}: {' '.join(proc.cmdline())}")
            proc.terminate()
            proc.wait(timeout=5)
        except (psutil.NoSuchProcess, psutil.TimeoutExpired):
            try:
                proc.kill()
            except psutil.NoSuchProcess:
                pass
        except Exception as e:
            print(f"Error killing process {proc.pid}: {e}")

def start_server():
    """Start the unified server"""
    try:
        print("Starting unified server...")
        
        # Change to the correct directory
        script_dir = os.path.dirname(os.path.abspath(__file__))
        os.chdir(script_dir)
        print(f"Working directory: {os.getcwd()}")
        
        # Check if server file exists
        if not os.path.exists('unified_server.py'):
            print("Error: unified_server.py not found!")
            return False
        
        # Start the server
        process = subprocess.Popen([
            sys.executable, 'unified_server.py'
        ], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        
        print(f"Server started with PID: {process.pid}")
        
        # Wait a bit to see if it starts successfully
        time.sleep(3)
        
        if process.poll() is None:
            print("✓ Server appears to be running")
            return True
        else:
            stdout, stderr = process.communicate()
            print("✗ Server failed to start")
            print("STDOUT:", stdout)
            print("STDERR:", stderr)
            return False
            
    except Exception as e:
        print(f"Error starting server: {e}")
        return False

def main():
    print("Murder Agent Backend Restart Script")
    print("=" * 40)
    
    # Kill existing servers
    print("1. Checking for existing server processes...")
    kill_existing_servers()
    
    # Wait a moment
    time.sleep(2)
    
    # Start new server
    print("2. Starting new server...")
    if start_server():
        print("✓ Backend restart completed successfully")
        print("The Murder Agent should now be accessible")
    else:
        print("✗ Backend restart failed")
        print("Please check the error messages above")

if __name__ == "__main__":
    main()
