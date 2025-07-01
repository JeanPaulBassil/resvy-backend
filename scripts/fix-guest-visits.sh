#!/bin/bash

# Script to fix guest visit counts based on completed reservations
# This script applies the SQL fix to update guest visit counts

echo "🔧 Fixing guest visit counts based on completed reservations..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: DATABASE_URL environment variable is not set"
    echo "Please set your DATABASE_URL before running this script"
    exit 1
fi

# Run the SQL fix
echo "📊 Updating guest visit counts..."
if psql "$DATABASE_URL" -f "$(dirname "$0")/fix-guest-visits.sql"; then
    echo "✅ Guest visit counts have been successfully updated!"
    echo "📈 All guest visit counts now reflect their completed reservations"
else
    echo "❌ Failed to update guest visit counts"
    exit 1
fi

echo "🎉 Fix completed successfully!" 