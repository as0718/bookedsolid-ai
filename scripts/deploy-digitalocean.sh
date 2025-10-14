#!/bin/bash

# Digital Ocean Deployment Helper Script
# This script helps you deploy to Digital Ocean App Platform

set -e

echo "=================================================="
echo "Digital Ocean Deployment Helper"
echo "=================================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# Check if doctl is installed
check_doctl() {
    if ! command -v doctl &> /dev/null; then
        print_error "doctl is not installed"
        echo ""
        echo "Install doctl CLI tool:"
        echo "  macOS: brew install doctl"
        echo "  Linux: snap install doctl"
        echo "  Or visit: https://docs.digitalocean.com/reference/doctl/how-to/install/"
        echo ""
        return 1
    fi
    print_success "doctl is installed"
    return 0
}

# Check if user is authenticated
check_auth() {
    if ! doctl auth list &> /dev/null; then
        print_error "Not authenticated with Digital Ocean"
        echo ""
        echo "Run: doctl auth init"
        echo ""
        return 1
    fi
    print_success "Authenticated with Digital Ocean"
    return 0
}

# Generate NEXTAUTH_SECRET
generate_secret() {
    echo ""
    print_info "Generating NEXTAUTH_SECRET..."
    SECRET=$(openssl rand -base64 32)
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "NEXTAUTH_SECRET:"
    echo ""
    echo "$SECRET"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    print_warning "Save this value! You'll need it for Digital Ocean environment variables."
    echo ""
}

# Check for .do/app.yaml
check_app_spec() {
    if [ ! -f ".do/app.yaml" ]; then
        print_error ".do/app.yaml not found"
        echo ""
        echo "Make sure you're in the project root directory."
        return 1
    fi
    print_success "App specification found"
    return 0
}

# Validate GitHub repository is set
check_github() {
    if git rev-parse --git-dir > /dev/null 2>&1; then
        REMOTE=$(git remote get-url origin 2>/dev/null || echo "")
        if [ -z "$REMOTE" ]; then
            print_error "No Git remote configured"
            echo ""
            echo "Add a remote:"
            echo "  git remote add origin https://github.com/username/repo.git"
            echo ""
            return 1
        fi
        print_success "Git repository configured: $REMOTE"
        return 0
    else
        print_error "Not a Git repository"
        return 1
    fi
}

# Pre-flight checks
preflight_checks() {
    echo "Running pre-flight checks..."
    echo ""

    local failed=0

    check_app_spec || failed=1
    check_github || failed=1

    if [ $failed -eq 1 ]; then
        echo ""
        print_error "Pre-flight checks failed"
        return 1
    fi

    echo ""
    print_success "All pre-flight checks passed!"
    return 0
}

