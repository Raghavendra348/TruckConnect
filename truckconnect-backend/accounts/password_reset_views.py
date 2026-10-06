from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode

from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView


User = get_user_model()


class ForgotPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = (request.data.get("email") or "").strip().lower()

        if not email:
            return Response(
                {"email": "Email address is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response(
                {
                    "detail": f"No account found with email '{email}'. Please check your spelling or create a new account."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        uid = urlsafe_base64_encode(str(user.pk).encode())
        token = default_token_generator.make_token(user)

        return Response(
            {
                "message": f"Password reset recovery token generated for {user.email}.",
                "email": user.email,
                "uid": uid,
                "token": token,
            },
            status=status.HTTP_200_OK,
        )


class ResetPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        uid = request.data.get("uid")
        token = request.data.get("token")
        email = (request.data.get("email") or "").strip().lower()
        new_password = request.data.get("new_password") or request.data.get("password")

        if not new_password:
            return Response(
                {"new_password": "New password is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if len(new_password) < 6:
            return Response(
                {"new_password": "Password must contain at least 6 characters."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = None

        if uid:
            try:
                user_id = urlsafe_base64_decode(uid).decode()
                user = User.objects.get(pk=user_id)
            except (ValueError, TypeError, OverflowError, User.DoesNotExist):
                return Response(
                    {"detail": "Invalid password reset link or UID."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        if not user and email:
            try:
                user = User.objects.get(email=email)
            except User.DoesNotExist:
                return Response(
                    {"detail": f"No account found with email '{email}'."},
                    status=status.HTTP_404_NOT_FOUND,
                )

        if not user:
            return Response(
                {"detail": "User identification (UID or registered email) is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if token and not default_token_generator.check_token(user, token):
            return Response(
                {"detail": "Invalid or expired password reset token. Please request a new link."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.set_password(new_password)
        user.save(update_fields=["password"])

        return Response(
            {
                "message": "Password has been reset successfully. You can now log in with your new password.",
                "email": user.email,
            },
            status=status.HTTP_200_OK,
        )