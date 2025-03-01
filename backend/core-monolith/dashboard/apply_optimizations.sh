#!/bin/bash

# Apply optimizations to the GIS backend
# This script applies all the optimizations to the database

set -e  # Exit on error

echo "Starting optimization process..."

# Apply migrations
echo "Applying migrations..."
python manage.py migrate

# Create SQL functions
echo "Creating SQL functions..."
python manage.py create_martin_functions

# Update source attributes
echo "Updating source attributes..."
python manage.py update_source_stats all --create-function

echo "Optimization complete!"
echo "The following optimizations have been applied:"
echo "1. Model improvements with proper indexes"
echo "2. Optimized SQL functions for GeoJSON generation"
echo "3. Spatial indexes for geometry fields"
echo "4. GIN indexes for JSON fields"
echo "5. Database function for efficient source attribute updates"
echo ""
echo "Performance should be significantly improved!"
