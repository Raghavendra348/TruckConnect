from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models


class UserManager(BaseUserManager):

    def create_user(
        self,
        email,
        password=None,
        **extra_fields
    ):
        if not email:
            raise ValueError("Email address is required")

        email = self.normalize_email(email)

        user = self.model(
            email=email,
            **extra_fields
        )

        user.set_password(password)
        user.save(using=self._db)

        return user

    def create_superuser(
        self,
        email,
        password=None,
        **extra_fields
    ):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_active", True)
        extra_fields.setdefault("role", "admin")

        if extra_fields.get("is_staff") is not True:
            raise ValueError(
                "Superuser must have is_staff=True."
            )

        if extra_fields.get("is_superuser") is not True:
            raise ValueError(
                "Superuser must have is_superuser=True."
            )

        return self.create_user(
            email=email,
            password=password,
            **extra_fields
        )


class User(AbstractUser):

    class Roles(models.TextChoices):
        CUSTOMER = "customer", "Customer"
        TRUCK_OWNER = "truck_owner", "Truck Owner"
        ADMIN = "admin", "Admin"

    class VerificationStatuses(models.TextChoices):
        PENDING = "pending", "Pending"
        VERIFIED = "verified", "Verified"
        REJECTED = "rejected", "Rejected"

    username = None

    email = models.EmailField(
        unique=True
    )

    full_name = models.CharField(
        max_length=150
    )

    mobile_number = models.CharField(
        max_length=20
    )

    profile_photo = models.ImageField(
        upload_to="profiles/",
        blank=True,
        null=True
    )

    address = models.TextField(
        blank=True,
        null=True
    )

    role = models.CharField(
        max_length=20,
        choices=Roles.choices,
        default=Roles.CUSTOMER
    )

    company_name = models.CharField(
        max_length=200,
        blank=True,
        null=True
    )

    verification_status = models.CharField(
        max_length=20,
        choices=VerificationStatuses.choices,
        default=VerificationStatuses.PENDING
    )

    USERNAME_FIELD = "email"

    REQUIRED_FIELDS = [
        "full_name",
        "mobile_number"
    ]

    objects = UserManager()

    def __str__(self):
        return f"{self.full_name} ({self.email})"