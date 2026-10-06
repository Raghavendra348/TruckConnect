import os
import json
from pathlib import Path
from django.db import migrations


def load_all_backup_data(apps, schema_editor):
    User = apps.get_model("accounts", "User")
    if User.objects.count() > 0:
        return

    # Find data_backup.json
    base_dir = Path(__file__).resolve().parent.parent.parent
    possible_paths = [
        base_dir / "data_backup.json",
        base_dir / "truckconnect-backend" / "data_backup.json",
        Path("data_backup.json"),
        Path("truckconnect-backend/data_backup.json"),
    ]

    fixture_file = None
    for p in possible_paths:
        if p.exists():
            fixture_file = p
            break

    if not fixture_file:
        return

    from django.core.management import call_command
    try:
        call_command("loaddata", str(fixture_file))
    except Exception as e:
        print("Could not auto-load fixture via call_command:", e)


def unload_backup_data(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0002_user_company_name_user_verification_status"),
        ("trips", "0003_triplocationupdate"),
        ("disputes", "0003_dispute_evidence_dispute_respondent_evidence_and_more"),
        ("payments", "0002_payment_due_date"),
        ("reports", "0002_alter_report_load_alter_report_trip"),
        ("notifications", "0002_notification_reference_key"),
        ("settlements", "0001_initial"),
        ("conversations", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(load_all_backup_data, unload_backup_data),
    ]
