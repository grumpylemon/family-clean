#!/bin/bash

# iOS Deployment Script for Family Clean
# This script helps automate the iOS build and deployment process

echo "🚀 Family Clean iOS Deployment Script"
echo "====================================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "app.json" ]; then
    echo -e "${RED}Error: app.json not found. Please run this script from the project root.${NC}"
    exit 1
fi

# Function to increment build number
increment_build_number() {
    echo -e "${YELLOW}Incrementing build number...${NC}"
    # Get current build number from app.json
    CURRENT_BUILD=$(grep -o '"buildNumber": "[0-9]*"' app.json | grep -o '[0-9]*')
    NEW_BUILD=$((CURRENT_BUILD + 1))
    
    # Update build number in app.json
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s/\"buildNumber\": \"$CURRENT_BUILD\"/\"buildNumber\": \"$NEW_BUILD\"/" app.json
    else
        sed -i "s/\"buildNumber\": \"$CURRENT_BUILD\"/\"buildNumber\": \"$NEW_BUILD\"/" app.json
    fi
    
    echo -e "${GREEN}Build number updated from $CURRENT_BUILD to $NEW_BUILD${NC}"
}

# Menu
echo "What would you like to do?"
echo "1) Configure Apple credentials"
echo "2) Build for TestFlight (Production)"
echo "3) Build for internal testing (Preview)"
echo "4) Submit latest build to TestFlight"
echo "5) Check build status"
echo "6) Increment build number"
echo "7) Full deployment (increment, build, submit)"

read -p "Enter your choice (1-7): " choice

case $choice in
    1)
        echo -e "${YELLOW}Configuring Apple credentials...${NC}"
        eas credentials
        ;;
    2)
        echo -e "${YELLOW}Building for TestFlight...${NC}"
        eas build --platform ios --profile production
        ;;
    3)
        echo -e "${YELLOW}Building for internal testing...${NC}"
        eas build --platform ios --profile preview
        ;;
    4)
        echo -e "${YELLOW}Submitting to TestFlight...${NC}"
        eas submit --platform ios --latest
        ;;
    5)
        echo -e "${YELLOW}Checking build status...${NC}"
        eas build:list --platform ios --limit 5
        ;;
    6)
        increment_build_number
        ;;
    7)
        echo -e "${YELLOW}Starting full deployment process...${NC}"
        increment_build_number
        echo -e "${YELLOW}Starting production build...${NC}"
        eas build --platform ios --profile production --auto-submit
        ;;
    *)
        echo -e "${RED}Invalid choice. Please run the script again.${NC}"
        exit 1
        ;;
esac

echo -e "${GREEN}Done!${NC}"