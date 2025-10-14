#!/bin/bash

# Production Deployment Helper Script for BookedSolid AI
# This script helps with database migrations and seeding for production

set -e  # Exit on error

echo "🚀 BookedSolid AI - Production Deployment Helper"
echo "================================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Production database URL
PROD_DB_URL="postgresql://postgres:db.OhitEV454lSUbjYX@db.mfndswtgocyzmbvsrbdu.supabase.co:5432/postgres"

# Function to print colored messages
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ️  $1${NC}"
}

# Check if Vercel CLI is installed
check_vercel_cli() {
    if ! command -v vercel &> /dev/null; then
        print_error "Vercel CLI not found"
        echo "Install with: npm install -g vercel"
        exit 1
    fi
    print_success "Vercel CLI found"
}

# Main menu
show_menu() {
    echo ""
    echo "What would you like to do?"
    echo "1) Run production database migrations"
    echo "2) Seed production database with demo data"
    echo "3) Check production database connection"
    echo "4) Pull Vercel environment variables"
    echo "5) Deploy to Vercel"
    echo "6) View deployment logs"
    echo "0) Exit"
    echo ""
    read -p "Enter choice [0-6]: " choice

    case $choice in
        1) run_migrations ;;
        2) seed_database ;;
        3) check_connection ;;
        4) pull_env_vars ;;
        5) deploy_vercel ;;
        6) view_logs ;;
        0) exit 0 ;;
        *)
            print_error "Invalid choice"
            show_menu
            ;;
    esac
}

# Run database migrations
run_migrations() {
    echo ""
    print_info "Running database migrations on production..."
    echo ""

    DATABASE_URL="$PROD_DB_URL" npx prisma migrate deploy

    if [ $? -eq 0 ]; then
        print_success "Migrations completed successfully"
    else
        print_error "Migration failed"
        exit 1
    fi

    show_menu
}

# Seed database
seed_database() {
    echo ""
    print_info "Seeding production database with demo data..."
    echo ""

    read -p "Are you sure you want to seed PRODUCTION database? (yes/no): " confirm
    if [ "$confirm" != "yes" ]; then
        print_info "Cancelled"
        show_menu
        return
    fi

    DATABASE_URL="$PROD_DB_URL" npm run db:seed

    if [ $? -eq 0 ]; then
        print_success "Database seeded successfully"
    else
        print_error "Seeding failed"
    fi

    show_menu
}

# Check database connection
check_connection() {
    echo ""
    print_info "Testing production database connection..."
    echo ""

    if command -v psql &> /dev/null; then
        psql "$PROD_DB_URL" -c "SELECT version();"
        if [ $? -eq 0 ]; then
            print_success "Database connection successful"
        else
            print_error "Database connection failed"
        fi
    else
        print_error "psql not found. Install PostgreSQL client to test connection."
    fi

    show_menu
}

# Pull environment variables from Vercel
pull_env_vars() {
    echo ""
    print_info "Pulling environment variables from Vercel..."
    echo ""

    check_vercel_cli

    vercel env pull .env.production.local

    if [ $? -eq 0 ]; then
        print_success "Environment variables pulled to .env.production.local"
    else
        print_error "Failed to pull environment variables"
        print_info "Make sure you're logged in: vercel login"
    fi

    show_menu
}

# Deploy to Vercel
deploy_vercel() {
    echo ""
    print_info "Deploying to Vercel production..."
    echo ""

    check_vercel_cli

    read -p "Deploy to production? (yes/no): " confirm
    if [ "$confirm" != "yes" ]; then
        print_info "Cancelled"
        show_menu
        return
    fi

    vercel --prod

    if [ $? -eq 0 ]; then
        print_success "Deployment initiated"
        print_info "Monitor at: https://vercel.com/dashboard"
    else
        print_error "Deployment failed"
    fi

    show_menu
}

# View deployment logs
view_logs() {
    echo ""
    print_info "Fetching latest deployment logs..."
    echo ""

    check_vercel_cli

    vercel logs

    show_menu
}

# Main execution
main() {
    # Check if running from correct directory
    if [ ! -f "package.json" ]; then
        print_error "Please run this script from the dashboard directory"
        exit 1
    fi

    show_menu
}

# Run main
main
