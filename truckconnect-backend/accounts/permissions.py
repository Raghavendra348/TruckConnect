from rest_framework.permissions import BasePermission

from .models import User


class IsCustomer(BasePermission):
    message = "Only customers can access this resource."

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == User.Roles.CUSTOMER
        )


class IsTruckOwner(BasePermission):
    message = "Only truck owners can access this resource."

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == User.Roles.TRUCK_OWNER
        )


class IsAdmin(BasePermission):
    message = "Only administrators can access this resource."

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == User.Roles.ADMIN
        )


class IsCustomerOrTruckOwner(BasePermission):
    message = "Only customers or truck owners can access this resource."

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        return request.user.role in [
            User.Roles.CUSTOMER,
            User.Roles.TRUCK_OWNER,
        ]