# Docker Setup for LensFusion Web UI

This project is containerized using Docker for easy deployment and consistent environments.

## Prerequisites

- Docker and Docker Compose installed on your system
- Environment variables set up (either in a .env file or in your environment)

## Building and Running

### Option 1: Using Docker Compose (Recommended)

```bash
# Build and start the container
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the container
docker-compose down
```

### Option 2: Using Docker Directly

```bash
# Build the Docker image
docker build -t lensfusion-web-ui .

# Run the container
docker run -p 3000:3000 \
  --env-file .env \
  --name lensfusion-web \
  -d lensfusion-web-ui
```

## Accessing the Application

Once running, the application will be available at:

```
http://localhost:3000
```