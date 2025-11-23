#!/bin/bash

# ScribeAI Project Verification Script
# Verifies that PR #1 setup is complete and functional

set -e

echo "🔍 ScribeAI Project Verification"
echo "=================================="
echo ""

ERRORS=0

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} $1"
    else
        echo -e "${RED}✗${NC} $1 - MISSING"
        ((ERRORS++))
    fi
}

check_dir() {
    if [ -d "$1" ]; then
        echo -e "${GREEN}✓${NC} $1/"
    else
        echo -e "${RED}✗${NC} $1/ - MISSING"
        ((ERRORS++))
    fi
}

echo "📁 Checking project structure..."
echo ""

# Root files
echo "Root configuration files:"
check_file "package.json"
check_file ".env.example"
check_file ".gitignore"
check_file ".eslintrc.cjs"
check_file ".prettierrc"
check_file "docker-compose.yml"
check_file "README.md"
check_file "setup.sh"
echo ""

# Apps directory
echo "Apps directory structure:"
check_dir "apps"
check_dir "apps/web"
check_dir "apps/api-socket"
echo ""

# Web app files
echo "Web app files:"
check_file "apps/web/package.json"
check_file "apps/web/next.config.js"
check_file "apps/web/tsconfig.json"
check_file "apps/web/tailwind.config.cjs"
check_file "apps/web/postcss.config.cjs"
check_file "apps/web/app/layout.tsx"
check_file "apps/web/app/page.tsx"
check_file "apps/web/app/globals.css"
check_file "apps/web/app/components/Header.tsx"
check_file "apps/web/app/providers/theme-provider.tsx"
echo ""

# Socket server files
echo "Socket server files:"
check_file "apps/api-socket/package.json"
check_file "apps/api-socket/tsconfig.json"
check_file "apps/api-socket/src/index.ts"
check_file "apps/api-socket/src/socket.ts"
echo ""

# Documentation
echo "Documentation files:"
check_file "docs/ARCHITECTURE.md"
check_file "PR-1-DESCRIPTION.md"
echo ""

# Check for node_modules
echo "📦 Checking dependencies..."
if [ -d "node_modules" ]; then
    echo -e "${GREEN}✓${NC} Root node_modules exists"
else
    echo -e "${YELLOW}⚠${NC} Root node_modules not found - run 'npm install'"
fi

if [ -d "apps/web/node_modules" ]; then
    echo -e "${GREEN}✓${NC} Web app node_modules exists"
else
    echo -e "${YELLOW}⚠${NC} Web app node_modules not found - run 'npm install'"
fi

if [ -d "apps/api-socket/node_modules" ]; then
    echo -e "${GREEN}✓${NC} Socket server node_modules exists"
else
    echo -e "${YELLOW}⚠${NC} Socket server node_modules not found - run 'npm install'"
fi
echo ""

# Check for .env file
echo "🔐 Checking environment configuration..."
if [ -f ".env" ]; then
    echo -e "${GREEN}✓${NC} .env file exists"
    if grep -q "your_gemini_api_key_here" .env 2>/dev/null; then
        echo -e "${YELLOW}⚠${NC} Remember to add your actual GEMINI_API_KEY to .env"
    fi
else
    echo -e "${YELLOW}⚠${NC} .env file not found - copy from .env.example"
fi
echo ""

# Check Docker
echo "🐳 Checking Docker setup..."
if command -v docker &> /dev/null; then
    echo -e "${GREEN}✓${NC} Docker is installed"
    
    if docker info &> /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} Docker daemon is running"
        
        # Check if postgres container is running
        if docker ps | grep -q scribeai-postgres; then
            echo -e "${GREEN}✓${NC} PostgreSQL container is running"
        else
            echo -e "${YELLOW}⚠${NC} PostgreSQL container not running - run 'docker-compose up -d'"
        fi
    else
        echo -e "${YELLOW}⚠${NC} Docker daemon not running - start Docker Desktop"
    fi
else
    echo -e "${YELLOW}⚠${NC} Docker not installed - needed for PostgreSQL"
fi
echo ""

# Summary
echo "=================================="
if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✅ All checks passed!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. If not done: npm install"
    echo "2. If not done: cp .env.example .env"
    echo "3. If not done: Edit .env and add GEMINI_API_KEY"
    echo "4. If not done: docker-compose up -d"
    echo "5. Run: npm run dev"
    echo "6. Visit: http://localhost:3000"
else
    echo -e "${RED}❌ Found $ERRORS error(s)${NC}"
    echo ""
    echo "Please fix the issues above and run this script again."
    exit 1
fi
echo ""
