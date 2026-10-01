from django.contrib.auth import authenticate
from rest_framework import serializers

from .models import User


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "full_name",
            "mobile_number",
            "profile_photo",
            "address",
            "role",
            "company_name",
            "verification_status",
        ]

        read_only_fields = [
            "id",
            "verification_status",
        ]


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True,
        min_length=8,
    )

    password_confirmation = serializers.CharField(
        write_only=True,
        min_length=8,
    )

    class Meta:
        model = User
        fields = [
            "email",
            "full_name",
            "mobile_number",
            "password",
            "password_confirmation",
            "profile_photo",
            "address",
            "role",
            "company_name",
        ]

    def validate_email(self, value):
        email = value.lower().strip()

        if User.objects.filter(email=email).exists():
            raise serializers.ValidationError(
                "A user with this email already exists."
            )

        return email

    def validate_role(self, value):
        allowed_roles = [
            User.Roles.CUSTOMER,
            User.Roles.TRUCK_OWNER,
        ]

        if value not in allowed_roles:
            raise serializers.ValidationError(
                "Only Customer or Truck Owner registration is allowed."
            )

        return value

    def validate(self, attrs):
        password = attrs.get("password")
        password_confirmation = attrs.get(
            "password_confirmation"
        )

        if password != password_confirmation:
            raise serializers.ValidationError(
                {
                    "password_confirmation": (
                        "Passwords do not match."
                    )
                }
            )

        role = attrs.get("role")

        if role == User.Roles.TRUCK_OWNER:
            company_name = attrs.get("company_name")

            if not company_name:
                raise serializers.ValidationError(
                    {
                        "company_name": (
                            "Company or Business Name is required "
                            "for Truck Owner registration."
                        )
                    }
                )

        return attrs

    def create(self, validated_data):
        validated_data.pop("password_confirmation")

        password = validated_data.pop("password")

        user = User(
            **validated_data,
        )

        user.set_password(password)

        user.save()

        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()

    password = serializers.CharField(
        write_only=True,
    )

    def validate(self, attrs):
        email = attrs.get("email").lower().strip()
        password = attrs.get("password")

        user = authenticate(
            username=email,
            password=password,
        )

        if user is None:
            raise serializers.ValidationError(
                "Invalid email or password."
            )

        if not user.is_active:
            raise serializers.ValidationError(
                "This account is inactive."
            )

        attrs["user"] = user

        return attrs