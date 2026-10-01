from django.urls import path

from .views import (
    CustomerTestView,
    LoginView,
    MeView,
    RegisterView,
    TruckOwnerTestView,
)

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", LoginView.as_view(), name="login"),
    path("me/", MeView.as_view(), name="me"),
    path("test/customer/", CustomerTestView.as_view(), name="test-customer"),
    path("test/truck-owner/", TruckOwnerTestView.as_view(), name="test-truck-owner"),
]