# Show deployment instructions
show_instructions() {
    echo ""
    echo "=================================================="
    echo "Deployment Instructions"
    echo "=================================================="
    echo ""
    echo "1. Push your code to GitHub:"
    echo "   ${BLUE}git add .${NC}"
    echo "   ${BLUE}git commit -m 'Prepare for deployment'${NC}"
    echo "   ${BLUE}git push origin main${NC}"
    echo ""
    echo "2. Go to Digital Ocean App Platform:"
    echo "   ${BLUE}https://cloud.digitalocean.com/apps${NC}"
    echo ""
    echo "3. Click 'Create App' and connect your GitHub repository"
    echo ""
    echo "4. Import the app spec:"
    echo "   - Select 'Import from App Spec'"
    echo "   - Upload: ${BLUE}.do/app.yaml${NC}"
    echo ""
    echo "5. Add environment variables (see below)"
    echo ""
    echo "6. Review and deploy!"
    echo ""
    echo "=================================================="
    echo "Required Environment Variables"
    echo "=================================================="
    echo ""
    echo "1. ${BLUE}NEXTAUTH_SECRET${NC}"
    echo "   Value: (use the generated secret above)"
    echo "   Type: Secret"
    echo "   Scope: RUN_AND_BUILD_TIME"
    echo ""
    echo "2. ${BLUE}NEXTAUTH_URL${NC}"
    echo "   Value: \${APP_URL}"
    echo "   Type: Plain Text"
    echo "   Scope: RUN_AND_BUILD_TIME"
    echo ""
    echo "3. ${BLUE}DATABASE_URL${NC}"
    echo "   Value: \${bookedsolid-db.DATABASE_URL}"
    echo "   Type: Plain Text"
    echo "   Scope: RUN_AND_BUILD_TIME"
    echo ""
    echo "4. ${BLUE}DIRECT_DATABASE_URL${NC}"
    echo "   Value: \${bookedsolid-db.DATABASE_URL}"
    echo "   Type: Plain Text"
    echo "   Scope: RUN_AND_BUILD_TIME"
    echo ""
    echo "5. ${BLUE}RETELL_WEBHOOK_SECRET${NC}"
    echo "   Value: (from your Retell dashboard)"
    echo "   Type: Secret"
    echo "   Scope: RUN_AND_BUILD_TIME"
    echo ""
    echo "6. ${BLUE}RETELL_API_KEY${NC}"
    echo "   Value: (from your Retell dashboard)"
    echo "   Type: Secret"
    echo "   Scope: RUN_AND_BUILD_TIME"
    echo ""
    echo "=================================================="
    echo "Post-Deployment Steps"
    echo "=================================================="
    echo ""
    echo "1. Wait for deployment to complete (5-10 minutes)"
    echo ""
    echo "2. Test your deployment:"
    echo "   - Homepage: https://your-app.ondigitalocean.app"
    echo "   - Health check: https://your-app.ondigitalocean.app/api/health"
    echo ""
    echo "3. Update Retell webhook URL:"
    echo "   - Go to: https://app.retellai.com"
    echo "   - Set webhook to: https://your-app.ondigitalocean.app/api/webhooks/retell"
    echo ""
    echo "4. Create admin user (via console or seed script)"
    echo ""
    echo "For detailed instructions, see: ${BLUE}DIGITALOCEAN_DEPLOYMENT.md${NC}"
    echo ""
}

# Create app using doctl
create_app() {
    echo ""
    print_info "Creating app on Digital Ocean..."
    echo ""

    if ! check_doctl || ! check_auth; then
        return 1
    fi

    # Update app.yaml with actual GitHub repo
    REPO_URL=$(git remote get-url origin)
    REPO_NAME=$(echo "$REPO_URL" | sed -E 's/.*[:/]([^/]+\/[^/]+)(\.git)?$/\1/' | sed 's/.git$//')

    print_info "Using repository: $REPO_NAME"
    echo ""

    # Create temporary app.yaml with updated repo
    TMP_SPEC=$(mktemp)
    sed "s|your-username/your-repo-name|$REPO_NAME|g" .do/app.yaml > "$TMP_SPEC"

    print_info "Creating app with doctl..."
    if doctl apps create --spec "$TMP_SPEC"; then
        print_success "App created successfully!"
        echo ""
        print_info "View your app at: https://cloud.digitalocean.com/apps"
    else
        print_error "Failed to create app"
        rm "$TMP_SPEC"
        return 1
    fi

    rm "$TMP_SPEC"
}

# Main menu
show_menu() {
    echo ""
    echo "What would you like to do?"
    echo ""
    echo "  1) Run pre-flight checks"
    echo "  2) Generate NEXTAUTH_SECRET"
    echo "  3) Show deployment instructions"
    echo "  4) Create app using doctl CLI"
    echo "  5) Exit"
    echo ""
    read -p "Enter your choice [1-5]: " choice

    case $choice in
        1)
            preflight_checks
            show_menu
            ;;
        2)
            generate_secret
            show_menu
            ;;
        3)
            show_instructions
            show_menu
            ;;
        4)
            create_app
            show_menu
            ;;
        5)
            echo ""
            print_info "Goodbye!"
            echo ""
            exit 0
            ;;
        *)
            print_error "Invalid choice"
            show_menu
            ;;
    esac
}

# Main execution
main() {
    # Run all checks and show instructions
    if preflight_checks; then
        generate_secret
        show_instructions
        show_menu
    else
        echo ""
        print_error "Please fix the issues above and try again"
        exit 1
    fi
}

main
