# Murder Agent Backend

This is a completely new implementation of the Murder Agent backend with improved conversation state management and proper handling of user inputs.

## Features

- Robust conversation state management
- Proper validation of user inputs, especially date formats
- Clear progression through all investigation steps
- Comprehensive error handling
- Detailed logging for debugging
- API endpoints for integration with the frontend

## Installation

1. Make sure you have Python 3.8+ installed
2. Install the required dependencies:
   ```
   pip install flask flask-cors openai
   ```
3. Set up your NVIDIA API key in a `.env` file or as an environment variable:
   ```
   NVIDIA_API_KEY=your_api_key_here
   ```

## Usage

### Starting the Server

Run the Murder Agent backend server:

```
python murder_agent_backend.py
```

The server will start on port 5001 by default.

### API Endpoints

#### 1. Process a Message

**Endpoint:** `/api/augment/murder`
**Method:** POST
**Payload:**
```json
{
  "question": "Your message here",
  "session_id": "optional_session_id"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "analysis": "Agent's response",
    "is_collecting_info": true,
    "current_step": "step_id",
    "collected_data": {
      "field1": "value1",
      "field2": "value2"
    },
    "error": null
  },
  "session_id": "session_id",
  "message": "Message processed successfully"
}
```

#### 2. Get Conversation State

**Endpoint:** `/api/augment/murder/state`
**Method:** GET
**Query Parameters:**
- `session_id`: The session ID

**Response:**
```json
{
  "success": true,
  "data": {
    "current_step": "step_id",
    "current_step_message": "Current step message",
    "collected_data": {
      "field1": "value1",
      "field2": "value2"
    },
    "last_updated": "timestamp"
  },
  "session_id": "session_id",
  "message": "Conversation state retrieved successfully"
}
```

#### 3. Reset Conversation

**Endpoint:** `/api/augment/murder/reset`
**Method:** POST
**Payload:**
```json
{
  "session_id": "session_id"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "analysis": "Greeting message",
    "is_collecting_info": true,
    "current_step": "greeting"
  },
  "session_id": "new_session_id",
  "message": "Conversation reset successfully"
}
```

### Testing

A test script is provided to verify that the backend works correctly:

```
python test_murder_agent.py
```

This script simulates a complete conversation with the Murder Agent and verifies that it correctly processes user inputs and advances through all the steps.

## Integration with the Frontend

To integrate this backend with the existing frontend:

1. Update the API endpoint in the frontend to point to this new backend (port 5001)
2. Ensure the frontend sends and receives the expected JSON format
3. Handle any error messages returned by the backend

## Conversation Flow

The Murder Agent follows this sequence of steps:

1. Greeting
2. Case ID
3. Date of Crime
4. Time of Crime
5. Location
6. Victim Name
7. Victim Age
8. Victim Gender
9. Cause of Death
10. Weapon Used
11. Crime Scene Description
12. Witnesses
13. Evidence Found
14. Suspects
15. Additional Notes
16. Analysis

Each step includes validation where appropriate, especially for the date input.

## Troubleshooting

If you encounter issues:

1. Check the log file (`murder_agent_backend.log`) for detailed error messages
2. Verify that your NVIDIA API key is correctly set
3. Ensure all required dependencies are installed
4. Check that the port 5001 is not already in use

## License

This software is proprietary and confidential.

## Author

Augment Agent
