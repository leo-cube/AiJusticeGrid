# 🔧 AI Justice Grid Backend - Production Deployment

## Overview
This is the production-ready backend server for the AI Justice Grid system. It provides a unified API for all agents and services.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Configure Environment
```bash
# Create .env file
echo "NVIDIA_API_KEY=your-nvidia-api-key" > .env
```

### 3. Start Server
```bash
python unified_server.py
```

**Server runs on**: `http://localhost:5000`

---

## 📋 Features

### ✅ Agent APIs
- **Murder Agent** - `/api/augment/murder`
- **Theft Agent** - `/api/augment/theft`
- **Financial Fraud Agent** - `/api/augment/financial-fraud`

### ✅ Core Services
- **Health Check** - `/health`
- **PDF Generation** - `/api/generate-pdf`
- **Data Storage** - Case management and persistence
- **Agent Management** - Enable/disable agents

### ✅ Production Ready
- **CORS Enabled** - Cross-origin requests supported
- **Error Handling** - Comprehensive error management
- **Logging** - Detailed logging to `unified_agent_server.log`
- **File Storage** - Automatic data directory creation

---

## 🌐 API Endpoints

### Health & Status
```
GET  /health              - Basic health check
GET  /api/health/full     - Detailed system status
GET  /agents              - List all agents
```

### Agent APIs
```
POST /api/augment/murder           - Murder investigation analysis
POST /api/augment/theft            - Theft investigation analysis
POST /api/augment/financial-fraud  - Financial fraud analysis
GET  /api/augment/toggle-agent     - Get agent status
POST /api/augment/toggle-agent     - Toggle agent enable/disable
```

### Data & Reports
```
GET  /api/murder-investigations     - Get all murder cases
GET  /api/murder-investigations/:id - Get specific case
POST /api/generate-pdf              - Generate PDF reports
```

---

## 🔧 Configuration

### Environment Variables
```bash
# Required
NVIDIA_API_KEY=your-nvidia-api-key

# Optional
FLASK_SECRET_KEY=your-secret-key
```

### File Structure
```
backend/
├── unified_server.py           # Main server file
├── requirements.txt            # Python dependencies
├── .env                       # Environment variables
├── data/                      # Data storage directory
├── FinancialAgent/           # Financial agent modules
├── TheftAgent/               # Theft agent modules
├── murder_*.py               # Murder agent modules
└── *.json                    # Data files
```

---

## 🐳 Docker Deployment

### Dockerfile
```dockerfile
FROM python:3.10-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY . .

# Create data directory
RUN mkdir -p data

# Expose port
EXPOSE 5000

# Start server
CMD ["python", "unified_server.py"]
```

### Build and Run
```bash
# Build image
docker build -t ai-justice-backend .

# Run container
docker run -d \
  -p 5000:5000 \
  -e NVIDIA_API_KEY=your-nvidia-api-key \
  -v $(pwd)/data:/app/data \
  ai-justice-backend
```

---

## 🔍 Testing

### Health Check
```bash
curl http://localhost:5000/health
```

### Agent Test
```bash
curl -X POST http://localhost:5000/api/augment/murder \
  -H "Content-Type: application/json" \
  -d '{"question": "Test case", "additional_notes": "Testing"}'
```

### PDF Generation Test
```bash
curl -X POST http://localhost:5000/api/generate-pdf \
  -H "Content-Type: application/json" \
  -d '{"title": "Test Report", "data": {"test": "data"}}'
```

---

## 📊 Monitoring

### Logs
- **File**: `unified_agent_server.log`
- **Level**: INFO, WARNING, ERROR
- **Rotation**: Manual (implement logrotate if needed)

### Health Monitoring
```bash
# Basic health
curl http://localhost:5000/health

# Detailed status
curl http://localhost:5000/api/health/full
```

---

## 🚨 Production Considerations

### Security
1. **API Keys**: Store securely, use environment variables
2. **CORS**: Update to allow only your frontend domain
3. **HTTPS**: Use reverse proxy (nginx) for HTTPS termination
4. **Firewall**: Restrict access to necessary ports only

### Performance
1. **Scaling**: Use multiple instances behind load balancer
2. **Database**: Consider moving from JSON files to proper database
3. **Caching**: Implement Redis for session/response caching
4. **Monitoring**: Add application performance monitoring

### Reliability
1. **Process Manager**: Use systemd, supervisor, or PM2
2. **Auto-restart**: Configure automatic restart on failure
3. **Backup**: Regular backup of data directory
4. **Updates**: Plan for zero-downtime deployments

---

## 🔧 Troubleshooting

### Common Issues

#### "NVIDIA API Key not found"
```bash
# Check environment variable
echo $NVIDIA_API_KEY

# Verify .env file
cat .env
```

#### "Port already in use"
```bash
# Find process using port 5000
lsof -i :5000

# Kill process
kill -9 <PID>
```

#### "Permission denied on data directory"
```bash
# Fix permissions
chmod 755 data/
chown -R $USER:$USER data/
```

### Debug Mode
```bash
# Run with debug logging
FLASK_DEBUG=1 python unified_server.py
```

---

## 📞 Support

### Logs Location
- `unified_agent_server.log` - Main application logs
- Console output - Real-time debugging

### Key Files
- `unified_server.py` - Main server application
- `requirements.txt` - Python dependencies
- `.env` - Environment configuration
- `data/` - Persistent data storage

---

## ✅ Deployment Checklist

- [ ] Python 3.10+ installed
- [ ] Dependencies installed (`pip install -r requirements.txt`)
- [ ] Environment variables configured
- [ ] NVIDIA API key valid
- [ ] Port 5000 available
- [ ] Data directory writable
- [ ] Health endpoint responding
- [ ] All agents responding to test queries

Your AI Justice Grid backend is ready for production! 🎉
