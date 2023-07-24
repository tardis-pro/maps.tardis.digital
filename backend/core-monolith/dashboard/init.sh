#!/bin/bash

python3 manage.py migrate
python3 manage.py create_martin_functions
python3 manage.py upload_csv_file core/seeds/sb.csv --source_id=14 --source_name="rcp45"

# Start the main application
exec "$@"
