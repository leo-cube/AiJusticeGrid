import logging
import uuid
from datetime import datetime
from flask import Flask, request, jsonify, send_file
from typing import Dict, Any, Tuple, Optional
import io

# Initialize Flask app
app = Flask(__name__)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Define the case information collection steps
CASE_INFO_STEPS = [
    {
        "id": "greeting",
        "message": "Hello, I'm the Murder Agent, an AI assistant specialized in homicide investigations. What is the Case ID for this investigation?",
        "field": "case_id",
        "next_step": "date_of_crime",
        "validation": None
    },
    {
        "id": "date_of_crime",
        "message": "When did the crime occur? Please provide the date (YYYY-MM-DD, MM/DD/YYYY, or text format like 'January 15, 2023').",
        "field": "date_of_crime",
        "next_step": "time_of_crime",
        "validation": "date"
    },
    {
        "id": "time_of_crime",
        "message": "What time did the crime occur? (HH:MM format, or approximate time like '2:30 PM', 'noon', or 'evening')",
        "field": "time_of_crime",
        "next_step": "location",
        "validation": "time"
    },
    {
        "id": "location",
        "message": "Where did the crime take place? Please provide the location.",
        "field": "location",
        "next_step": "victim_name",
        "validation": None
    },
    {
        "id": "victim_name",
        "message": "What is the victim's name?",
        "field": "victim_name",
        "next_step": "victim_age",
        "validation": None
    },
    {
        "id": "victim_age",
        "message": "What is the victim's age?",
        "field": "victim_age",
        "next_step": "victim_gender",
        "validation": "age"
    },
    {
        "id": "victim_gender",
        "message": "What is the victim's gender?",
        "field": "victim_gender",
        "next_step": "cause_of_death",
        "validation": None
    },
    {
        "id": "cause_of_death",
        "message": "What was the cause of death?",
        "field": "cause_of_death",
        "next_step": "weapon_used",
        "validation": None
    },
    {
        "id": "weapon_used",
        "message": "Was a weapon used? If so, what kind?",
        "field": "weapon_used",
        "next_step": "crime_scene_description",
        "validation": None
    },
    {
        "id": "crime_scene_description",
        "message": "Please describe the crime scene.",
        "field": "crime_scene_description",
        "next_step": "witnesses",
        "validation": None
    },
    {
        "id": "witnesses",
        "message": "Were there any witnesses? If so, please provide details.",
        "field": "witnesses",
        "next_step": "evidence_found",
        "validation": None
    },
    {
        "id": "evidence_found",
        "message": "What evidence was found at the scene?",
        "field": "evidence_found",
        "next_step": "suspects",
        "validation": None
    },
    {
        "id": "suspects",
        "message": "Are there any suspects at this time?",
        "field": "suspects",
        "next_step": "additional_notes",
        "validation": None
    },
    {
        "id": "additional_notes",
        "message": "Do you have any additional notes or information about the case?",
        "field": "additional_notes",
        "next_step": "working_message",
        "validation": None
    },
    {
        "id": "working_message",
        "message": "AiJusticeGrid is working to provide you a solution for this case.",
        "field": None,
        "next_step": "analysis",
        "validation": None
    },
    {
        "id": "analysis",
        "message": "Thank you for providing all the case details. I'll now analyze this information and provide you with a comprehensive report.",
        "field": None,
        "next_step": None,
        "validation": None
    }
]

# Dictionary to store conversation states
conversation_states = {}

# Helper function to get step by ID
def get_step_by_id(step_id):
    for step in CASE_INFO_STEPS:
        if step["id"] == step_id:
            return step
    return None

# Helper function to create a new conversation state
def create_new_conversation_state():
    session_id = str(uuid.uuid4())
    conversation_states[session_id] = {
        "current_step": "greeting",
        "collected_data": {},
        "last_updated": datetime.now().isoformat()
    }
    return session_id

# Helper function to store user input in the conversation state
def store_user_input(session_id: str, step_id: str, user_input: str) -> Tuple[bool, Optional[str], Optional[str]]:
    if session_id not in conversation_states:
        return False, "Session not found", None

    current_step = get_step_by_id(step_id)
    if not current_step:
        return False, "Invalid step", None

    formatted_input = user_input
    if current_step["validation"]:
        is_valid, validation_result = validate_input(user_input, current_step["validation"])
        if not is_valid:
            return False, validation_result, None
        if validation_result:
            formatted_input = validation_result

    if current_step["field"]:
        conversation_states[session_id]["collected_data"][current_step["field"]] = formatted_input

    return True, None, formatted_input

# Helper function to advance to the next step
def advance_to_next_step(session_id, current_step_id):
    if session_id not in conversation_states:
        return False

    current_step = get_step_by_id(current_step_id)
    if not current_step:
        return False

    if current_step["next_step"]:
        next_step_id = current_step["next_step"]
        conversation_states[session_id]["current_step"] = next_step_id
        return True

    return False

# Helper function to process user input and update conversation state
def process_user_input(session_id: str, user_input: str) -> Tuple[str, Dict[str, Any], Optional[str]]:
    if session_id not in conversation_states:
        new_session_id, conv_state = get_or_create_conversation_state(None)
        return new_session_id, conv_state, None

    conv_state = conversation_states[session_id]
    current_step_id = conv_state["current_step"]

    success, error_message, formatted_input = store_user_input(session_id, current_step_id, user_input)

    if not success:
        return session_id, conv_state, error_message

    advance_to_next_step(session_id, current_step_id)
    return session_id, conversation_states[session_id], None

