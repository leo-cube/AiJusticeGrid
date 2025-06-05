#!/usr/bin/env python3
"""
Simple script to check the current state of the Murder Agent storage
"""

import json
import os
from datetime import datetime

def check_storage_file():
    """Check the murder investigation JSON storage file"""
    storage_file = "murder_investigation.json"
    
    print("🔍 Murder Agent Storage Status Check")
    print("=" * 40)
    
    # Check if file exists
    if not os.path.exists(storage_file):
        print(f"❌ Storage file '{storage_file}' does not exist")
        return False
    
    print(f"✅ Storage file '{storage_file}' exists")
    
    try:
        # Load and parse the JSON file
        with open(storage_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        print("✅ JSON file is valid and readable")
        
        # Check structure
        if "murder_investigations" not in data:
            print("❌ Invalid structure: missing 'murder_investigations' key")
            return False
        
        investigations = data["murder_investigations"]
        
        # Check metadata
        metadata = investigations.get("metadata", {})
        cases = investigations.get("cases", {})
        
        print(f"\n📊 Storage Metadata:")
        print(f"   Created: {metadata.get('created', 'Unknown')}")
        print(f"   Last Updated: {metadata.get('last_updated', 'Unknown')}")
        print(f"   Total Cases: {metadata.get('total_cases', 0)}")
        print(f"   Version: {metadata.get('version', 'Unknown')}")
        
        print(f"\n📁 Cases in Storage:")
        print(f"   Actual case count: {len(cases)}")
        
        if len(cases) == 0:
            print("   No cases stored yet")
        else:
            for case_id, case_data in cases.items():
                case_metadata = case_data.get("case_metadata", {})
                ai_analysis = case_data.get("ai_analysis", {})
                conversation_data = case_data.get("conversation_data", {})
                
                print(f"\n   📋 Case: {case_id}")
                print(f"      Created: {case_metadata.get('created', 'Unknown')}")
                print(f"      Status: {case_metadata.get('status', 'Unknown')}")
                print(f"      AI Analysis: {'✅ Generated' if ai_analysis.get('generated') else '❌ Missing'}")
                print(f"      Conversation Pairs: {len(conversation_data.get('conversation_pairs', []))}")
                
                # Show victim info if available
                case_details = case_data.get("case_details", {})
                victim_info = case_details.get("victim_information", {})
                if victim_info.get("name"):
                    print(f"      Victim: {victim_info.get('name')} ({victim_info.get('age')}, {victim_info.get('gender')})")
                
                # Show crime info if available
                crime_info = case_details.get("crime_information", {})
                if crime_info.get("location"):
                    print(f"      Location: {crime_info.get('location')}")
                    print(f"      Date/Time: {crime_info.get('date')} at {crime_info.get('time')}")
        
        return True
        
    except json.JSONDecodeError as e:
        print(f"❌ JSON parsing error: {e}")
        return False
    except Exception as e:
        print(f"❌ Error reading storage file: {e}")
        return False

def check_storage_module():
    """Check if the storage module can be imported and used"""
    print(f"\n🔧 Storage Module Check")
    print("=" * 30)
    
    try:
        from murder_data_storage import murder_storage
        print("✅ Storage module imported successfully")
        
        # Test basic functionality
        metadata = murder_storage.get_storage_metadata()
        if metadata:
            print("✅ Storage module is functional")
            print(f"   Total cases: {metadata.get('total_cases', 0)}")
            return True
        else:
            print("❌ Storage module not returning metadata")
            return False
            
    except ImportError as e:
        print(f"❌ Cannot import storage module: {e}")
        return False
    except Exception as e:
        print(f"❌ Storage module error: {e}")
        return False

def main():
    """Main function"""
    print(f"🕐 Check performed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Check storage file
    file_ok = check_storage_file()
    
    # Check storage module
    module_ok = check_storage_module()
    
    print(f"\n" + "=" * 40)
    if file_ok and module_ok:
        print("🎉 Storage system is ready!")
    else:
        print("⚠️  Storage system has issues that need to be addressed")

if __name__ == "__main__":
    main()
