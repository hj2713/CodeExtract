#!/bin/bash

# NextJS App Setup Script
# Creates a new Next.js app, clones source repo, and copies template files

set -e

APP_NAME=$1
BASE_DIR=$2

if [ -z "$APP_NAME" ] || [ -z "$BASE_DIR" ]; then
    echo "Usage: ./setup.sh <app-name> <base-directory>"
    exit 1
fi

APP_DIR="$BASE_DIR/$APP_NAME"

echo "Creating Next.js app: $APP_NAME"
echo "Directory: $APP_DIR"

# Create the Next.js app
cd "$BASE_DIR"
npx create-next-app@latest "$APP_NAME" --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm --yes

# Navigate into the app
cd "$APP_DIR"

# Create source and extracted folders
mkdir -p source
mkdir -p extracted

# Clone the repo into source folder
echo "Cloning 1000x-landing into source folder..."
cd source
git clone https://github.com/darenhua/1000x-landing .

# Copy template files into extracted folder
echo "Copying template files to extracted folder..."
cd "$APP_DIR"
TEMPLATE_PATH="$BASE_DIR/../../../../../templates/fullstack"
if [ -d "$TEMPLATE_PATH" ]; then
    cp "$TEMPLATE_PATH"/* extracted/
    echo "Template files copied successfully"
else
    echo "Warning: Template path not found at $TEMPLATE_PATH"
fi

echo "Setup complete!"
echo "App created at: $APP_DIR"
ls -la "$APP_DIR"
