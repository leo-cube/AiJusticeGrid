from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import json
import logging
from dotenv import load_dotenv
import requests
import time

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Get API key from environment variables
NVIDIA_API_KEY = os.getenv('NVIDIA_API_KEY')
if not NVIDIA_API_KEY:
    logger.warning("NVIDIA_API_KEY not found in environment variables. Using default value.")
    NVIDIA_API_KEY = "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"

# Agent configuration
AGENTS = {
    "murder": {
        "system_prompt": "You are a specialized Murder Investigation AI Agent. Your role is to analyze murder cases, provide insights, and help investigators solve crimes. Use forensic knowledge, criminal psychology, and investigative techniques in your responses.",
        "port": 5000
    },
    "theft": {
        "system_prompt": "You are a specialized Theft Investigation AI Agent. Your role is to analyze theft cases, track stolen items, identify patterns, and help investigators recover property and identify perpetrators. Use knowledge of theft techniques, evidence analysis, and investigative methods in your responses.",
        "port": 5001
    },
    "financial-fraud": {
        "system_prompt": "You are a specialized Financial Fraud Investigation AI Agent. Your role is to analyze financial fraud cases, detect suspicious transactions, identify money laundering schemes, and help investigators track financial crimes. Use knowledge of financial systems, fraud patterns, and forensic accounting in your responses.",
        "port": 5002
    }
}

def call_nvidia_api(prompt, system_prompt):
    """Call the NVIDIA API with the given prompt and system prompt."""
    try:
        logger.info(f"Calling NVIDIA API with prompt: {prompt[:50]}...")

        headers = {
            "Authorization": f"Bearer {NVIDIA_API_KEY}",
            "Content-Type": "application/json"
        }

        payload = {
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.7,
            "top_p": 0.95,
            "max_tokens": 1024
        }

        response = requests.post(
            "https://api.nvidia.com/v1/chat/completions",
            headers=headers,
            json=payload
        )

        if response.status_code != 200:
            logger.error(f"NVIDIA API error: {response.status_code} - {response.text}")
            return f"Error calling NVIDIA API: {response.status_code}"

        result = response.json()
        return result["choices"][0]["message"]["content"]

    except Exception as e:
        logger.error(f"Error calling NVIDIA API: {str(e)}")
        return f"Error: {str(e)}"

def format_case_details(case_details):
    """Format case details into a structured prompt for the AI."""
    prompt = "# Case Details\n\n"

    # Add all case details to the prompt
    for key, value in case_details.items():
        if key != "question" and value and value != "Unknown":
            # Convert snake_case to Title Case for readability
            formatted_key = key.replace('_', ' ').title()
            prompt += f"- {formatted_key}: {value}\n"

    # Add the question at the end
    if "question" in case_details:
        prompt += f"\n# Question\n\n{case_details['question']}\n\n"
        prompt += "Please provide a detailed analysis of this case based on the information provided."

    return prompt

# Create routes for each agent
for agent_name, agent_config in AGENTS.items():
    # Create a closure to capture the agent_name variable
    def create_endpoint(agent):
        def endpoint_func():
            logger.info(f"Received request for {agent} agent")

            # Get case details from request
            case_details = request.json
            if not case_details:
                return jsonify({"error": "No case details provided"}), 400

            # Format the case details into a prompt
            prompt = format_case_details(case_details)

            # Get the system prompt for this agent
            system_prompt = AGENTS[agent]["system_prompt"]

            # Call the NVIDIA API
            response = call_nvidia_api(prompt, system_prompt)

            # Return the response
            return jsonify({"response": response})

        # Set the function name
        endpoint_func.__name__ = f"{agent}_endpoint"
        return endpoint_func

    # Register the route with a unique function for each agent
    app.add_url_rule(
        f"/api/augment/{agent_name}",
        endpoint=f"{agent_name}_endpoint",
        view_func=create_endpoint(agent_name),
        methods=["POST"]
    )

@app.route("/api/health", methods=["GET"])
def health_check():
    """Health check endpoint."""
    return jsonify({"status": "healthy", "agents": list(AGENTS.keys())})

if __name__ == "__main__":
    # Get the port from command line arguments or use default
    import sys
    import subprocess
    import platform

    if len(sys.argv) > 1:
        agent_name = sys.argv[1]
        if agent_name in AGENTS:
            port = AGENTS[agent_name]["port"]
            logger.info(f"Starting {agent_name} agent on port {port}")
            app.run(host="0.0.0.0", port=port)
        else:
            logger.error(f"Unknown agent: {agent_name}")
            sys.exit(1)
    else:
        # Start all agents
        logger.info("No agent specified. Starting all agents...")

        # On Windows, we need to use subprocess instead of fork
        if platform.system() == "Windows":
            # Start the first agent in the current process
            first_agent = list(AGENTS.keys())[0]
            port = AGENTS[first_agent]["port"]
            logger.info(f"Starting {first_agent} agent on port {port}")

            # Start other agents in separate processes
            for agent_name, agent_config in list(AGENTS.items())[1:]:
                port = agent_config["port"]
                logger.info(f"Starting {agent_name} agent in a separate process on port {port}")

                # Use subprocess to start a new process
                subprocess.Popen([
                    sys.executable,
                    __file__,
                    agent_name
                ])

            # Run the first agent in the current process
            app.run(host="0.0.0.0", port=AGENTS[first_agent]["port"])
        else:
            # Unix-like systems can use fork
            for agent_name, agent_config in AGENTS.items():
                port = agent_config["port"]
                # Fork a new process for each agent
                if os.fork() == 0:
                    logger.info(f"Starting {agent_name} agent on port {port}")
                    app.run(host="0.0.0.0", port=port)
                    sys.exit(0)
                time.sleep(1)  # Give each process time to start

            # Keep the parent process running
            while True:
                time.sleep(1)
