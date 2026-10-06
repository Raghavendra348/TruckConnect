from django.db import migrations


def seed_users(apps, schema_editor):
    User = apps.get_model("accounts", "User")
    from django.contrib.auth.hashers import make_password

    users_data = [
        {
            "email": "ragava12@gmail.com",
            "password": "Password@123",
            "full_name": "Raghavendra",
            "mobile_number": "9876543210",
            "role": "customer",
            "company_name": "Raghavendra Logistics",
            "verification_status": "verified",
        },
        {
            "email": "customer@truckconnect.com",
            "password": "Password@123",
            "full_name": "Demo Customer",
            "mobile_number": "9876543211",
            "role": "customer",
            "company_name": "Apex Cargo Ltd",
            "verification_status": "verified",
        },
        {
            "email": "owner@truckconnect.com",
            "password": "Password@123",
            "full_name": "Demo Transporter",
            "mobile_number": "9876543212",
            "role": "truck_owner",
            "company_name": "FastTrack Transport",
            "verification_status": "verified",
        },
        {
            "email": "admin@truckconnect.com",
            "password": "Password@123",
            "full_name": "System Administrator",
            "mobile_number": "9876543213",
            "role": "admin",
            "company_name": "TruckConnect Platform",
            "verification_status": "verified",
            "is_staff": True,
            "is_superuser": True,
        },
    ]

    for u_data in users_data:
        email = u_data["email"]
        if not User.objects.filter(email=email).exists():
            u = User(
                email=email,
                password=make_password(u_data["password"]),
                full_name=u_data["full_name"],
                mobile_number=u_data["mobile_number"],
                role=u_data["role"],
                company_name=u_data.get("company_name", ""),
                verification_status=u_data.get("verification_status", "verified"),
                is_staff=u_data.get("is_staff", False),
                is_superuser=u_data.get("is_superuser", False),
                is_active=True,
            )
            u.save()


def reverse_seed(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0002_user_company_name_user_verification_status"),
    ]

    operations = [
        migrations.RunPython(seed_users, reverse_seed),
    ]
