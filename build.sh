#!/usr/bin/env bash
# exit on error
set -o errexit

pip install -r requirements.txt
python truckconnect-backend/manage.py collectstatic --no-input || true
python truckconnect-backend/manage.py migrate
