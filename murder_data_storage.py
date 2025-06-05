#!/usr/bin/env python3
"""
Murder Investigation Data Storage Module

This module handles persistent storage of Murder Agent conversation data,
extracted case details, and AI-generated analysis reports in JSON format.
"""

import json
import os
import logging
from datetime import datetime
from typing import Dict, Any, List, Optional
from pathlib import Path

# Set up logging
logger = logging.getLogger(__name__)

class MurderInvestigationStorage:
    """
    Handles storage and retrieval of Murder Agent investigation data.
    """
    
    def __init__(self, storage_file: str = "murder_investigation.json"):
        """
        Initialize the storage handler.
        
        Args:
            storage_file: Path to the JSON storage file
        """
        self.storage_file = storage_file
        self.storage_path = Path(storage_file)
        self._ensure_storage_file_exists()
    
    def _ensure_storage_file_exists(self):
        """Ensure the storage file exists with proper structure."""
        if not self.storage_path.exists():
            initial_data = {
                "murder_investigations": {
                    "metadata": {
                        "created": datetime.now().isoformat(),
                        "last_updated": datetime.now().isoformat(),
                        "total_cases": 0,
                        "version": "1.0.0",
                        "description": "Persistent storage for Murder Agent investigation data and AI analysis reports"
                    },
                    "cases": {}
                }
            }
            self._save_data(initial_data)
            logger.info(f"Created new storage file: {self.storage_file}")
    
    def _load_data(self) -> Dict[str, Any]:
        """Load data from the JSON storage file."""
        try:
            with open(self.storage_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"Error loading storage file: {e}")
            return self._get_default_structure()
    
    def _save_data(self, data: Dict[str, Any]):
        """Save data to the JSON storage file."""
        try:
            # Update metadata
            data["murder_investigations"]["metadata"]["last_updated"] = datetime.now().isoformat()
            data["murder_investigations"]["metadata"]["total_cases"] = len(data["murder_investigations"]["cases"])
            
            with open(self.storage_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            logger.info(f"Data saved to {self.storage_file}")
        except Exception as e:
            logger.error(f"Error saving storage file: {e}")
    
    def _get_default_structure(self) -> Dict[str, Any]:
        """Get the default data structure."""
        return {
            "murder_investigations": {
                "metadata": {
                    "created": datetime.now().isoformat(),
                    "last_updated": datetime.now().isoformat(),
                    "total_cases": 0,
                    "version": "1.0.0",
                    "description": "Persistent storage for Murder Agent investigation data and AI analysis reports"
                },
                "cases": {}
            }
        }
    
    def store_investigation_data(self, case_id: str, session_id: str, extracted_data: Dict[str, Any], 
                               conversation_pairs: List[Dict[str, str]], ai_analysis: Optional[str] = None,
                               user_metadata: Optional[Dict[str, Any]] = None) -> bool:
        """
        Store complete investigation data for a case.
        
        Args:
            case_id: Unique case identifier
            session_id: Session ID for the conversation
            extracted_data: Structured data extracted from conversation
            conversation_pairs: List of question-answer pairs
            ai_analysis: AI-generated analysis report
            user_metadata: Additional metadata (session info, timestamps, etc.)
        
        Returns:
            True if successful, False otherwise
        """
        try:
            data = self._load_data()
            
            # Create case entry
            case_entry = {
                "case_metadata": {
                    "case_id": case_id,
                    "session_id": session_id,
                    "created": datetime.now().isoformat(),
                    "last_updated": datetime.now().isoformat(),
                    "status": "active"
                },
                "conversation_data": {
                    "total_messages": extracted_data.get('total_messages', 0),
                    "user_messages": extracted_data.get('user_messages', 0),
                    "assistant_messages": extracted_data.get('assistant_messages', 0),
                    "conversation_start": extracted_data.get('conversation_start'),
                    "conversation_end": extracted_data.get('conversation_end'),
                    "conversation_pairs": conversation_pairs
                },
                "case_details": {
                    "victim_information": {
                        "name": extracted_data.get('victim_name'),
                        "age": extracted_data.get('victim_age'),
                        "gender": extracted_data.get('victim_gender')
                    },
                    "crime_information": {
                        "date": extracted_data.get('crime_date'),
                        "time": extracted_data.get('crime_time'),
                        "location": extracted_data.get('location'),
                        "weapon_used": extracted_data.get('weapon_used'),
                        "cause_of_death": extracted_data.get('cause_of_death')
                    },
                    "investigation_details": {
                        "witnesses": extracted_data.get('witnesses'),
                        "evidence": extracted_data.get('evidence_found') or extracted_data.get('evidence'),
                        "suspects": extracted_data.get('suspects'),
                        "crime_scene_description": extracted_data.get('crime_scene_description') or extracted_data.get('crime_scene')
                    },
                    "additional_information": {
                        "notes": extracted_data.get('additional_notes') or extracted_data.get('notes')
                    }
                },
                "ai_analysis": {
                    "generated": ai_analysis is not None,
                    "generated_at": datetime.now().isoformat() if ai_analysis else None,
                    "content": ai_analysis
                },
                "user_metadata": user_metadata or {},
                "raw_extracted_data": extracted_data
            }
            
            # Store the case
            data["murder_investigations"]["cases"][case_id] = case_entry
            
            # Save to file
            self._save_data(data)
            
            logger.info(f"Successfully stored investigation data for case {case_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error storing investigation data for case {case_id}: {e}")
            return False
    
    def update_ai_analysis(self, case_id: str, ai_analysis: str) -> bool:
        """
        Update the AI analysis for an existing case.
        
        Args:
            case_id: Case identifier
            ai_analysis: AI-generated analysis content
        
        Returns:
            True if successful, False otherwise
        """
        try:
            data = self._load_data()
            
            if case_id in data["murder_investigations"]["cases"]:
                case_entry = data["murder_investigations"]["cases"][case_id]
                case_entry["ai_analysis"] = {
                    "generated": True,
                    "generated_at": datetime.now().isoformat(),
                    "content": ai_analysis
                }
                case_entry["case_metadata"]["last_updated"] = datetime.now().isoformat()
                
                self._save_data(data)
                logger.info(f"Updated AI analysis for case {case_id}")
                return True
            else:
                logger.warning(f"Case {case_id} not found for AI analysis update")
                return False
                
        except Exception as e:
            logger.error(f"Error updating AI analysis for case {case_id}: {e}")
            return False
    
    def get_case_data(self, case_id: str) -> Optional[Dict[str, Any]]:
        """
        Retrieve case data by case ID.
        
        Args:
            case_id: Case identifier
        
        Returns:
            Case data dictionary or None if not found
        """
        try:
            data = self._load_data()
            return data["murder_investigations"]["cases"].get(case_id)
        except Exception as e:
            logger.error(f"Error retrieving case data for {case_id}: {e}")
            return None
    
    def get_all_cases(self) -> Dict[str, Any]:
        """
        Retrieve all stored cases.
        
        Returns:
            Dictionary of all cases
        """
        try:
            data = self._load_data()
            return data["murder_investigations"]["cases"]
        except Exception as e:
            logger.error(f"Error retrieving all cases: {e}")
            return {}
    
    def get_storage_metadata(self) -> Dict[str, Any]:
        """
        Get storage metadata.
        
        Returns:
            Metadata dictionary
        """
        try:
            data = self._load_data()
            return data["murder_investigations"]["metadata"]
        except Exception as e:
            logger.error(f"Error retrieving metadata: {e}")
            return {}


# Global storage instance
murder_storage = MurderInvestigationStorage()
