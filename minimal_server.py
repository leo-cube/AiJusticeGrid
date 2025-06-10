#!/usr/bin/env python3
"""
Minimal server for testing Render deployment.
Use this to isolate 502 errors.
"""

import os
import sys
from flask import Flask, jsonify
from flask_cors import CORS
from datetime import datetime

# Create minimal Flask app
app = Flask(__name__)
CORS(app, origins="*")

@app.route('/')
def home():
    return jsonify({
        "message": "Minimal server is running!",
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "python_version": sys.version,
        "environment": {
            "PORT": os.getenv("PORT"),
            "RENDER": os.getenv("RENDER"),
            "FLASK_ENV": os.getenv("FLASK_ENV")
        }
    })

@app.route('/api/health')
def health():
    return jsonify({
        "status": "healthy",
        "message": "Minimal server health check"
    })

@app.route('/test')
def test():
    return jsonify({
        "test": "success",
        "message": "Test endpoint working"
    })

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    print(f"Starting minimal server on port {port}")
    app.run(host="0.0.0.0", port=port, debug=False)
