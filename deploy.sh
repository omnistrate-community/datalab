#!/bin/bash

# DataLab Docker Deployment Script
set -e

echo "🚀 DataLab Deployment Script"
echo "=============================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
IMAGE_NAME="datalab"
CONTAINER_NAME="datalab"
NETWORK_NAME="datalab-network"

# Functions
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker and try again."
        exit 1
    fi
    print_status "Docker is running"
}

# Check if .env file exists
check_env() {
    if [ ! -f ".env" ]; then
        print_warning ".env file not found. Creating from .env.example..."
        if [ -f ".env.example" ]; then
            cp .env.example .env
            print_warning "Please edit .env file with your configuration before proceeding."
            print_warning "At minimum, set NEXTAUTH_SECRET and ANTHROPIC_API_KEY"
            exit 1
        else
            print_error ".env.example file not found. Cannot create .env file."
            exit 1
        fi
    fi
    print_status ".env file found"
}

# Build the Docker image
build_image() {
    print_status "Building Docker image..."
    docker build -t $IMAGE_NAME .
    print_status "Image built successfully"
}

# Stop and remove existing container
cleanup_existing() {
    if docker ps -q -f name=$CONTAINER_NAME | grep -q .; then
        print_status "Stopping existing container..."
        docker stop $CONTAINER_NAME
    fi
    
    if docker ps -aq -f name=$CONTAINER_NAME | grep -q .; then
        print_status "Removing existing container..."
        docker rm $CONTAINER_NAME
    fi
}

# Deploy with Docker Compose
deploy_compose() {
    print_status "Deploying with Docker Compose..."
    docker-compose down --remove-orphans
    docker-compose up -d --build
    print_status "Deployment complete!"
}

# Deploy with Docker run
deploy_docker() {
    print_status "Creating Docker network..."
    docker network create $NETWORK_NAME 2>/dev/null || true
    
    print_status "Starting DataLab container..."
    docker run -d \
        --name $CONTAINER_NAME \
        --network $NETWORK_NAME \
        -p 3000:3000 \
        --env-file .env \
        -v datalab_data:/app/data \
        --restart unless-stopped \
        $IMAGE_NAME
    
    print_status "Container started successfully"
}

# Show deployment info
show_info() {
    echo ""
    print_status "Deployment Information:"
    echo "========================"
    echo "Application URL: http://localhost:3000"
    echo "Health Check: http://localhost:3000/api/health"
    echo "Container Name: $CONTAINER_NAME"
    echo ""
    echo "Useful commands:"
    echo "  View logs: docker logs $CONTAINER_NAME"
    echo "  Stop: docker stop $CONTAINER_NAME"
    echo "  Restart: docker restart $CONTAINER_NAME"
    echo "  Remove: docker rm -f $CONTAINER_NAME"
    echo ""
}

# Wait for application to be ready
wait_for_app() {
    print_status "Waiting for application to be ready..."
    for i in {1..30}; do
        if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
            print_status "Application is ready!"
            return 0
        fi
        echo -n "."
        sleep 2
    done
    print_warning "Application may still be starting up. Check logs with: docker logs $CONTAINER_NAME"
}

# Main deployment logic
main() {
    echo "Choose deployment method:"
    echo "1) Docker Compose (recommended)"
    echo "2) Docker run"
    echo "3) Build only"
    read -p "Enter choice (1-3): " choice
    
    check_docker
    check_env
    
    case $choice in
        1)
            deploy_compose
            ;;
        2)
            build_image
            cleanup_existing
            deploy_docker
            ;;
        3)
            build_image
            exit 0
            ;;
        *)
            print_error "Invalid choice"
            exit 1
            ;;
    esac
    
    wait_for_app
    show_info
}

# Handle script arguments
case "${1:-}" in
    "build")
        check_docker
        build_image
        ;;
    "compose")
        check_docker
        check_env
        deploy_compose
        wait_for_app
        show_info
        ;;
    "docker")
        check_docker
        check_env
        build_image
        cleanup_existing
        deploy_docker
        wait_for_app
        show_info
        ;;
    "clean")
        print_status "Cleaning up Docker resources..."
        docker-compose down --remove-orphans --volumes 2>/dev/null || true
        docker rm -f $CONTAINER_NAME 2>/dev/null || true
        docker rmi $IMAGE_NAME 2>/dev/null || true
        docker network rm $NETWORK_NAME 2>/dev/null || true
        print_status "Cleanup complete"
        ;;
    "logs")
        docker logs -f $CONTAINER_NAME
        ;;
    "")
        main
        ;;
    *)
        echo "Usage: $0 [build|compose|docker|clean|logs]"
        echo ""
        echo "Commands:"
        echo "  build   - Build Docker image only"
        echo "  compose - Deploy using Docker Compose"
        echo "  docker  - Deploy using Docker run"
        echo "  clean   - Clean up all Docker resources"
        echo "  logs    - Show container logs"
        echo "  (none)  - Interactive deployment"
        exit 1
        ;;
esac
