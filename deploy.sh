#!/bin/bash

# AI Justice Grid - Production Deployment Script
# This script helps deploy the AI Justice Grid system

set -e

echo "🚀 AI Justice Grid - Production Deployment"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if .env file exists
check_env() {
    if [ ! -f .env ]; then
        print_warning ".env file not found"
        print_status "Creating .env from .env.example..."
        cp .env.example .env
        print_warning "Please edit .env file with your actual configuration before continuing"
        exit 1
    fi
    print_success ".env file found"
}

# Check dependencies
check_dependencies() {
    print_status "Checking dependencies..."
    
    # Check Docker
    if command -v docker &> /dev/null; then
        print_success "Docker is installed"
    else
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    # Check Docker Compose
    if command -v docker-compose &> /dev/null; then
        print_success "Docker Compose is installed"
    else
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    # Check Python (for manual deployment)
    if command -v python3 &> /dev/null; then
        print_success "Python 3 is installed"
    else
        print_warning "Python 3 is not installed (needed for manual deployment)"
    fi
    
    # Check Node.js (for manual deployment)
    if command -v node &> /dev/null; then
        print_success "Node.js is installed"
    else
        print_warning "Node.js is not installed (needed for manual deployment)"
    fi
}

# Docker deployment
deploy_docker() {
    print_status "Starting Docker deployment..."
    
    # Build and start services
    print_status "Building and starting services..."
    docker-compose up -d --build
    
    # Wait for services to be healthy
    print_status "Waiting for services to be healthy..."
    sleep 30
    
    # Check service status
    print_status "Checking service status..."
    docker-compose ps
    
    # Test backend health
    print_status "Testing backend health..."
    if curl -f http://localhost:5000/health &> /dev/null; then
        print_success "Backend is healthy"
    else
        print_error "Backend health check failed"
        docker-compose logs backend
        exit 1
    fi
    
    # Test frontend
    print_status "Testing frontend..."
    if curl -f http://localhost:3000 &> /dev/null; then
        print_success "Frontend is accessible"
    else
        print_error "Frontend health check failed"
        docker-compose logs frontend
        exit 1
    fi
    
    print_success "Docker deployment completed successfully!"
    echo ""
    echo "🌐 Access your application:"
    echo "   Frontend: http://localhost:3000"
    echo "   Backend:  http://localhost:5000"
    echo ""
    echo "📊 Monitor with:"
    echo "   docker-compose logs -f"
    echo "   docker-compose ps"
}

# Manual deployment
deploy_manual() {
    print_status "Starting manual deployment..."
    
    # Deploy backend
    print_status "Deploying backend..."
    cd backend
    
    if [ ! -f .env ]; then
        print_status "Creating backend .env file..."
        echo "NVIDIA_API_KEY=$(grep NVIDIA_API_KEY ../.env | cut -d '=' -f2)" > .env
    fi
    
    print_status "Installing backend dependencies..."
    pip3 install -r requirements.txt
    
    print_status "Starting backend server..."
    nohup python3 unified_server.py > ../backend.log 2>&1 &
    BACKEND_PID=$!
    echo $BACKEND_PID > ../backend.pid
    
    cd ..
    
    # Wait for backend to start
    sleep 10
    
    # Test backend
    if curl -f http://localhost:5000/health &> /dev/null; then
        print_success "Backend started successfully"
    else
        print_error "Backend failed to start"
        cat backend.log
        exit 1
    fi
    
    # Deploy frontend
    print_status "Deploying frontend..."
    cd investigation-main
    
    if [ ! -f .env ]; then
        print_status "Creating frontend .env file..."
        cp ../.env .env
        # Update URLs for local deployment
        sed -i 's|https://your-backend-server.com|http://localhost:5000|g' .env
    fi
    
    print_status "Installing frontend dependencies..."
    npm install
    
    print_status "Building frontend..."
    npm run build
    
    print_status "Starting frontend server..."
    nohup npm start > ../frontend.log 2>&1 &
    FRONTEND_PID=$!
    echo $FRONTEND_PID > ../frontend.pid
    
    cd ..
    
    # Wait for frontend to start
    sleep 15
    
    # Test frontend
    if curl -f http://localhost:3000 &> /dev/null; then
        print_success "Frontend started successfully"
    else
        print_error "Frontend failed to start"
        cat frontend.log
        exit 1
    fi
    
    print_success "Manual deployment completed successfully!"
    echo ""
    echo "🌐 Access your application:"
    echo "   Frontend: http://localhost:3000"
    echo "   Backend:  http://localhost:5000"
    echo ""
    echo "📊 Monitor with:"
    echo "   tail -f backend.log"
    echo "   tail -f frontend.log"
    echo ""
    echo "🛑 Stop services with:"
    echo "   kill \$(cat backend.pid)"
    echo "   kill \$(cat frontend.pid)"
}

# Stop services
stop_services() {
    print_status "Stopping services..."
    
    # Stop Docker services
    if [ -f docker-compose.yml ]; then
        docker-compose down
        print_success "Docker services stopped"
    fi
    
    # Stop manual services
    if [ -f backend.pid ]; then
        kill $(cat backend.pid) 2>/dev/null || true
        rm backend.pid
        print_success "Backend stopped"
    fi
    
    if [ -f frontend.pid ]; then
        kill $(cat frontend.pid) 2>/dev/null || true
        rm frontend.pid
        print_success "Frontend stopped"
    fi
}

# Main menu
show_menu() {
    echo ""
    echo "Select deployment option:"
    echo "1) Docker deployment (recommended)"
    echo "2) Manual deployment"
    echo "3) Stop all services"
    echo "4) Exit"
    echo ""
    read -p "Enter your choice [1-4]: " choice
    
    case $choice in
        1)
            check_env
            check_dependencies
            deploy_docker
            ;;
        2)
            check_env
            check_dependencies
            deploy_manual
            ;;
        3)
            stop_services
            ;;
        4)
            echo "Goodbye!"
            exit 0
            ;;
        *)
            print_error "Invalid option. Please try again."
            show_menu
            ;;
    esac
}

# Run main menu
show_menu
