#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Finance Investigation Data Storage Module

This module handles persistent storage of financial fraud investigation data,
conversation history, and AI analysis results in JSON format.

Author: Augment Agent
"""

import json
import logging
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, List, Optional

# Get the absolute path to the project root directory (parent of FinancialAgent)
PROJECT_ROOT = Path(__file__).parent.parent.absolute()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class FinanceInvestigationStorage:
    """
    Handles storage and retrieval of financial fraud investigation data.
    """
    
    def __init__(self, storage_file: str = "finance_investigation.json"):
        """
        Initialize the storage system.

        Args:
            storage_file: Path to the JSON storage file (relative to project root)
        """
        self.storage_file = storage_file
        # Use absolute path relative to project root
        if Path(storage_file).is_absolute():
            self.storage_path = Path(storage_file)
        else:
            self.storage_path = PROJECT_ROOT / storage_file
        self._ensure_storage_file_exists()
    
    def _ensure_storage_file_exists(self):
        """Ensure the storage file exists with proper structure."""
        if not self.storage_path.exists():
            initial_data = {
                "finance_investigations": {
                    "metadata": {
                        "created": datetime.now().isoformat(),
                        "last_updated": datetime.now().isoformat(),
                        "total_cases": 0,
                        "version": "1.0.0",
                        "description": "Persistent storage for Finance Agent investigation data and AI analysis reports"
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
            return {"finance_investigations": {"metadata": {}, "cases": {}}}
    
    def _save_data(self, data: Dict[str, Any]):
        """Save data to the JSON storage file."""
        try:
            # Update metadata
            data["finance_investigations"]["metadata"]["last_updated"] = datetime.now().isoformat()
            data["finance_investigations"]["metadata"]["total_cases"] = len(data["finance_investigations"]["cases"])
            
            with open(self.storage_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            logger.info(f"Data saved to {self.storage_file}")
        except Exception as e:
            logger.error(f"Error saving storage file: {e}")
    
    def get_all_cases(self) -> Dict[str, Any]:
        """
        Retrieve all stored investigation cases.
        
        Returns:
            Dictionary containing all cases and metadata
        """
        try:
            data = self._load_data()
            return data.get("finance_investigations", {"metadata": {}, "cases": {}})
        except Exception as e:
            logger.error(f"Error retrieving all cases: {e}")
            return {"metadata": {}, "cases": {}}
    
    def get_case(self, case_id: str) -> Optional[Dict[str, Any]]:
        """
        Retrieve a specific investigation case.
        
        Args:
            case_id: Unique case identifier
            
        Returns:
            Case data if found, None otherwise
        """
        try:
            data = self._load_data()
            cases = data.get("finance_investigations", {}).get("cases", {})
            return cases.get(case_id)
        except Exception as e:
            logger.error(f"Error retrieving case {case_id}: {e}")
            return None
    
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
                        "account_type": extracted_data.get('account_type'),
                        "account_number": extracted_data.get('account_number')
                    },
                    "fraud_information": {
                        "case_id": extracted_data.get('case_id'),
                        "date_of_incident": extracted_data.get('date_of_incident'),
                        "time_of_discovery": extracted_data.get('time_of_discovery'),
                        "financial_institution": extracted_data.get('financial_institution'),
                        "fraud_type": extracted_data.get('fraud_type'),
                        "amount_involved": extracted_data.get('amount_involved'),
                        "method_used": extracted_data.get('method_used')
                    },
                    "investigation_details": {
                        "suspicious_activity": extracted_data.get('suspicious_activity'),
                        "evidence_collected": extracted_data.get('evidence_collected'),
                        "suspects": extracted_data.get('suspects')
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
            data["finance_investigations"]["cases"][case_id] = case_entry
            
            # Save to file
            self._save_data(data)
            
            logger.info(f"Successfully stored investigation data for case {case_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error storing investigation data for case {case_id}: {e}")
            return False
    
    def update_case_analysis(self, case_id: str, ai_analysis: str) -> bool:
        """
        Update the AI analysis for an existing case.
        
        Args:
            case_id: Unique case identifier
            ai_analysis: AI-generated analysis report
            
        Returns:
            True if successful, False otherwise
        """
        try:
            data = self._load_data()
            cases = data.get("finance_investigations", {}).get("cases", {})
            
            if case_id not in cases:
                logger.error(f"Case {case_id} not found for analysis update")
                return False
            
            # Update the analysis
            cases[case_id]["ai_analysis"] = {
                "generated": True,
                "generated_at": datetime.now().isoformat(),
                "content": ai_analysis
            }
            cases[case_id]["case_metadata"]["last_updated"] = datetime.now().isoformat()
            
            # Save to file
            self._save_data(data)
            
            logger.info(f"Successfully updated analysis for case {case_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error updating analysis for case {case_id}: {e}")
            return False
    
    def delete_case(self, case_id: str) -> bool:
        """
        Delete a case from storage.
        
        Args:
            case_id: Unique case identifier
            
        Returns:
            True if successful, False otherwise
        """
        try:
            data = self._load_data()
            cases = data.get("finance_investigations", {}).get("cases", {})
            
            if case_id in cases:
                del cases[case_id]
                self._save_data(data)
                logger.info(f"Successfully deleted case {case_id}")
                return True
            else:
                logger.warning(f"Case {case_id} not found for deletion")
                return False
                
        except Exception as e:
            logger.error(f"Error deleting case {case_id}: {e}")
            return False
    
    def get_storage_stats(self) -> Dict[str, Any]:
        """
        Get storage statistics.
        
        Returns:
            Dictionary containing storage statistics
        """
        try:
            data = self._load_data()
            metadata = data.get("finance_investigations", {}).get("metadata", {})
            cases = data.get("finance_investigations", {}).get("cases", {})
            
            return {
                "total_cases": len(cases),
                "storage_file": str(self.storage_path),
                "file_size_bytes": self.storage_path.stat().st_size if self.storage_path.exists() else 0,
                "created": metadata.get("created"),
                "last_updated": metadata.get("last_updated"),
                "version": metadata.get("version", "1.0.0")
            }
        except Exception as e:
            logger.error(f"Error getting storage stats: {e}")
            return {}

# Global instance for easy access
finance_storage = FinanceInvestigationStorage()
