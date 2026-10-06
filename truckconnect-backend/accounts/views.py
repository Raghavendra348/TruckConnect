from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .models import User
from .permissions import IsCustomer, IsTruckOwner
from .serializers import (
    LoginSerializer,
    RegisterSerializer,
    UserSerializer,
)


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(
            data=request.data,
        )

        if serializer.is_valid():
            user = serializer.save()

            return Response(
                {
                    "message": "Registration successful.",
                    "user": UserSerializer(user).data,
                },
                status=status.HTTP_201_CREATED,
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST,
        )


def ensure_initial_data_loaded():
    if User.objects.count() == 0:
        from pathlib import Path
        from django.core.management import call_command
        possible_paths = [
            Path("data_backup.json"),
            Path("truckconnect-backend/data_backup.json"),
            Path(__file__).resolve().parent.parent / "data_backup.json",
            Path(__file__).resolve().parent.parent.parent / "data_backup.json",
        ]
        for p in possible_paths:
            if p.exists():
                try:
                    call_command("loaddata", str(p))
                    break
                except Exception:
                    pass


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        ensure_initial_data_loaded()

        serializer = LoginSerializer(
            data=request.data,
        )

        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_401_UNAUTHORIZED,
            )

        user = serializer.validated_data["user"]

        refresh = RefreshToken.for_user(user)

        return Response(
            {
                "message": "Login successful.",
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "user": UserSerializer(user).data,
            },
            status=status.HTTP_200_OK,
        )


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )


class CustomerTestView(APIView):
    permission_classes = [IsCustomer]

    def get(self, request):
        return Response(
            {
                "message": "Customer permission verified.",
                "user_id": request.user.id,
                "role": request.user.role,
            },
            status=status.HTTP_200_OK,
        )


class TruckOwnerTestView(APIView):
    permission_classes = [IsTruckOwner]

    def get(self, request):
        return Response(
            {
                "message": "Truck Owner permission verified.",
                "user_id": request.user.id,
                "role": request.user.role,
            },
            status=status.HTTP_200_OK,
        )