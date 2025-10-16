#!/bin/bash

# tyron.js Build Script
# This script builds the tyron.js package with proper error handling

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${CYAN}🔄 $1...${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_header() {
    echo -e "${MAGENTA}🚀 $1${NC}"
}

# Start build process
print_header "Starting tyron.js build process..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the project root."
    exit 1
fi

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed or not in PATH"
    exit 1
fi

# Check if npm is available
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed or not in PATH"
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    print_status "Installing dependencies"
    npm install
    print_success "Dependencies installed"
fi

# Clean previous builds
print_status "Cleaning previous builds"
npm run clean
print_success "Previous builds cleaned"

# Run linting
print_status "Running ESLint"
if ! npm run lint; then
    print_warning "Linting found issues. Attempting to auto-fix..."
    if npm run lint:fix; then
        print_success "Linting issues auto-fixed"
    else
        print_error "Failed to auto-fix linting issues. Please fix manually."
        exit 1
    fi
else
    print_success "Linting passed"
fi

# Format code
print_status "Formatting code with Prettier"
if npm run format; then
    print_success "Code formatted"
else
    print_warning "Code formatting failed, but continuing with build..."
fi

# TypeScript compilation
print_status "Compiling TypeScript"
npm run build:tsc
print_success "TypeScript compilation completed"

# Copy and modify package.json for dist
print_status "Preparing package.json for distribution"
node -e "
const fs = require('fs');
const path = require('path');

try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    
    // Update the main field to point to index.js instead of dist/index.js
    packageJson.main = 'index.js';
    
    // Remove scripts that are only needed for development
    delete packageJson.scripts;
    delete packageJson.devDependencies;
    
    // Write the modified package.json to dist
    fs.writeFileSync(
        path.join('dist', 'package.json'),
        JSON.stringify(packageJson, null, 2) + '\n'
    );
    
    console.log('package.json prepared for distribution');
} catch (error) {
    console.error('Failed to prepare package.json:', error.message);
    process.exit(1);
}
"
print_success "package.json prepared for distribution"

# Copy LICENSE file
print_status "Copying LICENSE file"
if [ -f "LICENSE" ]; then
    cp LICENSE dist/
    print_success "LICENSE file copied"
else
    print_warning "LICENSE file not found, skipping..."
fi

# Verify build output
print_status "Verifying build output"
if [ -f "dist/index.js" ] && [ -f "dist/index.d.ts" ]; then
    print_success "Build output verified"
else
    print_error "Build output verification failed"
    exit 1
fi

# Final success message
echo ""
print_header "🎉 Build completed successfully!"
echo -e "${BLUE}📁 Output directory: dist/${NC}"
echo -e "${BLUE}📦 Package ready for publishing${NC}"
echo ""
echo -e "${YELLOW}📝 Next steps:${NC}"
echo -e "${YELLOW}• Publish to npm: npm run tyron${NC}"