# Helper function to get or create a conversation state
def get_or_create_conversation_state(session_id=None):
    if session_id and session_id in conversation_states:
        conversation_states[session_id]["last_updated"] = datetime.now().isoformat()
        return session_id, conversation_states[session_id]

    new_session_id = create_new_conversation_state()
    return new_session_id, conversation_states[new_session_id]

# Helper function to validate user input
def validate_input(input_value: str, validation_type: Optional[str]) -> Tuple[bool, Optional[str]]:
    if not validation_type:
        return True, None

    if validation_type == "date":
        # Implement date validation logic
        return True, input_value

    elif validation_type == "time":
        # Implement time validation logic
        return True, input_value

    elif validation_type == "age":
        # Implement age validation logic
        return True, input_value

    return True, None

class MurderAgent:
    def process_message(self, message: str, session_id: Optional[str] = None, force_new_session: bool = False, reset_conversation: bool = False) -> Tuple[str, str, bool, str, Optional[str]]:
        logger.info(f"Processing message: {message} with session_id: {session_id}")
        logger.info(f"force_new_session: {force_new_session}, reset_conversation: {reset_conversation}")

        if message and message.lower() in ["reset", "restart", "start over"] or force_new_session:
            if session_id and session_id in conversation_states and not reset_conversation:
                del conversation_states[session_id]

            if force_new_session:
                session_id = create_new_conversation_state()
            elif reset_conversation and session_id and session_id in conversation_states:
                conversation_states[session_id] = {
                    "current_step": "greeting",
                    "collected_data": {},
                    "last_updated": datetime.now().isoformat()
                }
            else:
                session_id = create_new_conversation_state()

            current_step = get_step_by_id("greeting")
            return session_id, current_step["message"], True, "greeting", None

        if not session_id or session_id not in conversation_states:
            session_id = create_new_conversation_state()
            if not message:
                current_step = get_step_by_id("greeting")
                return session_id, current_step["message"], True, "greeting", None

        conv_state = conversation_states[session_id]
        current_step_id = conv_state["current_step"]

        if current_step_id == "greeting" and not message:
            return session_id, get_step_by_id("greeting")["message"], True, "greeting", None

        if message:
            session_id, updated_state, error_message = process_user_input(session_id, message)

            if error_message:
                current_step = get_step_by_id(current_step_id)
                error_response = f"I couldn't process your input: {error_message}\n\nPlease try again. {current_step['message']}"
                return session_id, error_response, True, current_step_id, error_message

            current_step_id = updated_state["current_step"]
            current_step = get_step_by_id(current_step_id)

            if current_step_id == "analysis":
                analysis = self.analyze_case(updated_state["collected_data"])
                conversation_states[session_id]["analysis_result"] = analysis
                conversation_states[session_id]["analysis_completed"] = True
                conversation_states[session_id]["current_step"] = "completed"
                return session_id, analysis, False, "completed", None

            if current_step and current_step["message"]:
                return session_id, current_step["message"], True, current_step_id, None

        current_step = get_step_by_id(current_step_id)
        return session_id, current_step["message"] if current_step else "What would you like to know?", True, current_step_id, None

    def analyze_case(self, case_details):
        # Simulate sending data to NVIDIA model and generating a report
        report = self.generate_report(case_details)
        return report

    def generate_report(self, case_details):
        # Generate a comprehensive solution report
        report = "Comprehensive Solution Report\n\n"
        report += "Case Details:\n"
        for key, value in case_details.items():
            report += f"{key.replace('_', ' ').title()}: {value}\n"

        # Add some simulated analysis
        report += "\nAnalysis:\n"
        report += "Based on the provided details, the case appears to involve a single victim with multiple suspects. "
        report += "Further investigation is recommended to gather more evidence and interview witnesses.\n"

        return report

# Initialize the Murder Agent
murder_agent = MurderAgent()

@app.route('/api/augment/murder', methods=['POST'])
def murder_agent_endpoint():
    case_details = request.json
    if not case_details:
        return jsonify({
            "success": False,
            "error": "No case details provided",
            "data": {
                "analysis": "No case details provided. Please provide case details."
            }
        }), 400

    session_id = case_details.get("session_id")
    user_input = case_details.get("question", "")
    force_new_session = case_details.get("force_new_session", False)
    reset_conversation = case_details.get("reset_conversation", False)

    session_id, response, is_collecting_info, current_step, error_message = murder_agent.process_message(
        user_input,
        session_id,
        force_new_session=force_new_session,
        reset_conversation=reset_conversation
    )

    if current_step == "completed":
        # Provide an option to download the generated report
        report = conversation_states[session_id]["analysis_result"]
        buffer = io.BytesIO()
        buffer.write(report.encode('utf-8'))
        buffer.seek(0)

        return send_file(
            buffer,
            as_attachment=True,
            download_name="comprehensive_solution_report.txt",
            mimetype='text/plain'
        )

    return jsonify({
        "success": True,
        "data": {
            "analysis": response,
            "is_collecting_info": is_collecting_info,
            "current_step": current_step,
            "collected_data": conversation_states[session_id]["collected_data"] if session_id in conversation_states else {},
            "error": error_message
        },
        "session_id": session_id,
        "message": "Message processed successfully"
    })

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
