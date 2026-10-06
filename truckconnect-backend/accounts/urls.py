from django.urls import path

from .views import (
    CustomerTestView,
    LoginView,
    MeView,
    RegisterView,
    TruckOwnerTestView,
)
from .password_reset_views import (
    ForgotPasswordView,
    ResetPasswordView,
)

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", LoginView.as_view(), name="login"),
    path("me/", MeView.as_view(), name="me"),
    path("forgot-password/", ForgotPasswordView.as_view(), name="forgot-password"),
    path("reset-password/", ResetPasswordView.as_view(), name="reset-password"),
    path("test/customer/", CustomerTestView.as_view(), name="test-customer"),
    path("test/truck-owner/", TruckOwnerTestView.as_view(), name="test-truck-owner"),
]