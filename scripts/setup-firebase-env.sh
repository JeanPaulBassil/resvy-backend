#!/bin/bash

# This script helps set up the Firebase service account as an environment variable
# for use with Docker and other deployment environments

# Path to the service account JSON file
SERVICE_ACCOUNT_FILE="./src/config/firebase-service-account.json"

# Check if the file exists
if [ ! -f "$SERVICE_ACCOUNT_FILE" ]; then
  echo "Error: Firebase service account file not found at $SERVICE_ACCOUNT_FILE"
  exit 1
fi

# Extract project_id from the service account file
PROJECT_ID=$(grep -o '"project_id": "[^"]*' "$SERVICE_ACCOUNT_FILE" | cut -d'"' -f4)

if [ -z "$PROJECT_ID" ]; then
  echo "Warning: Could not extract project_id from service account file"
else
  echo "Found project_id: $PROJECT_ID"
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
  echo "Warning: .env file not found. Creating a new one."
  touch .env
fi

# Add or update FIREBASE_PROJECT_ID
if [ ! -z "$PROJECT_ID" ]; then
  if grep -q "FIREBASE_PROJECT_ID=" .env; then
    # Update existing entry
    sed -i '' "s|FIREBASE_PROJECT_ID=.*|FIREBASE_PROJECT_ID=$PROJECT_ID|g" .env
    echo "Updated FIREBASE_PROJECT_ID in .env file"
  else
    # Add new entry
    echo "FIREBASE_PROJECT_ID=$PROJECT_ID" >> .env
    echo "Added FIREBASE_PROJECT_ID to .env file"
  fi
fi

echo "Firebase environment variables setup complete!"
echo "You can now restart your Docker containers with:"
echo "docker-compose down && docker-compose up -d" 