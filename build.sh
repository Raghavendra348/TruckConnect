#!/usr/bin/env bash
# exit on error
set -o errexit

pip install -r requirements.txt

if [ -f "manage.py" ]; then
    python manage.py collectstatic --no-input || true
    python manage.py migrate
    python manage.py loaddata data_backup.json || true
elif [ -f "truckconnect-backend/manage.py" ]; then
    python truckconnect-backend/manage.py collectstatic --no-input || true
    python truckconnect-backend/manage.py migrate
    python truckconnect-backend/manage.py loaddata data_backup.json || true
fi
